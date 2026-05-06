import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShellComponent } from '../../shared/shell/shell.component';
import { WorkspaceService } from '../../core/services/workspace.service';
import { BoardService } from '../../core/services/board.service';
import { AuthService } from '../../core/services/auth.service';
import { Workspace } from '../../core/models/workspace.model';
import { Board } from '../../core/models/board.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ShellComponent],
  template: `
    <app-shell>
      <ng-container topbar-title>
        <div class="breadcrumb">
          <a routerLink="/dashboard">Dashboard</a>
          <span>›</span>
          <span class="truncate">{{ workspace()?.name || 'Workspace' }}</span>
        </div>
      </ng-container>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner-lg"></div>
          <p>Loading workspace...</p>
        </div>
      } @else if (workspace()) {
        <div class="workspace-page">

          <!-- Header -->
          <div class="ws-header">
            <div class="ws-header-accent" [style.background]="wsGradient(workspace()!.name)"></div>
            <div class="ws-header-content">
              <div class="ws-avatar-lg">{{ workspace()!.name[0].toUpperCase() }}</div>
              <div class="ws-header-text">
                <h1>{{ workspace()!.name }}</h1>
                <p>{{ workspace()!.description || 'No description provided.' }}</p>
                <div class="ws-meta">
                  <span class="badge-light">{{ workspace()!.visibility }}</span>
                  <span>{{ workspace()!.memberCount }} member{{ workspace()!.memberCount !== 1 ? 's' : '' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Boards Section -->
          <div class="section">
            <div class="section-header">
              <h3>Boards</h3>
              <button class="btn-primary" (click)="showCreateBoard.set(true)">+ New Board</button>
            </div>

            @if (boards().length === 0) {
              <div class="empty-state">
                <div class="empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="48" height="48"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="8" y1="7" x2="8" y2="17"></line><line x1="16" y1="7" x2="16" y2="13"></line></svg>
                </div>
                <h4>No boards yet</h4>
                <p>Create a board to start organizing your work</p>
                <button class="btn-primary" (click)="showCreateBoard.set(true)">Create First Board</button>
              </div>
            } @else {
              <div class="boards-grid">
                @for (board of boards(); track board.boardId) {
                  <div class="board-card" [class.is-closed]="board.closed">
                    <div class="board-card-accent" [style.background]="boardBg(board)"></div>
                    <a [routerLink]="['/board', board.boardId]" [queryParams]="{wsId: workspaceId}" class="board-link">
                      <div class="board-name">{{ board.name }}</div>
                      <div class="board-desc">{{ board.description || 'No description' }}</div>
                      <div class="board-meta">
                        <span style="display:flex;align-items:center;gap:4px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg> {{ board.listCount }} list{{ board.listCount !== 1 ? 's' : '' }}</span>
                        <span style="display:flex;align-items:center;gap:4px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> {{ board.memberCount }}</span>
                      </div>
                    </a>
                    <div class="board-actions">
                      @if (board.closed) {
                        <button class="board-action-btn" (click)="reopenBoard(board)" title="Reopen">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                        </button>
                      } @else {
                        <button class="board-action-btn" (click)="closeBoard(board)" title="Close board">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </button>
                      }
                      <button class="board-action-btn danger" (click)="confirmDelete(board)" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                    @if (board.closed) { <div class="closed-overlay">CLOSED</div> }
                  </div>
                }
              </div>
            }
          </div>

          <!-- Workspace Settings & Members Grid -->
          <div class="settings-members-grid">
            <!-- Members Section -->
            <div class="section">
              <div class="section-header">
                <h3>Members</h3>
                <button class="btn-outline" (click)="showAddMember.set(true)">+ Add Member</button>
              </div>
              <div class="members-list">
                @for (m of workspace()!.members || []; track m.userId) {
                  <div class="member-item">
                    <div class="member-avatar">{{ getMemberInitial(m.userId) }}</div>
                    <div class="member-info">
                      <span class="member-name">{{ getMemberName(m.userId) }}</span>
                      <span class="member-email">{{ getMemberEmail(m.userId) }}</span>
                    </div>
                    <span class="member-role" [class]="'role-' + m.role.toLowerCase()">{{ m.role }}</span>
                    @if (m.userId !== workspace()!.createdByUserId) {
                      <button class="member-remove-btn" (click)="removeMember(m.userId)" title="Remove">✕</button>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- Workspace Settings -->
            <div class="section">
              <div class="section-header">
                <h3>Settings</h3>
              </div>
              <div class="settings-card">
                <div class="form-group">
                  <label>Workspace Name</label>
                  <input [(ngModel)]="editWsName" type="text" placeholder="Workspace name" />
                </div>
                <div class="form-group">
                  <label>Visibility</label>
                  <select [(ngModel)]="editWsVisibility">
                    <option value="PRIVATE">Private</option>
                    <option value="PUBLIC">Public</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Description</label>
                  <textarea [(ngModel)]="editWsDesc" rows="3" placeholder="Workspace description"></textarea>
                </div>
                @if (wsSettingsMsg()) { <div class="settings-msg" [class.success]="wsSettingsSuccess()">{{ wsSettingsMsg() }}</div> }
                <div class="settings-actions">
                  <button class="btn-primary" (click)="saveWorkspaceSettings()" [disabled]="savingWs()">
                    {{ savingWs() ? 'Saving...' : 'Save Settings' }}
                  </button>
                  <button class="btn-danger-outline" (click)="deleteWorkspace()">Delete Workspace</button>
                </div>
              </div>
            </div>
          </div>

        </div>
      } @else {
        <div class="empty-state"><p>Workspace not found.</p></div>
      }

      <!-- Create Board Modal -->
      @if (showCreateBoard()) {
        <div class="modal-overlay" (click)="showCreateBoard.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Create New Board</h3>
              <button (click)="showCreateBoard.set(false)">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Board Name *</label>
                <input [(ngModel)]="boardName" placeholder="e.g. Sprint Planning" type="text" />
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea [(ngModel)]="boardDesc" placeholder="What is this board for?" rows="2"></textarea>
              </div>
              <div class="form-group">
                <label>Accent Color</label>
                <div class="color-picker">
                  @for (c of bgColors; track c) {
                    <button class="color-swatch" [style.background]="c"
                      [class.selected]="boardBgColor === c" (click)="boardBgColor = c"></button>
                  }
                </div>
              </div>
              <div class="form-group">
                <label>Visibility</label>
                <select [(ngModel)]="boardVisibility">
                  <option value="PRIVATE">Private</option>
                  <option value="WORKSPACE">Workspace</option>
                  <option value="PUBLIC">Public</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="showCreateBoard.set(false)">Cancel</button>
              <button class="btn-primary" (click)="createBoard()" [disabled]="!boardName.trim()">Create Board</button>
            </div>
          </div>
        </div>
      }

      <!-- Add Member Modal -->
      @if (showAddMember()) {
        <div class="modal-overlay" (click)="closeAddMember()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Add Member</h3>
              <button (click)="closeAddMember()">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-group search-group">
                <label>Search by name or email *</label>
                <input [(ngModel)]="memberSearchQuery" type="text"
                  placeholder="Type a name or email..." (input)="onMemberSearch()"
                  autocomplete="off" />
                @if (searchingUsers()) {
                  <div class="search-hint">Searching...</div>
                }
                @if (searchResults().length > 0) {
                  <div class="search-results">
                    @for (u of searchResults(); track u.userId) {
                      <div class="search-result-item"
                        [class.selected]="selectedUser()?.userId === u.userId"
                        (click)="selectUser(u)">
                        <div class="sr-avatar">{{ u.fullName[0].toUpperCase() || u.username[0].toUpperCase() || '?' }}</div>
                        <div class="sr-info">
                          <span class="sr-name">{{ u.fullName || u.username }}</span>
                          <span class="sr-email">{{ u.email }}</span>
                        </div>
                      </div>
                    }
                  </div>
                }
                @if (memberSearchQuery && !searchingUsers() && searchResults().length === 0 && searchDone()) {
                  <div class="search-hint">No users found</div>
                }
              </div>
              @if (selectedUser()) {
                <div class="selected-user-chip">
                  <span style="display:flex;align-items:center;gap:6px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    {{ selectedUser()!.fullName || selectedUser()!.username }} ({{ selectedUser()!.email }})
                  </span>
                  <button (click)="selectedUser.set(null)">✕</button>
                </div>
              }
              <div class="form-group">
                <label>Role</label>
                <select [(ngModel)]="addMemberRole">
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              @if (addMemberMsg()) { <div class="settings-msg">{{ addMemberMsg() }}</div> }
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeAddMember()">Cancel</button>
              <button class="btn-primary" (click)="addMember()" [disabled]="!selectedUser()">Add Member</button>
            </div>
          </div>
        </div>
      }
    </app-shell>
  `,
  styles: [`
    .breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 14px; white-space: nowrap; overflow: hidden; }
    .breadcrumb a { color: var(--accent); text-decoration: none; font-weight: 500; }
    .breadcrumb a:hover { text-decoration: underline; }
    .breadcrumb span { color: var(--text-muted); }
    .truncate { overflow: hidden; text-overflow: ellipsis; }

    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; gap: 16px; color: var(--text-muted); }
    .spinner-lg { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .workspace-page { max-width: 1400px; margin: 0 auto; padding-bottom: 40px; }

    /* Header */
    .ws-header {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      margin-bottom: 32px;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .ws-header-accent { height: 6px; width: 100%; opacity: 0.9; }
    .ws-header-content { display: flex; align-items: center; gap: 24px; padding: 32px 36px; }
    .ws-avatar-lg { width: 72px; height: 72px; background: var(--hover); color: var(--text); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; flex-shrink: 0; }
    .ws-header-text { flex: 1; min-width: 0; }
    .ws-header-text h1 { margin: 0 0 8px; font-size: 28px; font-weight: 700; color: var(--text); letter-spacing: -0.02em; }
    .ws-header-text p { margin: 0 0 16px; color: var(--text-muted); font-size: 15px; }
    .ws-meta { display: flex; align-items: center; gap: 12px; font-size: 13px; color: var(--text-muted); font-weight: 500; }
    .badge-light { background: var(--hover); color: var(--text); border: 1px solid var(--border); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; }

    /* Sections */
    .section { margin-bottom: 40px; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .section-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: var(--text); }

    /* Settings & Members Grid */
    .settings-members-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 32px;
    }

    /* Boards Grid */
    .boards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
    .board-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      position: relative;
      height: 140px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
    }
    .board-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--text-muted); }
    .board-card-accent { height: 4px; width: 100%; opacity: 0.8; }
    .board-link { display: flex; flex-direction: column; padding: 20px; flex: 1; text-decoration: none; color: inherit; box-sizing: border-box; }
    .board-name { font-size: 16px; font-weight: 700; margin-bottom: 6px; color: var(--text); }
    .board-desc { font-size: 13px; color: var(--text-muted); flex: 1; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4; }
    .board-meta { display: flex; gap: 12px; font-size: 12px; color: var(--text-muted); margin-top: auto; font-weight: 500; }
    
    .board-actions { position: absolute; top: 12px; right: 12px; display: flex; gap: 6px; opacity: 0; transition: opacity 0.2s; z-index: 2; }
    .board-card:hover .board-actions { opacity: 1; }
    .board-card.is-closed .board-actions { opacity: 1; }
    .board-action-btn { background: var(--hover); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 6px; cursor: pointer; font-size: 14px; color: var(--text); transition: all 0.2s; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; }
    .board-action-btn:hover { background: var(--border); }
    .board-action-btn.danger:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #ef4444; }
    .closed-overlay { position: absolute; inset: 0; background: rgba(15,23,42,0.7); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 18px; letter-spacing: 2px; pointer-events: none; z-index: 1; }

    /* Members List */
    .members-list { display: flex; flex-direction: column; gap: 12px; }
    .member-item { display: flex; align-items: center; gap: 12px; background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px 16px; box-shadow: var(--shadow-sm); }
    .member-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--hover); display: flex; align-items: center; justify-content: center; color: var(--text); font-weight: 700; font-size: 13px; flex-shrink: 0; }
    .member-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .member-name { font-size: 14px; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .member-email { font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .member-role { font-size: 11px; padding: 4px 8px; border-radius: 20px; font-weight: 600; text-transform: uppercase; border: 1px solid transparent; }
    .role-admin { background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.2); }
    .role-member { background: var(--hover); color: var(--text-muted); border-color: var(--border); }
    .role-observer { background: rgba(107,114,128,0.1); color: #6b7280; }

    /* User Search */
    .search-group { position: relative; }
    .search-results { position: absolute; left: 0; right: 0; top: 100%; background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-md); max-height: 200px; overflow-y: auto; z-index: 300; margin-top: 4px; }
    .search-result-item { display: flex; align-items: center; gap: 10px; padding: 12px 16px; cursor: pointer; transition: background 0.15s; border-bottom: 1px solid var(--hover); }
    .search-result-item:last-child { border-bottom: none; }
    .search-result-item:hover, .search-result-item.selected { background: var(--hover); }
    .sr-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--accent-muted); display: flex; align-items: center; justify-content: center; color: var(--accent); font-size: 13px; font-weight: 700; flex-shrink: 0; }
    .sr-info { display: flex; flex-direction: column; min-width: 0; }
    .sr-name { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sr-email { font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .search-hint { font-size: 12px; color: var(--text-muted); padding: 8px 0; font-style: italic; }
    .selected-user-chip { display: flex; align-items: center; justify-content: space-between; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.3); border-radius: var(--radius-md); padding: 10px 14px; margin-bottom: 16px; font-size: 13px; color: #10b981; font-weight: 500; }
    .selected-user-chip button { background: none; border: none; cursor: pointer; color: #10b981; font-size: 14px; opacity: 0.7; }
    .selected-user-chip button:hover { opacity: 1; }

    /* Empty */
    .empty-state { text-align: center; padding: 64px 24px; background: var(--card-bg); border: 1px dashed var(--border); border-radius: var(--radius-lg); }
    .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.8; }
    .empty-state h4 { font-size: 18px; font-weight: 700; margin: 0 0 8px; color: var(--text); }
    .empty-state p { color: var(--text-muted); margin: 0 0 24px; font-size: 15px; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); display: flex; align-items: center; justify-content: center; z-index: 500; backdrop-filter: blur(4px); }
    .modal { background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius-lg); width: 100%; max-width: 480px; overflow: hidden; box-shadow: var(--shadow-lg); animation: popIn 0.2s cubic-bezier(0.16,1,0.3,1); }
    @keyframes popIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--border); }
    .modal-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: var(--text); }
    .modal-header button { background: var(--hover); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; color: var(--text-muted); font-size: 16px; transition: all 0.2s; }
    .modal-header button:hover { background: var(--border); color: var(--text); }
    .modal-body { padding: 24px; }
    .modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 12px; background: var(--hover); }
    .form-group { margin-bottom: 20px; }
    label { display: block; font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
    input, textarea, select {
      width: 100%; background: var(--input-bg); border: 1px solid var(--border);
      border-radius: var(--radius-md); padding: 10px 14px; font-size: 14px; color: var(--text);
      box-sizing: border-box; font-family: inherit; transition: all 0.2s;
    }
    input:focus, textarea:focus, select:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-muted); }
    textarea { resize: vertical; }

    .color-picker { display: flex; gap: 12px; flex-wrap: wrap; }
    .color-swatch { width: 36px; height: 36px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: transform 0.15s; }
    .color-swatch:hover { transform: scale(1.1); }
    .color-swatch.selected { border-color: var(--text); box-shadow: 0 0 0 2px var(--card-bg) inset; }

    .btn-primary { padding: 10px 20px; background: var(--accent); color: #fff; border: none; border-radius: var(--radius-md); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { padding: 10px 20px; background: var(--card-bg); color: var(--text); border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-secondary:hover { background: var(--hover); border-color: var(--text-muted); }
    .btn-outline { padding: 8px 16px; background: transparent; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 13px; cursor: pointer; color: var(--text); font-weight: 600; transition: all 0.2s; }
    .btn-outline:hover { border-color: var(--text-muted); background: var(--hover); }
    .btn-danger-outline { padding: 10px 20px; background: transparent; border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-md); font-size: 14px; font-weight: 600; cursor: pointer; color: #ef4444; transition: all 0.2s; }
    .btn-danger-outline:hover { background: rgba(239,68,68,0.1); }
    .member-remove-btn { background: var(--hover); border: 1px solid var(--border); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-muted); font-size: 14px; margin-left: auto; transition: all 0.2s; }
    .member-remove-btn:hover { background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.2); }

    /* Settings */
    .settings-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); }
    .settings-actions { display: flex; gap: 12px; margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--hover); }
    .settings-msg { padding: 12px 16px; border-radius: var(--radius-md); font-size: 13px; margin-bottom: 16px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; }
    .settings-msg.success { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.3); color: #10b981; }

    /* Responsive Breakpoints */
    @media (max-width: 1024px) {
      .settings-members-grid { grid-template-columns: 1fr; }
      .boards-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .ws-header-content { flex-direction: column; text-align: center; padding: 24px; }
      .ws-meta { justify-content: center; }
      .boards-grid { grid-template-columns: 1fr; }
      .settings-actions { flex-direction: column; }
      .settings-actions button { width: 100%; }
    }
  `]
})
export class WorkspaceComponent implements OnInit {
  workspace = signal<Workspace | null>(null);
  boards = signal<Board[]>([]);
  loading = signal(true);
  showCreateBoard = signal(false);
  showAddMember = signal(false);

