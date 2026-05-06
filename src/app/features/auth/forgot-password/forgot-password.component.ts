import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const pw = control.get('newPassword');
  const confirm = control.get('confirmPassword');
  return pw && confirm && pw.value !== confirm.value ? { mismatch: true } : null;
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="logo-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="48" height="48"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg></div>
          <h1>FlowBoard</h1>
          <p>Reset your password</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          @if (step() === 1) {
            <div class="form-group">
              <label for="email">Email</label>
              <input id="email" type="email" formControlName="email" placeholder="you@example.com"
                [class.error]="f['email'].invalid && f['email'].touched" />
              @if (f['email'].invalid && f['email'].touched) {
                <span class="error-msg">Valid email required</span>
              }
            </div>
            
            <button type="button" class="btn-primary" [disabled]="loading()" (click)="requestOtp()">
              @if (loading()) { <span class="spinner"></span> }
              {{ loading() ? 'Sending OTP...' : 'Send OTP' }}
            </button>
          } @else {
            <div class="form-group">
              <label for="otp">Verification OTP</label>
              <input id="otp" type="text" formControlName="otp" placeholder="Enter 6-digit OTP"
                [class.error]="f['otp'].invalid && f['otp'].touched" />
              @if (f['otp'].invalid && f['otp'].touched) {
                <span class="error-msg">OTP is required</span>
              }
              <p style="font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 8px;">
                OTP sent to {{ f['email'].value }}
              </p>
            </div>
            
            <div class="form-group">
              <label for="newPassword">New Password</label>
              <input id="newPassword" type="password" formControlName="newPassword" placeholder="Min 8 chars"
                [class.error]="f['newPassword'].invalid && f['newPassword'].touched" />
              @if (f['newPassword'].invalid && f['newPassword'].touched) {
                <span class="error-msg">Min 8 characters required</span>
              }
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm New Password</label>
              <input id="confirmPassword" type="password" formControlName="confirmPassword" placeholder="Repeat password"
                [class.error]="form.errors?.['mismatch'] && f['confirmPassword'].touched" />
              @if (form.errors?.['mismatch'] && f['confirmPassword'].touched) {
                <span class="error-msg">Passwords don't match</span>
              }
            </div>
            
            <div style="display: flex; gap: 12px;">
              <button type="button" class="btn-secondary" [disabled]="loading()" (click)="step.set(1)">
                Back
              </button>
              <button type="submit" class="btn-primary" [disabled]="loading()">
                @if (loading()) { <span class="spinner"></span> }
                {{ loading() ? 'Resetting...' : 'Reset Password' }}
              </button>
            </div>
          }

          @if (errorMsg()) {
            <div class="alert-error" style="margin-top: 16px;">{{ errorMsg() }}</div>
          }
          @if (successMsg()) {
            <div class="alert-success" style="margin-top: 16px;">{{ successMsg() }}</div>
          }
        </form>

        <p class="auth-footer">
          Remember your password? <a routerLink="/auth/login">Sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); padding: 20px;
    }
    .auth-card {
      background: rgba(255,255,255,0.05); backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;
      padding: 48px 40px; width: 100%; max-width: 480px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.5);
    }
    .auth-logo { text-align: center; margin-bottom: 36px; }
    .logo-icon { font-size: 48px; margin-bottom: 8px; }
    .auth-logo h1 { color: #fff; font-size: 28px; font-weight: 700; margin: 0; }
    .auth-logo p { color: rgba(255,255,255,0.5); margin: 6px 0 0; font-size: 14px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; margin-bottom: 8px; }
    input {
      width: 100%; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15);
      border-radius: 10px; padding: 12px 16px; color: #fff; font-size: 14px;
      transition: border-color 0.2s; box-sizing: border-box;
    }
    input::placeholder { color: rgba(255,255,255,0.3); }
    input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
    input.error { border-color: #ef4444; }
    .error-msg { color: #ef4444; font-size: 12px; margin-top: 4px; display: block; }
    .alert-error { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4); border-radius: 8px; color: #fca5a5; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
    .alert-success { background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.4); border-radius: 8px; color: #86efac; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
    .btn-primary {
      width: 100%; padding: 13px; background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(99,102,241,0.4); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary {
      width: 100%; padding: 13px; background: rgba(255,255,255,0.1);
      color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center;
    }
    .btn-secondary:hover:not(:disabled) { background: rgba(255,255,255,0.15); }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .auth-footer { text-align: center; color: rgba(255,255,255,0.4); font-size: 13px; margin-top: 20px; }
    .auth-footer a { color: #818cf8; text-decoration: none; font-weight: 500; }
    .auth-footer a:hover { text-decoration: underline; }
    @media (max-width: 480px) { .auth-card { padding: 32px 24px; } }
  `]
})
export class ForgotPasswordComponent {
  form!: ReturnType<FormBuilder['group']>;

  get f() { return this.form.controls; }

  step = signal(1);
  loading = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: [''],
      newPassword: [''],
      confirmPassword: ['']
    }, { validators: passwordMatchValidator });
  }

  requestOtp(): void {
    if (this.f['email'].invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    this.loading.set(true);
    this.errorMsg.set('');
    
    this.auth.sendOtp({ email: this.f['email'].value, type: 'FORGOT_PASSWORD' }).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set(2);
        this.f['otp'].setValidators([Validators.required]);
        this.f['newPassword'].setValidators([Validators.required, Validators.minLength(8)]);
        this.f['confirmPassword'].setValidators([Validators.required]);
        this.f['otp'].updateValueAndValidity();
        this.f['newPassword'].updateValueAndValidity();
        this.f['confirmPassword'].updateValueAndValidity();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Failed to send OTP.');
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.step() === 1) return;
    
    this.loading.set(true);
    this.errorMsg.set('');

    const req = {
      email: this.f['email'].value,
      otp: this.f['otp'].value,
      newPassword: this.f['newPassword'].value
    };
    
    this.auth.resetPassword(req).subscribe({
      next: () => {
        this.successMsg.set('Password reset successful! Redirecting to login...');
        setTimeout(() => this.router.navigate(['/auth/login']), 1500);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Password reset failed. Please try again.');
      }
    });
  }
}
