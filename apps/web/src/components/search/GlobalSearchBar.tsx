'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, FileText, Tags, Library, Clock } from 'lucide-react';
import { useSearchSuggestions } from '@/lib/hooks/useSearch';
import type { SearchSuggestionDto } from './types';

export function GlobalSearchBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useSearchSuggestions(open && query ? query : '');

  const suggestions: SearchSuggestionDto[] = data?.suggestions ?? [];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  const navigate = useCallback(
    (q: string) => {
      setOpen(false);
      setQuery('');
      router.push(`/search?q=${encodeURIComponent(q)}`);
    },
    [router],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        navigate(suggestions[selectedIndex].text);
      } else if (query.trim()) {
        navigate(query.trim());
      }
    }
  };

  const iconMap: Record<string, typeof FileText> = {
    document: FileText,
    tag: Tags,
    collection: Library,
    query: Clock,
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-purple-500/30 transition-all text-sm w-full max-w-md"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-500 font-mono border border-slate-700/50">
          ⌘K
        </kbd>
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setOpen(false);
              setQuery('');
            }}
          />
          <div
            ref={panelRef}
            className="relative z-10 w-full max-w-xl mx-4 glass-panel rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden"
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50">
              {isFetching ? (
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin shrink-0" />
              ) : (
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search documents, tags, collections..."
                className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-base"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="max-h-80 overflow-y-auto py-2">
                {suggestions.map((s, i) => {
                  const Icon = iconMap[s.type] || Search;
                  return (
                    <button
                      key={`${s.type}-${s.text}-${i}`}
                      onClick={() => navigate(s.text)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        i === selectedIndex
                          ? 'bg-purple-500/10 text-purple-300'
                          : 'text-slate-300 hover:bg-slate-800/30'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                      <div className="flex-1 text-left truncate">
                        <span>{s.text}</span>
                        {s.subtitle && (
                          <span className="ml-2 text-xs text-slate-500">{s.subtitle}</span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase text-slate-600">{s.type}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Empty state */}
            {query && !isFetching && suggestions.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No results for &ldquo;{query}&rdquo;
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-700/50 text-[10px] text-slate-600">
              <span>↑↓ Navigate</span>
              <span>↵ Open</span>
              <span>Esc Close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