  // Board creation
  boardName = '';
  boardDesc = '';
  boardBgColor = '#6366f1';
  boardVisibility: 'PUBLIC' | 'WORKSPACE' | 'PRIVATE' = 'WORKSPACE';
  bgColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#14b8a6', '#3b82f6', '#1e293b'];

  // Workspace settings
  editWsName = '';
  editWsDesc = '';
  editWsVisibility: 'PUBLIC' | 'PRIVATE' = 'PRIVATE';
  savingWs = signal(false);
  wsSettingsMsg = signal('');
  wsSettingsSuccess = signal(false);

  // Add member
  addMemberRole: 'ADMIN' | 'MEMBER' = 'MEMBER';
  addMemberMsg = signal('');
  memberSearchQuery = '';
  searchResults = signal<User[]>([]);
  selectedUser = signal<User | null>(null);
  searchingUsers = signal(false);
  searchDone = signal(false);
  private searchTimeout: any = null;
  memberInfoCache = signal<Map<number, User>>(new Map());

  workspaceId!: number;

  constructor(
    private route: ActivatedRoute,
    private wsService: WorkspaceService,
    private boardService: BoardService,
    private router: Router,
    private auth: AuthService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.workspaceId = +params.get('id')!;
      this.loadData();
    });
  }

  // ── Member info helpers ─────────────────────────────────────────────────
  private loadMemberInfo(): void {
    const members = this.workspace()?.members ?? [];
    for (const m of members) {
      if (!this.memberInfoCache().has(m.userId)) {
        this.auth.searchUsers(String(m.userId)).subscribe();
        // Search by userId as string may not work; we'll use a direct approach
      }
    }
    // Batch fetch: search each unknown user by their ID
    // Since we have no direct "get user by id" endpoint for non-admin,
    // we use the search endpoint with a broad query and cache results
    this.auth.searchUsers('').subscribe({
      next: users => {
        const cache = new Map<number, User>();
        for (const u of users) cache.set(u.userId, u);
        this.memberInfoCache.set(cache);
      },
      error: () => { } // Silently fail — will show User #ID as fallback
    });
  }

  getMemberName(userId: number): string {
    const u = this.memberInfoCache().get(userId);
    return u?.fullName || u?.username || `User #${userId}`;
  }

  getMemberEmail(userId: number): string {
    return this.memberInfoCache().get(userId)?.email || '';
  }

  getMemberInitial(userId: number): string {
    const u = this.memberInfoCache().get(userId);
    return u?.fullName?.[0]?.toUpperCase() || u?.username?.[0]?.toUpperCase() || String(userId);
  }

  loadData(): void {
    this.loading.set(true);
    this.wsService.getWorkspace(this.workspaceId).subscribe({
      next: ws => {
        this.workspace.set(ws);
        this.editWsName = ws.name;
        this.editWsDesc = ws.description || '';
        this.editWsVisibility = ws.visibility as 'PUBLIC' | 'PRIVATE';
        this.loading.set(false);
        this.loadBoards();
        this.loadMemberInfo();
      },
      error: () => this.loading.set(false)
    });
  }

  loadBoards(): void {
    const memberIds = this.workspace()?.members?.map(m => m.userId) ?? [];
    this.boardService.getBoardsByWorkspace(this.workspaceId, memberIds).subscribe({
      next: boards => this.boards.set(boards),
      error: () => { }
    });
  }

  wsGradient(name: string): string {
    const gradients = [
      'linear-gradient(135deg, #6366f1, #8b5cf6)',
      'linear-gradient(135deg, #ec4899, #f43f5e)',
      'linear-gradient(135deg, #14b8a6, #06b6d4)',
      'linear-gradient(135deg, #f59e0b, #f97316)',
    ];
    return gradients[name.charCodeAt(0) % gradients.length];
  }

  boardBg(board: Board): string {
    return board.background || 'linear-gradient(135deg, #6366f1, #8b5cf6)';
  }

  createBoard(): void {
    if (!this.boardName.trim()) return;
    const memberIds = this.workspace()?.members?.map(m => m.userId) ?? [];
    this.boardService.createBoard({
      workspaceId: this.workspaceId,
      name: this.boardName,
      description: this.boardDesc,
      background: this.boardBgColor,
      visibility: this.boardVisibility,
      workspaceMemberIds: memberIds
    }).subscribe({
      next: board => {
        this.boards.update(list => [...list, board]);
        this.showCreateBoard.set(false);
        this.boardName = ''; this.boardDesc = '';
        this.router.navigate(['/board', board.boardId], { queryParams: { wsId: this.workspaceId } });
      },
      error: err => alert(err.error?.message || 'Failed to create board')
    });
  }

  closeBoard(board: Board): void {
    this.boardService.closeBoard(board.boardId).subscribe({
      next: updated => this.boards.update(list => list.map(b => b.boardId === board.boardId ? updated : b))
    });
  }

  reopenBoard(board: Board): void {
    this.boardService.reopenBoard(board.boardId).subscribe({
      next: updated => this.boards.update(list => list.map(b => b.boardId === board.boardId ? updated : b))
    });
  }

  confirmDelete(board: Board): void {
    if (confirm(`Delete board "${board.name}"? This action cannot be undone.`)) {
      this.boardService.deleteBoard(board.boardId).subscribe({
        next: () => this.boards.update(list => list.filter(b => b.boardId !== board.boardId))
      });
    }
  }

  // Workspace settings
  saveWorkspaceSettings(): void {
    this.savingWs.set(true);
    this.wsService.updateWorkspace(this.workspaceId, {
      name: this.editWsName,
      description: this.editWsDesc,
      visibility: this.editWsVisibility
    }).subscribe({
      next: updated => {
        this.workspace.set(updated);
        this.savingWs.set(false);
        this.wsSettingsMsg.set('Workspace settings saved!');
        this.wsSettingsSuccess.set(true);
        setTimeout(() => this.wsSettingsMsg.set(''), 3000);
      },
      error: e => {
        this.savingWs.set(false);
        this.wsSettingsMsg.set(e.error?.message || 'Failed to update workspace');
        this.wsSettingsSuccess.set(false);
      }
    });
  }

  deleteWorkspace(): void {
    if (!confirm(`Delete workspace "${this.workspace()?.name}"? All boards inside will be removed. This cannot be undone.`)) return;
    this.wsService.deleteWorkspace(this.workspaceId).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: e => alert(e.error?.message || 'Failed to delete workspace')
    });
  }

  onMemberSearch(): void {
    const q = this.memberSearchQuery.trim();
    this.searchDone.set(false);
    if (q.length < 2) { this.searchResults.set([]); return; }
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchingUsers.set(true);
      this.auth.searchUsers(q).subscribe({
        next: users => {
          // Filter out users already in workspace
          const existingIds = new Set((this.workspace()?.members ?? []).map(m => m.userId));
          this.searchResults.set(users.filter(u => !existingIds.has(u.userId)));
          this.searchingUsers.set(false);
          this.searchDone.set(true);
        },
        error: () => { this.searchingUsers.set(false); this.searchDone.set(true); }
      });
    }, 300);
  }

  selectUser(user: User): void {
    this.selectedUser.set(user);
    this.searchResults.set([]);
    this.memberSearchQuery = user.fullName || user.username;
  }

  closeAddMember(): void {
    this.showAddMember.set(false);
    this.memberSearchQuery = '';
    this.searchResults.set([]);
    this.selectedUser.set(null);
    this.addMemberMsg.set('');
  }

  addMember(): void {
    const user = this.selectedUser();
    if (!user) return;
    this.wsService.addMember(this.workspaceId, { userId: user.userId, role: this.addMemberRole }).subscribe({
      next: () => {
        this.closeAddMember();
        this.loadData();
      },
      error: e => this.addMemberMsg.set(e.error?.message || 'Failed to add member')
    });
  }

  removeMember(userId: number): void {
    const name = this.getMemberName(userId);
    if (!confirm(`Remove ${name} from this workspace?`)) return;
    this.wsService.removeMember(this.workspaceId, userId).subscribe({
      next: () => this.loadData(),
      error: e => alert(e.error?.message || 'Failed to remove member')
    });
  }
}

