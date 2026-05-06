export interface Label {
  labelId: number;
  boardId: number;
  name: string;
  color: string;
  createdAt: string;
}

export interface LabelRequest {
  name: string;
  color: string;
}

export interface Checklist {
  checklistId: number;
  cardId: number;
  title: string;
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  createdAt: string;
}

export interface ChecklistItem {
  itemId: number;
  checklistId: number;
  text: string;
  completed: boolean;
  assigneeUserId: number | null;
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChecklistRequest {
  title: string;
}

export interface AddChecklistItemRequest {
  text: string;
  assigneeUserId?: number;
  dueDate?: string;
}
