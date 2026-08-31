import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PairStore } from '../api/pair-store';
import { DEMO_BACKLOG } from '../data/demo-backlog';
import {
  BacklogSort,
  BacklogView,
  buildBacklog,
  fmtPredicted,
  sortBacklogItems,
} from '../logic/backlog-engine';
import { HkBreadcrumbs } from '../ui/breadcrumbs';
import { HkButton } from '../ui/button';
import { HkModule } from '../ui/module';
import { HkTabs, TabItem } from '../ui/tabs';

const VISIBLE_LIMIT = 8;

@Component({
  selector: 'app-backlog-page',
  imports: [FormsModule, HkBreadcrumbs, HkButton, HkModule, HkTabs],
  templateUrl: './backlog-page.html',
  styleUrl: './backlog-page.css',
})
export class BacklogPage {
  private readonly pairStore = inject(PairStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly view = signal<BacklogView | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal('Both plan to watch');
  readonly sort = signal<BacklogSort>('Predicted score');
  readonly showAll = signal(false);
  readonly sorts: BacklogSort[] = ['Predicted score', 'Popularity', 'Year'];

  nameA = '';
  nameB = '';

  readonly live = computed(() => this.view() !== null);
  readonly display = computed(() => this.view() ?? DEMO_BACKLOG);

  readonly tabs = computed<TabItem[]>(() => [
    { label: 'Both plan to watch', count: this.display().bothCount },
    { label: 'Only in one backlog', count: this.display().onlyOneCount },
    { label: 'Watching together', count: this.display().watchingCount },
  ]);

  readonly sortedItems = computed(() => sortBacklogItems(this.display().items, this.sort()));
  readonly visibleItems = computed(() =>
    this.showAll() ? this.sortedItems() : this.sortedItems().slice(0, VISIBLE_LIMIT),
  );
  readonly hiddenCount = computed(() => this.sortedItems().length - this.visibleItems().length);
  readonly visibleOnlyOne = computed(() => this.display().onlyOne.slice(0, 12));

  readonly segBoth = computed(() => this.display().overlapPct);
  readonly segOne = computed(() => {
    const d = this.display();
    const union = d.planningA + d.planningB - d.bothPlanned;
    return union === 0 ? 0 : Math.round(((d.planningA - d.bothPlanned) / union) * 100);
  });

  readonly crumbs = [
    { label: 'Home', path: '/compare' },
    { label: 'Compare', path: '/compare' },
    { label: 'Shared backlog' },
  ];

  readonly fmt = fmtPredicted;

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
      const [listA, listB] = await this.pairStore.load(a, b);
      this.view.set(buildBacklog(listA, listB));
      this.showAll.set(false);
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { a: listA.name, b: listB.name },
        queryParamsHandling: 'merge',
      });
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Loading backlogs failed.');
    } finally {
      this.loading.set(false);
    }
  }
}
