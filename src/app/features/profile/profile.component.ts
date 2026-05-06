import { Component, OnInit, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ShellComponent } from '../../shared/shell/shell.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ShellComponent],
  template: `
    <app-shell>
      <ng-container topbar-title><h2 class="page-title">Profile Settings</h2></ng-container>
      <div class="profile-page">
        <div class="profile-card">
          <div class="profile-avatar-section">
          <div class="avatar-circle" [class.has-image]="user()?.avatarUrl">
         @if (user()?.avatarUrl) {
         <img [src]="user()!.avatarUrl" [alt]="user()!.fullName" (error)="avatarError.set(true)" />
  }
  @if (!user()?.avatarUrl || avatarError()) {
    {{ initial() }}
  }
</div>
            <div>
              <h3>{{ user()?.fullName }}</h3>
              <p class="email">{{ user()?.email }}</p>
              <div class="badge-row">
                <span class="role-badge">{{ user()?.role }}</span>
                <span class="provider-badge" [class.oauth]="user()?.provider !== 'local'">{{ user()?.provider }}</span>
                <span class="status-badge" [class.active]="user()?.active" [class.inactive]="!user()?.active">
                  {{ user()?.active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="form-card">
          <h4>Update Profile</h4>
          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
            <div class="form-row">
              <div class="fg">
                <label>Full Name</label>
                <input type="text" formControlName="fullName" />
              </div>
              <div class="fg">
                <label>Username</label>
                <input type="text" formControlName="username" />
              </div>
            </div>
            <div class="fg">
              <label>Avatar URL</label>
              <input type="text" formControlName="avatarUrl" placeholder="https://example.com/avatar.png" />
            </div>
            @if (profileMsg()) { <div class="alert" [class.success]="profileSuccess()">{{ profileMsg() }}</div> }
            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="profileForm.invalid || saving()">
                {{ saving() ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>

        @if (user()?.provider === 'local' || !user()?.provider) {
          <div class="form-card">
            <h4>Change Password</h4>
            <form [formGroup]="pwForm" (ngSubmit)="changePassword()">
              <div class="fg">
                <label>Current Password</label>
                <input type="password" formControlName="oldPassword" />
              </div>
              <div class="form-row">
                <div class="fg">
                  <label>New Password</label>
                  <input type="password" formControlName="newPassword" />
                </div>
                <div class="fg">
                  <label>Confirm New Password</label>
                  <input type="password" formControlName="confirmNewPassword" />
                </div>
              </div>
              @if (pwMismatch()) { <div class="alert">New passwords don't match</div> }
              @if (pwMsg()) { <div class="alert" [class.success]="pwSuccess()">{{ pwMsg() }}</div> }
              <div class="form-actions">
                <button type="submit" class="btn-primary" [disabled]="pwForm.invalid || changingPw() || pwMismatch()">
                  {{ changingPw() ? 'Updating...' : 'Change Password' }}
                </button>
              </div>
            </form>
          </div>
        }

        <!-- Account Danger Zone -->
        <div class="form-card danger-card">
          <h4>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="vertical-align: middle; margin-right: 4px; margin-top: -2px;">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Danger Zone
          </h4>
          <p class="danger-desc">Deactivating your account will log you out and prevent future logins. This action is reversible only by an admin.</p>
          @if (deactivateMsg()) { <div class="alert" [class.success]="false">{{ deactivateMsg() }}</div> }
          <div class="form-actions">
            <button class="btn-danger" (click)="deactivateAccount()" [disabled]="deactivating()">
              {{ deactivating() ? 'Deactivating...' : 'Deactivate My Account' }}
            </button>
          </div>
        </div>
      </div>
    </app-shell>
  `,
  styles: [`
    .page-title { margin: 0; font-size: 18px; font-weight: 600; }
    .profile-page { max-width: 700px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .profile-card, .form-card { background: var(--card-bg,#fff); border: 1px solid var(--border,#e5e7eb); border-radius: 14px; padding: 28px; }
    .profile-avatar-section { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px; }
    .avatar-circle { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg,#6366f1,#8b5cf6); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 32px; font-weight: 700; flex-shrink: 0; }
    .avatar-circle.has-image { padding: 0; overflow: hidden; }
    .avatar-circle img { width: 100%; height: 100%; object-fit: cover; }
    .profile-avatar-section h3 { margin: 0 0 4px; font-size: 22px; }
    .email { margin: 0 0 12px; color: var(--text-muted,#6b7280); font-size: 14px; }
    .badge-row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
    .role-badge { background: rgba(99,102,241,0.1); color: #6366f1; font-size: 12px; padding: 3px 10px; border-radius: 20px; font-weight: 600; }
    .provider-badge { background: rgba(107,114,128,0.1); color: #6b7280; font-size: 12px; padding: 3px 10px; border-radius: 20px; font-weight: 600; }
    .provider-badge.oauth { background: rgba(245,158,11,0.1); color: #f59e0b; }
    .status-badge { font-size: 12px; padding: 3px 10px; border-radius: 20px; font-weight: 600; }
    .status-badge.active { background: rgba(16,185,129,0.1); color: #10b981; }
    .status-badge.inactive { background: rgba(239,68,68,0.1); color: #ef4444; }
    h4 { margin: 0 0 20px; font-size: 16px; text-align: center; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .fg { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 13px; font-weight: 500; color: var(--text-muted,#6b7280); }
    input { background: var(--input-bg,#f9fafb); border: 1px solid var(--border,#e5e7eb); border-radius: 8px; padding: 10px 14px; font-size: 14px; color: var(--text,#111827); transition: border-color 0.2s; box-sizing: border-box; }
    input:focus { outline: none; border-color: var(--accent,#6366f1); }
    .form-actions { display: flex; justify-content: center; margin-top: 12px; }
    .btn-primary { padding: 10px 24px; background: var(--accent,#6366f1); color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .alert { padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; text-align: center; }
    .alert.success { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.3); color: #10b981; }

    /* Danger zone */
    .danger-card { border-color: rgba(239,68,68,0.3); text-align: center; }
    .danger-desc { color: var(--text-muted,#6b7280); font-size: 13px; margin: 0 0 16px; line-height: 1.5; text-align: center; }
    .btn-danger { padding: 10px 24px; background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .btn-danger:hover:not(:disabled) { background: rgba(239,68,68,0.2); }
    .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

    @media (max-width: 480px) { .form-row { grid-template-columns: 1fr; } }
  `]
})
export class ProfileComponent implements OnInit {
  user!: Signal<import('../../core/models/user.model').User | null>;
  saving = signal(false);
  changingPw = signal(false);
  deactivating = signal(false);
  profileMsg = signal('');
  profileSuccess = signal(false);
  pwMsg = signal('');
  pwSuccess = signal(false);
  deactivateMsg = signal('');

