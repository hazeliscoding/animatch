import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HistoryStore } from '../api/history-store';
import { PairStore } from '../api/pair-store';
import { DEMO_COMPARISON } from '../data/demo-comparison';
import { ComparisonView, buildComparison } from '../logic/comparison-engine';
import { HkBreadcrumbs } from '../ui/breadcrumbs';
import { HkButton } from '../ui/button';
import { HkDataTable, TableColumn } from '../ui/data-table';
import { HkModule } from '../ui/module';

@Component({
  selector: 'app-compare-page',
  imports: [FormsModule, HkBreadcrumbs, HkButton, HkDataTable, HkModule],
  templateUrl: './compare-page.html',
  styleUrl: './compare-page.css',
})
export class ComparePage {
  private readonly pairStore = inject(PairStore);
  readonly history = inject(HistoryStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly view = signal<ComparisonView>(DEMO_COMPARISON);
  readonly live = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly editing = signal(false);

  nameA = '';
  nameB = '';

  readonly sharedCols = computed<TableColumn[]>(() => [
    { key: 'title', label: 'Title' },
    { key: 'a', label: this.view().userA.name, align: 'right', sortable: true },
    { key: 'b', label: this.view().userB.name, align: 'right', sortable: true },
    { key: 'd', label: 'Δ', align: 'right', sortable: true },
  ]);

  readonly crumbs = computed(() => [
    { label: 'Home', path: '/compare' },
    { label: 'Compare', path: '/compare' },
    { label: `${this.view().userA.name} × ${this.view().userB.name}` },
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
          this.view().userA.name.toLowerCase() === a.toLowerCase() &&
          this.view().userB.name.toLowerCase() === b.toLowerCase();
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
      this.history.recordComparison(listA.name, listB.name, this.view().compatScore);
      this.live.set(true);
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
