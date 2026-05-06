export interface WorkspaceMember {
  userId: number;
  role: string;
  joinedAt: string;
}

export interface Workspace {
  workspaceId: number;
  name: string;
  description: string;
  visibility: string;
  createdByUserId: number;
  memberCount: number;
  members: WorkspaceMember[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
}

export interface AddMemberRequest {
  userId: number;
  role: 'ADMIN' | 'MEMBER';
}
