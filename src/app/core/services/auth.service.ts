import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User, LoginRequest, RegisterRequest, UpdateProfileRequest, ChangePasswordRequest, AdminDeactivateResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiUrl}/api/auth`;

  // Angular Signals for reactive state
  private _currentUser = signal<User | null>(null);
  private _profileLoaded = signal(false);

  currentUser = this._currentUser.asReadonly();
  isProfileLoaded = this._profileLoaded.asReadonly();
  isLoggedIn = computed(() => this._currentUser() !== null);

  constructor(private http: HttpClient, private router: Router) {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.http.get<User>(`${this.base}/profile`, { withCredentials: true }).subscribe({
      next: user => {
        this._currentUser.set(user);
        this._profileLoaded.set(true);
      },
      error: () => {
        this._currentUser.set(null);
        this._profileLoaded.set(true);
      }
    });
  }

  login(req: LoginRequest): Observable<User> {
    return this.http.post<User>(`${this.base}/login`, req, { withCredentials: true }).pipe(
      tap(user => {
        this._currentUser.set(user);
        this._profileLoaded.set(true);
      })
    );
  }

  register(req: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${this.base}/register`, req, { withCredentials: true });
  }

  sendOtp(req: { email: string; type: string }): Observable<void> {
    return this.http.post<void>(`${this.base}/send-otp`, req, { withCredentials: true });
  }

  resetPassword(req: any): Observable<void> {
    return this.http.post<void>(`${this.base}/forgot-password/reset`, req, { withCredentials: true });
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this._currentUser.set(null);
        this.router.navigate(['/auth/login']);
      })
    );
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.base}/profile`, { withCredentials: true }).pipe(
      tap(user => this._currentUser.set(user))
    );
  }

  updateProfile(req: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.base}/profile`, req, { withCredentials: true }).pipe(
      tap(user => this.loadProfile())
    );
  }

  changePassword(req: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/change-password`, req, { withCredentials: true });
  }

  deactivateAccount(): Observable<void> {
    return this.http.delete<void>(`${this.base}/account`, { withCredentials: true }).pipe(
      tap(() => {
        this._currentUser.set(null);
        this.router.navigate(['/auth/login']);
      })
    );
  }

  adminDeactivateUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/users/${userId}`, { withCredentials: true });
  }

  adminActivateUser(userId: number): Observable<User> {
    return this.http.put<User>(`${this.base}/admin/users/${userId}/activate`, {}, { withCredentials: true });
  }

  searchUsers(query: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users/search`, {
      params: { query },
      withCredentials: true
    });
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/admin/users`, { withCredentials: true });
  }
}
