import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Board, CreateBoardRequest, UpdateBoardRequest,
  BoardList, CreateListRequest, UpdateListRequest, ReorderListRequest,
  BoardMember, AddBoardMemberRequest, BoardAnalytics
} from '../models/board.model';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private readonly base = `${environment.apiUrl}/api/boards`;

  constructor(private http: HttpClient) {}

  // ─── Boards ─────────────────────────────────────────────────────────────────

  createBoard(req: CreateBoardRequest): Observable<Board> {
    return this.http.post<Board>(this.base, req, { withCredentials: true });
  }

  getBoard(boardId: number, workspaceMemberIds: number[] = []): Observable<Board> {
    const params: any = {};
    if (workspaceMemberIds.length > 0) {
      params.workspaceMemberIds = workspaceMemberIds.join(',');
    }
    return this.http.get<Board>(`${this.base}/${boardId}`, { params, withCredentials: true });
  }

  getBoardsByWorkspace(workspaceId: number, workspaceMemberIds: number[] = []): Observable<Board[]> {
    const params: any = {};
    if (workspaceMemberIds.length > 0) {
      params.workspaceMemberIds = workspaceMemberIds.join(',');
    }
    return this.http.get<Board[]>(`${this.base}/workspace/${workspaceId}`, { params, withCredentials: true });
  }

  updateBoard(boardId: number, req: UpdateBoardRequest): Observable<Board> {
    return this.http.put<Board>(`${this.base}/${boardId}`, req, { withCredentials: true });
  }

  closeBoard(boardId: number): Observable<Board> {
    return this.http.patch<Board>(`${this.base}/${boardId}/close`, null, { withCredentials: true });
  }

  reopenBoard(boardId: number): Observable<Board> {
    return this.http.patch<Board>(`${this.base}/${boardId}/reopen`, null, { withCredentials: true });
  }

  deleteBoard(boardId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${boardId}`, { withCredentials: true });
  }

  getBoardAnalytics(boardId: number): Observable<BoardAnalytics> {
    return this.http.get<BoardAnalytics>(`${this.base}/${boardId}/analytics`, { withCredentials: true });
  }

  // ─── Members ─────────────────────────────────────────────────────────────────

  addMember(boardId: number, req: AddBoardMemberRequest): Observable<BoardMember> {
    return this.http.post<BoardMember>(`${this.base}/${boardId}/members`, req, { withCredentials: true });
  }

  removeMember(boardId: number, targetUserId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${boardId}/members/${targetUserId}`, { withCredentials: true });
  }

  updateMemberRole(boardId: number, targetUserId: number, role: string): Observable<BoardMember> {
    return this.http.patch<BoardMember>(
      `${this.base}/${boardId}/members/${targetUserId}/role`,
      null,
      { params: { role }, withCredentials: true }
    );
  }

  // ─── Lists ───────────────────────────────────────────────────────────────────

  createList(boardId: number, req: CreateListRequest): Observable<BoardList> {
    return this.http.post<BoardList>(`${this.base}/${boardId}/lists`, req, { withCredentials: true });
  }

  updateList(boardId: number, listId: number, req: UpdateListRequest): Observable<BoardList> {
    return this.http.put<BoardList>(`${this.base}/${boardId}/lists/${listId}`, req, { withCredentials: true });
  }

  reorderList(boardId: number, listId: number, req: ReorderListRequest): Observable<BoardList> {
    return this.http.patch<BoardList>(`${this.base}/${boardId}/lists/${listId}/reorder`, req, { withCredentials: true });
  }

  archiveList(boardId: number, listId: number): Observable<BoardList> {
    return this.http.patch<BoardList>(`${this.base}/${boardId}/lists/${listId}/archive`, null, { withCredentials: true });
  }

  unarchiveList(boardId: number, listId: number): Observable<BoardList> {
    return this.http.patch<BoardList>(`${this.base}/${boardId}/lists/${listId}/unarchive`, null, { withCredentials: true });
  }

  deleteList(boardId: number, listId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${boardId}/lists/${listId}`, { withCredentials: true });
  }

  getArchivedLists(boardId: number): Observable<BoardList[]> {
    return this.http.get<BoardList[]>(`${this.base}/${boardId}/lists/archived`, { withCredentials: true });
  }
}
