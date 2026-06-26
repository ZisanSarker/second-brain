export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  title: string;
  content?: string;
  fileUrl?: string;
  fileType: string;
  workspaceId: string;
  collectionId?: string;
  createdAt: Date;
  updatedAt: Date;
}
