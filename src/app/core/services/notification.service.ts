import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, timer, of, Subscription } from 'rxjs';
import { tap, switchMap, catchError, shareReplay, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Notification, NotificationPage, UnreadCountResponse } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly base = `${environment.apiUrl}/api/notifications`;

  // Reactive signals for UI binding
  private _unreadCount = signal<number>(0);
  private _notifications = signal<Notification[]>([]);
  private _loading = signal<boolean>(false);
  private _totalPages = signal<number>(0);
  private _currentPage = signal<number>(0);

  unreadCount = this._unreadCount.asReadonly();
  notifications = this._notifications.asReadonly();
  loading = this._loading.asReadonly();
  totalPages = this._totalPages.asReadonly();
  currentPage = this._currentPage.asReadonly();

  private pollingSub?: Subscription;

  // Single shared stream for polling unread counts
  private readonly unreadCountStream$ = timer(0, 30000).pipe(
    switchMap(() => this.http.get<UnreadCountResponse>(`${this.base}/unread-count`, { withCredentials: true }).pipe(
      catchError(() => of({ unreadCount: 0 }))
    )),
    map(res => res.unreadCount),
    tap(count => this._unreadCount.set(count)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(private http: HttpClient) {}

  /** Start polling unread count via shared RxJS stream */
  startPolling(): void {
    if (!this.pollingSub) {
      this.pollingSub = this.unreadCountStream$.subscribe();
    }
  }

  /** Stop polling */
  stopPolling(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
      this.pollingSub = undefined;
    }
  }

  /** Fetch unread notification count immediately */
  fetchUnreadCount(): void {
    this.http.get<UnreadCountResponse>(`${this.base}/unread-count`, { withCredentials: true }).subscribe({
      next: res => this._unreadCount.set(res.unreadCount),
      error: () => {} // silently ignore
    });
  }

  /** Fetch paginated notifications */
  getNotifications(page: number = 0, size: number = 20): Observable<NotificationPage> {
    this._loading.set(true);
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<NotificationPage>(this.base, { params, withCredentials: true }).pipe(
      tap(res => {
        if (page === 0) {
          this._notifications.set(res.content);
        } else {
          this._notifications.update(prev => [...prev, ...res.content]);
        }
        this._totalPages.set(res.totalPages);
        this._currentPage.set(res.number);
        this._loading.set(false);
      })
    );
  }

  /** Mark a single notification as read */
  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/read`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this._notifications.update(list =>
          list.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        this._unreadCount.update(c => Math.max(0, c - 1));
      })
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.base}/read-all`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this._notifications.update(list =>
          list.map(n => ({ ...n, isRead: true }))
        );
        this._unreadCount.set(0);
      })
    );
  }

  /** Get human-readable time ago string */
  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  }
}
