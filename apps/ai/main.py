import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from extractors import (
    ExtractionError,
    extract_pdf,
    extract_docx,
    extract_markdown,
    extract_text,
    extract_csv,
    extract_image,
    extract_website,
    extract_github,
    extract_youtube,
    normalize_text,
)
from schemas import (
    ChunkConfig,
    ChunkRequest,
    NormalizeRequest,
    ExtractionResult,
    NormalizationResult,
    ChunkResult,
    EmbedRequest,
    EmbedBatchRequest,
    EmbeddingResult,
    EmbedBatchResult,
    UpsertChunksRequest,
    DeleteVectorsRequest,
    SearchRequest,
    SearchResult,
    GenerateRequest,
    SummaryResult,
    TagsResult,
    KeywordsResult,
    WebsiteExtractRequest,
    GitHubExtractRequest,
    YouTubeExtractRequest,
)
from service import (
    chunk_text,
    embed_text,
    embed_batch,
    ensure_collection,
    upsert_chunks,
    delete_document_vectors,
    search_chunks,
    generate_summary,
    generate_tags,
    generate_keywords,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger("ai-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI service...")
    ensure_collection()
    yield
    logger.info("Shutting down AI service...")


app = FastAPI(
    title="AI Second Brain - AI Service",
    description="Python FastAPI service handling text extraction, chunking, embeddings, vector search, and LLM integration",
    version="1.0.0",
    lifespan=lifespan,
)

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ───────────────────────────────────────────────────────────────

@app.get("/", tags=["General"])
async def root():
    return {"status": "online", "service": "AI Service", "version": "1.0.0"}


@app.get("/health", status_code=status.HTTP_200_OK, tags=["Health"])
async def health_check():
    from service import get_qdrant_client
    qdrant_ok = False
    try:
        get_qdrant_client().get_collections()
        qdrant_ok = True
    except Exception:
        pass
    return {"status": "healthy", "qdrant": "connected" if qdrant_ok else "unreachable"}


# ── Extraction ──────────────────────────────────────────────────────────

EXTRACTORS = {
    "pdf": lambda b: extract_pdf(b),
    "docx": lambda b: extract_docx(b),
    "csv": lambda b: extract_csv(b),
    "image": lambda b: extract_image(b),
    "markdown": lambda t: extract_markdown(t),
    "txt": lambda t: extract_text(t),
}


@app.post("/api/v1/extract/{file_type}", tags=["Extraction"])
async def extract_text_endpoint(file_type: str, file: UploadFile = File(None), text: str = None):
    if file_type in ("markdown", "txt"):
        if text is None and file:
            content = await file.read()
            text = content.decode("utf-8", errors="replace")
        if text is None:
            raise HTTPException(status_code=400, detail="text field required for this file type")
        extractor = EXTRACTORS.get(file_type)
        if extractor is None:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_type}")
        try:
            extracted, meta = extractor(text)
        except ExtractionError as e:
            raise HTTPException(status_code=422, detail=str(e))
    elif file_type in ("pdf", "docx", "csv", "image"):
        if file is None:
            raise HTTPException(status_code=400, detail="file upload required")
        content = await file.read()
        extractor = EXTRACTORS.get(file_type)
        if extractor is None:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_type}")
        try:
            extracted, meta = extractor(content)
        except ExtractionError as e:
            raise HTTPException(status_code=422, detail=str(e))
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_type}")

    return ExtractionResult(text=extracted, metadata=meta)


@app.post("/api/v1/extract/website", tags=["Extraction"])
async def extract_website_endpoint(payload: WebsiteExtractRequest):
    try:
        text, meta = await extract_website(payload.url)
    except ExtractionError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return ExtractionResult(text=text, metadata=meta)


@app.post("/api/v1/extract/github", tags=["Extraction"])
async def extract_github_endpoint(payload: GitHubExtractRequest):
    try:
        text, meta = await extract_github(
            owner=payload.owner,
            repo=payload.repo,
            path=payload.path,
            branch=payload.branch,
            access_token=payload.access_token,
        )
    except ExtractionError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return ExtractionResult(text=text, metadata=meta)


