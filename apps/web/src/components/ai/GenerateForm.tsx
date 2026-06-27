'use client';

import { useState } from 'react';
import { useCollections } from '@/lib/hooks/useCollections';
import { Loader2, Sparkles } from 'lucide-react';

export function GenerateForm({
  onGenerate,
  isLoading,
  documentId,
  collectionId,
  showLanguage,
  showCustomPrompt,
}: {
  onGenerate: (data: {
    documentId?: string;
    collectionId?: string;
    customPrompt?: string;
    language?: string;
  }) => void;
  isLoading: boolean;
  documentId?: string;
  collectionId?: string;
  showLanguage?: boolean;
  showCustomPrompt?: boolean;
}) {
  const [selectedDocId, setSelectedDocId] = useState(documentId || '');
  const [selectedCollectionId, setSelectedCollectionId] = useState(collectionId || '');
  const [customPrompt, setCustomPrompt] = useState('');
  const [language, setLanguage] = useState('');

  const { data: collections } = useCollections();

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Document ID</label>
          <input
            type="text"
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            placeholder="Paste a document ID..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Collection</label>
          <select
            value={selectedCollectionId}
            onChange={(e) => setSelectedCollectionId(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-purple-500 focus:outline-none"
          >
            <option value="">Select a collection...</option>
            {collections?.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showCustomPrompt && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">
            Custom Prompt (optional)
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Override the default prompt..."
            rows={2}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
          />
        </div>
      )}

      {showLanguage && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Language</label>
          <input
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="e.g., Spanish, French, Japanese..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
          />
        </div>
      )}

      <button
        onClick={() =>
          onGenerate({
            documentId: selectedDocId || undefined,
            collectionId: selectedCollectionId || undefined,
            customPrompt: customPrompt || undefined,
            language: language || undefined,
          })
        }
        disabled={isLoading || (!selectedDocId && !selectedCollectionId)}
        className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-50"
      >
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        {isLoading ? 'Generating...' : 'Generate'}
      </button>
    </div>
  );
}
