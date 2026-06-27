'use client';

import { useState } from 'react';
import {
  usePermissions,
  useCreatePermission,
  useDeletePermission,
  useCreateLink,
  useShareLinks,
  useDeleteLink,
} from '@/lib/hooks/useSharing';
import { Share2, Copy, Trash2, X, Loader2, Check } from 'lucide-react';

const roles = ['VIEWER', 'COMMENTER', 'EDITOR'];

export function ShareDialog({
  entityType,
  entityId,
  onClose,
}: {
  entityType: string;
  entityId: string;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('VIEWER');
  const { data: permissions, refetch: refetchPerms } = usePermissions(entityType, entityId);
  const { data: links, refetch: refetchLinks } = useShareLinks(entityType, entityId);
  const createPerm = useCreatePermission();
  const deletePerm = useDeletePermission();
  const createLink = useCreateLink();
  const deleteLink = useDeleteLink();
  const [copied, setCopied] = useState<string | null>(null);

  const handleShare = () => {
    if (!email.trim()) return;
    createPerm.mutate(
      { entityType, entityId, userId: email.trim(), role },
      {
        onSuccess: () => {
          setEmail('');
          refetchPerms();
        },
      },
    );
  };

  const handleCreateLink = () => {
    const payload: any = { permission: role };
    if (entityType === 'DOCUMENT') payload.documentId = entityId;
    else if (entityType === 'COLLECTION') payload.collectionId = entityId;
    else if (entityType === 'GENERATED_CONTENT') payload.generatedContentId = entityId;

    createLink.mutate(payload, { onSuccess: () => refetchLinks() });
  };

  const copyToClipboard = async (token: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/share/${token}`);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700"
      >
        <Share2 size={14} /> Share
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-100">Share</h3>
              <button
                onClick={() => {
                  setOpen(false);
                  onClose?.();
                }}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Add people</label>
              <div className="flex gap-2">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="User ID or email..."
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-sm text-zinc-300"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleShare}
                  disabled={createPerm.isPending || !email.trim()}
                  className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
                >
                  {createPerm.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Share'}
                </button>
              </div>
            </div>

            {permissions?.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 text-xs font-medium text-zinc-400">Shared with</h4>
                <div className="space-y-2">
                  {permissions.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm text-zinc-200">
                          {p.user?.name || p.user?.email || p.userId}
                        </p>
                        <p className="text-xs text-zinc-500">{p.role}</p>
                      </div>
                      <button
                        onClick={() => deletePerm.mutate(p.id, { onSuccess: () => refetchPerms() })}
                        className="rounded p-1 text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-zinc-800 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-medium text-zinc-400">Shareable links</h4>
                <button
                  onClick={handleCreateLink}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  + Create link
                </button>
              </div>
              {links?.map((l: any) => (
                <div
                  key={l.id}
                  className="mb-2 flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2"
                >
                  <div>
                    <p className="text-xs text-zinc-400">{l.permission}</p>
                    {l.expiresAt && (
                      <p className="text-[10px] text-zinc-600">
                        Expires {new Date(l.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyToClipboard(l.token)}
                      className="rounded p-1 text-zinc-500 hover:text-zinc-300"
                    >
                      {copied === l.token ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => deleteLink.mutate(l.id, { onSuccess: () => refetchLinks() })}
                      className="rounded p-1 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
