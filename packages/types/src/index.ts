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
  title: string;
  status: string;
  sourceType: string;
  workspaceId: string;
  collectionId?: string | null;
  folderId?: string | null;
  createdAt: string;
  updatedAt: string;
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
