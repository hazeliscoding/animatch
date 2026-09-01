import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SAMPLE_PAIR } from '../anilist.config';
import { AnilistService } from '../api/anilist.service';
import { PairStore } from '../api/pair-store';
import { RecommendationView, buildRecommendations, fmtRec } from '../logic/recommendation-engine';
import { HkBreadcrumbs } from '../ui/breadcrumbs';
import { HkButton } from '../ui/button';
import { HkModule } from '../ui/module';

@Component({
  selector: 'app-recommendations-page',
  imports: [FormsModule, HkBreadcrumbs, HkButton, HkModule],
  templateUrl: './recommendations-page.html',
  styleUrl: './recommendations-page.css',
})
export class RecommendationsPage {
  private readonly anilist = inject(AnilistService);
  private readonly pairStore = inject(PairStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly recs = signal<RecommendationView[] | null>(null);
  readonly pairNames = signal<{ a: string; b: string } | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  nameA = '';
  nameB = '';
  readonly samplePair = SAMPLE_PAIR;

  readonly live = computed(() => this.recs() !== null);
  readonly subtitle = computed(() => {
    const p = this.pairNames();
    return p ? `${p.a} × ${p.b}` : '';
  });

  readonly crumbs = [
    { label: 'Home', path: '/' },
    { label: 'Recommendations' },
  ];

  readonly fmt = fmtRec;

  constructor() {
    const qp = this.route.snapshot.queryParamMap;
    const a = qp.get('a');
    const b = qp.get('b');
    if (a && b) {
      this.nameA = a;
      this.nameB = b;
      void this.load();
    }
  }

  loadSample() {
    this.nameA = SAMPLE_PAIR.a;
    this.nameB = SAMPLE_PAIR.b;
    void this.load();
  }

  async load() {
    if (this.loading()) return;
    const a = this.nameA.trim();
    const b = this.nameB.trim();
    if (!a || !b) {
      this.error.set('Enter two AniList usernames.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      const [[listA, listB], candidates] = await Promise.all([
        this.pairStore.load(a, b),
        this.anilist.getTopMedia(),
      ]);
      this.recs.set(buildRecommendations(listA, listB, candidates));
      this.pairNames.set({ a: listA.name, b: listB.name });
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { a: listA.name, b: listB.name },
        queryParamsHandling: 'merge',
      });
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Loading recommendations failed.');
    } finally {
      this.loading.set(false);
    }
  }
}
