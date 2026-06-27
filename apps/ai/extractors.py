from __future__ import annotations
import csv
import io
import logging
import re
from typing import Optional

logger = logging.getLogger("ai-service.extractors")


class ExtractionError(Exception):
    pass


def extract_pdf(file_bytes: bytes) -> tuple[str, dict]:
    import pdfplumber
    try:
        pages_text = []
        metadata = {}
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            metadata["page_count"] = len(pdf.pages)
            if pdf.metadata:
                metadata["title"] = pdf.metadata.get("Title", "")
                metadata["author"] = pdf.metadata.get("Author", "")
                metadata["subject"] = pdf.metadata.get("Subject", "")
            for i, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                pages_text.append(text)
        return "\n\n".join(pages_text), metadata
    except Exception as e:
        raise ExtractionError(f"PDF extraction failed: {e}")


def extract_docx(file_bytes: bytes) -> tuple[str, dict]:
    import docx
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs]
        metadata = {
            "paragraph_count": len(paragraphs),
            "section_count": len(doc.sections),
        }
        return "\n".join(paragraphs), metadata
    except Exception as e:
        raise ExtractionError(f"DOCX extraction failed: {e}")


def extract_markdown(text: str) -> tuple[str, dict]:
    metadata = {}
    headings = re.findall(r"^(#{1,6})\s+(.+)$", text, re.MULTILINE)
    metadata["heading_count"] = len(headings)
    metadata["headings"] = [h[1].strip() for h in headings]
    return text, metadata


def extract_text(text: str) -> tuple[str, dict]:
    return text, {"line_count": text.count("\n") + 1, "char_count": len(text)}


def extract_csv(file_bytes: str | bytes) -> tuple[str, dict]:
    try:
        if isinstance(file_bytes, str):
            file_bytes = file_bytes.encode()
        reader = csv.reader(io.StringIO(file_bytes.decode("utf-8", errors="replace")))
        rows = list(reader)
        if not rows:
            return "", {"row_count": 0, "column_count": 0}
        text_parts = []
        text_parts.append(" | ".join(rows[0]))
        text_parts.append("-" * 80)
        for row in rows[1:]:
            text_parts.append(" | ".join(row))
        return "\n".join(text_parts), {"row_count": len(rows), "column_count": len(rows[0]) if rows else 0}
    except Exception as e:
        raise ExtractionError(f"CSV extraction failed: {e}")


def extract_image(file_bytes: bytes) -> tuple[str, dict]:
    try:
        from PIL import Image
        import pytesseract
        image = Image.open(io.BytesIO(file_bytes))
        text = pytesseract.image_to_string(image)
        metadata = {
            "format": image.format,
            "size": image.size,
            "mode": image.mode,
        }
        return text.strip(), metadata
    except ImportError:
        raise ExtractionError("OCR libraries (Pillow/pytesseract) not available")
    except Exception as e:
        raise ExtractionError(f"OCR extraction failed: {e}")


async def extract_website(url: str) -> tuple[str, dict]:
    import trafilatura
    try:
        downloaded = trafilatura.fetch_url(url)
        if downloaded is None:
            raise ExtractionError(f"Failed to fetch URL: {url}")
        text = trafilatura.extract(downloaded, include_links=True, include_images=False, output_format="txt")
        if text is None:
            raise ExtractionError(f"No readable content found at: {url}")
        metadata = {"source_url": url, "source_type": "website"}
        return text, metadata
    except ExtractionError:
        raise
    except Exception as e:
        raise ExtractionError(f"Website extraction failed: {e}")


async def extract_github(
    owner: str,
    repo: str,
    path: str = "",
    branch: str = "main",
    access_token: Optional[str] = None,
) -> tuple[str, dict]:
    import httpx
    try:
        headers = {"Accept": "application/vnd.github.v3.raw"}
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        api_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}"
        async with httpx.AsyncClient() as client:
            resp = await client.get(api_url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, list):
                all_text = []
                file_count = 0
                for item in data:
                    if item["type"] == "file":
                        file_resp = await client.get(item["download_url"], headers=headers)
                        file_resp.raise_for_status()
                        all_text.append(f"--- FILE: {item['path']} ---\n{file_resp.text}")
                        file_count += 1
                text = "\n\n".join(all_text)
                metadata = {"file_count": file_count, "owner": owner, "repo": repo, "branch": branch, "path": path}
            else:
                text = resp.text
                metadata = {"file_count": 1, "owner": owner, "repo": repo, "branch": branch, "path": path}
            return text, metadata
    except httpx.HTTPStatusError as e:
        raise ExtractionError(f"GitHub API error: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        raise ExtractionError(f"GitHub extraction failed: {e}")


async def extract_youtube(
    video_id: str,
    languages: Optional[list[str]] = None,
) -> tuple[str, dict]:
    from youtube_transcript_api import YouTubeTranscriptApi
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        transcript = None
        if languages:
            for lang in languages:
                try:
                    transcript = transcript_list.find_transcript([lang])
                    break
                except Exception:
                    continue
        if transcript is None:
            transcript = transcript_list.find_generated_transcript(["en"])
        captions = transcript.fetch()
        text_parts = [entry["text"] for entry in captions]
        text = " ".join(text_parts)
        metadata = {
            "video_id": video_id,
            "language": transcript.language,
            "language_code": transcript.language_code,
            "is_generated": transcript.is_generated,
            "segment_count": len(captions),
        }
        return text, metadata
    except Exception as e:
        raise ExtractionError(f"YouTube transcript extraction failed: {e}")


def normalize_text(text: str) -> str:
    text = re.sub(r"\r\n", "\n", text)
    text = re.sub(r"\r", "\n", text)
    text = re.sub(r"\t", " ", text)
    text = re.sub(r"[^\S\n]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = text.strip()
    return text
