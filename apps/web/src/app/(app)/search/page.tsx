'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  BookOpen,
  Tag,
  Clock,
  User,
  Loader2,
} from 'lucide-react';
import { useSearch, useSearchHistory } from '@/lib/hooks/useSearch';
import { useCollections } from '@/lib/hooks/useCollections';
import { useTags } from '@/lib/hooks/useTags';
import type {
  SearchHitDto,
  SearchResultsDto,
  SearchHistoryEntryDto,
} from '@/components/search/types';

function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-primary/20 text-primary rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function sourceIcon(type: string) {
  switch (type) {
    case 'website':
      return Globe;
    case 'youtube':
      return BookOpen;
    default:
      return FileText;
  }
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [mode, setMode] = useState<string>('hybrid');
  const [collectionId, setCollectionId] = useState('');
  const [tagId, setTagId] = useState('');
  const [fileType, setFileType] = useState('');
  const [author, setAuthor] = useState('');
  const [page, setPage] = useState(1);
  const [language, setLanguage] = useState('');

  // Debounce query input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const searchParamsObj = useMemo(() => {
    const p: Record<string, unknown> = { page, limit: 20 };
    if (mode !== 'hybrid') p.mode = mode;
    if (collectionId) p.collectionId = collectionId;
    if (tagId) p.tagId = tagId;
    if (fileType) p.fileType = fileType;
    if (author) p.author = author;
    if (language) p.language = language;
    return p;
  }, [page, mode, collectionId, tagId, fileType, author, language]);

  const { data, isFetching, isError } = useSearch(debouncedQuery, searchParamsObj);
  const { data: history } = useSearchHistory();
  const { data: collections } = useCollections();
  const { data: tags } = useTags();

  const results = data as SearchResultsDto | undefined;
  const historyEntries = (history as SearchHistoryEntryDto[]) || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(query);
    setPage(1);
    router.push(`/search?q=${encodeURIComponent(query)}`, { scroll: false });
  };

  const clearFilters = () => {
    setMode('hybrid');
    setCollectionId('');
    setTagId('');
    setFileType('');
    setAuthor('');
    setLanguage('');
    setPage(1);
  };

  const hasFilters = mode !== 'hybrid' || collectionId || tagId || fileType || author || language;

  return (
    <div className="min-h-screen">
      {/* Search header */}
      <div className="border-b border-border px-6 py-4">
        <form onSubmit={handleSearch} className="max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              suppressHydrationWarning
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents, tags, collections..."
              autoFocus
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-popover/50 border border-border text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 transition-colors text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Active filters bar */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              showFilters
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-card/50 text-muted-foreground border border-border hover:text-foreground'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </button>
          {results && (
            <span className="text-xs text-muted-foreground">
              {results.total} result{results.total !== 1 ? 's' : ''} · {results.took}ms
            </span>
          )}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-destructive-foreground hover:text-destructive-foreground hover:bg-destructive/10 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-3 p-4 rounded-xl bg-popover/50 border border-border grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary/50"
              >
                <option value="hybrid">Hybrid</option>
                <option value="keyword">Keyword</option>
                <option value="semantic">Semantic</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Collection
              </label>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary/50"
              >
                <option value="">All</option>
                {collections?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Tag
              </label>
              <select
                value={tagId}
                onChange={(e) => setTagId(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary/50"
              >
                <option value="">All</option>
                {tags?.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                File Type
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary/50"
              >
                <option value="">All</option>
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
                <option value="markdown">Markdown</option>
                <option value="html">HTML</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Author
              </label>
              <input
                suppressHydrationWarning
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Any"
                className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary/50"
              >
                <option value="">All</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results area */}
      <div className="flex">
        {/* Main results */}
        <div className="flex-1 px-6 py-4 space-y-3">
          {isFetching && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          )}

          {!isFetching && isError && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Search failed. Please try again.</p>
            </div>
          )}

          {!isFetching && !isError && results && results.data.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground mb-1">No results found</p>
              <p className="text-sm">Try a different search term or adjust your filters.</p>
            </div>
          )}

          {!isFetching &&
            !isError &&
            results?.data.map((hit: SearchHitDto) => {
              const Icon = sourceIcon(hit.sourceType);
              return (
                <div
                  key={`${hit.documentId}-${hit.chunkIndex ?? 0}`}
                  className="p-4 rounded-xl border border-border bg-popover/30 hover:bg-popover/50 hover:border-border transition-all cursor-pointer"
                  onClick={() => router.push(`/documents/${hit.documentId}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {highlightText(hit.title, debouncedQuery)}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {highlightText(hit.matchedContent, debouncedQuery)}
                      </p>
                      {hit.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {hit.description}
                        </p>
                      )}
                      {/* Metadata */}
                      <div className="flex items-center gap-3 mt-2 flex-wrap text-[10px] text-muted-foreground">
                        {hit.chunkIndex !== undefined && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Chunk {hit.chunkIndex}
                          </span>
                        )}
                        {hit.pageNumber && <span>p.{hit.pageNumber}</span>}
                        {hit.section && <span>{hit.section}</span>}
                        {hit.author && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {hit.author}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(hit.updatedAt)}
                        </span>
                        <span>Score: {(hit.score * 100).toFixed(0)}%</span>
                      </div>
                      {/* Tags */}
                      {hit.tags && hit.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {hit.tags.map((t) => (
                            <span
                              key={t.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card text-[10px] text-muted-foreground"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {t.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Pagination */}
          {results && results.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground bg-card/50 border border-border hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <span className="text-xs text-muted-foreground">
                Page {results.page} of {results.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(results.totalPages, p + 1))}
                disabled={page >= results.totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground bg-card/50 border border-border hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {!isFetching && !isError && !results && !debouncedQuery && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm">
                Enter a search query to find knowledge across your workspace.
              </p>
            </div>
          )}
        </div>

        {/* Recent searches sidebar */}
        {historyEntries.length > 0 && (
          <aside className="hidden lg:block w-64 border-l border-border px-4 py-4">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3 font-medium">
              Recent Searches
            </h4>
            <div className="space-y-1">
              {historyEntries.slice(0, 10).map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => {
                    setQuery(entry.query);
                    setDebouncedQuery(entry.query);
                    setPage(1);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-card/30 transition-colors truncate"
                >
                  {entry.query}
                </button>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
