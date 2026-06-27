-- Enable pg_trgm for fuzzy/prefix matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Full-text search GIN index on Document title + description
CREATE INDEX IF NOT EXISTS idx_document_fulltext
  ON "Document"
  USING GIN (to_tsvector('english', coalesce("title", '') || ' ' || coalesce("description", '')));

-- Trigram GIN index for prefix/ILIKE matching on Document title
CREATE INDEX IF NOT EXISTS idx_document_title_trgm
  ON "Document"
  USING GIN ("title" gin_trgm_ops);

-- Full-text search GIN index on DocumentChunk content
CREATE INDEX IF NOT EXISTS idx_chunk_fulltext
  ON "DocumentChunk"
  USING GIN (to_tsvector('english', "content"));

-- Trigram GIN index for fuzzy matching on DocumentChunk content
CREATE INDEX IF NOT EXISTS idx_chunk_content_trgm
  ON "DocumentChunk"
  USING GIN ("content" gin_trgm_ops);

-- Index for search suggestions: matching titles
CREATE INDEX IF NOT EXISTS idx_document_title_prefix
  ON "Document" ("title" varchar_pattern_ops);

-- Index for search suggestions: matching tag names
CREATE INDEX IF NOT EXISTS idx_tag_name_prefix
  ON "Tag" ("name" varchar_pattern_ops);

-- Index for search history lookups
CREATE INDEX IF NOT EXISTS idx_search_history_query_prefix
  ON "SearchHistory" ("query" varchar_pattern_ops);
