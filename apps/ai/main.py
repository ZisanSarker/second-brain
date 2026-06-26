import logging
import os
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("ai-service")

app = FastAPI(
    title="AI Second Brain - AI Service",
    description="Python FastAPI service handling Embeddings, Chunking, Search, and LLM integrations",
    version="1.0.0",
)

# CORS configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response schemas
class ChunkRequest(BaseModel):
    text: str
    chunk_size: int = 500
    chunk_overlap: int = 50

class EmbedRequest(BaseModel):
    text: str

class QueryRequest(BaseModel):
    query: str
    collection_id: str
    top_k: int = 5

@app.get("/", tags=["General"])
async def root():
    return {
        "status": "online",
        "service": "AI Second Brain - AI Service",
        "version": "1.0.0"
    }

@app.get("/health", status_code=status.HTTP_200_OK, tags=["Health"])
async def health_check():
    # In future, we can add Qdrant connection checks here
    return {
        "status": "healthy",
        "database": "unverified",
        "qdrant": "unverified"
    }

@app.post("/api/v1/chunk", tags=["AI Core"])
async def chunk_text(payload: ChunkRequest):
    logger.info(f"Received chunk request, size: {len(payload.text)}")
    # Placeholder for chunking logic
    return {
        "chunks": [payload.text[i:i+payload.chunk_size] for i in range(0, len(payload.text), payload.chunk_size - payload.chunk_overlap)]
    }

@app.post("/api/v1/embed", tags=["AI Core"])
async def embed_text(payload: EmbedRequest):
    logger.info("Received embedding request")
    # Placeholder vector of length 1536 (e.g. OpenAI dimension) or 384
    mock_vector = [0.0] * 384
    return {
        "embedding": mock_vector,
        "dimension": 384
    }

@app.post("/api/v1/search", tags=["AI Core"])
async def search_collection(payload: QueryRequest):
    logger.info(f"Searching collection: {payload.collection_id} for: '{payload.query}'")
    # Placeholder results
    return {
        "results": [
            {
                "id": "mock-doc-1",
                "score": 0.89,
                "text": "This is a mock search result from Qdrant.",
                "metadata": {"title": "Mock Doc"}
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    reload_flag = os.getenv("UVICORN_RELOAD", "").lower() in ("1", "true", "yes")
    uvicorn.run("main:app", host=os.getenv("HOST", "0.0.0.0"), port=port, reload=reload_flag)
