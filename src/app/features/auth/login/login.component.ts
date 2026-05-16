import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="logo-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="48" height="48"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg></div>
          <h1>FlowBoard</h1>
          <p>Sign in to continue</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="email">Email address</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="you@example.com"
              [class.error]="form.get('email')?.invalid && form.get('email')?.touched"
            />
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <span class="error-msg">Valid email is required</span>
            }
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-wrapper">
              <input
                id="password"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                placeholder="Enter your password"
                [class.error]="form.get('password')?.invalid && form.get('password')?.touched"
              />
              <button type="button" class="toggle-pw" (click)="showPassword.set(!showPassword())">
                @if (showPassword()) {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                } @else {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                }
              </button>
            </div>
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <span class="error-msg">Password is required</span>
            }
          </div>

          @if (errorMsg()) {
            <div class="alert-error">{{ errorMsg() }}</div>
          }

          <button type="submit" class="btn-primary" [disabled]="loading()">
            @if (loading()) { <span class="spinner"></span> }
            {{ loading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="divider"><span>or continue with</span></div>

        <div class="oauth-buttons">
          <a [href]="googleOAuthUrl" class="btn-oauth btn-google">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </a>
          <a [href]="githubOAuthUrl" class="btn-oauth btn-github">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </a>
        </div>

        <p class="auth-footer">
          <a routerLink="/auth/forgot-password">Forgot password?</a><br><br>
          Don't have an account? <a routerLink="/auth/register">Create one</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
      padding: 20px;
    }
    .auth-card {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 48px 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.5);
    }
    .auth-logo { text-align: center; margin-bottom: 36px; }
    .logo-icon { font-size: 48px; margin-bottom: 8px; }
    .auth-logo h1 { color: #fff; font-size: 28px; font-weight: 700; margin: 0; }
    .auth-logo p { color: rgba(255,255,255,0.5); margin: 6px 0 0; font-size: 14px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; margin-bottom: 8px; }
    input {
      width: 100%;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 10px;
      padding: 12px 16px;
      color: #fff;
      font-size: 14px;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    input::placeholder { color: rgba(255,255,255,0.3); }
    input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
    input.error { border-color: #ef4444; }
    .input-wrapper { position: relative; }
    .input-wrapper input { padding-right: 44px; }
    .toggle-pw { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 16px; padding: 0; }
    .error-msg { color: #ef4444; font-size: 12px; margin-top: 4px; display: block; }
    .alert-error { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4); border-radius: 8px; color: #fca5a5; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
    .btn-primary {
      width: 100%; padding: 13px; background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(99,102,241,0.4); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .divider { position: relative; text-align: center; margin: 24px 0; }
    .divider::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; border-top: 1px solid rgba(255,255,255,0.1); }
    .divider span { background: transparent; color: rgba(255,255,255,0.4); font-size: 12px; padding: 0 12px; position: relative; }
    .oauth-buttons { display: flex; gap: 12px; margin-bottom: 24px; }
    .btn-oauth { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 11px; border-radius: 10px; font-size: 13px; font-weight: 500; cursor: pointer; text-decoration: none; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.15); color: #fff; }
    .btn-google { background: rgba(66,133,244,0.1); }
    .btn-google:hover { background: rgba(66,133,244,0.2); border-color: #4285f4; }
    .btn-github { background: rgba(255,255,255,0.05); }
    .btn-github:hover { background: rgba(255,255,255,0.1); }
    .auth-footer { text-align: center; color: rgba(255,255,255,0.4); font-size: 13px; margin: 0; }
    .auth-footer a { color: #818cf8; text-decoration: none; font-weight: 500; }
    .auth-footer a:hover { text-decoration: underline; }
  `]
})
export class LoginComponent {
  form!: ReturnType<FormBuilder['group']>;
  loading = signal(false);
  errorMsg = signal('');
  showPassword = signal(false);

  googleOAuthUrl = `${environment.apiUrl}/oauth2/authorization/google`;
  githubOAuthUrl = `${environment.apiUrl}/oauth2/authorization/github`;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.login(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Invalid email or password');
      }
    });
  }
}
