import {
  FolderPlus,
  Search,
  MessageSquareCode,
  Cpu,
  BookOpen,
  History,
  Settings,
  Database,
  ArrowRight,
  FileText,
  GitBranch,
  Video,
  Globe,
  Plus,
  Users,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo Area */}
          <div className="p-6 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Second Brain
              </h1>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                AI WORKSPACE
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-4 py-2 space-y-1.5">
            <Link
              href="#"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-medium text-sm transition-all"
            >
              <BookOpen className="h-[18px] w-[18px]" />
              <span>Knowledge Base</span>
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent hover:border-slate-800/50 font-medium text-sm transition-all"
            >
              <MessageSquareCode className="h-[18px] w-[18px]" />
              <span>AI Chat Assistant</span>
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent hover:border-slate-800/50 font-medium text-sm transition-all"
            >
              <Database className="h-[18px] w-[18px]" />
              <span>Vector Stores</span>
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent hover:border-slate-800/50 font-medium text-sm transition-all"
            >
              <Users className="h-[18px] w-[18px]" />
              <span>Teams & Share</span>
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent hover:border-slate-800/50 font-medium text-sm transition-all"
            >
              <History className="h-[18px] w-[18px]" />
              <span>Activity Log</span>
            </Link>
          </nav>
        </div>

        {/* User Workspace Info */}
        <div className="p-4 border-t border-slate-900">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50 border border-slate-800/60">
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
              JD
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-semibold text-slate-300 truncate">John Doe</h4>
              <p className="text-[10px] text-slate-500 truncate">john@example.com</p>
            </div>
            <button type="button" className="ml-auto text-slate-500 hover:text-slate-300">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Dashboard */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="h-16 border-b border-slate-900 px-6 md:px-8 flex items-center justify-between glass-panel sticky top-0 z-40">
          <div className="flex items-center gap-3 w-full max-w-md">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search documents, collections, transcripts, notes..."
              className="bg-transparent border-none outline-none text-sm text-slate-300 placeholder-slate-500 w-full"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700/80 text-xs font-medium transition-all text-slate-300"
            >
              <span>Workspace: Personal</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-xs font-semibold text-white shadow-lg shadow-indigo-500/10 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Import</span>
            </button>
          </div>
        </header>

        {/* Dashboard Grid Container */}
        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
          {/* Hero Welcome banner */}
          <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-950 border border-indigo-900/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-64 w-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Power up your personal Second Brain
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                Upload your files, import GitHub code repositories, scrape websites, or pull
                transcripts. We&apos;ll chunk, embed, and index them in Qdrant.
              </p>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-indigo-500/20 hover:bg-indigo-950/20 text-xs font-semibold text-indigo-400 transition-all shrink-0"
            >
              <span>View Getting Started Guide</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Indexed Documents',
                value: '42',
                icon: FileText,
                change: '+12% this week',
                changeColor: 'text-emerald-500',
              },
              {
                label: 'Semantic Queries',
                value: '1,284',
                icon: MessageSquareCode,
                change: '+24% this week',
                changeColor: 'text-indigo-400',
              },
              {
                label: 'Qdrant Vectors',
                value: '84,930',
                icon: Database,
                change: 'Optimal cluster status',
                changeColor: 'text-slate-400',
              },
              {
                label: 'AI Operations',
                value: '12.8k',
                icon: Cpu,
                change: 'Avg response 420ms',
                changeColor: 'text-purple-400',
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

          {/* Main sections split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Collections & Files (2 Cols wide on desktop) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Collections Panel */}
              <div className="glass-panel p-6 rounded-xl border border-slate-900 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Collections
                  </h3>
                  <button
                    type="button"
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Create Collection</span>
                  </button>
                </div>
                <div className="divide-y divide-slate-800/40">
                  {[
                    {
                      name: 'Research Papers',
                      size: '12 files',
                      type: 'PDFs & Text',
                      updated: '2 hours ago',
                    },
                    {
                      name: 'Github Docs',
                      size: '25 docs',
                      type: 'Markdown',
                      updated: 'Yesterday',
                    },
                    {
                      name: 'YouTube Brainstorming',
                      size: '5 transcripts',
                      type: 'Audio / Video',
                      updated: '3 days ago',
                    },
                  ].map((col, i) => (
                    <div
                      key={i}
                      className="py-3.5 flex items-center justify-between hover:bg-slate-900/10 px-2 rounded-lg cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-950/40 border border-indigo-900/20 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-300">{col.name}</h4>
                          <span className="text-[10px] text-slate-500">{col.type}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">{col.size}</span>
                        <span className="text-[9px] text-slate-600 block">
                          Updated {col.updated}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: AI Prompt Widget (1 Col wide on desktop) */}
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-xl border border-slate-900 flex flex-col h-[320px] justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/5 rounded-full blur-2xl"></div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Ask your Second Brain
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200">
                    Instant AI Chat Simulator
                  </h4>
                  <p className="text-xs text-slate-500">
                    Query your documents using semantic search. FastAPI handles retrieval and
                    Next.js displays the response.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 italic">
                    {'"Summarize my latest research papers on machine learning models..."'}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ask a question..."
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-lg py-2 px-3 pr-10 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500/50 transition-all"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-2 text-indigo-400 hover:text-indigo-300"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
