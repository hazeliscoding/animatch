import { Injectable, inject, signal } from '@angular/core';
import { AnilistService, AnilistUserList } from './anilist.service';

/**
 * Caches the currently-compared pair of users so Compare and Shared backlog
 * share one fetch. Keyed case-insensitively by username.
 */
@Injectable({ providedIn: 'root' })
export class PairStore {
  private readonly anilist = inject(AnilistService);
  readonly a = signal<AnilistUserList | null>(null);
  readonly b = signal<AnilistUserList | null>(null);

  matches(nameA: string, nameB: string): boolean {
    const a = this.a();
    const b = this.b();
    return (
      !!a &&
      !!b &&
      a.name.toLowerCase() === nameA.trim().toLowerCase() &&
      b.name.toLowerCase() === nameB.trim().toLowerCase()
    );
  }

  /** Fetch (or reuse) the pair's full lists. */
  async load(nameA: string, nameB: string): Promise<[AnilistUserList, AnilistUserList]> {
    if (this.matches(nameA, nameB)) {
      return [this.a()!, this.b()!];
    }
    const [a, b] = await Promise.all([
      this.anilist.getUserLists(nameA),
      this.anilist.getUserLists(nameB),
    ]);
    this.a.set(a);
    this.b.set(b);
    return [a, b];
  }
}
