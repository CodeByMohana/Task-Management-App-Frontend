export interface BoardMember {
  userId: number;
  role: string;
  joinedAt: string;
}

export interface BoardList {
  listId: number;
  boardId: number;
  name: string;
  position: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  boardId: number;
  workspaceId: number;
  name: string;
  description: string;
  background: string;
  visibility: string;
  closed: boolean;
  createdByUserId: number;
  memberCount: number;
  listCount: number;
  members: BoardMember[] | null;
  lists: BoardList[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardRequest {
  workspaceId: number;
  name: string;
  description?: string;
  background?: string;
  visibility?: 'PUBLIC' | 'WORKSPACE' | 'PRIVATE';
  workspaceMemberIds?: number[];
}

export interface UpdateBoardRequest {
  name?: string;
  description?: string;
  background?: string;
  visibility?: 'PUBLIC' | 'WORKSPACE' | 'PRIVATE';
}

export interface CreateListRequest {
  name: string;
}

export interface UpdateListRequest {
  name: string;
}

export interface ReorderListRequest {
  newPosition: number;
}

export interface AddBoardMemberRequest {
  userId: number;
  role: 'ADMIN' | 'MEMBER' | 'OBSERVER';
}

export interface BoardAnalytics {
  boardId: number;
  totalCards: number;
  cardsByList: { [listName: string]: number };
  totalMembers: number;
  cardsByPriority: { [priority: string]: number };
  cardsByStatus: { [status: string]: number };
}
