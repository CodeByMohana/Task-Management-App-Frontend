import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ShellComponent } from '../../shared/shell/shell.component';
import { BoardService } from '../../core/services/board.service';
import { CardService } from '../../core/services/card.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { AuthService } from '../../core/services/auth.service';
import { Board, BoardList } from '../../core/models/board.model';
import { Card } from '../../core/models/card.model';
import { CardDetailComponent } from './card-detail/card-detail.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ShellComponent, CardDetailComponent],
  template: `
    <app-shell>
      <ng-container topbar-title>
        <div class="board-topbar">
          <a routerLink="/dashboard" class="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back
          </a>
          <h2>{{ board()?.name }}</h2>
          @if (board()?.closed) { <span class="closed-badge">CLOSED</span> }
          <button class="archive-toggle-btn" (click)="toggleArchivePanel()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg> Archive
          </button>
        </div>
      </ng-container>

      @if (loading()) {
        <div class="board-loading">
          <div class="spinner-lg"></div><p>Loading board...</p>
        </div>
      } @else if (board()) {
        @if (board()!.closed) {
          <div class="closed-banner">
            <div class="closed-banner-content">
              <span class="closed-banner-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="32" height="32"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span>
              <div>
                <strong>This board is closed</strong>
                <p>No changes can be made while the board is closed.</p>
              </div>
            </div>
            <button class="btn-reopen" (click)="reopenBoard()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg> Reopen Board</button>
          </div>
        }
        <div class="board-container">
          <div class="board-canvas" (dragover)="$event.preventDefault()">

            <!-- Lists -->
            @for (list of sortedLists(); track list.listId) {
              <div class="list-column"
                   (dragover)="onListDragOver($event, list)"
                   (drop)="onDrop($event, list)">

                <!-- List Header -->
                <div class="list-header">
                  @if (editingListId() === list.listId && canEdit()) {
                    <input class="list-name-input" [(ngModel)]="editingListName"
                      (blur)="saveListName(list)" (keyup.enter)="saveListName(list)"
                      (keyup.escape)="editingListId.set(null)" autofocus />
                  } @else {
                    <span class="list-name" (dblclick)="canEdit() && startEditList(list)">{{ list.name }}</span>
                  }
                  @if (canEdit()) {
                    <div class="list-menu-wrap">
                      <button class="list-menu-btn" (click)="toggleListMenu(list.listId)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg></button>
                      @if (activeListMenu() === list.listId) {
                        <div class="list-menu">
                          <button (click)="startEditList(list); activeListMenu.set(null)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> Rename</button>
                          <button (click)="archiveList(list)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg> Archive</button>
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- Cards -->
                <div class="cards-container">
                  @for (card of getCards(list.listId); track card.cardId) {
                    <div class="card-tile"
                         [class.dragging]="draggingCard()?.cardId === card.cardId"
                         [style.border-left-color]="priorityColor(card.priority)"
                         [attr.draggable]="canEdit()"
                         (dragstart)="canEdit() && onCardDragStart($event, card)"
                         (dragend)="draggingCard.set(null)"
                         (click)="openCard(card)">
                      @if (card.coverColor) {
                        <div class="card-cover" [style.background]="card.coverColor"></div>
                      }
                      <div class="card-body">
                        <div class="card-title">{{ card.title }}</div>
                        @if (card.description) {
                          <div class="card-desc">{{ card.description | slice:0:80 }}{{ card.description.length > 80 ? '…' : '' }}</div>
                        }
                        <div class="card-footer">
                          <span class="priority-badge priority-{{ card.priority.toLowerCase() }}">{{ card.priority }}</span>
                          @if (card.dueDate) {
                            <span class="due-date" [class.overdue]="isOverdue(card.dueDate)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> {{ card.dueDate | date:'MMM d' }}</span>
                          }
                          @if (card.attachmentCount > 0) {
                            <span class="card-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg> {{ card.attachmentCount }}</span>
                          }
                        </div>
                      </div>
                    </div>
                  }
                  <!-- Drop placeholder -->
                  @if (draggingCard() && dropTarget()?.listId === list.listId) {
                    <div class="drop-placeholder"></div>
                  }
                </div>

                <!-- Add Card -->
                @if (canEdit()) {
                  @if (addingCardToList() === list.listId) {
                    <div class="add-card-form">
                      <textarea [(ngModel)]="newCardTitle" placeholder="Card title..." rows="2"
                        (keyup.enter)="createCard(list)" (keyup.escape)="addingCardToList.set(null)"></textarea>
                      <div class="add-card-actions">
                        <button class="btn-add" (click)="createCard(list)">Add Card</button>
                        <button class="btn-cancel" (click)="addingCardToList.set(null)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                      </div>
                    </div>
                  } @else {
                    <button class="add-card-btn" (click)="addingCardToList.set(list.listId)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Add a card</button>
                  }
                }
              </div>
            }

            <!-- Add List -->
            @if (canEdit()) {
              @if (addingList()) {
                <div class="list-column add-list-form">
                  <input [(ngModel)]="newListName" placeholder="List name..." class="list-name-input-new"
                    (keyup.enter)="createList()" (keyup.escape)="addingList.set(false)" autofocus />
                  <div class="add-card-actions">
                    <button class="btn-add" (click)="createList()">Add List</button>
                    <button class="btn-cancel" (click)="addingList.set(false)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                  </div>
                </div>
              } @else {
                <button class="add-list-btn" (click)="addingList.set(true)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Add a list</button>
              }
            }
          </div>
        </div>

        <!-- Card Detail Modal -->
        @if (selectedCard()) {
          <app-card-detail
            [card]="selectedCard()!"
            [boardId]="board()!.boardId"
            [boardName]="board()!.name"
            [workspaceName]="workspaceName()"
            [lists]="lists()"
            [boardClosed]="board()!.closed"
            [readOnly]="!canEdit()"
            [wsVisibility]="wsVisibility()"
            [isAdmin]="isAdmin()"
            (closed)="selectedCard.set(null)"
            (updated)="onCardUpdated($event)"
            (deleted)="onCardDeleted($event)">
          </app-card-detail>
        }

        <!-- Archive Panel -->
        @if (archiveOpen()) {
          <div class="archive-overlay" (click)="archiveOpen.set(false)"></div>
          <div class="archive-panel">
            <div class="archive-panel-header">
              <h3>📦 Archive</h3>
              <button class="close-btn" (click)="archiveOpen.set(false)">✕</button>
            </div>

            <div class="archive-section">
              <h4>Archived Lists</h4>
              @if (archivedLists().length === 0) {
                <p class="archive-empty">No archived lists</p>
              }
              @for (list of archivedLists(); track list.listId) {
                <div class="archive-item">
                  <span class="archive-item-name">📋 {{ list.name }}</span>
                  <div class="archive-item-actions">
                    <button class="btn-unarchive" (click)="unarchiveList(list)">Restore</button>
                    <button class="btn-delete-sm" (click)="deleteList(list)">Delete</button>
                  </div>
                </div>
              }
            </div>

            <div class="archive-section">
              <h4>Archived Cards</h4>
              @if (archivedCards().length === 0) {
                <p class="archive-empty">No archived cards</p>
              }
              @for (card of archivedCards(); track card.cardId) {
                <div class="archive-item">
                  <div class="archive-card-info">
                    <span class="archive-item-name">🗂️ {{ card.title }}</span>
                    <span class="archive-card-meta">{{ getListNameById(card.listId) }}</span>
                  </div>
                  <div class="archive-item-actions">
                    <button class="btn-unarchive" (click)="unarchiveCard(card)">Restore</button>
                    <button class="btn-delete-sm" (click)="deleteArchivedCard(card)">Delete</button>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      }
    </app-shell>
  `,
  styles: [`
    .board-topbar { display: flex; align-items: center; gap: 16px; padding: 4px 0 12px; }
    .back-link { color: var(--text-muted); text-decoration: none; font-size: 14px; font-weight: 500; padding: 8px 14px; background: var(--card-bg); border-radius: var(--radius-md); border: 1px solid var(--border); transition: all 0.2s; box-shadow: var(--shadow-sm); display: flex; align-items: center; gap: 6px; }
    .back-link:hover { background: var(--hover); color: var(--text); }
    .board-topbar h2 { margin: 0; font-size: 20px; font-weight: 700; color: var(--text); }
    .closed-badge { background: #ef4444; color: #fff; font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: 700; letter-spacing: 0.5px; }
    
    /* Closed Banner */
    .closed-banner { display: flex; align-items: center; justify-content: space-between; background: linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.1)); border: 1px solid rgba(245,158,11,0.2); border-radius: var(--radius-lg); padding: 16px 24px; margin-bottom: 20px; box-shadow: var(--shadow-sm); }
    .closed-banner-content { display: flex; align-items: center; gap: 16px; }
    .closed-banner-icon { font-size: 32px; }
    .closed-banner-content strong { font-size: 16px; display: block; margin-bottom: 4px; color: var(--text); }
    .closed-banner-content p { margin: 0; font-size: 14px; color: var(--text-muted); }
    .btn-reopen { padding: 10px 20px; background: var(--accent); color: #fff; border: none; border-radius: var(--radius-md); font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.2s; box-shadow: var(--shadow-md); }
    .btn-reopen:hover { background: var(--accent-hover); transform: translateY(-1px); }
    
    .board-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; gap: 20px; color: var(--text-muted); font-size: 16px; }
    .spinner-lg { width: 48px; height: 48px; border: 4px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .board-container { height: calc(100vh - 120px); overflow: hidden; margin: 0 -24px -24px -24px; }
    .board-canvas { display: flex; align-items: flex-start; gap: 16px; padding: 0 24px 24px; height: 100%; overflow-x: auto; overflow-y: hidden; }

    .list-column {
      width: 290px; flex-shrink: 0; background: var(--list-bg);
      border-radius: var(--radius-lg); display: flex; flex-direction: column; max-height: calc(100vh - 144px);
      box-shadow: 0 1px 2px rgba(0,0,0,0.03); border: 1px solid var(--border); transition: background 0.2s;
    }
    
    .list-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 12px; }
    .list-name { font-size: 15px; font-weight: 600; flex: 1; cursor: default; color: var(--text); }
    .list-name-input { background: var(--card-bg); border: 2px solid var(--accent); border-radius: var(--radius-md); padding: 6px 10px; font-size: 15px; font-weight: 600; color: var(--text); flex: 1; box-shadow: var(--shadow-sm); outline: none; }
    .list-menu-wrap { position: relative; }
    .list-menu-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 20px; padding: 2px 8px; border-radius: var(--radius-md); transition: all 0.2s; line-height: 1; }
    .list-menu-btn:hover { background: var(--hover); color: var(--text); }
    .list-menu { position: absolute; right: 0; top: 32px; background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); z-index: 50; min-width: 160px; padding: 6px; }
    .list-menu button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 14px; background: none; border: none; cursor: pointer; font-size: 14px; color: var(--text); border-radius: 6px; text-align: left; transition: background 0.2s; }
    .list-menu button:hover { background: var(--hover); }

    .cards-container { padding: 0 10px 10px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 10px; }
    .cards-container::-webkit-scrollbar { width: 6px; }
    .cards-container::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }
    .cards-container::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }

    .card-tile {
      background: var(--card-bg); border-radius: var(--radius-md); border: 1px solid var(--border);
      border-left: 4px solid #6366f1; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: var(--shadow-sm); overflow: hidden; position: relative;
    }
    .card-tile:hover { box-shadow: var(--shadow-md); border-color: var(--border); border-left-color: var(--accent); transform: translateY(-2px); }
    .card-tile.dragging { opacity: 0.6; transform: rotate(3deg) scale(1.02); box-shadow: var(--shadow-lg); z-index: 100; cursor: grabbing; }
    .card-cover { height: 36px; opacity: 0.8; }
    .card-body { padding: 14px; }
    .card-title { font-size: 14px; font-weight: 500; margin-bottom: 6px; line-height: 1.5; color: var(--text); }
    .card-desc { font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .card-footer { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
    
    .priority-badge { font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .priority-low { background: rgba(16,185,129,0.1); color: #059669; }
    .priority-medium { background: rgba(245,158,11,0.1); color: #d97706; }
    .priority-high { background: rgba(239,68,68,0.1); color: #dc2626; }
    .priority-critical { background: rgba(220,38,38,0.15); color: #b91c1c; }
    :host-context(.dark) .priority-low { color: #34d399; }
    :host-context(.dark) .priority-medium { color: #fbbf24; }
    :host-context(.dark) .priority-high { color: #f87171; }
    :host-context(.dark) .priority-critical { color: #fca5a5; }

    .due-date { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; padding: 2px 6px; background: var(--hover); border-radius: 4px; }
    .due-date.overdue { color: #dc2626; background: rgba(239,68,68,0.1); font-weight: 500; }
    .card-badge { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; padding: 2px 6px; background: var(--hover); border-radius: 4px; }
    
    .drop-placeholder { height: 64px; background: var(--accent-muted); border: 2px dashed var(--accent); border-radius: var(--radius-md); margin: 2px 0; transition: all 0.2s; }

    .add-card-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 12px 16px; background: none; border: none; text-align: left; color: var(--text-muted); font-size: 14px; font-weight: 500; cursor: pointer; border-radius: 0 0 var(--radius-lg) var(--radius-lg); transition: all 0.2s; }
    .add-card-btn:hover { background: rgba(0,0,0,0.04); color: var(--text); }
    :host-context(.dark) .add-card-btn:hover { background: rgba(255,255,255,0.04); }
    
    .add-card-form { padding: 0 10px 10px; }
    .add-card-form textarea { width: 100%; background: var(--card-bg); border: 2px solid var(--accent); border-radius: var(--radius-md); padding: 10px 12px; font-size: 14px; color: var(--text); resize: none; font-family: inherit; box-sizing: border-box; box-shadow: var(--shadow-md); outline: none; }
    .add-card-actions { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
    .btn-add { padding: 8px 16px; background: var(--accent); color: #fff; border: none; border-radius: var(--radius-md); font-size: 14px; cursor: pointer; font-weight: 600; box-shadow: var(--shadow-sm); transition: all 0.2s; }
    .btn-add:hover { background: var(--accent-hover); transform: translateY(-1px); box-shadow: var(--shadow-md); }
    .btn-cancel { padding: 8px; background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 18px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; transition: all 0.2s; line-height: 1; }
    .btn-cancel:hover { background: var(--hover); color: var(--text); }

    .add-list-btn {
      width: 290px; flex-shrink: 0; padding: 14px 20px; background: rgba(0,0,0,0.04); border: 1px dashed var(--border);
      border-radius: var(--radius-lg); color: var(--text-muted); font-size: 15px; font-weight: 500;
      cursor: pointer; text-align: left; white-space: nowrap; transition: all 0.2s;
    }
    .add-list-btn:hover { background: rgba(0,0,0,0.08); color: var(--text); border-color: transparent; }
    :host-context(.dark) .add-list-btn { background: rgba(255,255,255,0.04); }
    :host-context(.dark) .add-list-btn:hover { background: rgba(255,255,255,0.08); }
    
    .add-list-form { padding: 10px; background: var(--list-bg); border-radius: var(--radius-lg); width: 290px; flex-shrink: 0; border: 1px solid var(--border); }
    .list-name-input-new { width: 100%; background: var(--card-bg); border: 2px solid var(--accent); border-radius: var(--radius-md); padding: 10px 14px; font-size: 15px; font-weight: 600; color: var(--text); box-sizing: border-box; box-shadow: var(--shadow-sm); outline: none; }

    /* Archive Toggle */
    .archive-toggle-btn { margin-left: auto; padding: 8px 16px; background: var(--card-bg); color: var(--text); border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; box-shadow: var(--shadow-sm); display: flex; align-items: center; gap: 8px; }
    .archive-toggle-btn:hover { background: var(--hover); }

    /* Archive Panel */
    .archive-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.4); z-index: 90; backdrop-filter: blur(2px); }
    .archive-panel {
      position: fixed; top: 0; right: 0; width: 400px; height: 100vh; background: var(--card-bg);
      border-left: 1px solid var(--border); z-index: 100; overflow-y: auto;
      box-shadow: var(--shadow-lg); animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .archive-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 24px; border-bottom: 1px solid var(--border); }
    .archive-panel-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: var(--text); }
    .archive-panel-header .close-btn { background: var(--hover); border: none; cursor: pointer; font-size: 16px; color: var(--text-muted); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .archive-panel-header .close-btn:hover { background: var(--border); color: var(--text); }
    
    .archive-section { padding: 24px; border-bottom: 1px solid var(--border); }
    .archive-section h4 { margin: 0 0 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }
    .archive-empty { font-size: 14px; color: var(--text-muted); font-style: italic; margin: 0; padding: 12px; background: var(--hover); border-radius: var(--radius-md); text-align: center; }
    .archive-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--hover); border-radius: var(--radius-md); margin-bottom: 10px; gap: 12px; border: 1px solid var(--border); transition: all 0.2s; }
    .archive-item:hover { border-color: var(--accent-muted); box-shadow: var(--shadow-sm); }
    .archive-item-name { font-size: 14px; font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }
    .archive-card-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .archive-card-meta { font-size: 12px; color: var(--text-muted); margin-top: 4px; display: flex; align-items: center; gap: 4px; }
    .archive-item-actions { display: flex; gap: 8px; flex-shrink: 0; }
    .btn-unarchive { padding: 6px 12px; background: #fff; color: var(--text); border: 1px solid var(--border); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: var(--shadow-sm); }
    .btn-unarchive:hover { background: var(--hover); border-color: #10b981; color: #059669; }
    .btn-delete-sm { padding: 6px 12px; background: #fff; color: var(--text); border: 1px solid var(--border); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: var(--shadow-sm); }
    .btn-delete-sm:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #dc2626; }
    :host-context(.dark) .btn-unarchive, :host-context(.dark) .btn-delete-sm { background: var(--card-bg); }
  `]
})
export class BoardComponent implements OnInit {
  board = signal<Board | null>(null);
  lists = signal<BoardList[]>([]);
  cards = signal<Map<number, Card[]>>(new Map());
  loading = signal(true);
  selectedCard = signal<Card | null>(null);
  draggingCard = signal<Card | null>(null);
  dropTarget = signal<BoardList | null>(null);
  addingList = signal(false);
  addingCardToList = signal<number | null>(null);
  editingListId = signal<number | null>(null);
  activeListMenu = signal<number | null>(null);
  archiveOpen = signal(false);
  archivedLists = signal<BoardList[]>([]);
  archivedCards = signal<Card[]>([]);
  wsVisibility = signal<string>('PRIVATE');
  isAdmin = signal(false);
  workspaceName = signal<string>('');
  newListName = '';
  newCardTitle = '';
  editingListName = '';

