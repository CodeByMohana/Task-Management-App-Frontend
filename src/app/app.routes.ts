import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  // Landing page after Google / GitHub OAuth2 — backend sets httpOnly cookies and redirects here
  {
    path: 'oauth2/redirect',
    loadComponent: () => import('./features/auth/oauth2-redirect/oauth2-redirect.component').then(m => m.OAuth2RedirectComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent)
  },
  {
    path: 'workspace/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/workspace/workspace.component').then(m => m.WorkspaceComponent)
  },
  {
    path: 'board/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/board/board.component').then(m => m.BoardComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent)
  },
  { path: '**', redirectTo: '/dashboard' }
];

