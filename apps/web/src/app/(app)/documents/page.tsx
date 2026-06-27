'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  FileText,
  FileImage,
  FileCode,
  Table,
  FileSpreadsheet,
  File as FileIcon,
  MoreHorizontal,
  Calendar,
  HardDrive,
  Tag,
  SlidersHorizontal,
  X,
  Globe,
  GitBranch,
  Video,
  ChevronDown,
} from 'lucide-react';
import { useDocuments } from '@/lib/hooks/useDocuments';
import { useCollections } from '@/lib/hooks/useCollections';
import { useTags } from '@/lib/hooks/useTags';
import { useFolders } from '@/lib/hooks/useFolders';
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
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
};

function getFileIcon(fileType?: string | null) {
  if (!fileType) return FileIcon;
  const ext = fileType.toLowerCase();
  return fileTypeIcons[ext] || FileIcon;
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

function statusBadge(status?: string | null) {
  if (!status || status === 'COMPLETED' || status === 'READY') return null;
  const colors: Record<string, { bg: string; text: string; dot: string }> = {
    PENDING: { bg: 'bg-slate-800/60', text: 'text-slate-400', dot: 'bg-slate-500' },
    PENDING_UPLOAD: { bg: 'bg-slate-800/60', text: 'text-slate-400', dot: 'bg-slate-500' },
    QUEUED: { bg: 'bg-blue-900/30', text: 'text-blue-400', dot: 'bg-blue-400' },
    PROCESSING: {
      bg: 'bg-amber-900/30',
      text: 'text-amber-400',
      dot: 'bg-amber-400 animate-pulse',
    },
    EXTRACTING: {
      bg: 'bg-amber-900/30',
      text: 'text-amber-400',
      dot: 'bg-amber-400 animate-pulse',
    },
    CHUNKING: { bg: 'bg-amber-900/30', text: 'text-amber-400', dot: 'bg-amber-400 animate-pulse' },
    EMBEDDING: {
      bg: 'bg-purple-900/30',
      text: 'text-purple-400',
      dot: 'bg-purple-400 animate-pulse',
    },
    INDEXING: {
      bg: 'bg-purple-900/30',
      text: 'text-purple-400',
      dot: 'bg-purple-400 animate-pulse',
    },
    FAILED: { bg: 'bg-red-900/30', text: 'text-red-400', dot: 'bg-red-400' },
  };
  const c = colors[status] || colors.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${c.bg} text-[10px] font-medium ${c.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

function DocumentCard({ doc }: { doc: Document }) {
  const Icon = getFileIcon(doc.fileType);
  const processingStatus = doc.processingStatus || (doc.status !== 'READY' ? doc.status : null);
  return (
    <Link href={`/documents/${doc.id}`}>
      <div className="glass-panel rounded-xl border border-slate-800/60 p-4 h-full glass-panel-hover cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/10">
            <Icon className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="flex items-center gap-1.5">
            {doc.fileType && (
              <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-[10px] font-mono font-semibold text-slate-400 uppercase">
                {doc.fileType}
              </span>
            )}
            {statusBadge(processingStatus)}
            <button
              type="button"
              className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-800/50"
            >
              <MoreHorizontal className="h-3.5 w-3.5 text-slate-500" />
            </button>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-slate-200 mb-2 line-clamp-2 group-hover:text-white transition-colors">
          {doc.title}
        </h3>

        <div className="space-y-1.5 mt-auto">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <HardDrive className="h-3 w-3" />
            <span>{formatFileSize(doc.fileSize)}</span>
            <span className="text-slate-700">·</span>
            <Calendar className="h-3 w-3" />
            <span>{formatDate(doc.createdAt)}</span>
          </div>

          {doc.tags && doc.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {doc.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                    borderColor: `${tag.color}30`,
                  }}
                >
                  {tag.name}
                </span>
              ))}
              {doc.tags.length > 3 && (
                <span className="text-[10px] text-slate-500">+{doc.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="glass-panel rounded-xl border border-slate-800/60 p-4 animate-pulse"
        >
          <div className="h-10 w-10 rounded-xl bg-slate-800/60 mb-3" />
          <div className="h-4 bg-slate-800/60 rounded w-3/4 mb-2" />
          <div className="h-3 bg-slate-800/60 rounded w-1/2 mb-3" />
          <div className="h-3 bg-slate-800/60 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [collectionFilter, setCollectionFilter] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  const params: Record<string, unknown> = {};
  if (searchQuery) params.search = searchQuery;
  if (collectionFilter) params.collectionId = collectionFilter;
  if (folderFilter) params.folderId = folderFilter;
  if (fileTypeFilter) params.fileType = fileTypeFilter;
  if (tagFilter) params.tagId = tagFilter;

  const { data, isLoading, error } = useDocuments(params);
  const { data: collections } = useCollections();
  const { data: tags } = useTags();
  const { data: folders } = useFolders();

  const hasActiveFilters =
    searchQuery || collectionFilter || folderFilter || fileTypeFilter || tagFilter;

  const clearFilters = () => {
    setSearchQuery('');
    setCollectionFilter('');
    setFolderFilter('');
    setFileTypeFilter('');
    setTagFilter('');
  };

  const paginatedData = data as { data?: Document[] } | undefined;
  const documents = paginatedData?.data ?? (Array.isArray(data) ? data : []);

  return (
    <div className="flex flex-col h-full">
      <header className="h-16 border-b border-slate-800/50 px-6 flex items-center justify-between bg-[#030303]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-indigo-400" />
          <h1 className="text-sm font-semibold text-slate-200">Documents</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setImportOpen(!importOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 text-xs font-semibold text-slate-300 hover:bg-slate-700/50 transition-all"
            >
              <Globe className="h-3.5 w-3.5" />
              Import
              <ChevronDown
                className={`h-3 w-3 transition-transform ${importOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {importOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setImportOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 glass-panel rounded-xl py-1 border border-slate-700/50 min-w-[180px]">
                  <Link
                    href="/imports/website"
                    onClick={() => setImportOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/50 transition-colors"
                  >
                    <Globe className="h-4 w-4 text-blue-400" />
                    Website
                  </Link>
                  <Link
                    href="/imports/github"
                    onClick={() => setImportOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/50 transition-colors"
                  >
                    <GitBranch className="h-4 w-4 text-slate-400" />
                    GitHub Repo
                  </Link>
                  <Link
                    href="/imports/youtube"
                    onClick={() => setImportOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/50 transition-colors"
                  >
                    <Video className="h-4 w-4 text-red-400" />
                    YouTube
                  </Link>
                </div>
              </>
            )}
          </div>
          <Link
            href="/upload"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-xs font-semibold text-white shadow-lg shadow-indigo-500/10 transition-all"
          >
            <span>Upload</span>
          </Link>
        </div>
      </header>

      <div className="p-6 flex-1 overflow-auto space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 w-full max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-purple-500/30 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-xs text-slate-300 focus:outline-none focus:border-purple-500/30 transition-colors"
            >
              <option value="">All Collections</option>
              {collections?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-xs text-slate-300 focus:outline-none focus:border-purple-500/30 transition-colors"
            >
              <option value="">All Folders</option>
              {folders?.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            <select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-xs text-slate-300 focus:outline-none focus:border-purple-500/30 transition-colors"
            >
              <option value="">All Types</option>
              {['pdf', 'docx', 'md', 'txt', 'png', 'jpg', 'jpeg', 'webp', 'csv'].map((t) => (
                <option key={t} value={t}>
                  .{t}
                </option>
              ))}
            </select>

            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-xs text-slate-300 focus:outline-none focus:border-purple-500/30 transition-colors"
            >
              <option value="">All Tags</option>
              {tags?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-all"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="glass-panel rounded-xl border border-red-900/30 p-8 text-center">
            <div className="p-3 rounded-xl bg-red-500/10 inline-flex mb-3">
              <X className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-sm text-slate-400">Failed to load documents. Please try again.</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="glass-panel rounded-xl border border-slate-800/60 p-12 text-center">
            <div className="p-3 rounded-xl bg-slate-800/50 inline-flex mb-3">
              <FileText className="h-6 w-6 text-slate-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-300 mb-1">
              {hasActiveFilters ? 'No matching documents' : 'No documents yet'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {hasActiveFilters
                ? 'Try adjusting your filters or search query.'
                : 'Upload your first document to get started.'}
            </p>
            {!hasActiveFilters && (
              <Link
                href="/upload"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-xs font-semibold text-white shadow-lg shadow-indigo-500/10 transition-all"
              >
                Upload Document
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
