import { Component, signal, Signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { NotificationService } from '../../core/services/notification.service';
import { CardService } from '../../core/services/card.service';
import { CommentService } from '../../core/services/comment.service';
import { Workspace } from '../../core/models/workspace.model';
import { Notification } from '../../core/models/notification.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  template: `
    <div class="shell" [class.dark]="darkMode()">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <div class="logo" (click)="onLogoClick()">
            <span class="logo-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg></span>
            @if (!sidebarCollapsed()) { <span class="logo-text">FlowBoard</span> }
          </div>
          @if (!sidebarCollapsed()) {
            <button class="collapse-btn" (click)="sidebarCollapsed.set(true)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          }
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" title="Dashboard">
            <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></span>
            @if (!sidebarCollapsed()) { <span>Dashboard</span> }
          </a>
          <a routerLink="/notifications" routerLinkActive="active" class="nav-item" title="Notifications">
            <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg></span>
            @if (!sidebarCollapsed()) {
              <span>Notifications</span>
              @if (notifService.unreadCount() > 0) {
                <span class="sidebar-badge">{{ notifService.unreadCount() > 99 ? '99+' : notifService.unreadCount() }}</span>
              }
            }
          </a>
          <a routerLink="/profile" routerLinkActive="active" class="nav-item" title="My Profile">
            <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></span>
            @if (!sidebarCollapsed()) { <span>My Profile</span> }
          </a>
          @if (currentUser()?.role === 'PLATFORM_ADMIN') {
            <a routerLink="/admin" routerLinkActive="active" class="nav-item" title="Admin Panel">
              <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></span>
              @if (!sidebarCollapsed()) { <span>Admin Panel</span> }
            </a>
          }
          <a [href]="docsUrl" target="_blank" rel="noopener noreferrer" class="nav-item" title="API Documentation">
            <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></span>
            @if (!sidebarCollapsed()) { <span>API Docs ↗</span> }
          </a>
        </nav>

        @if (!sidebarCollapsed()) {
          <div class="sidebar-section">
            <div class="section-header">
              <span>Workspaces</span>
              <button class="icon-btn" (click)="showCreateWs.set(true)" title="New Workspace"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
            </div>
            @for (ws of workspaces(); track ws.workspaceId) {
              <a [routerLink]="['/workspace', ws.workspaceId]" routerLinkActive="active" class="ws-item" [title]="ws.name">
                <span class="ws-avatar" [style.background]="wsColor(ws.name)">{{ ws.name[0].toUpperCase() }}</span>
                <span class="ws-name">{{ ws.name }}</span>
              </a>
            }
            @if (workspaces().length === 0) {
              <p class="empty-hint">No workspaces yet</p>
            }
          </div>
        }

        <div class="sidebar-footer">
          <button class="nav-item dark-toggle" (click)="darkMode.set(!darkMode())" title="Toggle dark mode">
            <span class="nav-icon">
              @if (darkMode()) {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              }
            </span>
            @if (!sidebarCollapsed()) { <span>{{ darkMode() ? 'Light Mode' : 'Dark Mode' }}</span> }
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="main-area">
        <!-- Topbar -->
        <header class="topbar">
          <div class="topbar-left">
            <ng-content select="[topbar-title]"></ng-content>
          </div>
          <div class="topbar-right">
            <!-- Notifications Bell -->
            <button class="icon-btn notif-btn" (click)="toggleNotifDropdown()" title="Notifications" id="notif-bell-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              @if (notifService.unreadCount() > 0) {
                <span class="badge">{{ notifService.unreadCount() > 99 ? '99+' : notifService.unreadCount() }}</span>
              }
            </button>
            @if (showNotifs()) {
              <div class="notif-dropdown" id="notif-dropdown">
                <div class="notif-header">
                  <span>Notifications</span>
                  <div class="notif-header-actions">
                    @if (notifService.unreadCount() > 0) {
                      <button class="notif-mark-all" (click)="markAllRead()" title="Mark all as read">
                        ✓ Mark all read
                      </button>
                    }
                    <a routerLink="/notifications" class="notif-view-all" (click)="showNotifs.set(false)">
                      View all →
                    </a>
                  </div>
                </div>

                @if (dropdownNotifications().length === 0 && !notifService.loading()) {
                  <div class="notif-empty">
                    <span class="notif-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="32" height="32"><path d="M13.73 21a2 2 0 0 1-3.46 0"></path><path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"></path><path d="M18 8a6 6 0 0 0-9.33-5"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg></span>
                    <p>No notifications yet</p>
                  </div>
                } @else {
                  @for (notif of dropdownNotifications(); track notif.id) {
                    <div class="notif-item" [class.unread]="!notif.isRead" (click)="onNotifClick(notif)">
                      <div class="notif-item-content">
                        <span class="notif-item-subject">{{ notif.subject }}</span>
                        <span class="notif-item-time">{{ notifService.getTimeAgo(notif.createdAt) }}</span>
                      </div>
                      @if (!notif.isRead) {
                        <span class="notif-dot"></span>
                      }
                    </div>
                  }
                }

                <div class="notif-footer">
                  <a routerLink="/notifications" (click)="showNotifs.set(false)">See all notifications</a>
                </div>
              </div>
            }

            <!-- User Menu -->
            <button class="user-btn" (click)="showUserMenu.set(!showUserMenu())" id="user-menu-btn">
            <div class="avatar" [class.has-image]="currentUser()?.avatarUrl">
              @if (currentUser()?.avatarUrl) {
                <img [src]="currentUser()!.avatarUrl" [alt]="currentUser()!.fullName" (error)="avatarError.set(true)" />
              }
              @if (!currentUser()?.avatarUrl || avatarError()) {
                {{ userInitial() }}
              }
            </div>
            @if (!sidebarCollapsed()) { <span class="user-name">{{ currentUser()?.fullName }}</span> }
            </button>
            @if (showUserMenu()) {
              <div class="user-dropdown">
                <div class="user-info">
                  <strong>{{ currentUser()?.fullName }}</strong>
                  <small>{{ currentUser()?.email }}</small>
                </div>
                <hr />
                <a routerLink="/profile" class="dropdown-item" (click)="showUserMenu.set(false)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Profile Settings</a>
                <button class="dropdown-item danger" (click)="logout()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> Sign Out</button>
              </div>
            }
          </div>
        </header>

        <!-- Page Content -->
        <main class="page-content">
          <ng-content></ng-content>
        </main>
      </div>

      <!-- Create Workspace Modal -->
      @if (showCreateWs()) {
        <div class="modal-overlay" (click)="showCreateWs.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Create Workspace</h3>
              <button (click)="showCreateWs.set(false)">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Name *</label>
                <input [(ngModel)]="wsName" placeholder="My Team Workspace" type="text" />
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea [(ngModel)]="wsDesc" placeholder="What is this workspace for?" rows="3"></textarea>
              </div>
              <div class="form-group">
                <label>Visibility</label>
                <select [(ngModel)]="wsVisibility">
                  <option value="PRIVATE">🔒 Private</option>
                  <option value="PUBLIC">🌐 Public</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="showCreateWs.set(false)">Cancel</button>
              <button class="btn-primary" (click)="createWorkspace()" [disabled]="!wsName.trim()">Create</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .shell { display: flex; height: 100vh; background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; overflow: hidden; }

    /* Sidebar */
    .sidebar {
      width: 240px; background: var(--sidebar-bg); border-right: 1px solid var(--border);
      display: flex; flex-direction: column; transition: width 0.3s; flex-shrink: 0; overflow: hidden;
    }
    .sidebar.collapsed { width: 64px; }
    .sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 16px; border-bottom: 1px solid var(--border); transition: padding 0.3s; }
    .sidebar.collapsed .sidebar-header { flex-direction: column; padding: 16px 0; gap: 16px; justify-content: center; }
    .logo { display: flex; align-items: center; gap: 10px; cursor: pointer; text-decoration: none; flex: 1; overflow: hidden; }
    .sidebar.collapsed .logo { justify-content: center; width: 100%; flex: none; overflow: visible; }
    .logo-icon { font-size: 22px; flex-shrink: 0; }
    .logo-text { color: var(--text); font-weight: 700; font-size: 17px; white-space: nowrap; }
    .collapse-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px 6px; border-radius: 6px; font-size: 10px; flex-shrink: 0; }
    .collapse-btn:hover { background: var(--hover); }

    .sidebar-nav { padding: 12px 8px; }
    .nav-item {
      display: flex; align-items: center; gap: 10px; padding: 9px 12px;
      border-radius: 8px; color: var(--text-muted); text-decoration: none;
      font-size: 14px; font-weight: 500; transition: all 0.15s; cursor: pointer;
      white-space: nowrap; width: 100%; background: none; border: none;
    }
    .nav-item:hover, .nav-item.active { background: var(--hover); color: var(--text); }
    .nav-item.active { background: var(--accent-muted); color: var(--accent); }
    .nav-icon { font-size: 18px; flex-shrink: 0; }

    .sidebar-badge {
      background: #ef4444; color: #fff; font-size: 10px; font-weight: 700;
      min-width: 18px; height: 18px; border-radius: 9px; display: inline-flex;
      align-items: center; justify-content: center; padding: 0 5px; margin-left: auto;
    }

    .sidebar-section { padding: 8px; flex: 1; overflow-y: auto; }
    .section-header { display: flex; align-items: center; justify-content: space-between; padding: 4px 8px 8px; color: var(--text-muted); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .icon-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 2px 6px; border-radius: 4px; font-size: 16px; }
    .icon-btn:hover { background: var(--hover); color: var(--text); }

    .ws-item { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 8px; cursor: pointer; text-decoration: none; color: var(--text-muted); font-size: 13px; transition: all 0.15s; }
    .ws-item:hover, .ws-item.active { background: var(--hover); color: var(--text); }
    .ws-avatar { width: 26px; height: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0; }
    .ws-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .empty-hint { color: var(--text-muted); font-size: 12px; padding: 6px 10px; }

    .sidebar-footer { padding: 8px; border-top: 1px solid var(--border); }
    .dark-toggle { width: 100%; }

    /* Main Area */
    .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    /* Topbar */
    .topbar {
      height: 60px; background: var(--topbar-bg); border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px; gap: 16px; flex-shrink: 0; position: relative;
    }
    .topbar-left { flex: 1; }
    .topbar-right { display: flex; align-items: center; gap: 12px; position: relative; }

    /* Notifications */
    .notif-btn { position: relative; font-size: 18px; }
    .badge {
      position: absolute; top: -4px; right: -4px; background: #ef4444; color: #fff;
      font-size: 10px; min-width: 16px; height: 16px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; padding: 0 3px;
      animation: badgePulse 2s ease-in-out infinite;
    }
    @keyframes badgePulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    .notif-dropdown {
      position: absolute; top: 44px; right: 0; width: 380px;
      background: var(--card-bg); border: 1px solid var(--border); border-radius: 14px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.3); z-index: 100; overflow: hidden;
      animation: dropdownSlide 0.2s ease-out;
    }
    @keyframes dropdownSlide {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .notif-header {
      padding: 14px 16px; font-weight: 600; font-size: 14px;
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
    }
    .notif-header-actions { display: flex; align-items: center; gap: 12px; }
    .notif-mark-all {
      background: none; border: none; color: var(--accent); cursor: pointer;
      font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 6px;
      transition: background 0.15s;
    }
    .notif-mark-all:hover { background: var(--accent-muted); }
    .notif-view-all {
      color: var(--accent); font-size: 11px; font-weight: 600; text-decoration: none;
      padding: 4px 8px; border-radius: 6px; transition: background 0.15s;
    }
    .notif-view-all:hover { background: var(--accent-muted); }
    .notif-item {
      display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px;
      font-size: 13px; border-bottom: 1px solid var(--border); color: var(--text-muted);
      cursor: pointer; transition: background 0.15s; position: relative;
    }
    .notif-item:hover { background: var(--hover); }
    .notif-item.unread { background: var(--accent-muted); color: var(--text); }
    .notif-item-icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
    .notif-item-content { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .notif-item-subject {
      font-size: 13px; font-weight: 500; line-height: 1.3;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .notif-item-time { font-size: 11px; color: var(--text-muted); }
    .notif-dot {
      width: 8px; height: 8px; border-radius: 50%; background: var(--accent);
      flex-shrink: 0; margin-top: 6px;
    }
    .notif-empty {
      padding: 32px 16px; text-align: center;
    }
    .notif-empty-icon { font-size: 32px; display: block; margin-bottom: 8px; }
    .notif-empty p { margin: 0; color: var(--text-muted); font-size: 13px; }
    .notif-footer {
      padding: 10px 16px; text-align: center; border-top: 1px solid var(--border);
    }
    .notif-footer a {
      color: var(--accent); font-size: 12px; font-weight: 600;
      text-decoration: none; transition: opacity 0.15s;
    }
    .notif-footer a:hover { opacity: 0.8; }

    /* User menu */
    .user-btn { display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; padding: 4px 8px; border-radius: 8px; }
    .user-btn:hover { background: var(--hover); }
    .avatar { width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 13px; flex-shrink: 0; }
    .avatar.has-image { padding: 0; overflow: hidden; }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .user-name { color: var(--text); font-size: 14px; font-weight: 500; }
    .user-dropdown {
      position: absolute; top: 44px; right: 0; width: 220px;
      background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.3); z-index: 100; overflow: hidden; padding: 8px;
      animation: dropdownSlide 0.2s ease-out;
    }
    .user-info { padding: 8px; }
    .user-info strong { display: block; font-size: 14px; }
    .user-info small { color: var(--text-muted); font-size: 12px; }
    hr { border: none; border-top: 1px solid var(--border); margin: 4px 0; }
    .dropdown-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 12px; background: none; border: none; border-radius: 8px; color: var(--text); font-size: 13px; cursor: pointer; text-decoration: none; transition: background 0.15s; }
    .dropdown-item:hover { background: var(--hover); }
    .dropdown-item.danger { color: #ef4444; }
    .dropdown-item.danger:hover { background: rgba(239,68,68,0.1); }

    /* Page Content */
    .page-content { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 24px; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(4px); }
    .modal { background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 480px; overflow: hidden; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--border); }
    .modal-header h3 { margin: 0; font-size: 18px; }
    .modal-header button { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 18px; padding: 4px; }
    .modal-body { padding: 24px; }
    .modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 12px; }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-size: 13px; font-weight: 500; color: var(--text-muted); margin-bottom: 6px; }
    input, textarea, select {
      width: 100%; background: var(--input-bg); border: 1px solid var(--border);
      border-radius: 8px; padding: 10px 14px; color: var(--text); font-size: 14px;
      transition: border-color 0.2s; box-sizing: border-box; font-family: inherit;
    }
    input:focus, textarea:focus, select:focus { outline: none; border-color: var(--accent); }
    textarea { resize: vertical; }
    .btn-primary { padding: 9px 20px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { padding: 9px 20px; background: var(--hover); color: var(--text); border: 1px solid var(--border); border-radius: 8px; font-size: 14px; cursor: pointer; }

    /* CSS Variables Theme Context */
    :host { display: contents; }
    .shell { 
      --bg: #f4f5f8; --sidebar-bg: #ffffff; --topbar-bg: #ffffff; --card-bg: #ffffff; 
      --border: #e2e8f0; --text: #0f172a; --text-muted: #64748b; --hover: #f1f5f9; 
      --accent: #4f46e5; --accent-hover: #4338ca; --accent-muted: #e0e7ff; 
      --input-bg: #f8fafc; --list-bg: #eaeff4;
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      --radius-md: 8px; --radius-lg: 12px;
    }
    .shell.dark { 
      --bg: #0f1117; --sidebar-bg: #161925; --topbar-bg: #161925; --card-bg: #1e2230; 
      --border: #2e344a; --text: #f8fafc; --text-muted: #94a3b8; --hover: #262b3d; 
      --accent: #6366f1; --accent-hover: #818cf8; --accent-muted: rgba(99, 102, 241, 0.15); 
      --input-bg: #161925; --list-bg: #1a1e2b;
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
    }

    /* Responsive Layout Breakpoints */
    @media (max-width: 1024px) {
      /* Force collapse on tablet */
      .sidebar { width: 64px !important; }
      .logo-text, .nav-item span:not(.nav-icon):not(.sidebar-badge), .ws-name, .section-header span:not(.icon-btn), .dark-toggle span:not(.nav-icon) { display: none !important; }
      .collapse-btn { display: none !important; }
      .ws-avatar { margin: 0 auto; }
      .sidebar-badge { position: absolute; top: 0; right: 0; margin: 0; }
      .nav-item { position: relative; justify-content: center; }
      .user-name { display: none; }
    }
    
    @media (max-width: 768px) {
      /* Mobile optimizations */
      .topbar { padding: 0 16px; }
      .page-content { padding: 16px; }
      
      /* Option 1: Mobile Bottom Nav (Requires HTML rewrite) 
         Option 2: Sidebar becomes bottom nav using CSS only */
      .shell { flex-direction: column; }
      .sidebar { 
        width: 100% !important; 
        height: 60px; 
        flex-direction: row; 
        border-right: none; 
        border-top: 1px solid var(--border); 
        order: 3; /* Move to bottom */
        overflow: visible;
      }
      .sidebar-header, .sidebar-section, .sidebar-footer { display: none; }
      .sidebar-nav { 
        display: flex; 
        flex-direction: row; 
        width: 100%; 
        justify-content: space-around; 
        padding: 0; 
      }
      .nav-item { 
        width: auto; 
        padding: 16px; 
        border-radius: 0;
      }
      .main-area { order: 1; }
    }
  `]
})
export class ShellComponent implements OnInit, OnDestroy {
  currentUser!: Signal<import('../../core/models/user.model').User | null>;
  userInitial: () => string;
  workspaces = signal<Workspace[]>([]);
  sidebarCollapsed = signal(false);
  darkMode = signal(false);
  showNotifs = signal(false);
  showUserMenu = signal(false);
  showCreateWs = signal(false);
  avatarError = signal(false);
  dropdownNotifications = signal<Notification[]>([]);

  wsName = '';
  wsDesc = '';
  wsVisibility: 'PUBLIC' | 'PRIVATE' = 'PRIVATE';
  docsUrl = `${environment.apiUrl}/swagger-ui.html`;

  constructor(
    private auth: AuthService,
    private wsService: WorkspaceService,
    private dashboardService: DashboardService,
    public notifService: NotificationService,
    private router: Router,
    private cardService: CardService,
    private commentService: CommentService
  ) {
    this.currentUser = this.auth.currentUser;
    this.userInitial = () => {
      const name = this.auth.currentUser()?.fullName;
      return name ? name[0].toUpperCase() : 'U';
    };
    this.loadWorkspaces();
  }

  ngOnInit(): void {
    // Start polling for unread count
    this.notifService.startPolling();
  }

  onLogoClick(): void {
    if (this.sidebarCollapsed()) {
      this.sidebarCollapsed.set(false);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnDestroy(): void {
    this.notifService.stopPolling();
  }

  toggleNotifDropdown(): void {
    const newState = !this.showNotifs();
    this.showNotifs.set(newState);
    this.showUserMenu.set(false);

    if (newState) {
      // Load latest notifications for dropdown (first 5)
      this.notifService.getNotifications(0, 5).subscribe({
        next: page => {
          this.dropdownNotifications.set(page.content);
        },
        error: () => {}
      });
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
      this.notifService.markAsRead(notif.id).subscribe();
      // Optimistically update dropdown
      this.dropdownNotifications.update(list =>
        list.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
      );
    }
    
    navigateFn();
    this.showNotifs.set(false);
  }

  markAllRead(): void {
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.dropdownNotifications.update(list =>
          list.map(n => ({ ...n, isRead: true }))
        );
      }
    });
  }

  loadWorkspaces(): void {
    // Subscribe to the cached stream from DashboardService
    this.dashboardService.workspaces$.subscribe({
      next: ws => this.workspaces.set(ws),
      error: () => {}
    });
  }

  wsColor(name: string): string {
    const colors = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#10b981','#3b82f6'];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  }

  createWorkspace(): void {
    if (!this.wsName.trim()) return;
    this.wsService.createWorkspace({ name: this.wsName, description: this.wsDesc, visibility: this.wsVisibility }).subscribe({
      next: ws => {
        // We only append to local state if we don't want to immediately reload everything,
        // but triggering a reload is safer.
        this.workspaces.update(list => [...list, ws]);
        this.dashboardService.reload(); // Notify dashboard service to refetch and update cache
        this.showCreateWs.set(false);
        this.wsName = ''; this.wsDesc = ''; this.wsVisibility = 'PRIVATE';
        this.router.navigate(['/workspace', ws.workspaceId]);
      },
      error: err => alert(err.error?.message || 'Failed to create workspace')
    });
  }

  logout(): void {
    this.showUserMenu.set(false);
    this.auth.logout().subscribe();
  }
}
