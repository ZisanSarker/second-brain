"""Tests for FastAPI endpoints using TestClient."""

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_root():
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert data["service"] == "AI Service"


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"


def test_normalize_endpoint():
    resp = client.post("/api/v1/normalize", json={"text": "  Hello   World  \n\n\n\nNew\npara\r\n"})
    assert resp.status_code == 200
    data = resp.json()
    assert "Hello" in data["text"]
    assert data["normalized_length"] < data["original_length"]


def test_chunk_endpoint():
    resp = client.post("/api/v1/chunk", json={
        "text": "Hello world. " * 50,
        "config": {"chunk_size": 50, "chunk_overlap": 10},
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_chunks"] > 0
    assert len(data["chunks"]) > 0
    assert data["chunks"][0]["content"]


def test_chunk_endpoint_empty_text():
    resp = client.post("/api/v1/chunk", json={"text": "", "config": {"chunk_size": 50}})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_chunks"] == 0


def test_extract_txt_endpoint():
    resp = client.post("/api/v1/extract/txt", params={"text": "Hello World"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["text"] == "Hello World"


def test_extract_markdown_endpoint():
    resp = client.post("/api/v1/extract/markdown", params={"text": "# Title\n\nBody"})
    assert resp.status_code == 200
    data = resp.json()
    assert "# Title" in data["text"]
    assert len(data["metadata"]["headings"]) == 1


def test_normalize_no_text():
    resp = client.post("/api/v1/normalize", json={"text": ""})
    assert resp.status_code == 200
    assert resp.json()["text"] == ""


def test_unsupported_file_type():
    resp = client.post("/api/v1/extract/unknown")
    assert resp.status_code == 400
    assert "Unsupported" in resp.json()["detail"]
