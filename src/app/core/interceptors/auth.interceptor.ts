import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<boolean>(false);

  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Always send cookies (JWT in HttpOnly cookie)
    const authReq = req.clone({ withCredentials: true });

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !req.url.includes('/api/auth/')) {
          return this.handle401(authReq, next);
        }
        return throwError(() => err);
      })
    );
  }

  private handle401(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter(result => result),
        take(1),
        switchMap(() => next.handle(req))
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(false);

    return next.handle(this.makeRefreshCall(req)).pipe(
      switchMap(() => {
        this.isRefreshing = false;
        this.refreshTokenSubject.next(true);
        return next.handle(req);
      }),
      catchError(err => {
        this.isRefreshing = false;
        this.router.navigate(['/auth/login']);
        return throwError(() => err);
      })
    );
  }

  private makeRefreshCall(originalReq: HttpRequest<any>): HttpRequest<any> {
    return originalReq.clone({
      url: originalReq.url.replace(/\/api\/.*/, '/api/auth/refresh'),
      method: 'POST',
      body: null,
      withCredentials: true
    });
  }
}
