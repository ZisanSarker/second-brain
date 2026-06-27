'use client';

import { useState } from 'react';
import { AiPageLayout } from '@/components/ai/AiLayout';
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from '@/lib/hooks/useAi';
import { Plus, Edit3, Trash2, Check, X } from 'lucide-react';

export default function TemplatesPage() {
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const { data: templates, refetch } = useTemplates(typeFilter);
  const create = useCreateTemplate();
  const update = useUpdateTemplate();
  const del = useDeleteTemplate();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', systemPrompt: '', userPrompt: '' });
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({
    name: '',
    type: 'SUMMARY',
    systemPrompt: '',
    userPrompt: '',
  });

  const handleSave = async (id: string) => {
    await update.mutateAsync({ id, data: editForm });
    setEditingId(null);
    refetch();
  };

  const handleCreate = async () => {
    await create.mutateAsync(newForm);
    setShowNew(false);
    setNewForm({ name: '', type: 'SUMMARY', systemPrompt: '', userPrompt: '' });
    refetch();
  };

  const types = [
    'SUMMARY',
    'FLASHCARD',
    'QUIZ',
    'NOTES',
    'MINDMAP',
    'COMPARISON',
    'TRANSLATION',
    'ELI5',
    'TAKEAWAYS',
    'ACTION_ITEMS',
    'TIMELINE',
    'GLOSSARY',
    'FAQ',
    'STUDY_PLAN',
    'INTERVIEW_QUESTIONS',
  ];

  return (
    <AiPageLayout
      title="Templates"
      description="Customize AI prompt templates for each content type"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={typeFilter || ''}
          onChange={(e) => setTypeFilter(e.target.value || undefined)}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground"
        >
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary-hover"
        >
          <Plus size={14} /> New Template
        </button>
      </div>

      <div className="space-y-3">
        {showNew && (
          <div className="rounded-lg border border-primary bg-popover/50 p-4">
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <input
                suppressHydrationWarning
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                placeholder="Template name"
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder-muted-foreground"
              />
              <select
                value={newForm.type}
                onChange={(e) => setNewForm({ ...newForm, type: e.target.value })}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={newForm.systemPrompt}
              onChange={(e) => setNewForm({ ...newForm, systemPrompt: e.target.value })}
              placeholder="System prompt"
              rows={3}
              className="mb-3 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder-muted-foreground"
            />
            <textarea
              value={newForm.userPrompt}
              onChange={(e) => setNewForm({ ...newForm, userPrompt: e.target.value })}
              placeholder="User prompt (optional)"
              rows={2}
              className="mb-3 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder-muted-foreground"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary-hover"
              >
                Create
              </button>
              <button
                onClick={() => setShowNew(false)}
                className="rounded-lg bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {templates?.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No templates found.</p>
        )}

        {templates?.map((tpl: any) => (
          <div key={tpl.id} className="rounded-lg border border-border bg-popover/30 p-4">
            {editingId === tpl.id ? (
              <div className="space-y-3">
                <input
                  suppressHydrationWarning
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
                />
                <textarea
                  value={editForm.systemPrompt}
                  onChange={(e) => setEditForm({ ...editForm, systemPrompt: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
                />
                <textarea
                  value={editForm.userPrompt}
                  onChange={(e) => setEditForm({ ...editForm, userPrompt: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(tpl.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-foreground hover:bg-success"
                  >
                    <Check size={14} /> Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="inline-flex items-center gap-1 rounded-lg bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                  >
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{tpl.name}</span>
                    <span className="rounded bg-card px-1.5 py-0.5 text-xs text-muted-foreground">
                      {tpl.type}
                    </span>
                    {tpl.isDefault && (
                      <span className="rounded bg-primary/30 px-1.5 py-0.5 text-xs text-primary">
                        Default
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">v{tpl.version}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingId(tpl.id);
                        setEditForm({
                          name: tpl.name,
                          systemPrompt: tpl.systemPrompt,
                          userPrompt: tpl.userPrompt || '',
                        });
                      }}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Edit3 size={14} />
                    </button>
                    {!tpl.isDefault && (
                      <button
                        onClick={() => del.mutate(tpl.id, { onSuccess: () => refetch() })}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/30 hover:text-destructive-foreground"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mb-1 text-xs text-muted-foreground line-clamp-2">
                  {tpl.systemPrompt}
                </p>
                {tpl.userPrompt && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    User: {tpl.userPrompt}
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </AiPageLayout>
  );
}
