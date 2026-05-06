import { Component, OnInit, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShellComponent } from '../../shared/shell/shell.component';
import { WorkspaceService } from '../../core/services/workspace.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { Workspace } from '../../core/models/workspace.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ShellComponent],
  template: `
    <app-shell>
      <ng-container topbar-title>
        <h2 class="page-title">Dashboard</h2>
      </ng-container>

      <div class="dashboard">
        <!-- Hero -->
        <div class="hero-section">
          <div class="hero-content">
            <h1>Welcome back, {{ firstName() }}</h1>
            <p>You have {{ workspaces().length }} workspace{{ workspaces().length !== 1 ? 's' : '' }}. Ready to get things done?</p>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ workspaces().length }}</span>
              <span class="stat-label">Workspaces</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="8" y1="7" x2="8" y2="17"></line><line x1="16" y1="7" x2="16" y2="13"></line></svg>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ totalBoards() }}</span>
              <span class="stat-label">Boards</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ myCardsCount() }}</span>
              <span class="stat-label">My Cards</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ totalMembers() }}</span>
              <span class="stat-label">Collaborators</span>
            </div>
          </div>
        </div>

        <!-- Workspaces -->
        <div class="section">
          <div class="section-header">
            <h3>Your Workspaces</h3>
          </div>

          @if (loading()) {
            <div class="loading-grid">
              @for (_ of [1,2,3]; track $index) {
                <div class="skeleton-card"></div>
              }
            </div>
          } @else if (workspaces().length === 0) {
            <div class="empty-state">
              <div class="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="48" height="48"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
              </div>
              <h4>No workspaces yet</h4>
              <p>Create a workspace to start organizing your team's work</p>
            </div>
          } @else {
            <div class="ws-grid">
              @for (ws of workspaces(); track ws.workspaceId) {
                <a [routerLink]="['/workspace', ws.workspaceId]" class="ws-card">
                  <div class="ws-card-accent" [style.background]="wsGradient(ws.name)"></div>
                  <div class="ws-card-content">
                    <div class="ws-card-header">
                      <span class="ws-card-icon">{{ ws.name[0].toUpperCase() }}</span>
                      <h4>{{ ws.name }}</h4>
                      <span class="ws-badge">{{ ws.visibility }}</span>
                    </div>
                    <p class="ws-card-desc">{{ ws.description || 'No description provided.' }}</p>
                    <div class="ws-card-footer">
                      <span style="display:flex;align-items:center;gap:6px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> {{ ws.memberCount }} member{{ ws.memberCount !== 1 ? 's' : '' }}</span>
                      <span>{{ ws.createdAt | date:'MMM d, y' }}</span>
                    </div>
                  </div>
                </a>
              }
            </div>
          }
        </div>
      </div>
    </app-shell>
  `,
  styles: [`
    .dashboard {
      max-width: 1400px;
      margin: 0 auto;
      padding-bottom: 40px;
    }

    /* Page Title */
    .page-title {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      letter-spacing: -0.01em;
    }

    /* Hero Section */
    .hero-section {
      padding: 32px 0 40px;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }
    .hero-content h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px;
      color: var(--text);
      letter-spacing: -0.02em;
    }
    .hero-content p {
      margin: 0;
      font-size: 16px;
      color: var(--text-muted);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 24px;
      margin-top: 32px;
      margin-bottom: 48px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .stat-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
      border-color: var(--text-muted);
    }
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }
    .stat-icon.blue { background: rgba(59,130,246,0.1); color: #2563eb; }
    .stat-icon.purple { background: rgba(139,92,246,0.1); color: #7c3aed; }
    .stat-icon.green { background: rgba(16,185,129,0.1); color: #059669; }
    .stat-icon.orange { background: rgba(245,158,11,0.1); color: #d97706; }
    .stat-body {
      display: flex;
      flex-direction: column;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      line-height: 1.2;
      color: var(--text);
    }
    .stat-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-muted);
    }

    /* Section Headers */
    .section {
      margin-bottom: 40px;
    }
    .section-header {
      margin-bottom: 24px;
    }
    .section-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: var(--text);
    }

    /* Workspace Grid */
    .ws-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
    }
    .ws-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }
    .ws-card:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-4px);
      border-color: var(--accent);
    }
    .ws-card-accent {
      height: 4px;
      width: 100%;
      opacity: 0.8;
    }
    .ws-card-content {
      padding: 24px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .ws-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      position: relative;
    }
    .ws-card-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--hover);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
    }
    .ws-card-header h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: var(--text);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ws-badge {
      background: var(--hover);
      color: var(--text-muted);
      border: 1px solid var(--border);
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .ws-card-desc {
      margin: 0 0 24px;
      font-size: 14px;
      color: var(--text-muted);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1;
    }
    .ws-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-muted);
      padding-top: 16px;
      border-top: 1px solid var(--hover);
    }

    /* Skeletons */
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
    }
    .skeleton-card {
      height: 180px;
      background: linear-gradient(90deg, var(--card-bg) 25%, var(--hover) 50%, var(--card-bg) 75%);
      background-size: 400% 100%;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      animation: shimmer 1.5s infinite ease-in-out;
    }
    @keyframes shimmer {
      0% { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 64px 24px;
      background: var(--card-bg);
      border: 1px dashed var(--border);
      border-radius: var(--radius-lg);
    }
    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.8;
    }
    .empty-state h4 {
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 8px;
      color: var(--text);
    }
    .empty-state p {
      color: var(--text-muted);
      margin: 0;
      font-size: 15px;
    }

    /* Breakpoints */
    @media (max-width: 1024px) {
      .hero-content h1 { font-size: 24px; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
    }
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: 1fr; gap: 16px; }
      .ws-grid { grid-template-columns: 1fr; }
      .hero-section { padding: 24px 0; }
      .stat-card { padding: 16px 20px; }
      .ws-card-content { padding: 20px; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser!: Signal<import('../../core/models/user.model').User | null>;
  firstName: () => string;
  workspaces = signal<Workspace[]>([]);
  loading = signal(true);
  totalBoards = signal(0);
  totalMembers = signal(0);
  myCardsCount = signal(0);

  constructor(
    private auth: AuthService,
    private dashboardService: DashboardService
  ) {
    this.currentUser = this.auth.currentUser;
    this.firstName = () => this.auth.currentUser()?.fullName?.split(' ')[0] ?? 'there';
  }

  ngOnInit(): void {
    // Subscribe to the centralized and cached dashboard data stream
    this.dashboardService.dashboardData$.subscribe({
      next: data => {
        this.workspaces.set(data.workspaces);
        this.totalBoards.set(data.totalBoards);
        this.totalMembers.set(data.totalMembers);
        this.myCardsCount.set(data.myCardsCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  wsGradient(name: string): string {
    const gradients = [
      'linear-gradient(135deg, #6366f1, #8b5cf6)',
      'linear-gradient(135deg, #ec4899, #f43f5e)',
      'linear-gradient(135deg, #14b8a6, #06b6d4)',
      'linear-gradient(135deg, #f59e0b, #f97316)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #3b82f6, #6366f1)',
    ];
    return gradients[name.charCodeAt(0) % gradients.length];
  }
}
