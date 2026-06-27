"""Tests for text extraction and normalization functions."""

from extractors import extract_text, extract_markdown, normalize_text, extract_csv


def test_extract_txt():
    text = "Hello\nWorld"
    result, meta = extract_text(text)
    assert result == text
    assert meta["line_count"] == 2
    assert meta["char_count"] == 11


def test_extract_markdown():
    text = "# Heading 1\n\nSome content\n\n## Heading 2\n\nMore content"
    result, meta = extract_markdown(text)
    assert meta["heading_count"] == 2
    assert meta["headings"] == ["Heading 1", "Heading 2"]
    assert "Some content" in result


def test_extract_csv():
    text = "name,age,city\nAlice,30,NYC\nBob,25,LA"
    result, meta = extract_csv(text)
    assert meta["row_count"] == 3  # header + 2 rows
    assert meta["column_count"] == 3
    assert "Alice" in result
    assert "NYC" in result


def test_normalize_whitespace():
    text = "  Hello   World  \n\n\n\nNext  paragraph.\r\n"
    result = normalize_text(text)
    assert "  " not in result  # no double spaces
    assert "\n\n\n" not in result  # max two newlines
    assert result == result.strip()


def test_normalize_line_endings():
    text = "Line1\r\nLine2\rLine3"
    result = normalize_text(text)
    assert "\r\n" not in result
    assert "\r" not in result
    assert result == "Line1\nLine2\nLine3"


def test_normalize_tabs():
    text = "Column1\tColumn2\tColumn3"
    result = normalize_text(text)
    assert "\t" not in result
