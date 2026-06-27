'use client';

import { useState } from 'react';
import { useDeleteContent } from '@/lib/hooks/useAi';
import { Trash2, ChevronDown, ChevronUp, MessageSquare, Share2 } from 'lucide-react';
import { CommentSidebar } from '@/components/comments/CommentSidebar';
import { ShareDialog } from '@/components/sharing/ShareDialog';

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
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const deleteContent = useDeleteContent();
  const formatted = formatContent(item.content);
  const isJson = isJsonContent(item.content);

  const handleDelete = async () => {
    await deleteContent.mutateAsync(item.id);
    onDeleted?.();
  };

  return (
    <div className="rounded-lg border border-border bg-popover/30 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded bg-card px-2 py-0.5 text-xs font-medium text-foreground">
            {item.type}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
          {item.model && <span className="text-xs text-muted-foreground">{item.model}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowComments(true)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Comments"
          >
            <MessageSquare size={14} />
          </button>
          <button
            onClick={() => setShowShare(true)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Share"
          >
            <Share2 size={14} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={handleDelete}
            className="rounded p-1 text-muted-foreground hover:bg-destructive/30 hover:text-destructive-foreground"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 max-h-96 overflow-auto rounded bg-popover p-3">
          {isJson ? (
            <pre className="text-xs text-foreground">{formatted}</pre>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none text-foreground">
              {formatted}
            </div>
          )}
        </div>
      )}

      {showComments && (
        <CommentSidebar
          entityType="GENERATED_CONTENT"
          entityId={item.id}
          onClose={() => setShowComments(false)}
        />
      )}
      {showShare && (
        <ShareDialog
          entityType="GENERATED_CONTENT"
          entityId={item.id}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

export function ContentList({ items, onDeleted }: { items: any[]; onDeleted?: () => void }) {
  if (!items?.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No content generated yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item: any) => (
        <ContentCard key={item.id} item={item} onDeleted={onDeleted} />
      ))}
    </div>
  );
}
