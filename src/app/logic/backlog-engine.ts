// Shared-backlog math over two users' full AniList lists.
// Predicted mutual score = AniList site average (0-10) nudged by each user's
// genre affinity: how they historically score titles sharing a genre,
// relative to their own mean (clamped to ±1 per user).

import { AnimeEntry, AnilistUserList } from '../api/anilist.service';
import { completedOf } from './comparison-engine';

export type BacklogSort = 'Predicted score' | 'Popularity' | 'Year';

export interface BacklogItemView {
  title: string;
  meta: string;
  note: string;
  chip: string;
  chipKind: 'both' | 'started';
  cover: string | null;
  predicted: number;
  popularity: number;
  year: number;
}

export interface SingleBacklogItemView {
  title: string;
  meta: string;
  who: string;
  cover: string | null;
  popularity: number;
}

export interface WatchingItemView {
  title: string;
  meta: string;
  note: string;
  cover: string | null;
}

export interface PickView {
  rank: number;
  title: string;
  reason: string;
  medal: 'gold' | 'silver' | 'bronze' | 'none';
}

export interface BacklogView {
  nameA: string;
  nameB: string;
  planningA: number;
  planningB: number;
  /** Titles present in both PLANNING lists (excludes started-by-one titles) */
  bothPlanned: number;
  bothCount: number;
  onlyOneCount: number;
  watchingCount: number;
  overlapPct: number;
  items: BacklogItemView[];
  onlyOne: SingleBacklogItemView[];
  watching: WatchingItemView[];
  picks: PickView[];
}

const fmt1 = (v: number) => (Math.round(v * 10) / 10).toFixed(1);

const planningOf = (list: AnilistUserList) => list.entries.filter((e) => e.status === 'PLANNING');
const watchingOf = (list: AnilistUserList) =>
  list.entries.filter((e) => e.status === 'CURRENT' || e.status === 'REPEATING');

function metaOf(e: AnimeEntry): string {
  const parts = [e.format ?? '—', e.year != null ? String(e.year) : '—'];
  if (e.episodes != null) parts.push(`${e.episodes} ep`);
  if (e.genres.length) parts.push(e.genres.slice(0, 2).join(' / '));
  return parts.join(' · ');
}

export interface GenreStats {
  mean: number;
  byGenre: Map<string, { sum: number; n: number }>;
}

/** The slice of a media object the prediction math needs. */
export interface PredictableTitle {
  genres: string[];
  averageScore: number | null;
}

export function genreStatsOf(completed: AnimeEntry[]): GenreStats {
  const scored = completed.filter((e) => e.score != null);
  const mean = scored.length ? scored.reduce((s, e) => s + e.score!, 0) / scored.length : 0;
  const byGenre = new Map<string, { sum: number; n: number }>();
  for (const e of scored) {
    for (const g of e.genres) {
      const st = byGenre.get(g) ?? { sum: 0, n: 0 };
      st.sum += e.score!;
      st.n++;
      byGenre.set(g, st);
    }
  }
  return { mean, byGenre };
}

/** How far above/below their own mean this user scores the title's genres, clamped to ±1. */
export function genreFit(stats: GenreStats, title: PredictableTitle): number {
  if (stats.mean === 0) return 0;
  let sum = 0;
  let n = 0;
  for (const g of title.genres) {
    const st = stats.byGenre.get(g);
    if (st && st.n >= 3) {
      sum += st.sum / st.n - stats.mean;
      n++;
    }
  }
  if (n === 0) return 0;
  return Math.max(-1, Math.min(1, sum / n));
}

/** Predicted mutual enjoyment on a 1–10 scale. */
export function predictedScore(a: GenreStats, b: GenreStats, title: PredictableTitle): number {
  const base = title.averageScore != null ? title.averageScore / 10 : 7;
  const adj = (genreFit(a, title) + genreFit(b, title)) / 2;
  return Math.max(1, Math.min(10, base + adj));
}

export function bestGenre(a: GenreStats, b: GenreStats, title: PredictableTitle): string | null {
  let best: string | null = null;
  let bestFit = 0.3; // only call out genuinely-liked genres
  for (const g of title.genres) {
    const sa = a.byGenre.get(g);
    const sb = b.byGenre.get(g);
    if (!sa || !sb || sa.n < 3 || sb.n < 3) continue;
    const fit = sa.sum / sa.n - a.mean + (sb.sum / sb.n - b.mean);
    if (fit > bestFit) {
      bestFit = fit;
      best = g;
    }
  }
  return best;
}