@app.post("/api/v1/extract/youtube", tags=["Extraction"])
async def extract_youtube_endpoint(payload: YouTubeExtractRequest):
    try:
        text, meta = await extract_youtube(payload.video_id, payload.languages)
    except ExtractionError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return ExtractionResult(text=text, metadata=meta)


# ── Normalization ───────────────────────────────────────────────────────

@app.post("/api/v1/normalize", tags=["Processing"])
async def normalize_endpoint(payload: NormalizeRequest):
    original = payload.text
    normalized = normalize_text(original)
    return NormalizationResult(text=normalized, original_length=len(original), normalized_length=len(normalized))


# ── Chunking ────────────────────────────────────────────────────────────

@app.post("/api/v1/chunk", tags=["Processing"])
async def chunk_endpoint(payload: ChunkRequest):
    chunks = chunk_text(payload.text, chunk_size=payload.config.chunk_size, chunk_overlap=payload.config.chunk_overlap)
    return ChunkResult(
        chunks=chunks,
        strategy=payload.config.strategy,
        total_chunks=len(chunks),
        chunk_size=payload.config.chunk_size,
        chunk_overlap=payload.config.chunk_overlap,
    )


# ── Embedding ───────────────────────────────────────────────────────────

@app.post("/api/v1/embed", tags=["Embedding"])
async def embed_endpoint(payload: EmbedRequest):
    vector = embed_text(payload.text)
    return EmbeddingResult(embedding=vector, dimension=len(vector), model=settings.embedding_model)


@app.post("/api/v1/embed-batch", tags=["Embedding"])
async def embed_batch_endpoint(payload: EmbedBatchRequest):
    vectors = embed_batch(payload.texts)
    return EmbedBatchResult(embeddings=vectors, dimension=len(vectors[0]) if vectors else 0, model=settings.embedding_model)


# ── Vector Storage ──────────────────────────────────────────────────────

@app.post("/api/v1/upsert-chunks", tags=["Storage"])
async def upsert_chunks_endpoint(payload: UpsertChunksRequest):
    from schemas import Chunk
    chunk_objs = [Chunk(**c) for c in payload.chunks]
    try:
        upsert_chunks(
            payload.workspace_id,
            payload.document_id,
            payload.version_id,
            chunk_objs,
            payload.embeddings,
            tags=payload.tags,
            language=payload.language,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"status": "ok", "chunks_upserted": len(payload.chunks)}


@app.post("/api/v1/delete-vectors", tags=["Storage"])
async def delete_vectors_endpoint(payload: DeleteVectorsRequest):
    try:
        delete_document_vectors(payload.document_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"status": "ok", "document_id": payload.document_id}


# ── Search ──────────────────────────────────────────────────────────────

@app.post("/api/v1/search", tags=["Search"])
async def search_endpoint(payload: SearchRequest):
    try:
        hits = search_chunks(
            query=payload.query,
            workspace_id=payload.workspace_id,
            top_k=payload.top_k,
            document_id=payload.document_id,
            collection_id=payload.collection_id,
            tag_ids=payload.tag_ids,
            language=payload.language,
            score_threshold=payload.score_threshold,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return SearchResult(hits=hits, query=payload.query, total=len(hits))


# ── AI Generation ──────────────────────────────────────────────────────

@app.post("/api/v1/generate/summary", tags=["AI Generation"])
async def generate_summary_endpoint(payload: GenerateRequest):
    try:
        summary = await generate_summary(payload.text, payload.max_tokens)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return SummaryResult(summary=summary, model=settings.openrouter_model)


@app.post("/api/v1/generate/tags", tags=["AI Generation"])
async def generate_tags_endpoint(payload: GenerateRequest):
    try:
        tags = await generate_tags(payload.text, payload.max_tokens)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return TagsResult(tags=tags, model=settings.openrouter_model)


@app.post("/api/v1/generate/keywords", tags=["AI Generation"])
async def generate_keywords_endpoint(payload: GenerateRequest):
    try:
        keywords = await generate_keywords(payload.text, payload.max_tokens)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return KeywordsResult(keywords=keywords, model=settings.openrouter_model)


if __name__ == "__main__":
    import uvicorn
    reload_flag = os.getenv("UVICORN_RELOAD", "").lower() in ("1", "true", "yes")
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=reload_flag)
