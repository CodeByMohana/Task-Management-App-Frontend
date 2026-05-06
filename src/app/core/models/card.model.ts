export type CardPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CardStatus = 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export interface CardAttachment {
  attachmentId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedByUserId: number;
  uploadedAt: string;
}

export interface Card {
  cardId: number;
  listId: number;
  boardId: number;
  workspaceId: number;
  title: string;
  description: string;
  priority: CardPriority;
  status: CardStatus;
  assigneeUserId: number | null;
  createdByUserId: number;
  dueDate: string | null;
  startDate: string | null;
  coverColor: string | null;
  position: number;
  archived: boolean;
  attachmentCount: number;
  attachments: CardAttachment[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardRequest {
  listId: number;
  boardId: number;
  workspaceId: number;
  title: string;
  description?: string;
  priority?: CardPriority;
  status?: CardStatus;
  assigneeUserId?: number;
  dueDate?: string;
  startDate?: string;
  coverColor?: string;
  boardName?: string;
  workspaceName?: string;
}

export interface UpdateCardRequest {
  title?: string;
  description?: string;
  priority?: CardPriority;
  status?: CardStatus;
  assigneeUserId?: number;
  dueDate?: string;
  startDate?: string;
  coverColor?: string;
  boardName?: string;
  workspaceName?: string;
}

export interface MoveCardRequest {
  targetListId: number;
  newPosition: number;
}

export interface AddAttachmentRequest {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}
