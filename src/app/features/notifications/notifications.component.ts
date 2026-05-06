import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from '../../shared/shell/shell.component';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/notification.model';
import { Router } from '@angular/router';
import { CardService } from '../../core/services/card.service';
import { CommentService } from '../../core/services/comment.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, ShellComponent],
  template: `
    <app-shell>
      <ng-container topbar-title>
        <h2 class="page-title">Notifications</h2>
      </ng-container>

      <div class="notifications-page">
        <!-- Header -->
        <div class="notif-page-header">
          <div class="header-left">
            <h1><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" style="vertical-align: middle; margin-right: 8px; margin-top: -4px;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg> Notifications</h1>
            @if (notifService.unreadCount() > 0) {
              <span class="unread-badge">{{ notifService.unreadCount() }} unread</span>
            }
          </div>
          <div class="header-actions">
            @if (notifService.unreadCount() > 0) {
              <button class="action-btn" (click)="markAllRead()" id="mark-all-read-btn">
                <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"></polyline></svg></span> Mark all as read
              </button>
            }
            <div class="filter-group">
              <button class="filter-btn" [class.active]="activeFilter() === 'all'" (click)="setFilter('all')">
                All
              </button>
              <button class="filter-btn" [class.active]="activeFilter() === 'unread'" (click)="setFilter('unread')">
                Unread
              </button>
              <button class="filter-btn" [class.active]="activeFilter() === 'read'" (click)="setFilter('read')">
                Read
              </button>
            </div>
          </div>
        </div>

        <!-- Notifications List -->
        @if (notifService.loading() && filteredNotifications().length === 0) {
          <div class="loading-container">
            @for (_ of [1,2,3,4,5]; track $index) {
              <div class="skeleton-notif">
                <div class="skeleton-icon"></div>
                <div class="skeleton-content">
                  <div class="skeleton-line long"></div>
                  <div class="skeleton-line short"></div>
                </div>
              </div>
            }
          </div>
        } @else if (filteredNotifications().length === 0) {
          <div class="empty-state">
            <div class="empty-illustration">
              @if (activeFilter() === 'unread') {
                <span class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="64" height="64"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                <h3>All caught up!</h3>
                <p>No unread notifications. You're on top of everything.</p>
              } @else if (activeFilter() === 'read') {
                <span class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="64" height="64"><path d="M4 7V4h16v3"></path><path d="M9 20h6"></path><path d="M12 14v6"></path><path d="M4 7h16v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z"></path></svg></span>
                <h3>No read notifications</h3>
                <p>Notifications you've read will appear here.</p>
              } @else {
                <span class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="64" height="64"><path d="M13.73 21a2 2 0 0 1-3.46 0"></path><path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"></path><path d="M18 8a6 6 0 0 0-9.33-5"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg></span>
                <h3>No notifications yet</h3>
                <p>When someone assigns you a card, mentions you, or adds you to a workspace, you'll see it here.</p>
              }
            </div>
          </div>
        } @else {
          <div class="notif-list">
            @for (notif of filteredNotifications(); track notif.id) {
              <div class="notif-card" [class.unread]="!notif.isRead" (click)="onNotifClick(notif)">
                <div class="notif-card-icon" [class]="'icon-' + getEventColor(notif.eventType)">
                  @if (notif.eventType.includes('CARD_')) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  } @else if (notif.eventType.includes('COMMENT_')) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  } @else if (notif.eventType.includes('BOARD_')) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="8" y1="7" x2="8" y2="17"></line><line x1="16" y1="7" x2="16" y2="13"></line></svg>
                  } @else if (notif.eventType.includes('MEMBER_')) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  }
                </div>
                <div class="notif-card-body">
                  <div class="notif-card-top">
                    <span class="notif-type-badge" [class]="'badge-' + getEventColor(notif.eventType)">
                      {{ formatEventType(notif.eventType) }}
                    </span>
                    <span class="notif-card-time">{{ notifService.getTimeAgo(notif.createdAt) }}</span>
                  </div>
                  <h4 class="notif-card-subject">{{ notif.subject }}</h4>
                  <p class="notif-card-message">{{ notif.message }}</p>
                  @if (notif.triggeredBy) {
                    <span class="notif-card-triggered">
                      Triggered by <strong>{{ notif.triggeredBy }}</strong>
                    </span>
                  }
                </div>
                <div class="notif-card-actions">
                  @if (!notif.isRead) {
                    <button class="mark-read-btn" (click)="markRead($event, notif)" title="Mark as read">
                      <span class="notif-unread-dot"></span>
                    </button>
                  } @else {
                    <span class="notif-read-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Load More -->
          @if (!notifService.loading() && notifService.currentPage() < notifService.totalPages() - 1) {
            <div class="load-more-container">
              <button class="load-more-btn" (click)="loadMore()" id="load-more-btn">
                Load more notifications
              </button>
            </div>
          }
          @if (notifService.loading() && filteredNotifications().length > 0) {
            <div class="load-more-container">
              <div class="loading-spinner"></div>
            </div>
          }
        }
      </div>
    </app-shell>
  `,
  styles: [`
    .notifications-page { max-width: 800px; margin: 0 auto; }

    .page-title { margin: 0; font-size: 18px; font-weight: 600; }

    /* Header */
    .notif-page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
    }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .header-left h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .unread-badge {
      background: linear-gradient(135deg, #ef4444, #f97316); color: #fff;
      font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px;
    }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    .action-btn {
      display: flex; align-items: center; gap: 6px;
      background: var(--accent-muted, rgba(99,102,241,0.1)); color: var(--accent, #6366f1);
      border: 1px solid var(--accent, #6366f1); border-radius: 8px;
      padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
    }
    .action-btn:hover { background: var(--accent, #6366f1); color: #fff; }

    /* Filter */
    .filter-group {
      display: flex; background: var(--hover, #f3f4f6); border-radius: 10px;
      padding: 3px; gap: 2px;
    }
    .filter-btn {
      background: none; border: none; padding: 7px 14px; border-radius: 8px;
      font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-muted, #6b7280);
      transition: all 0.2s;
    }
    .filter-btn.active {
      background: var(--card-bg, #fff); color: var(--text, #111827);
      box-shadow: 0 1px 3px rgba(0,0,0,0.08); font-weight: 600;
    }
    .filter-btn:hover:not(.active) { color: var(--text, #111827); }

    /* Notification Cards */
    .notif-list { display: flex; flex-direction: column; gap: 8px; }
    .notif-card {
      display: flex; align-items: flex-start; gap: 16px;
      background: var(--card-bg, #fff); border: 1px solid var(--border, #e5e7eb);
      border-radius: 14px; padding: 18px 20px; cursor: pointer;
      transition: all 0.2s; position: relative;
    }
    .notif-card:hover {
      transform: translateX(4px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
      border-color: var(--accent, #6366f1);
    }
    .notif-card.unread {
      background: var(--accent-muted, rgba(99,102,241,0.1));
      border-left: 3px solid var(--accent, #6366f1);
    }

    .notif-card-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; flex-shrink: 0;
    }
    .icon-blue { background: rgba(59,130,246,0.12); }
    .icon-purple { background: rgba(139,92,246,0.12); }
    .icon-green { background: rgba(16,185,129,0.12); }
    .icon-orange { background: rgba(245,158,11,0.12); }
    .icon-pink { background: rgba(236,72,153,0.12); }
    .icon-teal { background: rgba(20,184,166,0.12); }

    .notif-card-body { flex: 1; min-width: 0; }
    .notif-card-top {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 6px; gap: 8px;
    }
    .notif-type-badge {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.5px; padding: 3px 8px; border-radius: 6px;
    }
    .badge-blue { background: rgba(59,130,246,0.12); color: #3b82f6; }
    .badge-purple { background: rgba(139,92,246,0.12); color: #8b5cf6; }
    .badge-green { background: rgba(16,185,129,0.12); color: #10b981; }
    .badge-orange { background: rgba(245,158,11,0.12); color: #f59e0b; }
    .badge-pink { background: rgba(236,72,153,0.12); color: #ec4899; }
    .badge-teal { background: rgba(20,184,166,0.12); color: #14b8a6; }

    .notif-card-time { font-size: 12px; color: var(--text-muted, #6b7280); white-space: nowrap; }
    .notif-card-subject { margin: 0 0 4px; font-size: 15px; font-weight: 600; line-height: 1.3; }
    .notif-card-message {
      margin: 0 0 8px; font-size: 13px; color: var(--text-muted, #6b7280);
      line-height: 1.4; overflow: hidden; display: -webkit-box;
      -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    }
    .notif-card-triggered { font-size: 11px; color: var(--text-muted, #6b7280); }
    .notif-card-triggered strong { color: var(--text, #111827); }

    .notif-card-actions { display: flex; align-items: center; flex-shrink: 0; margin-top: 4px; }
    .mark-read-btn {
      background: none; border: none; cursor: pointer; padding: 4px;
      display: flex; align-items: center; justify-content: center;
    }
    .notif-unread-dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: var(--accent, #6366f1); display: block;
      transition: transform 0.2s;
    }
    .mark-read-btn:hover .notif-unread-dot { transform: scale(1.3); }
    .notif-read-check { font-size: 14px; color: var(--text-muted, #6b7280); }

    /* Loading */
    .loading-container { display: flex; flex-direction: column; gap: 8px; }
    .skeleton-notif {
      display: flex; align-items: center; gap: 16px;
      background: var(--card-bg, #fff); border: 1px solid var(--border, #e5e7eb);
      border-radius: 14px; padding: 18px 20px;
    }
    .skeleton-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: linear-gradient(90deg, var(--hover, #f3f4f6) 25%, rgba(255,255,255,0.5) 50%, var(--hover, #f3f4f6) 75%);
      background-size: 400% 100%; animation: shimmer 1.5s infinite; flex-shrink: 0;
    }
    .skeleton-content { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .skeleton-line {
      height: 12px; border-radius: 6px;
      background: linear-gradient(90deg, var(--hover, #f3f4f6) 25%, rgba(255,255,255,0.5) 50%, var(--hover, #f3f4f6) 75%);
      background-size: 400% 100%; animation: shimmer 1.5s infinite;
    }
    .skeleton-line.long { width: 80%; }
    .skeleton-line.short { width: 40%; }
    @keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

    /* Empty State */
    .empty-state { text-align: center; padding: 80px 20px; }
    .empty-illustration { max-width: 400px; margin: 0 auto; }
    .empty-icon { font-size: 64px; display: block; margin-bottom: 16px; }
    .empty-state h3 { margin: 0 0 8px; font-size: 22px; font-weight: 700; }
    .empty-state p { margin: 0; color: var(--text-muted, #6b7280); font-size: 14px; line-height: 1.5; }

    /* Load More */
    .load-more-container { display: flex; justify-content: center; padding: 24px 0; }
    .load-more-btn {
      background: var(--hover, #f3f4f6); color: var(--text, #111827);
      border: 1px solid var(--border, #e5e7eb); border-radius: 10px;
      padding: 10px 28px; font-size: 14px; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
    }
    .load-more-btn:hover { background: var(--accent-muted, rgba(99,102,241,0.1)); border-color: var(--accent, #6366f1); color: var(--accent, #6366f1); }
    .loading-spinner {
      width: 24px; height: 24px; border: 3px solid var(--border, #e5e7eb);
      border-top-color: var(--accent, #6366f1); border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 640px) {
      .notif-page-header { flex-direction: column; align-items: flex-start; }
      .header-actions { width: 100%; flex-wrap: wrap; }
      .notif-card { padding: 14px 16px; }
    }
  `]
})
export class NotificationsComponent implements OnInit {
  activeFilter = signal<'all' | 'unread' | 'read'>('all');
  filteredNotifications = signal<Notification[]>([]);

