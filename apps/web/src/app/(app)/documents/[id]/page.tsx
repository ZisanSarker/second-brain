'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  FileImage,
  FileCode,
  Table,
  FileSpreadsheet,
  File as FileIcon,
  Calendar,
  HardDrive,
  Clock,
  User,
  Globe,
  BookOpen,
  Tag,
  Download,
  RotateCcw,
  ArrowLeft,
  Edit3,
  Save,
  X,
  Layers,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Share2,
} from 'lucide-react';
import {
  useDocument,
  useVersions,
  useRestoreVersion,
  useDownloadUrl,
  useUpdateDocument,
  useProcessingStatus,
  useRetryProcessing,
} from '@/lib/hooks/useDocuments';
import { useRemoveTag } from '@/lib/hooks/useDocuments';
import { useHeartbeat } from '@/lib/hooks/usePresence';
import { CommentSidebar } from '@/components/comments/CommentSidebar';
import { ShareDialog } from '@/components/sharing/ShareDialog';
import type { DocumentVersion } from '@second-brain/types';

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
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(dateStr);
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-800/30 last:border-0">
      <div className="p-1.5 rounded-lg bg-slate-800/50 shrink-0">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-sm text-slate-200 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: doc, isLoading, error } = useDocument(id);
  const { data: versions } = useVersions(id);
  const updateDocument = useUpdateDocument();
  const restoreVersion = useRestoreVersion();
  const downloadUrl = useDownloadUrl();
  const removeTag = useRemoveTag();
  const { data: processing } = useProcessingStatus(id);
  const retryProcessing = useRetryProcessing();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLanguage, setEditLanguage] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [showVersions, setShowVersions] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const heartbeat = useHeartbeat();

  useEffect(() => {
    heartbeat.mutate({ status: 'ACTIVE', currentDocumentId: id });
    return () => {
      heartbeat.mutate({ status: 'AWAY' });
    };
  }, [id]);

  const startEditing = () => {
    if (!doc) return;
    setEditTitle(doc.title);
    setEditDescription(doc.description || '');
    setEditLanguage(doc.language || '');
    setEditAuthor(doc.author || '');
    setIsEditing(true);
  };

  const saveEdit = async () => {
    if (!doc) return;
    await updateDocument.mutateAsync({
      id: doc.id,
      data: {
        title: editTitle,
        description: editDescription || null,
        language: editLanguage || null,
        author: editAuthor || null,
      },
    });
    setIsEditing(false);
  };

  const handleDownload = async () => {
    if (!doc) return;
    setDownloading(true);
    try {
      const res = await downloadUrl.mutateAsync(doc.id);
      window.open(res.url, '_blank');
    } catch {
      // Silently fail
    }
    setDownloading(false);
  };

  const handleRestoreVersion = async (versionId: string) => {
    await restoreVersion.mutateAsync({ documentId: id, versionId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass-panel rounded-xl border border-slate-800/60 p-8 animate-pulse space-y-4 w-full max-w-3xl mx-6">
          <div className="h-8 bg-slate-800/60 rounded w-2/3" />
          <div className="h-4 bg-slate-800/60 rounded w-1/3" />
          <div className="h-32 bg-slate-800/60 rounded" />
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass-panel rounded-xl border border-red-900/30 p-8 text-center max-w-md">
          <div className="p-3 rounded-xl bg-red-500/10 inline-flex mb-3">
            <X className="h-6 w-6 text-red-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300 mb-1">Document not found</h3>
          <p className="text-xs text-slate-500 mb-4">
            This document may have been deleted or you don't have access.
          </p>
          <button
            onClick={() => router.push('/documents')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 text-xs font-semibold text-slate-300 hover:bg-slate-700/50 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  const Icon = getFileIcon(doc.fileType);

  return (
    <div className="flex flex-col h-full">
      <header className="h-16 border-b border-slate-800/50 px-6 flex items-center justify-between bg-[#030303]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/documents')}
            className="p-1.5 rounded-lg hover:bg-slate-800/50 transition-all"
          >
            <ArrowLeft className="h-4 w-4 text-slate-400" />
          </button>
          <div className="p-1.5 rounded-lg bg-indigo-500/10">
            <Icon className="h-4 w-4 text-indigo-400" />
          </div>
          <h1 className="text-sm font-semibold text-slate-200 truncate max-w-md">{doc.title}</h1>
          {doc.fileType && (
            <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-[10px] font-mono font-semibold text-slate-400 uppercase">
              {doc.fileType}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 text-xs font-semibold text-slate-300 hover:bg-slate-700/50 transition-all"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 text-xs font-semibold text-slate-300 hover:bg-slate-700/50 transition-all"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Comments
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 text-xs font-semibold text-slate-300 hover:bg-slate-700/50 transition-all disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {downloading ? 'Preparing...' : 'Download'}
          </button>
          {isEditing ? (
            <>
              <button
                onClick={saveEdit}
                disabled={updateDocument.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-xs font-semibold text-white shadow-lg shadow-indigo-500/10 transition-all disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 text-xs font-semibold text-slate-300 hover:bg-slate-700/50 transition-all"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={startEditing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 text-xs font-semibold text-slate-300 hover:bg-slate-700/50 transition-all"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
        </div>
        {showShare && (
          <ShareDialog entityType="DOCUMENT" entityId={id} onClose={() => setShowShare(false)} />
        )}
      </header>
      {showComments && (
        <CommentSidebar
          entityType="DOCUMENT"
          entityId={id}
          onClose={() => setShowComments(false)}
        />
      )}

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Edit Form */}
          {isEditing ? (
            <div className="glass-panel rounded-xl border border-slate-800/60 p-6 space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Edit Metadata
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-sm text-slate-200 focus:outline-none focus:border-purple-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-sm text-slate-200 focus:outline-none focus:border-purple-500/30 transition-colors resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-1">
                      Language
                    </label>
                    <input
                      type="text"
                      value={editLanguage}
                      onChange={(e) => setEditLanguage(e.target.value)}
                      placeholder="e.g. en, ja"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-sm text-slate-200 focus:outline-none focus:border-purple-500/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-1">
                      Author
                    </label>
                    <input
                      type="text"
                      value={editAuthor}
                      onChange={(e) => setEditAuthor(e.target.value)}
                      placeholder="Author name"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-sm text-slate-200 focus:outline-none focus:border-purple-500/30 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel rounded-xl border border-slate-800/60 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                File Information
              </h2>
              <div className="space-y-0">
                <MetaRow icon={FileText} label="Title" value={doc.title} />
                <MetaRow icon={HardDrive} label="Size" value={formatFileSize(doc.fileSize)} />
                {doc.fileType && (
                  <MetaRow icon={FileIcon} label="Type" value={doc.fileType.toUpperCase()} />
                )}
                {doc.mimeType && <MetaRow icon={FileIcon} label="MIME" value={doc.mimeType} />}
                {doc.language && <MetaRow icon={Globe} label="Language" value={doc.language} />}
                {doc.author && <MetaRow icon={User} label="Author" value={doc.author} />}
                {doc.pageCount != null && (
                  <MetaRow icon={BookOpen} label="Pages" value={String(doc.pageCount)} />
                )}
                {doc.wordCount != null && (
                  <MetaRow icon={MessageSquare} label="Words" value={String(doc.wordCount)} />
                )}
              </div>
            </div>

            <div className="glass-panel rounded-xl border border-slate-800/60 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Dates & Relations
              </h2>
              <div className="space-y-0">
                <MetaRow icon={Calendar} label="Created" value={formatDate(doc.createdAt)} />
                <MetaRow icon={Clock} label="Updated" value={formatDate(doc.updatedAt)} />
                {doc.lastAccessedAt && (
                  <MetaRow
                    icon={Clock}
                    label="Last Accessed"
                    value={formatDate(doc.lastAccessedAt)}
                  />
                )}
                {doc.collection && (
                  <MetaRow icon={BookOpen} label="Collection" value={doc.collection.name} />
                )}
                {doc.folder && <MetaRow icon={Layers} label="Folder" value={doc.folder.name} />}
                <MetaRow
                  icon={User}
                  label="Owner"
                  value={doc.owner?.name || doc.owner?.email || '—'}
                />
                <MetaRow icon={Layers} label="Version" value={`v${doc.versionNumber}`} />
              </div>
            </div>
          </div>

          {/* Description */}
          {doc.description && (
            <div className="glass-panel rounded-xl border border-slate-800/60 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Description
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">{doc.description}</p>
            </div>
          )}

          {/* Tags */}
          {doc.tags && doc.tags.length > 0 && (
            <div className="glass-panel rounded-xl border border-slate-800/60 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {doc.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                      border: `1px solid ${tag.color}30`,
                    }}
                  >
                    <Tag className="h-3 w-3" />
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Processing Status */}
          {processing?.document && (
            <div className="glass-panel rounded-xl border border-slate-800/60 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Processing Status
                </h2>
                {(processing.document as { processingStatus?: string }).processingStatus ===
                  'FAILED' && (
                  <button
                    onClick={() => retryProcessing.mutate(id)}
                    disabled={retryProcessing.isPending}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-[11px] font-medium text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                  >
                    Retry
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(
                  ['processingStatus', 'parsingStatus', 'embeddingStatus', 'indexStatus'] as const
                ).map((key) => {
                  const value =
                    (processing.document as Record<string, string | undefined>)[key] || 'PENDING';
                  const isActive =
                    value === 'PROCESSING' ||
                    value === 'EXTRACTING' ||
                    value === 'CHUNKING' ||
                    value === 'EMBEDDING' ||
                    value === 'INDEXING';
                  const isDone = value === 'COMPLETED';
                  const isFailed = value === 'FAILED';
                  const labels: Record<string, string> = {
                    processingStatus: 'Overall',
                    parsingStatus: 'Extraction',
                    embeddingStatus: 'Embedding',
                    indexStatus: 'Indexing',
                  };
                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-xl border text-center ${
                        isDone
                          ? 'bg-green-500/5 border-green-500/20'
                          : isFailed
                            ? 'bg-red-500/5 border-red-500/20'
                            : isActive
                              ? 'bg-amber-500/5 border-amber-500/20'
                              : 'bg-slate-900/30 border-slate-800/30'
                      }`}
                    >
                      <p className="text-[10px] font-medium text-slate-500 mb-1">{labels[key]}</p>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          isDone
                            ? 'text-green-400'
                            : isFailed
                              ? 'text-red-400'
                              : isActive
                                ? 'text-amber-400'
                                : 'text-slate-500'
                        }`}
                      >
                        {isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                        )}
                        {value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Version History */}
          <div className="glass-panel rounded-xl border border-slate-800/60">
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="w-full flex items-center justify-between p-5"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Version History
                </h2>
                {versions && (
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-800/80 text-[10px] font-mono text-slate-400">
                    {versions.length}
                  </span>
                )}
              </div>
              {showVersions ? (
                <ChevronUp className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              )}
            </button>
            {showVersions && (
              <div className="px-5 pb-5 border-t border-slate-800/50 pt-4 space-y-3">
                {versions && versions.length > 0 ? (
                  versions.map((version: DocumentVersion) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-slate-800/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 shrink-0">
                          <Layers className="h-3.5 w-3.5 text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-200">
                            v{version.versionNumber}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {formatRelativeTime(version.createdAt)} —{' '}
                            {formatFileSize(version.fileSize)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRestoreVersion(version.id)}
                        disabled={restoreVersion.isPending}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/50 text-[11px] font-medium text-slate-300 hover:bg-slate-700/50 transition-all disabled:opacity-50 shrink-0"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restore
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No version history available.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
