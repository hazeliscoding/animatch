import { Component, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AnilistService, AnilistUserHit } from './api/anilist.service';
import { AuthService } from './api/auth.service';
import { SeoService } from './seo.service';
import { HkGlobalHeader } from './ui/global-header';
import { HkGlobalNav } from './ui/global-nav';
import { HkSearchInput } from './ui/search-input';
import { HkUtilityBar, UtilityItem } from './ui/utility-bar';
import { NAV_ITEMS, UTIL_LEFT } from './data/animatch-data';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, HkGlobalHeader, HkGlobalNav, HkSearchInput, HkUtilityBar],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: { '(document:click)': 'onDocumentClick($event)' },
})
export class App {
  private readonly router = inject(Router);
  private readonly anilist = inject(AnilistService);
  readonly auth = inject(AuthService);

  readonly utilLeft = UTIL_LEFT;
  readonly navItems = NAV_ITEMS;

  readonly viewer = this.auth.viewer;

  readonly utilRight = computed<UtilityItem[]>(() =>
    this.auth.connected()
      ? [
          { label: this.viewer() ? `Signed in as ${this.viewer()!.name}` : 'My profile', action: 'profile' },
          { label: 'Log out', action: 'logout' },
        ]
      : [{ label: 'Connect AniList', action: 'connect' }],
  );

  readonly searchResults = signal<AnilistUserHit[]>([]);
  readonly searchOpen = signal(false);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private searchSeq = 0;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly activeNav = computed(() => {
    const url = this.url();
    if (url.startsWith('/compare')) return 'Compare';
    if (url.startsWith('/backlog')) return 'Shared backlog';
    if (url.startsWith('/groups')) return 'Groups';
    if (url.startsWith('/recommendations')) return 'Recommendations';
    if (url.startsWith('/profile')) return 'My profile';
    return '';
  });

  readonly mobileNav = [
    { label: 'Compare', glyph: '⇄', path: '/compare' },
    { label: 'Backlog', glyph: '≡', path: '/backlog' },
    { label: 'Groups', glyph: '⌂', path: '/groups' },
    { label: 'Recs', glyph: '★', path: '/recommendations' },
    { label: 'Profile', glyph: '○', path: '/profile' },
  ];

  constructor() {
    inject(SeoService).init();
    effect(() => {
      const token = this.auth.token();
      if (!token) {
        this.auth.viewer.set(null);
        return;
      }
      void this.anilist
        .getViewer(token)
        .then((v) => this.auth.viewer.set(v))
        .catch(() => this.auth.logout());
    });
  }

  onUtilAction(action: string) {
    if (action === 'connect') {
      if (!this.auth.login()) void this.router.navigate(['/profile']);
    } else if (action === 'profile') {
      void this.router.navigate(['/profile']);
    } else if (action === 'logout') {
      this.auth.logout();
    }
  }

  onSearchQuery(q: string) {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    const query = q.trim();
    if (query.length < 2) {
      this.searchSeq++;
      this.searchOpen.set(false);
      this.searchResults.set([]);
      return;
    }
    this.searchTimer = setTimeout(() => void this.runSearch(query), 300);
  }

  onSearchSubmit(q: string) {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    const query = q.trim();
    if (query.length >= 2) void this.runSearch(query);
  }

  private async runSearch(query: string) {
    const seq = ++this.searchSeq;
    try {
      const hits = await this.anilist.searchUsers(query);
      if (seq !== this.searchSeq) return;
      this.searchResults.set(hits);
      this.searchOpen.set(true);
    } catch {
      // network hiccup — keep the dropdown closed rather than surface an error here
      if (seq === this.searchSeq) this.searchOpen.set(false);
    }
  }

  pickUser(name: string) {
    this.searchOpen.set(false);
    const params = this.router.parseUrl(this.router.url).queryParams;
    let a = params['a'] as string | undefined;
    let b = params['b'] as string | undefined;
    if (!a) {
      a = name;
    } else if (!b && a.toLowerCase() !== name.toLowerCase()) {
      b = name;
    } else {
      a = name;
      b = undefined;
    }
    void this.router.navigate(['/compare'], { queryParams: { a, b: b ?? null } });
  }

  onDocumentClick(event: Event) {
    if (!this.searchOpen()) return;
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.search-wrap')) this.searchOpen.set(false);
  }

  /** Keyboard support for the search dropdown: arrows rove, Escape closes. */
  onSearchKeydown(event: KeyboardEvent) {
    const wrap = event.currentTarget as HTMLElement;
    if (event.key === 'Escape') {
      this.searchOpen.set(false);
      wrap.querySelector('input')?.focus();
      return;
    }
    if (!this.searchOpen() || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return;
    event.preventDefault();
    const options = [...wrap.querySelectorAll<HTMLButtonElement>('.result:not(.none)')];
    if (!options.length) return;
    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'ArrowDown') {
      options[Math.min(current + 1, options.length - 1)].focus();
    } else if (current <= 0) {
      wrap.querySelector('input')?.focus();
    } else {
      options[current - 1].focus();
    }
  }

  onSearchFocusout(event: FocusEvent) {
    const wrap = event.currentTarget as HTMLElement;
    if (!wrap.contains(event.relatedTarget as Node | null)) this.searchOpen.set(false);
  }
}
