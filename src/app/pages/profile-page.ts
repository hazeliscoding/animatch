import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AnilistService } from '../api/anilist.service';
import { AuthService } from '../api/auth.service';
import { HistoryStore, relativeTime } from '../api/history-store';
import { HistBin, histSummary } from '../logic/comparison-engine';
import { ProfileView, buildProfile } from '../logic/profile-engine';
import { HkBreadcrumbs } from '../ui/breadcrumbs';
import { HkButton } from '../ui/button';
import { HkModule } from '../ui/module';

@Component({
  selector: 'app-profile-page',
  imports: [FormsModule, RouterLink, HkBreadcrumbs, HkButton, HkModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePage {
  private readonly anilist = inject(AnilistService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);
  readonly history = inject(HistoryStore);

  readonly profile = signal<ProfileView | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly viewerName = signal<string | null>(null);

  username = '';
  clientIdInput = this.auth.clientId();
  readonly origin = window.location.origin;

  readonly isSelf = computed(
    () => this.profile() !== null && this.profile()!.name === this.viewerName(),
  );

  readonly crumbs = computed(() => [
    { label: 'Home', path: '/' },
    { label: this.profile() && !this.isSelf() ? 'Profiles' : 'My profile' },
    ...(this.profile() ? [{ label: this.profile()!.name }] : []),
  ]);

  histLabel(bins: HistBin[], name: string): string {
    return histSummary(bins, name);
  }

  readonly rel = relativeTime;

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((qp) => {
      const u = qp.get('u');
      if (u) {
        if (this.profile()?.name.toLowerCase() !== u.toLowerCase()) void this.load(u);
      } else if (this.auth.connected()) {
        void this.loadSelf();
      }
    });
  }

  private async loadSelf() {
    const token = this.auth.token();
    if (!token) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const viewer = await this.anilist.getViewer(token);
      this.viewerName.set(viewer.name);
      await this.load(viewer.name);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Loading your profile failed.');
      this.loading.set(false);
    }
  }

  async load(name: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const list = await this.anilist.getUserLists(name);
      this.profile.set(buildProfile(list));
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Loading the profile failed.');
    } finally {
      this.loading.set(false);
    }
  }

  viewUser() {
    const name = this.username.trim();
    if (!name) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { u: name },
      queryParamsHandling: 'merge',
    });
  }

  connect() {
    if (!this.auth.login()) {
      this.error.set('Sign-in is not configured on this deployment — see the site-owner setup below.');
    }
  }

  saveClientId() {
    this.auth.setClientId(this.clientIdInput);
    this.error.set(null);
  }

  logout() {
    this.auth.logout();
    this.viewerName.set(null);
    if (!this.route.snapshot.queryParamMap.get('u')) this.profile.set(null);
  }
}
