import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SAMPLE_PAIR } from '../anilist.config';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HistoryStore } from '../api/history-store';
import { PairStore } from '../api/pair-store';
import { ComparisonView, buildComparison } from '../logic/comparison-engine';
import { HkBreadcrumbs } from '../ui/breadcrumbs';
import { HkButton } from '../ui/button';
import { HkDataTable, TableColumn } from '../ui/data-table';
import { HkGenreRadar } from '../ui/genre-radar';
import { HkModule } from '../ui/module';

@Component({
  selector: 'app-compare-page',
  imports: [FormsModule, RouterLink, HkBreadcrumbs, HkButton, HkDataTable, HkGenreRadar, HkModule],
  templateUrl: './compare-page.html',
  styleUrl: './compare-page.css',
})
export class ComparePage {
  private readonly pairStore = inject(PairStore);
  readonly history = inject(HistoryStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly view = signal<ComparisonView | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly editing = signal(false);
  readonly genreView = signal<'bars' | 'radar'>('bars');

  nameA = '';
  nameB = '';
  readonly samplePair = SAMPLE_PAIR;

  readonly live = computed(() => this.view() !== null);

  readonly sharedCols = computed<TableColumn[]>(() => [
    { key: 'title', label: 'Title' },
    { key: 'a', label: this.view()?.userA.name ?? 'User A', align: 'right', sortable: true },
    { key: 'b', label: this.view()?.userB.name ?? 'User B', align: 'right', sortable: true },
    { key: 'd', label: 'Δ', align: 'right', sortable: true },
  ]);

  readonly crumbs = computed(() => [
    { label: 'Home', path: '/' },
    { label: 'Compare', path: '/compare' },
    ...(this.view() ? [{ label: `${this.view()!.userA.name} × ${this.view()!.userB.name}` }] : []),
  ]);

  constructor() {
    // React to param changes too — the header user search navigates to
    // /compare with new params while this page may already be active.
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((qp) => {
      const a = qp.get('a');
      const b = qp.get('b');
      if (a && b) {
        const alreadyLoaded =
          this.live() &&
          this.view()!.userA.name.toLowerCase() === a.toLowerCase() &&
          this.view()!.userB.name.toLowerCase() === b.toLowerCase();
        if (!alreadyLoaded) {
          this.nameA = a;
          this.nameB = b;
          void this.compare();
        }
      } else if (a) {
        this.nameA = a;
        this.editing.set(true);
      }
    });
  }

  loadSample() {
    this.nameA = SAMPLE_PAIR.a;
    this.nameB = SAMPLE_PAIR.b;
    void this.compare();
  }

  showPicker() {
    return this.editing() || !this.live();
  }

  async compare() {
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
      const [listA, listB] = await this.pairStore.load(a, b);
      this.view.set(buildComparison(listA, listB));
      this.history.recordComparison(listA.name, listB.name, this.view()!.compatScore);
      this.editing.set(false);
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { a: listA.name, b: listB.name },
        queryParamsHandling: 'merge',
      });
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Comparison failed.');
    } finally {
      this.loading.set(false);
    }
  }
}
