from __future__ import annotations
from enum import Enum
from typing import Any, List, Optional
from pydantic import BaseModel, Field


class FileType(str, Enum):
    pdf = "pdf"
    docx = "docx"
    markdown = "markdown"
    txt = "txt"
    csv = "csv"
    image = "image"


class ChunkConfig(BaseModel):
    chunk_size: int = Field(default=500, ge=50, le=8000)
    chunk_overlap: int = Field(default=50, ge=0)
    strategy: str = Field(default="recursive")


class NormalizeRequest(BaseModel):
    text: str


class ChunkRequest(BaseModel):
    text: str
    config: ChunkConfig = Field(default_factory=ChunkConfig)


class UpsertChunksRequest(BaseModel):
    workspace_id: str
    document_id: str
    version_id: str
    chunks: list[dict]
    embeddings: list[list[float]]


class DeleteVectorsRequest(BaseModel):
    document_id: str


# --- Extraction ---

class ExtractionResult(BaseModel):
    text: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    pages: Optional[List[dict]] = None


class NormalizationResult(BaseModel):
    text: str
    original_length: int
    normalized_length: int


# --- Chunking ---

class Chunk(BaseModel):
    content: str
    index: int
    page_number: Optional[int] = None
    section: Optional[str] = None
    token_count: int = 0
    char_count: int = 0


class ChunkResult(BaseModel):
    chunks: list[Chunk]
    strategy: str = "recursive"
    total_chunks: int
    chunk_size: int
    chunk_overlap: int


# --- Embedding ---

class EmbedRequest(BaseModel):
    text: str


class EmbedBatchRequest(BaseModel):
    texts: list[str]


class EmbeddingResult(BaseModel):
    embedding: list[float]
    dimension: int
    model: str


class EmbedBatchResult(BaseModel):
    embeddings: list[list[float]]
    dimension: int
    model: str


# --- Search ---

class SearchRequest(BaseModel):
    query: str
    workspace_id: str
    top_k: int = Field(default=5, ge=1, le=100)
    document_id: Optional[str] = None
    collection_id: Optional[str] = None
    score_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class SearchHit(BaseModel):
    id: str
    score: float
    text: str
    document_id: str
    chunk_index: int
    page_number: Optional[int] = None
    section: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class SearchResult(BaseModel):
    hits: list[SearchHit]
    query: str
    total: int


# --- AI Generation ---

class GenerateRequest(BaseModel):
    text: str
    max_tokens: int = Field(default=300, ge=32, le=2048)


class SummaryResult(BaseModel):
    summary: str
    model: str


class TagsResult(BaseModel):
    tags: list[str]
    model: str


class KeywordsResult(BaseModel):
    keywords: list[str]
    model: str


# --- Import extraction ---

class WebsiteExtractRequest(BaseModel):
    url: str


class GitHubExtractRequest(BaseModel):
    owner: str
    repo: str
    path: str = ""
    branch: str = "main"
    access_token: Optional[str] = None


class YouTubeExtractRequest(BaseModel):
    video_id: str
    languages: Optional[list[str]] = None
