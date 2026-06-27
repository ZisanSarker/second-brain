'use client';

import { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  X,
  AlertTriangle,
  FileText,
  FileImage,
  FileCode,
  Table,
  File as FileIcon,
  Calendar,
  HardDrive,
  Clock,
} from 'lucide-react';
import {
  useTrash,
  useRestoreTrashDocument,
  usePermanentDeleteTrashDocument,
  useEmptyTrash,
} from '@/lib/hooks/useTrash';
import type { Document } from '@second-brain/types';

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
};

function getFileIcon(fileType?: string | null) {
  if (!fileType) return FileIcon;
  return fileTypeIcons[fileType.toLowerCase()] || FileIcon;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  return formatDate(dateStr);
}

export default function TrashPage() {
  const { data: trashItems, isLoading, error } = useTrash();
  const restoreDocument = useRestoreTrashDocument();
  const permanentDeleteDocument = usePermanentDeleteTrashDocument();
  const emptyTrash = useEmptyTrash();

  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<string | null>(null);

  const documents = (trashItems as Document[] | undefined) ?? [];

  const handleRestore = async (id: string) => {
    await restoreDocument.mutateAsync(id);
  };

  const handlePermanentDelete = async (id: string) => {
    await permanentDeleteDocument.mutateAsync(id);
    setConfirmPermanentDelete(null);
  };

  const handleEmptyTrash = async () => {
    await emptyTrash.mutateAsync();
    setConfirmEmpty(false);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="h-16 border-b border-slate-800/50 px-6 flex items-center justify-between bg-[#030303]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Trash2 className="h-5 w-5 text-red-400" />
          <h1 className="text-sm font-semibold text-slate-200">Trash</h1>
          {documents.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-slate-800/80 text-[10px] font-mono text-slate-500">
              {documents.length}
            </span>
          )}
        </div>
        {documents.length > 0 && (
          <button
            onClick={() => setConfirmEmpty(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Empty Trash
          </button>
        )}
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Info Banner */}
          {documents.length > 0 && (
            <div className="glass-panel rounded-xl border border-amber-900/20 p-4 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400">
                Documents in trash are automatically deleted after 30 days. You can restore them
                before then.
              </p>
            </div>
          )}

          {/* Empty Trash Confirmation */}
          {confirmEmpty && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="glass-panel rounded-xl border border-slate-800/60 p-6 w-full max-w-sm mx-4 text-center">
                <div className="p-2 rounded-xl bg-red-500/10 inline-flex mb-3">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">Empty trash?</h3>
                <p className="text-xs text-slate-500 mb-4">
                  This will permanently delete all {documents.length} documents. This action cannot
                  be undone.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setConfirmEmpty(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800/50 text-xs font-semibold text-slate-300 hover:bg-slate-700/50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEmptyTrash}
                    disabled={emptyTrash.isPending}
                    className="px-3 py-1.5 rounded-lg bg-red-500 text-xs font-semibold text-white hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    Permanently Delete All
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Permanent Delete Confirmation */}
          {confirmPermanentDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="glass-panel rounded-xl border border-slate-800/60 p-6 w-full max-w-sm mx-4 text-center">
                <div className="p-2 rounded-xl bg-red-500/10 inline-flex mb-3">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">Permanently delete?</h3>
                <p className="text-xs text-slate-500 mb-4">
                  This action cannot be undone. The document will be permanently removed.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setConfirmPermanentDelete(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800/50 text-xs font-semibold text-slate-300 hover:bg-slate-700/50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(confirmPermanentDelete)}
                    disabled={permanentDeleteDocument.isPending}
                    className="px-3 py-1.5 rounded-lg bg-red-500 text-xs font-semibold text-white hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Trash List */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="glass-panel rounded-xl border border-slate-800/60 p-4 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-800/60" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-800/60 rounded w-1/2" />
                      <div className="h-3 bg-slate-800/60 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="glass-panel rounded-xl border border-red-900/30 p-8 text-center">
              <div className="p-3 rounded-xl bg-red-500/10 inline-flex mb-3">
                <X className="h-6 w-6 text-red-400" />
              </div>
              <p className="text-sm text-slate-400">Failed to load trash.</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="glass-panel rounded-xl border border-slate-800/60 p-12 text-center">
              <div className="p-3 rounded-xl bg-slate-800/50 inline-flex mb-3">
                <Trash2 className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300 mb-1">Trash is empty</h3>
              <p className="text-xs text-slate-500">Deleted documents will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
                const Icon = getFileIcon(doc.fileType);
                return (
                  <div
                    key={doc.id}
                    className="glass-panel rounded-xl border border-slate-800/60 p-4 hover:border-slate-700/60 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-slate-800/50 shrink-0">
                        <Icon className="h-5 w-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-200 truncate">
                          {doc.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Deleted {formatRelativeTime(doc.deletedAt || doc.updatedAt)}
                          </span>
                          {doc.fileType && (
                            <>
                              <span className="text-slate-700">·</span>
                              <span className="uppercase">{doc.fileType}</span>
                            </>
                          )}
                          {doc.fileSize && (
                            <>
                              <span className="text-slate-700">·</span>
                              <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleRestore(doc.id)}
                          disabled={restoreDocument.isPending}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Restore
                        </button>
                        <button
                          onClick={() => setConfirmPermanentDelete(doc.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                          title="Permanently delete"
                        >
                          <X className="h-4 w-4 text-slate-500 hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
