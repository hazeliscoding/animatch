import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AnilistService } from '../api/anilist.service';
import { DEMO_GROUP } from '../data/demo-group';
import { GroupView, buildGroup } from '../logic/group-engine';
import { HkBreadcrumbs } from '../ui/breadcrumbs';
import { HkButton } from '../ui/button';
import { HkComparisonTable } from '../ui/comparison-table';
import { HkModule } from '../ui/module';

const MAX_MEMBERS = 5;

@Component({
  selector: 'app-groups-page',
  imports: [FormsModule, HkBreadcrumbs, HkButton, HkComparisonTable, HkModule],
  templateUrl: './groups-page.html',
  styleUrl: './groups-page.css',
})
export class GroupsPage {
  private readonly anilist = inject(AnilistService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly view = signal<GroupView | null>(null);
  readonly members = signal<string[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  newMember = '';

  readonly live = computed(() => this.view() !== null);
  readonly display = computed(() => this.view() ?? DEMO_GROUP);
  readonly groupName = computed(() => (this.live() ? 'Watch group' : 'Saturday watch club'));
  readonly memberCount = computed(() =>
    this.live() ? this.view()!.users.length : this.members().length || 4,
  );
  readonly canAdd = computed(() => this.members().length < MAX_MEMBERS);

  readonly crumbs = [
    { label: 'Home', path: '/compare' },
    { label: 'Groups', path: '/groups' },
    { label: 'Watch group' },
  ];

  constructor() {
    const usersParam = this.route.snapshot.queryParamMap.get('users');
    if (usersParam) {
      const names = usersParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, MAX_MEMBERS);
      this.members.set(names);
      if (names.length >= 2) void this.load();
    }
  }

  addMember() {
    const name = this.newMember.trim();
    if (!name || !this.canAdd()) return;
    if (this.members().some((m) => m.toLowerCase() === name.toLowerCase())) {
      this.error.set(`"${name}" is already in the group.`);
      return;
    }
    this.error.set(null);
    this.members.update((m) => [...m, name]);
    this.newMember = '';
    if (this.members().length >= 2) void this.load();
  }

  removeMember(name: string) {
    this.members.update((m) => m.filter((x) => x !== name));
    if (this.members().length >= 2) {
      void this.load();
    } else {
      this.view.set(null);
      this.syncUrl();
    }
  }

  async load() {
    if (this.loading()) return;
    const names = this.members();
    if (names.length < 2) {
      this.error.set('Add at least two AniList usernames.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      const lists = await Promise.all(names.map((n) => this.anilist.getUserLists(n)));
      this.members.set(lists.map((l) => l.name));
      this.view.set(buildGroup(lists));
      this.syncUrl();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Loading the group failed.');
    } finally {
      this.loading.set(false);
    }
  }

  private syncUrl() {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { users: this.members().length ? this.members().join(',') : null },
      queryParamsHandling: 'merge',
    });
  }
}
