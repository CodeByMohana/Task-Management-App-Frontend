import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShellComponent } from '../../shared/shell/shell.component';
import { AuthService } from '../../core/services/auth.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { User } from '../../core/models/user.model';
import { Workspace } from '../../core/models/workspace.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ShellComponent],
  template: `
    <app-shell>
      <ng-container topbar-title><h2 class="page-title">Admin Panel</h2></ng-container>
      <div class="admin-page">
        <div class="notice">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="vertical-align: middle; margin-top: -2px; margin-right: 4px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          Admin Panel — User management requires <code>PLATFORM_ADMIN</code> role.
        </div>

        <!-- Analytics Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-num">{{ users().length }}</div>
            <div class="stat-lbl">Total Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-num">{{ activeUsersCount() }}</div>
            <div class="stat-lbl">Active Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-num">{{ inactiveUsersCount() }}</div>
            <div class="stat-lbl">Inactive Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-num">{{ publicWorkspaces().length }}</div>
            <div class="stat-lbl">Public Workspaces</div>
          </div>
        </div>

        <!-- Search -->
        <div class="search-bar">
          <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearch()"
            placeholder="Search users by name..." />
        </div>

        <!-- Users Table -->
        <div class="table-card">
          <div class="table-header">
            <h4>Users</h4>
            @if (loadingUsers()) { <span class="loading-text">Loading...</span> }
          </div>
          @if (errorMsg()) {
            <div class="table-error">{{ errorMsg() }}</div>
          }
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Email</th><th>Username</th><th>Role</th><th>Provider</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              @for (u of filteredUsers(); track u.userId) {
                <tr [class.inactive-row]="!u.active">
                  <td>#{{ u.userId }}</td>
                  <td>{{ u.fullName }}</td>
                  <td>{{ u.email }}</td>
                  <td>{{ u.username }}</td>
                  <td><span class="role-chip" [class]="'role-' + u.role.toLowerCase()">{{ u.role }}</span></td>
                  <td><span class="provider-chip" [class.oauth]="u.provider !== 'local'">{{ u.provider }}</span></td>
                  <td><span class="status-chip" [class.active]="u.active" [class.inactive]="!u.active">{{ u.active ? 'Active' : 'Inactive' }}</span></td>
                  <td class="actions-cell">
                    @if (u.active) {
                      <button class="action-btn danger" (click)="deactivateUser(u)"
                        [disabled]="processingUserId() === u.userId"
                        title="Deactivate user">
                        @if (processingUserId() === u.userId) {
                          ...
                        } @else {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" style="vertical-align: middle; margin-right: 2px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Deactivate
                        }
                      </button>
                    } @else {
                      <button class="action-btn success" (click)="activateUser(u)"
                        [disabled]="processingUserId() === u.userId"
                        title="Activate user">
                        @if (processingUserId() === u.userId) {
                          ...
                        } @else {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" style="vertical-align: middle; margin-right: 2px;"><polyline points="20 6 9 17 4 12"></polyline></svg> Activate
                        }
                      </button>
                    }
                  </td>
                </tr>
              }
              @if (users().length === 0 && !loadingUsers()) {
                <tr><td colspan="8" class="empty-td">No users found</td></tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Public Workspaces -->
        <div class="table-card">
          <div class="table-header">
            <h4>Public Workspaces</h4>
          </div>
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Description</th><th>Members</th><th>Created</th></tr>
            </thead>
            <tbody>
              @for (ws of publicWorkspaces(); track ws.workspaceId) {
                <tr>
                  <td>#{{ ws.workspaceId }}</td>
                  <td>{{ ws.name }}</td>
                  <td>{{ ws.description || '—' }}</td>
                  <td>{{ ws.memberCount }}</td>
                  <td>{{ ws.createdAt | date:'MMM d, y' }}</td>
                </tr>
              }
              @if (publicWorkspaces().length === 0) {
                <tr><td colspan="5" class="empty-td">No public workspaces</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </app-shell>
  `,
  styles: [`
    .page-title { margin: 0; font-size: 18px; font-weight: 600; }
    .admin-page { max-width: 1200px; display: flex; flex-direction: column; gap: 24px; }
    .notice { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #f59e0b; }
    .notice code { background: rgba(245,158,11,0.2); padding: 1px 6px; border-radius: 4px; font-size: 12px; }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
    .stat-card { background: var(--card-bg,#fff); border: 1px solid var(--border,#e5e7eb); border-radius: 12px; padding: 20px; text-align: center; transition: transform 0.2s; }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
    .stat-num { font-size: 32px; font-weight: 700; color: var(--accent,#6366f1); }
    .stat-lbl { font-size: 12px; color: var(--text-muted,#6b7280); margin-top: 4px; }

    .search-bar input {
      width: 100%; background: var(--input-bg,#f9fafb); border: 1px solid var(--border,#e5e7eb);
      border-radius: 10px; padding: 12px 16px; font-size: 14px; color: var(--text,#111827);
      transition: border-color 0.2s; box-sizing: border-box;
    }
    .search-bar input:focus { outline: none; border-color: var(--accent,#6366f1); }

    .table-card { background: var(--card-bg,#fff); border: 1px solid var(--border,#e5e7eb); border-radius: 14px; overflow: hidden; }
    .table-header { padding: 16px 20px; border-bottom: 1px solid var(--border,#e5e7eb); display: flex; align-items: center; justify-content: space-between; }
    .table-header h4 { margin: 0; font-size: 16px; }
    .loading-text { font-size: 12px; color: var(--text-muted,#6b7280); }
    .table-error { padding: 12px 20px; background: rgba(239,68,68,0.1); color: #ef4444; font-size: 13px; }

    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 10px 16px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted,#6b7280); background: var(--hover,#f9fafb); }
    td { padding: 12px 16px; font-size: 14px; border-top: 1px solid var(--border,#e5e7eb); }
    .empty-td { text-align: center; color: var(--text-muted,#6b7280); padding: 32px 16px; }
    .inactive-row { opacity: 0.6; }
    .actions-cell { white-space: nowrap; }

    .role-chip { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .role-platform_admin { background: rgba(239,68,68,0.1); color: #ef4444; }
    .role-member { background: rgba(99,102,241,0.1); color: #6366f1; }
    .role-board_owner { background: rgba(245,158,11,0.1); color: #f59e0b; }

    .provider-chip { font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 600; background: rgba(107,114,128,0.1); color: #6b7280; }
    .provider-chip.oauth { background: rgba(245,158,11,0.1); color: #f59e0b; }

    .status-chip { font-size: 12px; padding: 3px 10px; border-radius: 20px; font-weight: 600; }
    .status-chip.active { background: rgba(16,185,129,0.1); color: #10b981; }
    .status-chip.inactive { background: rgba(239,68,68,0.1); color: #ef4444; }

    .action-btn { padding: 6px 14px; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
    .action-btn.danger { background: rgba(239,68,68,0.1); color: #ef4444; }
    .action-btn.danger:hover:not(:disabled) { background: rgba(239,68,68,0.2); }
    .action-btn.success { background: rgba(16,185,129,0.1); color: #10b981; }
    .action-btn.success:hover:not(:disabled) { background: rgba(16,185,129,0.2); }
    .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    @media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr; } }
  `]
})
export class AdminComponent implements OnInit {
  users = signal<User[]>([]);
  publicWorkspaces = signal<Workspace[]>([]);
  loadingUsers = signal(false);
  processingUserId = signal<number | null>(null);
  errorMsg = signal('');
  searchQuery = '';

