'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { workspacesApi } from '@/lib/api/workspaces';
import { useAuthStore } from '@/lib/store/auth-store';
import { Shield, UserMinus } from 'lucide-react';
import type { WorkspaceMember } from '@second-brain/types';

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'text-warning bg-warning/10',
  ADMIN: 'text-primary bg-primary/10',
  EDITOR: 'text-info bg-info/10',
  MEMBER: 'text-muted-foreground bg-muted/10',
  VIEWER: 'text-muted-foreground bg-muted/5',
};

export default function MembersPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { currentWorkspace } = useAuthStore();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workspacesApi
      .getMembers(workspaceId)
      .then(setMembers)
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const handleRoleChange = async (memberId: string, role: string) => {
    await workspacesApi.updateMemberRole(workspaceId, memberId, role);
    setMembers((prev) => prev.map((m) => (m.userId === memberId ? { ...m, role } : m)));
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Remove this member?')) return;
    await workspacesApi.removeMember(workspaceId, memberId);
    setMembers((prev) => prev.filter((m) => m.userId !== memberId));
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Members</h1>
        <p className="text-muted-foreground mt-1">
          {currentWorkspace?.name || 'Workspace'} · {members.length} members
        </p>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="divide-y divide-border">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary flex items-center justify-center text-sm font-medium text-foreground">
                  {(member.user.name || member.user.email)[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {member.user.name || 'Unnamed'}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider ${
                    ROLE_COLORS[member.role] || 'text-muted-foreground'
                  }`}
                >
                  {member.role}
                </span>
                {member.role !== 'OWNER' && (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                    className="px-2 py-1 rounded-lg bg-popover/50 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring/50"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="MEMBER">Member</option>
                    <option value="EDITOR">Editor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                )}
                {member.role !== 'OWNER' && (
                  <button
                    onClick={() => handleRemove(member.userId)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/10 transition-all"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
