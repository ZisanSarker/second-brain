export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/html',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/json',
  'text/csv',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.txt',
  '.md',
  '.html',
  '.htm',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.json',
  '.csv',
] as const;

export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
