import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SITE_URL } from './anilist.config';

const DEFAULT_DESCRIPTION =
  'Compare two AniList profiles — scores, genres, and backlogs — to see how compatible your anime taste is and what to watch together. Free, no account needed.';

/** Keeps description/OG/canonical tags in sync with the active route. */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly document = inject(DOCUMENT);

  init() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      let deepest = this.route.snapshot;
      while (deepest.firstChild) deepest = deepest.firstChild;
      const description = (deepest.data['description'] as string | undefined) ?? DEFAULT_DESCRIPTION;
      const url = SITE_URL + e.urlAfterRedirects.split('?')[0];

      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:description', content: description });
      this.meta.updateTag({ property: 'og:url', content: url });
      // Title is applied by Angular's TitleStrategy on the same event; defer one tick.
      setTimeout(() => this.meta.updateTag({ property: 'og:title', content: this.title.getTitle() }));

      let canonical = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!canonical) {
        canonical = this.document.createElement('link');
        canonical.rel = 'canonical';
        this.document.head.appendChild(canonical);
      }
      canonical.href = url;
    });
  }
}