  constructor(
    public notifService: NotificationService,
    private router: Router,
    private cardService: CardService,
    private commentService: CommentService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.notifService.getNotifications(0, 20).subscribe({
      next: () => this.applyFilter(),
      error: () => {}
    });
  }

  setFilter(filter: 'all' | 'unread' | 'read'): void {
    this.activeFilter.set(filter);
    this.applyFilter();
  }

  private applyFilter(): void {
    const all = this.notifService.notifications();
    switch (this.activeFilter()) {
      case 'unread':
        this.filteredNotifications.set(all.filter(n => !n.isRead));
        break;
      case 'read':
        this.filteredNotifications.set(all.filter(n => n.isRead));
        break;
      default:
        this.filteredNotifications.set([...all]);
    }
  }

  onNotifClick(notif: Notification): void {
    const navigateFn = () => {
      if (notif.entityType === 'CARD' && notif.entityId) {
        this.cardService.getCard(notif.entityId).subscribe({
          next: (card) => {
            this.router.navigate(['/board', card.boardId], { queryParams: { cardId: card.cardId } });
          }
        });
      } else if (notif.entityType === 'COMMENT' && notif.entityId) {
        this.commentService.getComment(0, notif.entityId).subscribe({
          next: (comment) => {
            this.cardService.getCard(comment.cardId).subscribe({
              next: (card) => {
                this.router.navigate(['/board', card.boardId], { queryParams: { cardId: card.cardId } });
              }
            });
          }
        });
      }
    };

    if (!notif.isRead) {
      this.notifService.markAsRead(notif.id).subscribe({
        next: () => {
          this.applyFilter();
          navigateFn();
        }
      });
    } else {
      navigateFn();
    }
  }

  markRead(event: Event, notif: Notification): void {
    event.stopPropagation();
    if (!notif.isRead) {
      this.notifService.markAsRead(notif.id).subscribe({
        next: () => this.applyFilter()
      });
    }
  }

  markAllRead(): void {
    this.notifService.markAllAsRead().subscribe({
      next: () => this.applyFilter()
    });
  }

  loadMore(): void {
    const nextPage = this.notifService.currentPage() + 1;
    this.notifService.getNotifications(nextPage, 20).subscribe({
      next: () => this.applyFilter()
    });
  }

  formatEventType(type: string): string {
    return type.replace(/_/g, ' ');
  }

  getEventColor(eventType: string): string {
    const colorMap: Record<string, string> = {
      'CARD_ASSIGNED': 'blue',
      'CARD_UPDATED': 'purple',
      'CARD_DUE_DATE_APPROACHING': 'orange',
      'COMMENT_ADDED': 'teal',
      'WORKSPACE_MEMBER_ADDED': 'green',
      'BOARD_CREATED': 'purple',
      'BOARD_UPDATED': 'blue',
      'MEMBER_REMOVED': 'pink'
    };
    return colorMap[eventType] || 'blue';
  }
}