  sortedLists = () => [...this.lists()].sort((a, b) => a.position - b.position);
  canEdit = computed(() => {
    if (this.board()?.closed) return false;
    // Board admins can do everything else. Non-admins have limited actions inside cards.
    return this.isAdmin();
  });

  constructor(
    private route: ActivatedRoute,
    private boardService: BoardService,
    private cardService: CardService,
    private wsService: WorkspaceService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = +params.get('id')!;
      if (!id) return;
      this.loading.set(true);
      // First try loading the board directly (works if user is a board member or board is PUBLIC)
      this.boardService.getBoard(id).subscribe({
        next: board => {
          this.board.set(board);
          this.lists.set(board.lists ?? []);
          this.loading.set(false);
          this.loadAllCards(board.boardId);
          this.resolvePermissions(board);
        },
        error: (err) => {
          if (err.status === 403) {
            this.loadBoardWithWorkspaceContext(id);
          } else {
            this.loading.set(false);
          }
        }
      });
    });

    this.route.queryParamMap.subscribe(params => {
      const cardIdParam = params.get('cardId');
      if (cardIdParam) {
        this.openCardById(+cardIdParam);
      }
    });
  }

  private loadBoardWithWorkspaceContext(boardId: number): void {
    // Try to get the workspaceId from query params (set when navigating from workspace page)
    const wsId = this.route.snapshot.queryParamMap.get('wsId');
    if (!wsId) {
      this.loading.set(false);
      return;
    }
    this.wsService.getWorkspace(+wsId).subscribe({
      next: ws => {
        const memberIds = ws.members?.map(m => m.userId) ?? [];
        this.boardService.getBoard(boardId, memberIds).subscribe({
          next: board => {
            this.board.set(board);
            this.lists.set(board.lists ?? []);
            this.loading.set(false);
            this.loadAllCards(board.boardId);
            this.resolvePermissions(board);
          },
          error: () => this.loading.set(false)
        });
      },
      error: () => this.loading.set(false)
    });
  }

  private resolvePermissions(board: Board): void {
    // Check if user is an explicit board admin
    const userId = this.authService.currentUser()?.userId;
    if (board.members) {
      const me = board.members.find(m => m.userId === userId);
      if (me?.role === 'ADMIN') {
        this.isAdmin.set(true);
      }
    }
    // Get workspace details and check workspace-level admin
    this.wsService.getWorkspace(board.workspaceId).subscribe({
      next: ws => {
        this.wsVisibility.set(ws.visibility);
        this.workspaceName.set(ws.name);
        
        // If they are a workspace admin, they automatically inherit board admin rights
        if (ws.members) {
          const wsMe = ws.members.find(m => m.userId === userId);
          if (wsMe?.role === 'ADMIN') {
            this.isAdmin.set(true);
          }
        }
      }
    });
  }

  loadAllCards(boardId: number): void {
    this.cardService.getCardsByBoard(boardId).subscribe({
      next: allCards => {
        const map = new Map<number, Card[]>();
        for (const card of allCards) {
          const list = map.get(card.listId) ?? [];
          list.push(card);
          map.set(card.listId, list);
        }
        this.cards.set(map);
      }
    });
  }

  getCards(listId: number): Card[] {
    return (this.cards().get(listId) ?? []).filter(c => !c.archived).sort((a, b) => a.position - b.position);
  }

  priorityColor(p: string): string {
    const m: Record<string, string> = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#dc2626' };
    return m[p] ?? '#6366f1';
  }

  isOverdue(date: string): boolean {
    return new Date(date) < new Date();
  }

  openCardById(cardId: number): void {
    this.cardService.getCard(cardId).subscribe({ next: c => this.selectedCard.set(c), error: () => {} });
  }

  openCard(card: Card): void {
    this.openCardById(card.cardId);
  }

  onCardUpdated(updated: Card): void {
    const map = new Map(this.cards());
    const list = (map.get(updated.listId) ?? []).map(c => c.cardId === updated.cardId ? updated : c);
    map.set(updated.listId, list);
    this.cards.set(map);
    if (this.selectedCard()?.cardId === updated.cardId) this.selectedCard.set(updated);
  }

  onCardDragStart(event: DragEvent, card: Card): void {
    this.draggingCard.set(card);
    event.dataTransfer?.setData('cardId', String(card.cardId));
  }

  onListDragOver(event: DragEvent, list: BoardList): void {
    event.preventDefault();
    this.dropTarget.set(list);
  }

  onDrop(event: DragEvent, targetList: BoardList): void {
    event.preventDefault();
    const card = this.draggingCard();
    if (!card) return;
    const targetCards = this.getCards(targetList.listId);
    const newPos = targetCards.length + 1;

    // Optimistic update
    const map = new Map(this.cards());
    const srcList = (map.get(card.listId) ?? []).filter(c => c.cardId !== card.cardId);
    map.set(card.listId, srcList);
    const moved = { ...card, listId: targetList.listId, position: newPos };
    map.set(targetList.listId, [...(map.get(targetList.listId) ?? []), moved]);
    this.cards.set(map);
    this.draggingCard.set(null);
    this.dropTarget.set(null);

    this.cardService.moveCard(card.cardId, { targetListId: targetList.listId, newPosition: newPos }).subscribe({
      error: () => this.loadAllCards(this.board()!.boardId) // rollback on error
    });
  }

  createList(): void {
    if (!this.newListName.trim()) return;
    const boardId = this.board()!.boardId;
    const pos = this.lists().length + 1;
    // Optimistic
    const temp: BoardList = { listId: -Date.now(), boardId, name: this.newListName, position: pos, archived: false, createdAt: '', updatedAt: '' };
    this.lists.update(l => [...l, temp]);
    const name = this.newListName;
    this.newListName = '';
    this.addingList.set(false);

    this.boardService.createList(boardId, { name }).subscribe({
      next: created => this.lists.update(l => l.map(x => x.listId === temp.listId ? created : x)),
      error: () => this.lists.update(l => l.filter(x => x.listId !== temp.listId))
    });
  }

  createCard(list: BoardList): void {
    if (!this.newCardTitle.trim()) return;
    const title = this.newCardTitle;
    this.newCardTitle = '';
    this.addingCardToList.set(null);

    this.cardService.createCard({
      listId: list.listId,
      boardId: this.board()!.boardId,
      workspaceId: this.board()!.workspaceId,
      title,
      boardName: this.board()!.name,
      workspaceName: this.workspaceName()
    }).subscribe({
      next: card => {
        const map = new Map(this.cards());
        map.set(card.listId, [...(map.get(card.listId) ?? []), card]);
        this.cards.set(map);
      }
    });
  }

  startEditList(list: BoardList): void {
    this.editingListId.set(list.listId);
    this.editingListName = list.name;
  }

  saveListName(list: BoardList): void {
    const name = this.editingListName.trim();
    this.editingListId.set(null);
    if (!name || name === list.name) return;
    this.lists.update(ls => ls.map(l => l.listId === list.listId ? { ...l, name } : l));
    this.boardService.updateList(this.board()!.boardId, list.listId, { name }).subscribe();
  }

  archiveList(list: BoardList): void {
    this.activeListMenu.set(null);
    this.boardService.archiveList(this.board()!.boardId, list.listId).subscribe({
      next: () => this.lists.update(ls => ls.filter(l => l.listId !== list.listId))
    });
  }

  toggleListMenu(id: number): void {
    this.activeListMenu.set(this.activeListMenu() === id ? null : id);
  }

  // ── Board Actions ─────────────────────────────────────────────────────

  reopenBoard(): void {
    this.boardService.reopenBoard(this.board()!.boardId).subscribe({
      next: updated => this.board.set(updated)
    });
  }

  // ── Archive Panel ──────────────────────────────────────────────────────

  toggleArchivePanel(): void {
    const open = !this.archiveOpen();
    this.archiveOpen.set(open);
    if (open) this.loadArchived();
  }

  loadArchived(): void {
    const boardId = this.board()!.boardId;
    this.boardService.getArchivedLists(boardId).subscribe({
      next: archivedLists => {
        this.archivedLists.set(archivedLists);
        // After archived lists are loaded, fetch archived cards from all lists
        this.loadArchivedCards([...this.lists(), ...archivedLists]);
      }
    });
  }

  private loadArchivedCards(allLists: BoardList[]): void {
    const collected: Card[] = [];
    let remaining = allLists.length;
    if (remaining === 0) { this.archivedCards.set([]); return; }
    for (const list of allLists) {
      this.cardService.getArchivedCardsByList(list.listId).subscribe({
        next: cards => { collected.push(...cards); },
        complete: () => { remaining--; if (remaining <= 0) this.archivedCards.set(collected); },
        error: () => { remaining--; if (remaining <= 0) this.archivedCards.set(collected); }
      });
    }
  }

  unarchiveList(list: BoardList): void {
    this.boardService.unarchiveList(this.board()!.boardId, list.listId).subscribe({
      next: restored => {
        this.archivedLists.update(ls => ls.filter(l => l.listId !== list.listId));
        this.lists.update(ls => [...ls, restored]);
      }
    });
  }

  deleteList(list: BoardList): void {
    if (!confirm('Permanently delete this list?')) return;
    this.boardService.deleteList(this.board()!.boardId, list.listId).subscribe({
      next: () => this.archivedLists.update(ls => ls.filter(l => l.listId !== list.listId))
    });
  }

  unarchiveCard(card: Card): void {
    this.cardService.unarchiveCard(card.cardId).subscribe({
      next: restored => {
        this.archivedCards.update(cs => cs.filter(c => c.cardId !== card.cardId));
        const map = new Map(this.cards());
        map.set(restored.listId, [...(map.get(restored.listId) ?? []), restored]);
        this.cards.set(map);
      }
    });
  }

  deleteArchivedCard(card: Card): void {
    if (!confirm('Permanently delete this card?')) return;
    this.cardService.deleteCard(card.cardId).subscribe({
      next: () => this.archivedCards.update(cs => cs.filter(c => c.cardId !== card.cardId))
    });
  }

  getListNameById(listId: number): string {
    return this.lists().find(l => l.listId === listId)?.name
      ?? this.archivedLists().find(l => l.listId === listId)?.name
      ?? 'Unknown list';
  }

  onCardDeleted(card: Card): void {
    const map = new Map(this.cards());
    const list = (map.get(card.listId) ?? []).filter(c => c.cardId !== card.cardId);
    map.set(card.listId, list);
    this.cards.set(map);
    this.selectedCard.set(null);
  }
}
