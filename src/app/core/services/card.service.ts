import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Card, CreateCardRequest, UpdateCardRequest, MoveCardRequest, CardAttachment, AddAttachmentRequest
} from '../models/card.model';

@Injectable({ providedIn: 'root' })
export class CardService {
  private readonly base = `${environment.apiUrl}/api/cards`;

  constructor(private http: HttpClient) {}

  createCard(req: CreateCardRequest): Observable<Card> {
    return this.http.post<Card>(this.base, req, { withCredentials: true });
  }

  getCard(cardId: number): Observable<Card> {
    return this.http.get<Card>(`${this.base}/${cardId}`, { withCredentials: true });
  }

  getCardsByList(listId: number): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.base}/list/${listId}`, { withCredentials: true });
  }

  getCardsByBoard(boardId: number): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.base}/board/${boardId}`, { withCredentials: true });
  }

  getMyCards(): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.base}/my-cards`, { withCredentials: true });
  }

  searchCards(boardId: number, title: string): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.base}/search/${boardId}`, {
      params: { title },
      withCredentials: true
    });
  }

  updateCard(cardId: number, req: UpdateCardRequest): Observable<Card> {
    return this.http.put<Card>(`${this.base}/${cardId}`, req, { withCredentials: true });
  }

  moveCard(cardId: number, req: MoveCardRequest): Observable<Card> {
    return this.http.put<Card>(`${this.base}/${cardId}/move`, req, { withCredentials: true });
  }

  archiveCard(cardId: number): Observable<Card> {
    return this.http.post<Card>(`${this.base}/${cardId}/archive`, null, { withCredentials: true });
  }

  unarchiveCard(cardId: number): Observable<Card> {
    return this.http.post<Card>(`${this.base}/${cardId}/unarchive`, null, { withCredentials: true });
  }

  deleteCard(cardId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${cardId}`, { withCredentials: true });
  }

  getArchivedCardsByList(listId: number): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.base}/list/${listId}/archived`, { withCredentials: true });
  }

  getAttachments(cardId: number): Observable<CardAttachment[]> {
    return this.http.get<CardAttachment[]>(`${this.base}/${cardId}/attachments`, { withCredentials: true });
  }

  addAttachment(cardId: number, req: AddAttachmentRequest): Observable<CardAttachment> {
    return this.http.post<CardAttachment>(`${this.base}/${cardId}/attachments`, req, { withCredentials: true });
  }

  deleteAttachment(cardId: number, attachmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${cardId}/attachments/${attachmentId}`, { withCredentials: true });
  }
}
