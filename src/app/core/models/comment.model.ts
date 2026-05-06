export interface Comment {
  commentId: number;
  cardId: number;
  authorUserId: number;
  authorName?: string;
  content: string;
  parentCommentId: number | null;
  deleted: boolean;
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface AddCommentRequest {
  content: string;
  parentCommentId?: number;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface CommentAttachment {
  attachmentId: number;
  cardId: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSizeKb: number;
  uploadedByUserId: number;
  uploadedAt: string;
}
