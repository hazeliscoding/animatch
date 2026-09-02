import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SAMPLE_PAIR } from '../anilist.config';
import { AuthService } from '../api/auth.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HistoryStore } from '../api/history-store';
import { PairStore } from '../api/pair-store';
import { ComparisonView, HistBin, buildComparison, histSummary } from '../logic/comparison-engine';
import { renderShareCard } from '../logic/share-card';
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
  private readonly auth = inject(AuthService);
  readonly history = inject(HistoryStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly view = signal<ComparisonView | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly editing = signal(false);
  readonly genreView = signal<'bars' | 'radar'>('bars');

  readonly nameA = signal('');
  readonly nameB = signal('');
  readonly samplePair = SAMPLE_PAIR;

  readonly live = computed(() => this.view() !== null);

  readonly sharedCols = computed<TableColumn[]>(() => [
    { key: 'title', label: 'Title' },
    { key: 'a', label: this.view()?.userA.name ?? 'User A', align: 'right', sortable: true },
    { key: 'b', label: this.view()?.userB.name ?? 'User B', align: 'right', sortable: true },
    { key: 'd', label: 'diff', align: 'right', sortable: true },
  ]);

  histLabel(bins: HistBin[], name: string): string {
    return histSummary(bins, name);
  }

  scoreHint(score: number): string {
    if (score >= 70) return 'Strong match';
    if (score >= 45) return 'Solid overlap';
    if (score >= 25) return 'Some common ground';
    return 'Very different lanes';
  }

  readonly shareStatus = signal('');
  private statusTimer: ReturnType<typeof setTimeout> | null = null;

  private setStatus(message: string) {
    this.shareStatus.set(message);
    if (this.statusTimer) clearTimeout(this.statusTimer);
    this.statusTimer = setTimeout(() => this.shareStatus.set(''), 3000);
  }

  private async makeCard(): Promise<{ blob: Blob; filename: string }> {
    const v = this.view()!;
    const blob = await renderShareCard(v, this.scoreHint(v.compatScore));
    return { blob, filename: `animatch-${v.userA.name}-x-${v.userB.name}.png` };
  }

  async share() {
    const v = this.view();
    if (!v) return;
    const url = window.location.href;

    // Touch devices: the native share sheet is the right home for the image.
    // Desktop Chrome/Edge also implement navigator.share (the Windows flyout),
    // but there "share" means "paste it into chat" — copy the image instead.
    const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    if (touch) {
      try {
        const { blob, filename } = await this.makeCard();
        const file = new File([blob], filename, { type: 'image/png' });
        const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
        if (nav.share && nav.canShare?.({ files: [file] })) {
          await nav.share({
            files: [file],
            title: `AniMatch: ${v.userA.name} × ${v.userB.name} — ${v.compatScore}/100`,
            url,
          });
          return;
        }
      } catch (e) {
        // user dismissed the sheet — do nothing further
        if (e instanceof DOMException && e.name === 'AbortError') return;
      }
    }

    // Copy the card image itself so Ctrl+V pastes it. The ClipboardItem gets a
    // Promise payload so clipboard.write is issued inside the click gesture —
    // awaiting the (slow) render first can outlive the activation window.
    try {
      const ClipboardItemCtor = (window as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem;
      if (ClipboardItemCtor && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItemCtor({ 'image/png': this.makeCard().then((c) => c.blob) }),
        ]);
        this.setStatus('Card copied — paste it anywhere');
        return;
      }
    } catch {
      // clipboard images unsupported here — fall back to the link
    }

    // last resort: the link as text
    await this.copyLink();
  }

  async copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      this.setStatus('Link copied');
    } catch {
      this.setStatus('Could not copy — grab the address bar URL');
    }
  }

  async downloadCard() {
    if (!this.view()) return;
    try {
      const { blob, filename } = await this.makeCard();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      this.setStatus('Card saved');
    } catch {
      this.setStatus('Card rendering failed');
    }
  }

  readonly crumbs = computed(() => [
    { label: 'Home', path: '/' },
    { label: 'Compare', path: '/compare' },
    ...(this.view() ? [{ label: `${this.view()!.userA.name} × ${this.view()!.userB.name}` }] : []),
  ]);

  constructor() {
    // Signed in? You're probably one half of the comparison.
    effect(() => {
      const viewer = this.auth.viewer();
      if (viewer && !this.nameA() && !this.live()) this.nameA.set(viewer.name);
    });
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
          this.nameA.set(a);
          this.nameB.set(b);
          void this.compare();
        }
      } else if (a) {
        this.nameA.set(a);
        this.editing.set(true);
      }
    });
  }

  loadSample() {
    this.nameA.set(SAMPLE_PAIR.a);
    this.nameB.set(SAMPLE_PAIR.b);
    void this.compare();
  }

  showPicker() {
    return this.editing() || !this.live();
  }

  async compare() {
    if (this.loading()) return;
    const a = this.nameA().trim();
    const b = this.nameB().trim();
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
