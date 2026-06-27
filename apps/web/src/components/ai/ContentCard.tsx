'use client';

import { useState } from 'react';
import { useDeleteContent } from '@/lib/hooks/useAi';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';

function formatContent(content: any): string {
  if (typeof content === 'string') return content;
  return JSON.stringify(content, null, 2);
}

function isJsonContent(content: any): boolean {
  if (typeof content === 'string') return false;
  return true;
}

export function ContentCard({ item, onDeleted }: { item: any; onDeleted?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const deleteContent = useDeleteContent();
  const formatted = formatContent(item.content);
  const isJson = isJsonContent(item.content);

  const handleDelete = async () => {
    await deleteContent.mutateAsync(item.id);
    onDeleted?.();
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
            {item.type}
          </span>
          <span className="text-xs text-zinc-500">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
          {item.model && <span className="text-xs text-zinc-600">{item.model}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={handleDelete}
            className="rounded p-1 text-zinc-500 hover:bg-red-900/30 hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 max-h-96 overflow-auto rounded bg-zinc-950 p-3">
          {isJson ? (
            <pre className="text-xs text-zinc-300">{formatted}</pre>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none text-zinc-300">{formatted}</div>
          )}
        </div>
      )}
    </div>
  );
}

export function ContentList({ items, onDeleted }: { items: any[]; onDeleted?: () => void }) {
  if (!items?.length) {
    return <p className="py-8 text-center text-sm text-zinc-500">No content generated yet.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item: any) => (
        <ContentCard key={item.id} item={item} onDeleted={onDeleted} />
      ))}
    </div>
  );
}
