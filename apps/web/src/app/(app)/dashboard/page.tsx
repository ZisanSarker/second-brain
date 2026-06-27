'use client';

import { useAuthStore } from '@/lib/store/auth-store';
import { useWorkspaceSummary } from '@/lib/hooks/useActivity';
import { useActiveUsers } from '@/lib/hooks/usePresence';
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
  MessageSquare,
  Bell,
  Activity,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { workspacesApi } from '@/lib/api/workspaces';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { currentWorkspace } = useAuthStore();
  const { data: summary } = useWorkspaceSummary();
  const { data: activeUsers } = useActiveUsers();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (currentWorkspace?.id) {
      workspacesApi
        .getMembers(currentWorkspace.id)
        .then((members) => setMemberCount(members.length));
      workspacesApi
        .getInvitations(currentWorkspace.id)
        .then((invites) =>
          setInvitations(invites.filter((i: any) => !i.acceptedAt && !i.rejectedAt)),
        );
    }
  }, [currentWorkspace?.id]);

  const stats = [
    {
      label: 'Workspace Members',
      value: String(memberCount || '—'),
      icon: Users,
      change: `${activeUsers?.length || 0} active now`,
      changeColor: 'text-success',
    },
    {
      label: 'Recent Activity',
      value: String(summary?.recentActivity ?? '—'),
      icon: Activity,
      change: 'Last 30 days',
      changeColor: 'text-primary',
    },
    {
      label: 'AI Operations',
      value: String(summary?.recentAiContent ?? '—'),
      icon: Sparkles,
      change: 'Generated this month',
      changeColor: 'text-primary',
    },
    {
      label: 'Comments',
      value: String(summary?.recentComments ?? '—'),
      icon: MessageSquare,
      change: 'This month',
      changeColor: 'text-info',
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3 w-full max-w-md">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            suppressHydrationWarning
            type="text"
            placeholder="Search documents, collections, notes..."
            className="bg-transparent border-none outline-none text-sm text-foreground placeholder-muted-foreground w-full"
          />
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/notifications"
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-card hover:text-foreground"
          >
            <Bell size={18} />
          </Link>
          <Link
            href="/upload"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-xs font-semibold text-foreground shadow-lg shadow-primary/10 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Import</span>
          </Link>
        </div>
      </header>

      <div className="p-6 max-w-7xl w-full mx-auto space-y-8 flex-1 overflow-auto">
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-primary/40 via-primary/20 to-card border border-primary/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-64 w-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              {currentWorkspace?.name || 'Your Second Brain'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              {activeUsers?.length
                ? `${activeUsers.length} team member${activeUsers.length > 1 ? 's are' : ' is'} active now`
                : 'Upload, search, and collaborate with your team.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/activity"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-popover border border-primary/20 hover:bg-primary/20 text-xs font-semibold text-primary transition-all shrink-0"
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Activity</span>
            </Link>
            <Link
              href="/workspaces"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-popover border border-primary/20 hover:bg-primary/20 text-xs font-semibold text-primary transition-all shrink-0"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Members</span>
            </Link>
          </div>
        </div>

        {invitations.length > 0 && (
          <div className="rounded-xl border border-warning/30 bg-warning/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-warning" />
                <span className="text-sm text-warning">
                  {invitations.length} pending invitation{invitations.length > 1 ? 's' : ''}
                </span>
              </div>
              <Link
                href={`/workspaces/${currentWorkspace?.id}/invitations`}
                className="text-xs text-warning hover:text-warning"
              >
                Manage
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="glass-panel p-5 rounded-xl border border-border flex flex-col justify-between h-28 hover:border-border/80 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-semibold">{stat.label}</span>
                <div className="p-1.5 rounded-lg bg-card/80">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
                <p className={`text-[10px] ${stat.changeColor} font-medium mt-0.5`}>
                  {stat.change}
                </p>
              </div>
            </div>
          ))}
        </div>

        {activeUsers && activeUsers.length > 0 && (
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Active Members
            </h3>
            <div className="flex flex-wrap gap-2">
              {activeUsers.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-full bg-card/50 px-3 py-1.5"
                >
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-sm text-foreground">{p.user?.name || 'Unknown'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Quick Import Sources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                title: 'Local Files',
                desc: 'PDF, DOCX, Markdown, Images',
                icon: FolderPlus,
                color: 'from-primary to-primary',
                href: '/upload',
              },
              {
                title: 'GitHub Repository',
                desc: 'Sync code branches & wikis',
                icon: GitBranch,
                color: 'from-muted to-card',
                href: '/imports/github',
              },
              {
                title: 'YouTube Video',
                desc: 'Import transcript & metadata',
                icon: Video,
                color: 'from-destructive to-destructive',
                href: '/imports/youtube',
              },
              {
                title: 'Web URL / Website',
                desc: 'Crawl HTML & extract content',
                icon: Globe,
                color: 'from-success to-success',
                href: '/imports/website',
              },
            ].map((src, i) => (
              <Link
                key={i}
                href={src.href}
                className="glass-panel p-5 rounded-xl border border-border glass-panel-hover flex flex-col justify-between h-40 cursor-pointer group"
              >
                <div
                  className={`h-10 w-10 rounded-xl bg-gradient-to-tr ${src.color} flex items-center justify-center shadow-lg`}
                >
                  <src.icon className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground group-hover:text-foreground transition-all">
                    {src.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">{src.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
