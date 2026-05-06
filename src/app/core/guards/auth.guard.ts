import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

export const authGuard: CanActivateFn = (): Observable<boolean> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // If profile loading has already completed, check immediately
  if (auth.isProfileLoaded()) {
    if (auth.isLoggedIn()) return of(true);
    router.navigate(['/auth/login']);
    return of(false);
  }

  // Profile still loading — wait for it to become true before checking
  return toObservable(auth.isProfileLoaded).pipe(
    filter(loaded => loaded === true),   // wait until loaded is true
    take(1),
    switchMap(() => {
      if (auth.isLoggedIn()) return of(true);
      router.navigate(['/auth/login']);
      return of(false);
    })
  );
};
