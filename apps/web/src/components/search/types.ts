export interface SearchSuggestionDto {
  text: string;
  type: 'query' | 'document' | 'tag' | 'collection';
  id?: string;
  subtitle?: string;
}

export interface SearchHitDto {
  documentId: string;
  title: string;
  description?: string;
  source: string;
  sourceType: string;
  score: number;
  keywordScore?: number;
  semanticScore?: number;
  matchedContent: string;
  chunkIndex?: number;
  pageNumber?: number;
  section?: string;
  fileType?: string;
  author?: string;
  language?: string;
  updatedAt: string;
  tags?: { id: string; name: string; color?: string }[];
  collectionId?: string;
  collectionName?: string;
  folderName?: string;
}

export interface SearchResultsDto {
  data: SearchHitDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query: string;
  mode: string;
  took: number;
}

export interface SearchHistoryEntryDto {
  id: string;
  query: string;
  filters?: Record<string, unknown>;
  resultCount?: number;
  createdAt: string;
}
