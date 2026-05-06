import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-oauth2-redirect',
  standalone: true,
  template: `
    <div style="
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
      color: #fff;
      font-family: 'Inter', sans-serif;
    ">
      <div style="font-size: 48px; margin-bottom: 16px;">⚡</div>
      <h2 style="margin: 0 0 8px; font-size: 22px;">Signing you in...</h2>
      <p style="color: rgba(255,255,255,0.5); font-size: 14px;">Please wait while we set up your session.</p>
    </div>
  `
})
export class OAuth2RedirectComponent implements OnInit {
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // The backend already set httpOnly cookies (accessToken, refreshToken).
    // Fetch the profile to hydrate the auth state signals, then go to dashboard.
    this.auth.getProfile().subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => this.router.navigate(['/auth/login'])
    });
  }
}

