'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  FileImage,
  FileCode,
  Table,
  File as FileIcon,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { usePresignedUploadUrl, useCreateDocument } from '@/lib/hooks/useDocuments';
import apiClient from '@/lib/api/client';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/markdown',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/csv',
];

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.md,.txt,.png,.jpg,.jpeg,.webp,.csv';

type UploadFile = {
  file: File;
  id: string;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
};

const fileTypeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  md: FileCode,
  txt: FileText,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  webp: FileImage,
  csv: Table,
};

function getFileIcon(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return fileTypeIcons[ext] || FileIcon;
}

function formatFileSize(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIdx = 0;
  while (size >= 1024 && unitIdx < units.length - 1) {
    size /= 1024;
    unitIdx++;
  }
  return `${size.toFixed(1)} ${units[unitIdx]}`;
}

function getFileExtension(name: string) {
  return name.split('.').pop()?.toLowerCase() || '';
}

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const presignedUrl = usePresignedUploadUrl();
  const createDocument = useCreateDocument();

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const valid: UploadFile[] = [];
    for (const file of Array.from(newFiles)) {
      if (
        ACCEPTED_TYPES.includes(file.type) ||
        ACCEPTED_EXTENSIONS.includes(`.${getFileExtension(file.name)}`)
      ) {
        valid.push({
          file,
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          status: 'pending',
          progress: 0,
        });
      }
    }
    setFiles((prev) => [...prev, ...valid]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const retryFile = (id: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: 'pending' as const, progress: 0, error: undefined } : f,
      ),
    );
  };

  const uploadFile = async (uploadFile: UploadFile): Promise<boolean> => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadFile.id ? { ...f, status: 'uploading' as const, progress: 0 } : f,
      ),
    );

    try {
      const ext = getFileExtension(uploadFile.name);
      const presigned = await presignedUrl.mutateAsync({
        fileName: uploadFile.name,
        fileType: ext,
        fileSize: uploadFile.size,
      });

      await apiClient.put(presigned.url, uploadFile.file, {
        headers: { 'Content-Type': uploadFile.file.type },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f)));
        },
      });

      await createDocument.mutateAsync({
        title: uploadFile.name.replace(/\.[^/.]+$/, ''),
        storageKey: presigned.key,
        fileType: ext,
        mimeType: uploadFile.file.type,
        fileSize: uploadFile.size,
        originalName: uploadFile.name,
        sourceType: 'upload',
      } as Parameters<typeof createDocument.mutateAsync>[0]);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: 'success' as const, progress: 100 } : f,
        ),
      );
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: 'error' as const, error: message } : f,
        ),
      );
      return false;
    }
  };

  const uploadAll = async () => {
    const pending = files.filter((f) => f.status === 'pending' || f.status === 'error');
    for (const f of pending) {
      await uploadFile(f);
    }
  };

  const retryFailed = async () => {
    const failed = files.filter((f) => f.status === 'error');
    for (const f of failed) {
      await uploadFile(f);
    }
  };

  const pendingCount = files.filter((f) => f.status === 'pending' || f.status === 'error').length;
  const uploadingCount = files.filter((f) => f.status === 'uploading').length;
  const successCount = files.filter((f) => f.status === 'success').length;
  const failedCount = files.filter((f) => f.status === 'error').length;
  const canUpload = pendingCount > 0 && uploadingCount === 0;

  return (
    <div className="flex flex-col h-full">
      <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/documents')}
            className="p-1.5 rounded-lg hover:bg-card/50 transition-all"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <Upload className="h-5 w-5 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">Upload Documents</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className={`glass-panel rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
              dragOver ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-border/50'
            }`}
          >
            <input
              suppressHydrationWarning
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED_EXTENSIONS}
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <div className="p-4 rounded-2xl bg-card/30 inline-flex mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">
              Drop files here or click to browse
            </h2>
            <p className="text-xs text-muted-foreground">
              Supports PDF, DOCX, Markdown, TXT, PNG, JPG, WebP, and CSV
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="glass-panel rounded-xl border border-border">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Files ({files.length})
                </h2>
                <div className="flex items-center gap-2">
                  {failedCount > 0 && (
                    <button
                      onClick={retryFailed}
                      disabled={uploadingCount > 0}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-warning/10 border border-warning/20 text-[11px] font-medium text-warning hover:bg-warning/20 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Retry Failed
                    </button>
                  )}
                  {canUpload && (
                    <button
                      onClick={uploadAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-primary text-xs font-semibold text-foreground shadow-lg shadow-primary/10 transition-all"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload All
                    </button>
                  )}
                </div>
              </div>
              <div className="p-3 space-y-2">
                {files.map((f) => {
                  const Icon = getFileIcon(f.file);
                  return (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-popover/30 border border-border/30"
                    >
                      <div className="p-2 rounded-lg bg-card/50 shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-foreground truncate">{f.name}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            {f.status === 'success' && (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            )}
                            {f.status === 'error' && (
                              <AlertCircle className="h-4 w-4 text-destructive-foreground" />
                            )}
                            {f.status === 'uploading' && (
                              <Loader2 className="h-4 w-4 text-primary animate-spin" />
                            )}
                            {f.status === 'pending' && (
                              <button
                                onClick={() => removeFile(f.id)}
                                className="p-0.5 rounded hover:bg-muted/50 transition-all"
                              >
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-muted-foreground">
                            {formatFileSize(f.size)}
                          </span>
                          {f.status === 'error' && f.error && (
                            <span className="text-[11px] text-destructive-foreground truncate">
                              {f.error}
                            </span>
                          )}
                          {f.status === 'pending' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(f.id);
                              }}
                              className="text-[11px] text-muted-foreground hover:text-foreground"
                            >
                              Remove
                            </button>
                          )}
                          {f.status === 'error' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                retryFile(f.id);
                              }}
                              className="text-[11px] text-warning hover:text-warning"
                            >
                              Retry
                            </button>
                          )}
                        </div>
                        {(f.status === 'uploading' || f.status === 'success') && (
                          <div className="mt-2 h-1 rounded-full bg-card/80 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                f.status === 'success'
                                  ? 'bg-success'
                                  : 'bg-gradient-to-r from-primary to-primary'
                              }`}
                              style={{ width: `${f.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          {successCount > 0 && (
            <div className="glass-panel rounded-xl border border-success/30 p-5 text-center">
              <div className="p-2 rounded-xl bg-success/10 inline-flex mb-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {successCount} file{successCount > 1 ? 's' : ''} uploaded successfully
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Your documents are being processed and will be available shortly.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => router.push('/documents')}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-primary text-xs font-semibold text-foreground shadow-lg shadow-primary/10 transition-all"
                >
                  View Documents
                </button>
                <button
                  onClick={() => setFiles([])}
                  className="px-3 py-1.5 rounded-lg bg-card/50 text-xs font-semibold text-foreground hover:bg-muted/50 transition-all"
                >
                  Upload More
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