  activeUsersCount = () => this.users().filter(u => u.active).length;
  inactiveUsersCount = () => this.users().filter(u => !u.active).length;
  filteredUsers = () => {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.users();
    return this.users().filter(u =>
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q)
    );
  };

  constructor(private auth: AuthService, private wsService: WorkspaceService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadPublicWorkspaces();
  }

  loadUsers(): void {
    this.loadingUsers.set(true);
    this.errorMsg.set('');
    this.auth.getAllUsers().subscribe({
      next: users => { this.users.set(users); this.loadingUsers.set(false); },
      error: (e) => {
        this.loadingUsers.set(false);
        this.errorMsg.set(e.error?.message || 'Failed to load users. You may not have admin access.');
      }
    });
  }

  loadPublicWorkspaces(): void {
    this.wsService.getPublicWorkspaces().subscribe({
      next: ws => this.publicWorkspaces.set(ws),
      error: () => {}
    });
  }

  onSearch(): void {
    if (this.searchQuery.trim().length > 0) {
      this.auth.searchUsers(this.searchQuery).subscribe({
        next: users => this.users.set(users),
        error: () => {}
      });
    } else {
      this.loadUsers();
    }
  }

  deactivateUser(u: User): void {
    if (!confirm(`Deactivate user "${u.fullName}" (${u.email})? They will be unable to log in.`)) return;
    this.processingUserId.set(u.userId);
    this.auth.adminDeactivateUser(u.userId).subscribe({
      next: () => {
        // Update user in local list to reflect deactivated state
        this.users.update(list => list.map(x => x.userId === u.userId ? { ...x, active: false } : x));
        this.processingUserId.set(null);
      },
      error: (e) => {
        this.processingUserId.set(null);
        alert(e.error?.message || 'Failed to deactivate user');
      }
    });
  }

  activateUser(u: User): void {
    if (!confirm(`Reactivate user "${u.fullName}" (${u.email})?`)) return;
    this.processingUserId.set(u.userId);
    this.auth.adminActivateUser(u.userId).subscribe({
      next: (updatedUser) => {
        // Update user in local list to reflect activated state
        this.users.update(list => list.map(x => x.userId === u.userId ? { ...x, active: true } : x));
        this.processingUserId.set(null);
      },
      error: (e) => {
        this.processingUserId.set(null);
        alert(e.error?.message || 'Failed to activate user');
      }
    });
  }
}
