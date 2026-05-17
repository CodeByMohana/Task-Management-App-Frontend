import { Injectable, signal, effect } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private static readonly STORAGE_KEY = 'flowboard-dark-mode';
  /** The single source of truth for dark mode across the entire app. */
  readonly darkMode = signal<boolean>(this.loadFromStorage());
  constructor() {
    // Whenever darkMode changes, sync to localStorage + <body> class.
    effect(() => {
      const isDark = this.darkMode();
      this.persistToStorage(isDark);
      this.applyToBody(isDark);
    });
    // Apply immediately on service creation (before first render).
    this.applyToBody(this.darkMode());
  }
  toggle(): void {
    this.darkMode.set(!this.darkMode());
  }
  private loadFromStorage(): boolean {
    try {
      return localStorage.getItem(ThemeService.STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }
  private persistToStorage(isDark: boolean): void {
    try {
      localStorage.setItem(ThemeService.STORAGE_KEY, String(isDark));
    } catch {
      // Storage unavailable (private browsing, etc.) – silently fail.
    }
  }
  private applyToBody(isDark: boolean): void {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }
}
