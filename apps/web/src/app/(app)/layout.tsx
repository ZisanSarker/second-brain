'use client';

import { AuthGuard } from '@/lib/guards/AuthGuard';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import {
  Brain,
  LayoutDashboard,
  Library,
  MessagesSquare,
  Settings,
  Users,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const sidebarLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/workspaces', label: 'Workspaces', icon: Library },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, currentWorkspace, workspaces, logout, setCurrentWorkspace } = useAuthStore();
  const [wsOpen, setWsOpen] = useState(false);

  useEffect(() => {
    // Fetch workspaces if not loaded
    if (workspaces.length === 0) {
      useAuthStore.getState().fetchWorkspaces();
    }
  }, [workspaces.length]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#030303] flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/50 flex flex-col">
        <div className="p-4 border-b border-slate-800/50">
          <Link href="/dashboard" className="flex items-center gap-2 text-white font-semibold">
            <div className="p-1.5 rounded-lg bg-purple-500/10">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            Second Brain
          </Link>
        </div>

        {/* Workspace selector */}
        <div className="px-3 py-3 border-b border-slate-800/50">
          <div className="relative">
            <button
              onClick={() => setWsOpen(!wsOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-sm text-slate-300 hover:border-purple-500/30 transition-colors"
            >
              <span className="truncate">{currentWorkspace?.name || 'Select workspace'}</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {wsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setWsOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 z-20 glass-panel rounded-xl py-1 border border-slate-700/50 max-h-48 overflow-y-auto">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        setCurrentWorkspace(ws);
                        setWsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        currentWorkspace?.id === ws.id
                          ? 'text-purple-400 bg-purple-500/10'
                          : 'text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      {ws.name}
                    </button>
                  ))}
                  <div className="border-t border-slate-700/50 mt-1 pt-1">
                    <Link
                      href="/workspaces/new"
                      onClick={() => setWsOpen(false)}
                      className="block px-3 py-2 text-sm text-purple-400 hover:bg-slate-800/50 transition-colors"
                    >
                      + New workspace
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="p-3 border-t border-slate-800/50 space-y-1">
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-all"
          >
            <Users className="w-4 h-4" />
            Profile
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-all"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>

          {user && (
            <div className="px-3 py-2 mt-1">
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
