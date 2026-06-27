'use client';

import Link from 'next/link';
import {
  Clock,
  FileText,
  FileImage,
  FileCode,
  Table,
  FileSpreadsheet,
  File as FileIcon,
  X,
  Calendar,
  HardDrive,
  Sun,
  Moon,
  CalendarDays,
  ChevronRight,
} from 'lucide-react';
import { useRecentDocuments } from '@/lib/hooks/useRecent';
import type { RecentDocument } from '@second-brain/types';

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

type TimeGroup = 'Today' | 'Yesterday' | 'This Week' | 'Older';

function getTimeGroup(dateStr: string): TimeGroup {
  const now = new Date();
  const date = new Date(dateStr);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfWeek = new Date(startOfToday.getTime() - startOfToday.getDay() * 86400000);

  if (date >= startOfToday) return 'Today';
  if (date >= startOfYesterday) return 'Yesterday';
  if (date >= startOfWeek) return 'This Week';
  return 'Older';
}

function groupLabel(group: TimeGroup) {
  switch (group) {
    case 'Today':
      return { label: 'Today', icon: Sun };
    case 'Yesterday':
      return { label: 'Yesterday', icon: Moon };
    case 'This Week':
      return { label: 'This Week', icon: CalendarDays };
    case 'Older':
      return { label: 'Older', icon: Calendar };
  }
}

function formatTime(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RecentPage() {
  const { data: recentItems, isLoading, error } = useRecentDocuments();

  const allRecent = (recentItems as RecentDocument[] | undefined) ?? [];

  const grouped = allRecent.reduce(
    (acc, item) => {
      const group = getTimeGroup(item.lastAccessedAt);
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    },
    {} as Record<TimeGroup, RecentDocument[]>,
  );

  const groupOrder: TimeGroup[] = ['Today', 'Yesterday', 'This Week', 'Older'];

  return (
    <div className="flex flex-col h-full">
      <header className="h-16 border-b border-slate-800/50 px-6 flex items-center bg-[#030303]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-indigo-400" />
          <h1 className="text-sm font-semibold text-slate-200">Recent</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, gi) => (
                <div key={gi}>
                  <div className="h-5 bg-slate-800/60 rounded w-24 mb-3 animate-pulse" />
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
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
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="glass-panel rounded-xl border border-red-900/30 p-8 text-center">
              <div className="p-3 rounded-xl bg-red-500/10 inline-flex mb-3">
                <X className="h-6 w-6 text-red-400" />
              </div>
              <p className="text-sm text-slate-400">Failed to load recent documents.</p>
            </div>
          ) : allRecent.length === 0 ? (
            <div className="glass-panel rounded-xl border border-slate-800/60 p-12 text-center">
              <div className="p-3 rounded-xl bg-slate-800/50 inline-flex mb-3">
                <Clock className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300 mb-1">No recent documents</h3>
              <p className="text-xs text-slate-500">
                Documents you view will appear here for quick access.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupOrder.map((group) => {
                const items = grouped[group];
                if (!items || items.length === 0) return null;
                const { label, icon: GroupIcon } = groupLabel(group);

                return (
                  <div key={group}>
                    <div className="flex items-center gap-2 mb-3">
                      <GroupIcon className="h-4 w-4 text-slate-500" />
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {label}
                      </h2>
                      <span className="text-[10px] text-slate-600">({items.length})</span>
                    </div>
                    <div className="space-y-2">
                      {items.map((item) => {
                        const doc = item.document;
                        const Icon = getFileIcon(doc.fileType);
                        return (
                          <Link key={item.id} href={`/documents/${doc.id}`}>
                            <div className="glass-panel rounded-xl border border-slate-800/60 p-4 glass-panel-hover group cursor-pointer">
                              <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/10 shrink-0">
                                  <Icon className="h-5 w-5 text-indigo-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                                      {doc.title}
                                    </h3>
                                    <ChevronRight className="h-4 w-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2" />
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatTime(item.lastAccessedAt)}
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
                                        <span>{formatFileSize(doc.fileSize)}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
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
