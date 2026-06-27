'use client';

import Link from 'next/link';
import {
  Heart,
  FileText,
  FileImage,
  FileCode,
  Table,
  FileSpreadsheet,
  File as FileIcon,
  X,
  Calendar,
  HardDrive,
  Trash2,
} from 'lucide-react';
import { useFavorites, useRemoveFavorite } from '@/lib/hooks/useFavorites';
import type { Favorite } from '@second-brain/types';

const fileTypeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  doc: FileText,
  md: FileCode,
  txt: FileText,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  webp: FileImage,
  csv: Table,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
};

function getFileIcon(fileType?: string | null) {
  if (!fileType) return FileIcon;
  return fileTypeIcons[fileType.toLowerCase()] || FileIcon;
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIdx = 0;
  while (size >= 1024 && unitIdx < units.length - 1) {
    size /= 1024;
    unitIdx++;
  }
  return `${size.toFixed(1)} ${units[unitIdx]}`;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function FavoriteCard({
  favorite,
  onRemove,
}: {
  favorite: Favorite;
  onRemove: (id: string) => void;
}) {
  const doc = favorite.document;
  if (!doc) return null;

  const Icon = getFileIcon(doc.fileType);

  return (
    <Link href={`/documents/${doc.id}`}>
      <div className="glass-panel rounded-xl border border-border p-4 glass-panel-hover cursor-pointer group h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-destructive/10 to-destructive/10 border border-destructive/10">
            <Icon className="h-5 w-5 text-destructive-foreground" />
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(favorite.id);
            }}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-card/50"
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        <h3 className="text-sm font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-foreground transition-colors">
          {doc.title}
        </h3>

        <div className="mt-auto space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <HardDrive className="h-3 w-3" />
            <span>{formatFileSize(doc.fileSize)}</span>
            <span className="text-muted-foreground">·</span>
            <Calendar className="h-3 w-3" />
            <span>{formatDate(doc.createdAt)}</span>
          </div>

          {doc.fileType && (
            <span className="px-1.5 py-0.5 rounded-md bg-card/80 text-[10px] font-mono font-semibold text-muted-foreground uppercase inline-block">
              {doc.fileType}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function FavoritesPage() {
  const { data: favorites, isLoading, error } = useFavorites({ entityType: 'document' });
  const removeFavorite = useRemoveFavorite();

  const handleRemove = async (id: string) => {
    await removeFavorite.mutateAsync(id);
  };

  const allFavorites = (favorites as Favorite[] | undefined) ?? [];

  return (
    <div className="flex flex-col h-full">
      <header className="h-16 border-b border-border px-6 flex items-center bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Heart className="h-5 w-5 text-destructive-foreground" />
          <h1 className="text-sm font-semibold text-foreground">Favorites</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="glass-panel rounded-xl border border-border p-4 animate-pulse"
                >
                  <div className="h-10 w-10 rounded-xl bg-card/60 mb-3" />
                  <div className="h-4 bg-card/60 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-card/60 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="glass-panel rounded-xl border border-destructive/30 p-8 text-center">
              <div className="p-3 rounded-xl bg-destructive/10 inline-flex mb-3">
                <X className="h-6 w-6 text-destructive-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Failed to load favorites.</p>
            </div>
          ) : allFavorites.length === 0 ? (
            <div className="glass-panel rounded-xl border border-border p-12 text-center">
              <div className="p-3 rounded-xl bg-card/50 inline-flex mb-3">
                <Heart className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">No favorites yet</h3>
              <p className="text-xs text-muted-foreground">
                Favorite documents by clicking the heart icon to see them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {allFavorites.map((fav) => (
                <FavoriteCard key={fav.id} favorite={fav} onRemove={handleRemove} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
