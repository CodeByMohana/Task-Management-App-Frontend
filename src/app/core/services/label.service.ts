import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Label, LabelRequest,
  Checklist, CreateChecklistRequest,
  ChecklistItem, AddChecklistItemRequest
} from '../models/label.model';

@Injectable({ providedIn: 'root' })
export class LabelService {
  private readonly base = `${environment.apiUrl}/api/labels`;

  constructor(private http: HttpClient) {}

  // ─── Board Labels ─────────────────────────────────────────────────────────

  createLabel(boardId: number, req: LabelRequest): Observable<Label> {
    return this.http.post<Label>(`${this.base}/boards/${boardId}/labels`, req, { withCredentials: true });
  }

  getLabelsByBoard(boardId: number): Observable<Label[]> {
    return this.http.get<Label[]>(`${this.base}/boards/${boardId}/labels`, { withCredentials: true });
  }

  updateLabel(boardId: number, labelId: number, req: LabelRequest): Observable<Label> {
    return this.http.put<Label>(`${this.base}/boards/${boardId}/labels/${labelId}`, req, { withCredentials: true });
  }

  deleteLabel(boardId: number, labelId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/boards/${boardId}/labels/${labelId}`, { withCredentials: true });
  }

  // ─── Card Labels ──────────────────────────────────────────────────────────

  addLabelToCard(cardId: number, labelId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/cards/${cardId}/labels/${labelId}`, null, { withCredentials: true });
  }

  removeLabelFromCard(cardId: number, labelId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/cards/${cardId}/labels/${labelId}`, { withCredentials: true });
  }

  getLabelsForCard(cardId: number): Observable<Label[]> {
    return this.http.get<Label[]>(`${this.base}/cards/${cardId}/labels`, { withCredentials: true });
  }

  // ─── Checklists ───────────────────────────────────────────────────────────

  createChecklist(cardId: number, req: CreateChecklistRequest): Observable<Checklist> {
    return this.http.post<Checklist>(`${this.base}/cards/${cardId}/checklists`, req, { withCredentials: true });
  }

  getChecklistsByCard(cardId: number): Observable<Checklist[]> {
    return this.http.get<Checklist[]>(`${this.base}/cards/${cardId}/checklists`, { withCredentials: true });
  }

  deleteChecklist(checklistId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/checklists/${checklistId}`, { withCredentials: true });
  }

  getChecklistProgress(checklistId: number): Observable<Checklist> {
    return this.http.get<Checklist>(`${this.base}/checklists/${checklistId}/progress`, { withCredentials: true });
  }

  // ─── Checklist Items ──────────────────────────────────────────────────────

  addItem(checklistId: number, req: AddChecklistItemRequest): Observable<ChecklistItem> {
    return this.http.post<ChecklistItem>(`${this.base}/checklists/${checklistId}/items`, req, { withCredentials: true });
  }

  toggleItem(itemId: number): Observable<ChecklistItem> {
    return this.http.put<ChecklistItem>(`${this.base}/items/${itemId}/toggle`, null, { withCredentials: true });
  }

  deleteItem(itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/items/${itemId}`, { withCredentials: true });
  }
}
