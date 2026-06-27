'use client';

import { useState } from 'react';
import { Tags, Plus, X, Check, Palette, FileText, Trash2, Pencil } from 'lucide-react';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/lib/hooks/useTags';
import type { Tag } from '@second-brain/types';

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
  '#06b6d4',
];

function TagBadge({ tag, size = 'sm' }: { tag: Tag; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      }`}
      style={{
        backgroundColor: `${tag.color}20`,
        color: tag.color,
        border: `1px solid ${tag.color}30`,
      }}
    >
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
      {tag.name}
    </span>
  );
}

export default function TagsPage() {
  const { data: tags, isLoading, error } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#8b5cf6');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createTag.mutateAsync({ name: newName.trim(), color: newColor });
    setNewName('');
    setNewColor('#8b5cf6');
    setShowCreate(false);
  };

  const handleStartEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await updateTag.mutateAsync({
      id: editingId,
      data: { name: editName.trim(), color: editColor },
    });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteTag.mutateAsync(id);
    setConfirmDelete(null);
  };

  const allTags = tags ?? [];

  return (
    <div className="flex flex-col h-full">
      <header className="h-16 border-b border-slate-800/50 px-6 flex items-center justify-between bg-[#030303]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Tags className="h-5 w-5 text-indigo-400" />
          <h1 className="text-sm font-semibold text-slate-200">Tags</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-xs font-semibold text-white shadow-lg shadow-indigo-500/10 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          New Tag
        </button>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Create Form */}
          {showCreate && (
            <div className="glass-panel rounded-xl border border-slate-800/60 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Create Tag
                </h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="p-1 rounded-lg hover:bg-slate-800/50"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Tag name"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-sm text-slate-200 focus:outline-none focus:border-purple-500/30 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1.5">
                    Color
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewColor(color)}
                          className={`w-7 h-7 rounded-lg transition-all ${
                            newColor === color
                              ? 'ring-2 ring-white/40 scale-110'
                              : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Preview:</span>
                    <TagBadge
                      tag={{
                        id: 'preview',
                        name: newName || 'tag-name',
                        color: newColor,
                        workspaceId: '',
                        createdAt: '',
                        updatedAt: '',
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCreate(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800/50 text-xs font-semibold text-slate-300 hover:bg-slate-700/50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={!newName.trim() || createTag.isPending}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-xs font-semibold text-white shadow-lg shadow-indigo-500/10 transition-all disabled:opacity-50"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation */}
          {confirmDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="glass-panel rounded-xl border border-slate-800/60 p-6 w-full max-w-sm mx-4 text-center">
                <div className="p-2 rounded-xl bg-red-500/10 inline-flex mb-3">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">Delete Tag?</h3>
                <p className="text-xs text-slate-500 mb-4">
                  This tag will be removed from all documents. This action cannot be undone.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800/50 text-xs font-semibold text-slate-300 hover:bg-slate-700/50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(confirmDelete)}
                    disabled={deleteTag.isPending}
                    className="px-3 py-1.5 rounded-lg bg-red-500 text-xs font-semibold text-white hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tags List */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="glass-panel rounded-xl border border-slate-800/60 p-4 animate-pulse"
                >
                  <div className="h-5 bg-slate-800/60 rounded w-24" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="glass-panel rounded-xl border border-red-900/30 p-8 text-center">
              <div className="p-3 rounded-xl bg-red-500/10 inline-flex mb-3">
                <X className="h-6 w-6 text-red-400" />
              </div>
              <p className="text-sm text-slate-400">Failed to load tags.</p>
            </div>
          ) : allTags.length === 0 ? (
            <div className="glass-panel rounded-xl border border-slate-800/60 p-12 text-center">
              <div className="p-3 rounded-xl bg-slate-800/50 inline-flex mb-3">
                <Tags className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300 mb-1">No tags yet</h3>
              <p className="text-xs text-slate-500 mb-4">
                Create tags to organize and categorize your documents.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-xs font-semibold text-white shadow-lg shadow-indigo-500/10 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Tag
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {allTags.map((tag) => (
                <div key={tag.id} className="glass-panel rounded-xl border border-slate-800/60 p-4">
                  {editingId === tag.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-sm text-slate-200 focus:outline-none focus:border-purple-500/30 transition-colors"
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                        />
                        <div className="flex flex-wrap gap-1">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => setEditColor(color)}
                              className={`w-6 h-6 rounded-md transition-all ${
                                editColor === color
                                  ? 'ring-2 ring-white/40 scale-110'
                                  : 'hover:scale-110'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                          <input
                            type="color"
                            value={editColor}
                            onChange={(e) => setEditColor(e.target.value)}
                            className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0"
                          />
                        </div>
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editName.trim() || updateTag.isPending}
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded-lg hover:bg-slate-800/50 transition-all"
                        >
                          <X className="h-3.5 w-3.5 text-slate-500" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm font-medium text-slate-200">{tag.name}</span>
                        {tag._count?.documents != null && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-800/80 text-[10px] font-mono text-slate-500">
                            {tag._count.documents} docs
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(tag)}
                          className="p-1.5 rounded-lg hover:bg-slate-800/50 transition-all"
                        >
                          <Pencil className="h-3.5 w-3.5 text-slate-500" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(tag.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-slate-500 hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
