'use client';

import { useAuthStore } from '@/lib/store/auth-store';
import {
  FolderPlus,
  Search,
  MessageSquareCode,
  Cpu,
  BookOpen,
  FileText,
  GitBranch,
  Video,
  Globe,
  Plus,
  Database,
  ArrowRight,
  History,
  Users,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { currentWorkspace } = useAuthStore();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-16 border-b border-slate-800/50 px-6 flex items-center justify-between bg-[#030303]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3 w-full max-w-md">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search documents, collections, notes..."
            className="bg-transparent border-none outline-none text-sm text-slate-300 placeholder-slate-500 w-full"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-xs font-semibold text-white shadow-lg shadow-indigo-500/10 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Import</span>
          </button>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="p-6 max-w-7xl w-full mx-auto space-y-8 flex-1 overflow-auto">
        {/* Hero Banner */}
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-950 border border-indigo-900/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-64 w-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {currentWorkspace?.name || 'Your Second Brain'}
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Upload files, import websites, sync GitHub repos, and chat with your knowledge.
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-indigo-500/20 hover:bg-indigo-950/20 text-xs font-semibold text-indigo-400 transition-all shrink-0"
          >
            <span>Getting Started Guide</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Indexed Documents',
              value: '—',
              icon: FileText,
              change: 'No documents yet',
              changeColor: 'text-slate-500',
            },
            {
              label: 'Semantic Queries',
              value: '—',
              icon: MessageSquareCode,
              change: 'Start a chat',
              changeColor: 'text-indigo-400',
            },
            {
              label: 'AI Operations',
              value: '—',
              icon: Cpu,
              change: 'Ready',
              changeColor: 'text-purple-400',
            },
            {
              label: 'Workspace Members',
              value: '1',
              icon: Users,
              change: 'You',
              changeColor: 'text-slate-400',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="glass-panel p-5 rounded-xl border border-slate-900 flex flex-col justify-between h-28 hover:border-slate-800/80 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">{stat.label}</span>
                <div className="p-1.5 rounded-lg bg-slate-800/80">
                  <stat.icon className="h-4 w-4 text-indigo-400" />
                </div>
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-bold text-slate-200">{stat.value}</h3>
                <p className={`text-[10px] ${stat.changeColor} font-medium mt-0.5`}>
                  {stat.change}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Import Grid */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
            Quick Import Sources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                title: 'Local Files',
                desc: 'PDF, DOCX, Markdown, Images',
                icon: FolderPlus,
                color: 'from-blue-600 to-indigo-600',
              },
              {
                title: 'GitHub Repository',
                desc: 'Sync code branches & wikis',
                icon: GitBranch,
                color: 'from-zinc-700 to-slate-900',
              },
              {
                title: 'YouTube Video',
                desc: 'Import transcript & metadata',
                icon: Video,
                color: 'from-red-600 to-rose-700',
              },
              {
                title: 'Web URL / Website',
                desc: 'Crawl HTML & extract content',
                icon: Globe,
                color: 'from-teal-600 to-emerald-600',
              },
            ].map((src, i) => (
              <div
                key={i}
                className="glass-panel p-5 rounded-xl border border-slate-900 glass-panel-hover flex flex-col justify-between h-40 cursor-pointer group"
              >
                <div
                  className={`h-10 w-10 rounded-xl bg-gradient-to-tr ${src.color} flex items-center justify-center shadow-lg`}
                >
                  <src.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 group-hover:text-white transition-all">
                    {src.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">{src.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
