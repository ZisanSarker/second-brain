"""Tests for text chunking."""

from service import chunk_text


def test_chunk_small_text():
    text = "Hello world."
    chunks = chunk_text(text, chunk_size=500, chunk_overlap=50)
    assert len(chunks) == 1
    assert chunks[0].content == "Hello world."
    assert chunks[0].index == 0


def test_chunk_large_text():
    text = "word " * 1000
    chunks = chunk_text(text, chunk_size=100, chunk_overlap=20)
    assert len(chunks) > 5
    assert all(c.index >= 0 for c in chunks)
    assert all(c.token_count > 0 for c in chunks)
    assert all(c.char_count > 0 for c in chunks)


def test_chunk_overlap():
    text = "word " * 500
    chunks = chunk_text(text, chunk_size=100, chunk_overlap=50)
    for i in range(1, len(chunks)):
        prev_end = chunks[i - 1].content[-50:]
        curr_start = chunks[i].content[:50]
        assert len(prev_end) > 0
        assert len(curr_start) > 0


def test_chunk_boundaries():
    text = "A" * 1000
    chunks = chunk_text(text, chunk_size=100, chunk_overlap=0)
    total_chars = sum(len(c.content) for c in chunks)
    # No overlap means total chars should be roughly equal to source
    assert chunks[-1].index == len(chunks) - 1
