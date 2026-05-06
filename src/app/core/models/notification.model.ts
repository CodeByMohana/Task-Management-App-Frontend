export interface Notification {
  id: number;
  eventType: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  message: string;
  entityId: number | null;
  entityType: string | null;
  workspaceId: string | null;
  triggeredBy: string | null;
  status: 'PENDING' | 'SENT' | 'FAILED';
  isRead: boolean;
  errorMessage: string | null;
  createdAt: string;
  sentAt: string | null;
}

export interface NotificationPage {
  content: Notification[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
