from __future__ import annotations
import logging
import time
from typing import Optional

import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.http import models as qdrant_models
from sentence_transformers import SentenceTransformer

from config import settings
from schemas import Chunk, SearchHit

logger = logging.getLogger("ai-service.service")

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
    import tiktoken
    encoder = tiktoken.get_encoding("cl100k_base")
    tokens = encoder.encode(text)
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
    model = get_embedding_model()
    vec = model.encode(text, normalize_embeddings=True)
    return vec.tolist()


def embed_batch(texts: list[str]) -> list[list[float]]:
    model = get_embedding_model()
    vecs = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return vecs.tolist()


# --- Qdrant ---

COLLECTION_NAME = "chunks"


def ensure_collection():
    client = get_qdrant_client()
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
    logger.info("Qdrant collection '%s' created with indexes", COLLECTION_NAME)


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
        point_id = f"{document_id}_{chunk.index}"
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


# --- AI Generation (OpenRouter) ---

import httpx

OPENROUTER_HEADERS = {
    "HTTP-Referer": "https://secondbrain.app",
    "X-Title": "Second Brain",
}


async def generate_summary(text: str, max_tokens: int = 300) -> str:
    if not settings.openrouter_api_key:
        raise RuntimeError("OpenRouter API key not configured")
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.openrouter_base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                **OPENROUTER_HEADERS,
            },
            json={
                "model": settings.openrouter_model,
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant that writes concise document summaries."},
                    {"role": "user", "content": f"Summarize the following document in {max_tokens} tokens or less:\n\n{text[:8000]}"},
                ],
                "max_tokens": max_tokens,
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()


async def generate_tags(text: str, max_tokens: int = 100) -> list[str]:
    if not settings.openrouter_api_key:
        raise RuntimeError("OpenRouter API key not configured")
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.openrouter_base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                **OPENROUTER_HEADERS,
            },
            json={
                "model": settings.openrouter_model,
                "messages": [
                    {"role": "system", "content": "Generate 3-5 relevant tags for the given document. Return only a comma-separated list, no markdown, no numbering."},
                    {"role": "user", "content": f"Document:\n\n{text[:4000]}"},
                ],
                "max_tokens": max_tokens,
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"].strip()
        tags = [t.strip() for t in content.split(",") if t.strip()]
        return tags


async def generate_keywords(text: str, max_tokens: int = 100) -> list[str]:
    if not settings.openrouter_api_key:
        raise RuntimeError("OpenRouter API key not configured")
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.openrouter_base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                **OPENROUTER_HEADERS,
            },
            json={
                "model": settings.openrouter_model,
                "messages": [
                    {"role": "system", "content": "Extract 5-10 key terms or phrases from the document. Return only a comma-separated list, no markdown, no numbering."},
                    {"role": "user", "content": f"Document:\n\n{text[:4000]}"},
                ],
                "max_tokens": max_tokens,
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"].strip()
        keywords = [k.strip() for k in content.split(",") if k.strip()]
        return keywords
