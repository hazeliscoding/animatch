import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'animatch.theme';

/**
 * Sun/moon theming: system preference by default, explicit choice wins and
 * persists. The index.html bootstrap script stamps data-theme before first
 * paint; this service takes over from there.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.resolveInitial());

  constructor() {
    this.apply(this.theme());
    // follow OS changes only while the user hasn't chosen explicitly
    if (typeof matchMedia === 'function') {
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(THEME_KEY)) {
          this.theme.set(e.matches ? 'dark' : 'light');
          this.apply(this.theme());
        }
      });
    }
  }

  private resolveInitial(): Theme {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    const stamped = document.documentElement.dataset['theme'];
    if (stamped === 'dark' || stamped === 'light') return stamped;
    if (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  toggle() {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    localStorage.setItem(THEME_KEY, next);
    this.apply(next);
  }

  private apply(theme: Theme) {
    document.documentElement.dataset['theme'] = theme;
  }
}
