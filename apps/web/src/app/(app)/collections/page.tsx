'use client';

import { useState } from 'react';
import {
  Library,
  Plus,
  Archive,
  RotateCcw,
  Heart,
  MoreHorizontal,
  BookOpen,
  FileText,
  Files,
  X,
  Check,
} from 'lucide-react';
import {
  useCollections,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
  useArchiveCollection,
  useRestoreCollection,
} from '@/lib/hooks/useCollections';
import type { Collection } from '@second-brain/types';

function CollectionCard({
  collection,
  onArchive,
  onRestore,
  onEdit,
  onDelete,
}: {
  collection: Collection;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onEdit: (collection: Collection) => void;
  onDelete: (id: string) => void;
}) {
  const docCount = collection._count?.documents ?? 0;

  return (
    <div className="glass-panel rounded-xl border border-slate-800/60 p-5 glass-panel-hover group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/10">
          <Library className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="flex items-center gap-1">
          {!collection.archivedAt ? (
            <button
              onClick={() => onArchive(collection.id)}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-800/50"
              title="Archive"
            >
              <Archive className="h-3.5 w-3.5 text-slate-500" />
            </button>
          ) : (
            <button
              onClick={() => onRestore(collection.id)}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-800/50"
              title="Restore"
            >
              <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
            </button>
          )}
          <button
            onClick={() => onEdit(collection)}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-800/50"
          >
            <MoreHorizontal className="h-3.5 w-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-slate-200 mb-1 group-hover:text-white transition-colors">
        {collection.name}
      </h3>

      {collection.description && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{collection.description}</p>
      )}

      <div className="flex items-center gap-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          <span>
            {docCount} document{docCount !== 1 ? 's' : ''}
          </span>
        </div>
        {collection.archivedAt && (
          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-medium">
            Archived
          </span>
        )}
      </div>
    </div>
  );
}

export default function CollectionsPage() {
  const { data: collections, isLoading, error } = useCollections();
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();
  const archiveCollection = useArchiveCollection();
  const restoreCollection = useRestoreCollection();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const activeCollections = collections?.filter((c) => showArchived || !c.archivedAt) ?? [];

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createCollection.mutateAsync({
      name: newName.trim(),
      description: newDesc.trim() || undefined,
    });
    setNewName('');
    setNewDesc('');
    setShowCreateForm(false);
  };

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setEditName(collection.name);
    setEditDesc(collection.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingCollection || !editName.trim()) return;
    await updateCollection.mutateAsync({
      id: editingCollection.id,
      data: { name: editName.trim(), description: editDesc.trim() || undefined },
    });
    setEditingCollection(null);
  };

  const handleDelete = async (id: string) => {
    await deleteCollection.mutateAsync(id);
    setConfirmDelete(null);
  };

  const allCollections = collections ?? [];

  return (
    <div className="flex flex-col h-full">
      <header className="h-16 border-b border-slate-800/50 px-6 flex items-center justify-between bg-[#030303]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Library className="h-5 w-5 text-indigo-400" />
          <h1 className="text-sm font-semibold text-slate-200">Collections</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              showArchived
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <Archive className="h-3.5 w-3.5" />
            Archived
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-xs font-semibold text-white shadow-lg shadow-indigo-500/10 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            New Collection
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Create Form */}
          {showCreateForm && (
            <div className="glass-panel rounded-xl border border-slate-800/60 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  New Collection
                </h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-1 rounded-lg hover:bg-slate-800/50"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Collection name"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-sm text-slate-200 focus:outline-none focus:border-purple-500/30 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-sm text-slate-200 focus:outline-none focus:border-purple-500/30 transition-colors resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800/50 text-xs font-semibold text-slate-300 hover:bg-slate-700/50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim() || createCollection.isPending}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-xs font-semibold text-white shadow-lg shadow-indigo-500/10 transition-all disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {editingCollection && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="glass-panel rounded-xl border border-slate-800/60 p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-200">Edit Collection</h2>
                  <button
                    onClick={() => setEditingCollection(null)}
                    className="p-1 rounded-lg hover:bg-slate-800/50"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Collection name"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-sm text-slate-200 focus:outline-none focus:border-purple-500/30 transition-colors"
                  />
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-sm text-slate-200 focus:outline-none focus:border-purple-500/30 transition-colors resize-none"
                  />
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        setConfirmDelete(editingCollection.id);
                        setEditingCollection(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      Delete
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingCollection(null)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800/50 text-xs font-semibold text-slate-300 hover:bg-slate-700/50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={!editName.trim() || updateCollection.isPending}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-xs font-semibold text-white shadow-lg shadow-indigo-500/10 transition-all disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
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
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">Delete Collection?</h3>
                <p className="text-xs text-slate-500 mb-4">
                  This action cannot be undone. Documents in this collection will not be deleted.
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
                    disabled={deleteCollection.isPending}
                    className="px-3 py-1.5 rounded-lg bg-red-500 text-xs font-semibold text-white hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Collection Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="glass-panel rounded-xl border border-slate-800/60 p-5 animate-pulse"
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-800/60 mb-4" />
                  <div className="h-4 bg-slate-800/60 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-slate-800/60 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="glass-panel rounded-xl border border-red-900/30 p-8 text-center">
              <div className="p-3 rounded-xl bg-red-500/10 inline-flex mb-3">
                <X className="h-6 w-6 text-red-400" />
              </div>
              <p className="text-sm text-slate-400">Failed to load collections.</p>
            </div>
          ) : activeCollections.length === 0 ? (
            <div className="glass-panel rounded-xl border border-slate-800/60 p-12 text-center">
              <div className="p-3 rounded-xl bg-slate-800/50 inline-flex mb-3">
                <Library className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300 mb-1">
                {showArchived ? 'No archived collections' : 'No collections yet'}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                {showArchived
                  ? 'Archived collections will appear here.'
                  : 'Create your first collection to organize your documents.'}
              </p>
              {!showArchived && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-xs font-semibold text-white shadow-lg shadow-indigo-500/10 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Collection
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCollections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  onArchive={(id) => archiveCollection.mutate(id)}
                  onRestore={(id) => restoreCollection.mutate(id)}
                  onEdit={handleEdit}
                  onDelete={(id) => setConfirmDelete(id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
