from __future__ import annotations
import asyncio
import logging
import time
from typing import Optional

import httpx
import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.http import models as qdrant_models
from sentence_transformers import SentenceTransformer

from config import settings
from schemas import Chunk, SearchHit

logger = logging.getLogger("ai-service.service")

# --- Retry helper ---

_MAX_RETRIES = 3
_BASE_DELAY = 0.5


async def _retry_async(fn, *args, **kwargs):
    last_exc = None
    for attempt in range(_MAX_RETRIES):
        try:
            return await fn(*args, **kwargs)
        except (httpx.HTTPStatusError, httpx.RequestError) as e:
            last_exc = e
            if attempt < _MAX_RETRIES - 1:
                delay = _BASE_DELAY * (2 ** attempt)
                logger.warning("Retry %d/%d after error: %s — waiting %.1fs", attempt + 1, _MAX_RETRIES, e, delay)
                await asyncio.sleep(delay)
    raise last_exc


# --- Lazy-loaded singletons ---
_model: Optional[SentenceTransformer] = None
_qdrant: Optional[QdrantClient] = None


def get_embedding_model() -> SentenceTransformer:
    global _model
    if _model is None:
        logger.info("Loading embedding model: %s", settings.embedding_model)
        start = time.time()
        _model = SentenceTransformer(settings.embedding_model)
        logger.info("Model loaded in %.2fs, dim=%d", time.time() - start, settings.embedding_dimension)
    return _model


def get_qdrant_client() -> QdrantClient:
    global _qdrant
    if _qdrant is None:
        _qdrant = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key or None,
            prefer_grpc=False,
        )
    return _qdrant


# --- Chunking ---

def chunk_text(
    text: str,
    chunk_size: int = 500,
    chunk_overlap: int = 50,
) -> list[Chunk]:
    if not text:
        return []
    import tiktoken
    try:
        encoder = tiktoken.get_encoding("cl100k_base")
    except Exception as e:
        raise ValueError(f"Failed to load tokenizer: {e}")
    try:
        tokens = encoder.encode(text)
    except Exception as e:
        raise ValueError(f"Failed to encode text: {e}")
    chunks: list[Chunk] = []
    start = 0
    index = 0
    while start < len(tokens):
        end = min(start + chunk_size, len(tokens))
        chunk_tokens = tokens[start:end]
        chunk_text_str = encoder.decode(chunk_tokens)
        char_count = len(chunk_text_str)
        token_count = len(chunk_tokens)
        chunks.append(Chunk(
            content=chunk_text_str,
            index=index,
            char_count=char_count,
            token_count=token_count,
        ))
        index += 1
        if end == len(tokens):
            break
        start += chunk_size - chunk_overlap
        if start >= len(tokens):
            break
    return chunks


# --- Embedding ---

def embed_text(text: str) -> list[float]:
    try:
        model = get_embedding_model()
        vec = model.encode(text, normalize_embeddings=True)
        return vec.tolist()
    except Exception as e:
        logger.error("Embedding failed: %s", e)
        raise


def embed_batch(texts: list[str]) -> list[list[float]]:
    try:
        model = get_embedding_model()
        vecs = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return vecs.tolist()
    except Exception as e:
        logger.error("Batch embedding failed: %s", e)
        raise


# --- Qdrant ---

COLLECTION_NAME = "chunks"


def ensure_collection():
    client = get_qdrant_client()
    for attempt in range(_MAX_RETRIES):
        try:
            collections = client.get_collections().collections
            existing = {c.name for c in collections}
            if COLLECTION_NAME in existing:
                logger.info("Qdrant collection '%s' already exists", COLLECTION_NAME)
                return
            logger.info("Creating Qdrant collection '%s' (size=%d)", COLLECTION_NAME, settings.embedding_dimension)
            client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=qdrant_models.VectorParams(
                    size=settings.embedding_dimension,
                    distance=qdrant_models.Distance.COSINE,
                ),
            )
            client.create_payload_index(
                collection_name=COLLECTION_NAME,
                field_name="workspace_id",
                field_schema=qdrant_models.PayloadSchemaType.KEYWORD,
            )
            client.create_payload_index(
                collection_name=COLLECTION_NAME,
                field_name="document_id",
                field_schema=qdrant_models.PayloadSchemaType.KEYWORD,
            )
            client.create_payload_index(
                collection_name=COLLECTION_NAME,
                field_name="source_type",
                field_schema=qdrant_models.PayloadSchemaType.KEYWORD,
            )
            client.create_payload_index(
                collection_name=COLLECTION_NAME,
                field_name="tags",
                field_schema=qdrant_models.PayloadSchemaType.KEYWORD,
            )
            client.create_payload_index(
                collection_name=COLLECTION_NAME,
                field_name="version_id",
                field_schema=qdrant_models.PayloadSchemaType.KEYWORD,
            )
            client.create_payload_index(
                collection_name=COLLECTION_NAME,
                field_name="language",
                field_schema=qdrant_models.PayloadSchemaType.KEYWORD,
            )
            logger.info("Qdrant collection '%s' created with indexes", COLLECTION_NAME)
            return
        except Exception as e:
            logger.warning("Qdrant connection attempt %d/%d failed: %s", attempt + 1, _MAX_RETRIES, e)
            if attempt < _MAX_RETRIES - 1:
                time.sleep(_BASE_DELAY * (2 ** attempt))
    logger.error("Failed to connect to Qdrant after %d attempts", _MAX_RETRIES)