  profileForm!: ReturnType<FormBuilder['group']>;
  pwForm!: ReturnType<FormBuilder['group']>;

  initial = () => this.auth.currentUser()?.fullName?.[0]?.toUpperCase() ?? 'U';
  pwMismatch = () => {
    const pw = this.pwForm?.get('newPassword')?.value;
    const confirm = this.pwForm?.get('confirmNewPassword')?.value;
    return pw && confirm && pw !== confirm;
  };

  constructor(private auth: AuthService, private fb: FormBuilder) {
    this.user = this.auth.currentUser;
    this.profileForm = this.fb.group({
      fullName: ['', Validators.required],
      username: ['', [Validators.required, Validators.minLength(3)]],
      avatarUrl: ['']
    });
    this.pwForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmNewPassword: ['', Validators.required]
    });
  }

  // Add this signal in the component class:
avatarError = signal(false);

// Add this method to reset error when URL changes:
ngOnInit(): void {
  const u = this.auth.currentUser();
  if (u) {
    this.profileForm.patchValue({
      fullName: u.fullName,
      username: u.username,
      avatarUrl: u.avatarUrl || ''
    });
  }
  
  // Reset avatar error when URL changes
  this.profileForm.get('avatarUrl')?.valueChanges.subscribe(() => {
    this.avatarError.set(false);
  });
}



  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.saving.set(true);
    const { fullName, username, avatarUrl } = this.profileForm.value;
    this.auth.updateProfile({
      fullName: fullName || undefined,
      username: username || undefined,
      avatarUrl: avatarUrl || undefined
    }).subscribe({
      next: () => { this.saving.set(false); this.profileMsg.set('Profile updated!'); this.profileSuccess.set(true); setTimeout(() => this.profileMsg.set(''), 3000); },
      error: (e) => { this.saving.set(false); this.profileMsg.set(e.error?.message || 'Update failed'); this.profileSuccess.set(false); }
    });
  }

  changePassword(): void {
    if (this.pwForm.invalid || this.pwMismatch()) return;
    this.changingPw.set(true);
    const { oldPassword, newPassword } = this.pwForm.value;
    // Only send oldPassword + newPassword — backend doesn't expect confirmNewPassword
    this.auth.changePassword({ oldPassword, newPassword }).subscribe({
      next: () => { this.changingPw.set(false); this.pwMsg.set('Password changed!'); this.pwSuccess.set(true); this.pwForm.reset(); setTimeout(() => this.pwMsg.set(''), 3000); },
      error: (e) => { this.changingPw.set(false); this.pwMsg.set(e.error?.message || 'Failed to change password'); this.pwSuccess.set(false); }
    });
  }

  deactivateAccount(): void {
    if (!confirm('Are you sure you want to deactivate your account? You will be logged out and unable to log in again until an admin reactivates your account.')) return;
    this.deactivating.set(true);
    this.auth.deactivateAccount().subscribe({
      error: (e) => {
        this.deactivating.set(false);
        this.deactivateMsg.set(e.error?.message || 'Failed to deactivate account');
      }
    });
  }
  
}
