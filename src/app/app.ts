import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { HkGlobalHeader } from './ui/global-header';
import { HkGlobalNav } from './ui/global-nav';
import { HkSearchInput } from './ui/search-input';
import { HkUtilityBar } from './ui/utility-bar';
import { NAV_ITEMS, UTIL_LEFT, UTIL_RIGHT } from './data/animatch-data';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, HkGlobalHeader, HkGlobalNav, HkSearchInput, HkUtilityBar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);

  readonly utilLeft = UTIL_LEFT;
  readonly utilRight = UTIL_RIGHT;
  readonly navItems = NAV_ITEMS;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly activeNav = computed(() => {
    const url = this.url();
    if (url.startsWith('/backlog')) return 'Shared backlog';
    if (url.startsWith('/groups')) return 'Groups';
    return 'Compare';
  });

  readonly mobileNav = [
    { label: 'Compare', glyph: '⇄', path: '/compare' },
    { label: 'Backlog', glyph: '≡', path: '/backlog' },
    { label: 'Groups', glyph: '⌂', path: '/groups' },
    { label: 'Profile', glyph: '○', path: null },
  ];
}
