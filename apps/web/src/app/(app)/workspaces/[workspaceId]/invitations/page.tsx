'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { workspacesApi } from '@/lib/api/workspaces';
import { Plus, Trash2 } from 'lucide-react';
import type { Invitation } from '@second-brain/types';

export default function InvitationsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');

  const fetchInvitations = () => {
    workspacesApi
      .getInvitations(workspaceId)
      .then(setInvitations)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvitations();
  }, [workspaceId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await workspacesApi.createInvitation(workspaceId, { email, role });
    setEmail('');
    setShowForm(false);
    fetchInvitations();
  };

  const handleRevoke = async (invitationId: string) => {
    await workspacesApi.revokeInvitation(workspaceId, invitationId);
    setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invitations</h1>
          <p className="text-muted-foreground mt-1">Invite people to join your workspace</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-foreground text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Invite
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-panel rounded-2xl p-6 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
            <input
              suppressHydrationWarning
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-popover/50 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 transition-all"
              placeholder="colleague@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-popover/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 transition-all"
            >
              <option value="VIEWER">Viewer</option>
              <option value="MEMBER">Member</option>
              <option value="EDITOR">Editor</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-foreground text-sm font-medium transition-all"
            >
              Send Invitation
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl bg-card hover:bg-muted text-foreground text-sm font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading invitations...</p>
      ) : invitations.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">No pending invitations</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Role: {inv.role} · Expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(inv.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