def upsert_chunks(
    workspace_id: str,
    document_id: str,
    version_id: str,
    chunks: list[Chunk],
    embeddings: list[list[float]],
    tags: Optional[list[str]] = None,
    language: Optional[str] = None,
):
    if len(chunks) != len(embeddings):
        raise ValueError(f"chunk count ({len(chunks)}) != embedding count ({len(embeddings)})")
    ensure_collection()
    client = get_qdrant_client()
    base_payload = {
        "workspace_id": workspace_id,
        "document_id": document_id,
        "version_id": version_id,
        "source_type": "document",
    }
    if tags:
        base_payload["tags"] = tags
    if language:
        base_payload["language"] = language
    points = []
    for chunk, vector in zip(chunks, embeddings):
        point_id = f"{document_id}_{version_id}_{chunk.index}"
        payload = {
            **base_payload,
            "chunk_index": chunk.index,
            "text": chunk.content,
            "page_number": chunk.page_number,
            "section": chunk.section,
            "token_count": chunk.token_count,
            "char_count": chunk.char_count,
        }
        points.append(qdrant_models.PointStruct(
            id=point_id,
            vector=vector,
            payload=payload,
        ))
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=points,
        wait=True,
    )
    logger.info("Upserted %d chunks for document %s", len(points), document_id)


def delete_document_vectors(document_id: str):
    try:
        client = get_qdrant_client()
        client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=qdrant_models.Filter(
                must=[qdrant_models.FieldCondition(
                    key="document_id",
                    match=qdrant_models.MatchValue(value=document_id),
                )],
            ),
        )
        logger.info("Deleted vectors for document %s", document_id)
    except Exception as e:
        logger.error("Failed to delete vectors for document %s: %s", document_id, e)
        raise


def search_chunks(
    query: str,
    workspace_id: str,
    top_k: int = 5,
    document_id: Optional[str] = None,
    collection_id: Optional[str] = None,
    tag_ids: Optional[list[str]] = None,
    language: Optional[str] = None,
    score_threshold: Optional[float] = None,
) -> list[SearchHit]:
    model = get_embedding_model()
    query_vec = model.encode(query, normalize_embeddings=True).tolist()
    client = get_qdrant_client()
    must_conditions = [qdrant_models.FieldCondition(
        key="workspace_id",
        match=qdrant_models.MatchValue(value=workspace_id),
    )]
    if document_id:
        must_conditions.append(qdrant_models.FieldCondition(
            key="document_id",
            match=qdrant_models.MatchValue(value=document_id),
        ))
    if collection_id:
        must_conditions.append(qdrant_models.FieldCondition(
            key="collection_id",
            match=qdrant_models.MatchValue(value=collection_id),
        ))
    if tag_ids:
        must_conditions.append(qdrant_models.FieldCondition(
            key="tags",
            match=qdrant_models.MatchAny(any=tag_ids),
        ))
    if language:
        must_conditions.append(qdrant_models.FieldCondition(
            key="language",
            match=qdrant_models.MatchValue(value=language),
        ))
    qdrant_filter = qdrant_models.Filter(must=must_conditions)
    result = client.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vec,
        query_filter=qdrant_filter,
        limit=top_k,
        score_threshold=score_threshold,
        with_payload=True,
    )
    hits = []
    for scored in result:
        payload = scored.payload or {}
        hits.append(SearchHit(
            id=scored.id,
            score=scored.score,
            text=payload.get("text", ""),
            document_id=payload.get("document_id", ""),
            chunk_index=payload.get("chunk_index", 0),
            page_number=payload.get("page_number"),
            section=payload.get("section"),
            metadata={k: v for k, v in payload.items() if k not in ("text",)},
        ))
    return hits


# --- AI Generation (LLM) ---

_LLM_HEADERS: dict[str, str] = {}


def _truncate_warn(text: str, max_chars: int, label: str) -> str:
    if len(text) > max_chars:
        logger.warning("%s truncated from %d to %d characters", label, len(text), max_chars)
        return text[:max_chars]
    return text


async def _llm_complete(messages: list[dict], max_tokens: int, timeout: float) -> str:
    if not settings.llm_api_key:
        raise RuntimeError("LLM API key not configured")
    async with httpx.AsyncClient() as client:
        async def _call():
            resp = await client.post(
                f"{settings.llm_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.llm_api_key}",
                    **_LLM_HEADERS,
                },
                json={
                    "model": settings.llm_model,
                    "messages": messages,
                    "max_tokens": max_tokens,
                },
                timeout=timeout,
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"].strip()
        return await _retry_async(_call)


async def generate_summary(text: str, max_tokens: int = 300) -> str:
    truncated = _truncate_warn(text, 8000, "Summary input")
    return await _llm_complete(
        [
            {"role": "system", "content": "You are a helpful assistant that writes concise document summaries."},
            {"role": "user", "content": f"Summarize the following document in {max_tokens} tokens or less:\n\n{truncated}"},
        ],
        max_tokens=max_tokens,
        timeout=60,
    )


async def generate_tags(text: str, max_tokens: int = 100) -> list[str]:
    truncated = _truncate_warn(text, 4000, "Tags input")
    content = await _llm_complete(
        [
            {"role": "system", "content": "Generate 3-5 relevant tags for the given document. Return only a comma-separated list, no markdown, no numbering."},
            {"role": "user", "content": f"Document:\n\n{truncated}"},
        ],
        max_tokens=max_tokens,
        timeout=30,
    )
    return [t.strip() for t in content.split(",") if t.strip()]


async def generate_keywords(text: str, max_tokens: int = 100) -> list[str]:
    truncated = _truncate_warn(text, 4000, "Keywords input")
    content = await _llm_complete(
        [
            {"role": "system", "content": "Extract 5-10 key terms or phrases from the document. Return only a comma-separated list, no markdown, no numbering."},
            {"role": "user", "content": f"Document:\n\n{truncated}"},
        ],
        max_tokens=max_tokens,
        timeout=30,
    )
    return [k.strip() for k in content.split(",") if k.strip()]
