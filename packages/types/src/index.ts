export interface User {
  id: string;
  email: string;
  name: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  status: string;
  emailVerified: boolean;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role?: string;
  joinedAt?: string;
  memberCount?: number;
  documentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceWithDetails extends Workspace {
  settings?: WorkspaceSettings;
  conversations?: number;
}

export interface WorkspaceSettings {
  id: string;
  workspaceId: string;
  aiModel: string;
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
  maxTokens: number;
  temperature: number;
  preferences: Record<string, unknown>;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: string;
  language: string;
  preferences: Record<string, unknown>;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

export interface Invitation {
  id: string;
  workspaceId: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  workspace?: {
    id: string;
    name: string;
    slug: string;
  };
  inviteUrl?: string;
}

export interface Document {
  id: string;
  workspaceId: string;
  collectionId?: string | null;
  folderId?: string | null;
  ownerId?: string | null;
  title: string;
  originalName?: string | null;
  fileType?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  uploadStatus: string;
  versionNumber: number;
  sourceType: string;
  status: string;
  description?: string | null;
  language?: string | null;
  author?: string | null;
  source?: string | null;
  importedFrom?: string | null;
  pageCount?: number | null;
  wordCount?: number | null;
  readingTime?: number | null;
  lastAccessedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  collection?: { id: string; name: string } | null;
  folder?: { id: string; name: string } | null;
  owner?: { id: string; name: string | null; email: string } | null;
  tags?: Tag[];
  versions?: DocumentVersion[];
  _count?: { versions: number; comments: number };
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  storageKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface Collection {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  _count?: { documents: number };
  documents?: Document[];
}

export interface Folder {
  id: string;
  workspaceId: string;
  parentId?: string | null;
  name: string;
  createdAt: string;
  updatedAt: string;
  children?: Folder[];
  parent?: { id: string; name: string } | null;
  _count?: { documents: number; children: number };
}

export interface Tag {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  _count?: { documents: number };
}

export interface Favorite {
  id: string;
  userId: string;
  entityId: string;
  entityType: string;
  createdAt: string;
  document?: Document | null;
}

export interface RecentDocument {
  id: string;
  userId: string;
  documentId: string;
  lastAccessedAt: string;
  document: Document;
}

export interface TrashItem {
  documents: (Document & { tags?: Tag[]; collection?: { id: string; name: string } | null })[];
  collections: Collection[];
}

export interface UploadPresignedUrl {
  url: string;
  key: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  details?: Record<string, unknown>;
}
