import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Comment, AddCommentRequest, UpdateCommentRequest, CommentAttachment } from '../models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly base = `${environment.apiUrl}/api/comments`;

  constructor(private http: HttpClient) {}

  getComments(cardId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.base}/cards/${cardId}/comments`, { withCredentials: true });
  }

  getComment(cardId: number, commentId: number): Observable<Comment> {
    return this.http.get<Comment>(`${this.base}/cards/${cardId}/comments/${commentId}`, { withCredentials: true });
  }

  addComment(cardId: number, req: AddCommentRequest): Observable<Comment> {
    return this.http.post<Comment>(`${this.base}/cards/${cardId}/comments`, req, { withCredentials: true });
  }

  updateComment(cardId: number, commentId: number, req: UpdateCommentRequest): Observable<Comment> {
    return this.http.put<Comment>(`${this.base}/cards/${cardId}/comments/${commentId}`, req, { withCredentials: true });
  }

  deleteComment(cardId: number, commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/cards/${cardId}/comments/${commentId}`, { withCredentials: true });
  }

  getCommentCount(cardId: number): Observable<number> {
    return this.http.get<number>(`${this.base}/cards/${cardId}/comments/count`, { withCredentials: true });
  }

  getAttachments(cardId: number): Observable<CommentAttachment[]> {
    return this.http.get<CommentAttachment[]>(`${this.base}/cards/${cardId}/attachments`, { withCredentials: true });
  }
}