export function buildBacklog(a: AnilistUserList, b: AnilistUserList): BacklogView {
  const planA = planningOf(a);
  const planB = planningOf(b);
  const watchA = watchingOf(a);
  const watchB = watchingOf(b);
  const statsA = genreStatsOf(completedOf(a));
  const statsB = genreStatsOf(completedOf(b));

  const planBIds = new Map(planB.map((e) => [e.mediaId, e]));
  const watchAIds = new Map(watchA.map((e) => [e.mediaId, e]));
  const watchBIds = new Map(watchB.map((e) => [e.mediaId, e]));

  // "Both plan to watch": planned by both, or planned by one while the other
  // has already started it (easy to sync up).
  const items: BacklogItemView[] = [];
  const claimed = new Set<number>();
  const addItem = (e: AnimeEntry, chipKind: 'both' | 'started', chip: string, note: string) => {
    items.push({
      title: e.title,
      meta: metaOf(e),
      note,
      chip,
      chipKind,
      cover: e.cover,
      predicted: predictedScore(statsA, statsB, e),
      popularity: e.popularity,
      year: e.year ?? 0,
    });
    claimed.add(e.mediaId);
  };

  for (const e of planA) {
    if (planBIds.has(e.mediaId)) {
      const genre = bestGenre(statsA, statsB, e);
      addItem(e, 'both', 'BOTH PLAN', genre ? `Matches both users' ${genre} profiles` : 'In both plan-to-watch lists');
    } else if (watchBIds.has(e.mediaId)) {
      const w = watchBIds.get(e.mediaId)!;
      addItem(e, 'started', `${b.name.toUpperCase()} STARTED`, `${b.name} is ${w.progress} episodes in — easy to sync up`);
    }
  }
  for (const e of planB) {
    if (claimed.has(e.mediaId)) continue;
    if (watchAIds.has(e.mediaId)) {
      const w = watchAIds.get(e.mediaId)!;
      addItem(e, 'started', `${a.name.toUpperCase()} STARTED`, `${a.name} is ${w.progress} episodes in — easy to sync up`);
    }
  }

  const bothPlanned = planA.filter((e) => planBIds.has(e.mediaId)).length;

  const onlyOne: SingleBacklogItemView[] = [
    ...planA
      .filter((e) => !planBIds.has(e.mediaId) && !watchBIds.has(e.mediaId))
      .map((e) => ({ title: e.title, meta: metaOf(e), who: `only ${a.name}`, cover: e.cover, popularity: e.popularity })),
    ...planB
      .filter((e) => !claimed.has(e.mediaId) && !watchAIds.has(e.mediaId))
      .map((e) => ({ title: e.title, meta: metaOf(e), who: `only ${b.name}`, cover: e.cover, popularity: e.popularity })),
  ].sort((x, y) => y.popularity - x.popularity);

  const watching: WatchingItemView[] = watchA
    .filter((e) => watchBIds.has(e.mediaId))
    .map((e) => {
      const w = watchBIds.get(e.mediaId)!;
      return {
        title: e.title,
        meta: metaOf(e),
        note: `${a.name} at ep ${e.progress} · ${b.name} at ep ${w.progress}`,
        cover: e.cover,
      };
    });

  const ranked = [...items].sort((x, y) => y.predicted - x.predicted);
  const medals: PickView['medal'][] = ['gold', 'silver', 'bronze'];
  const picks: PickView[] = ranked.slice(0, 5).map((it, i) => ({
    rank: i + 1,
    title: it.title,
    reason:
      i === 0
        ? `Highest predicted mutual score · ${fmt1(it.predicted)}`
        : it.chipKind === 'started'
          ? it.note
          : `Predicted mutual ${fmt1(it.predicted)}`,
    medal: medals[i] ?? 'none',
  }));

  return {
    nameA: a.name,
    nameB: b.name,
    planningA: planA.length,
    planningB: planB.length,
    bothPlanned,
    bothCount: items.length,
    onlyOneCount: onlyOne.length,
    watchingCount: watching.length,
    overlapPct: planA.length + planB.length - bothPlanned === 0
      ? 0
      : Math.round((bothPlanned / (planA.length + planB.length - bothPlanned)) * 100),
    items,
    onlyOne,
    watching,
    picks,
  };
}

export function sortBacklogItems(items: BacklogItemView[], sort: BacklogSort): BacklogItemView[] {
  const sorted = [...items];
  if (sort === 'Popularity') sorted.sort((a, b) => b.popularity - a.popularity);
  else if (sort === 'Year') sorted.sort((a, b) => b.year - a.year);
  else sorted.sort((a, b) => b.predicted - a.predicted);
  return sorted;
}

export const fmtPredicted = fmt1;
