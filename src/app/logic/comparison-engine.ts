// Pure comparison math over two AniList completed lists.
// Compat score weights: 45% score correlation, 30% genre overlap,
// 15% completed overlap, 10% studio affinity — mirroring the breakdown UI.

import { AnimeEntry, AnilistUserList } from '../api/anilist.service';
import { BreakdownItem, GenreRow, HistBin, UserSummary } from '../data/animatch-data';
import { TableRow } from '../ui/data-table';

export interface DisagreementView {
  title: string;
  meta: string;
  a: string;
  b: string;
  diff: string;
  cover: string | null;
}

export interface ComparisonView {
  userA: UserSummary & { avatar: string | null };
  userB: UserSummary & { avatar: string | null };
  compatScore: number;
  breakdown: BreakdownItem[];
  disagreements: DisagreementView[];
  sharedRows: TableRow[];
  sharedFooter: string[];
  sharedTotal: number;
  /** Shared titles scored ≥ 2 points apart */
  disagreementTotal: number;
  histA: HistBin[];
  histB: HistBin[];
  genres: GenreRow[];
}

export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

/** Cosine similarity between per-genre title counts, as a 0–100 percentage. */
export function genreOverlap(a: AnimeEntry[], b: AnimeEntry[]): number {
  const countGenres = (entries: AnimeEntry[]) => {
    const counts = new Map<string, number>();
    for (const e of entries) for (const g of e.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
    return counts;
  };
  const ca = countGenres(a);
  const cb = countGenres(b);
  const all = new Set([...ca.keys(), ...cb.keys()]);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const g of all) {
    const va = ca.get(g) ?? 0;
    const vb = cb.get(g) ?? 0;
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  const den = Math.sqrt(na) * Math.sqrt(nb);
  return den === 0 ? 0 : Math.round((dot / den) * 100);
}

/** Studios each user rates highly (mean ≥ 8 over ≥ 2 scored titles). */
export function favoriteStudios(entries: AnimeEntry[]): Set<string> {
  const stats = new Map<string, { sum: number; n: number }>();
  for (const e of entries) {
    if (e.score == null) continue;
    for (const s of e.studios) {
      const st = stats.get(s) ?? { sum: 0, n: 0 };
      st.sum += e.score;
      st.n++;
      stats.set(s, st);
    }
  }
  const fav = new Set<string>();
  for (const [name, { sum, n }] of stats) if (n >= 2 && sum / n >= 8) fav.add(name);
  return fav;
}

export function studioAffinity(a: AnimeEntry[], b: AnimeEntry[]): number {
  const fa = favoriteStudios(a);
  const fb = favoriteStudios(b);
  if (fa.size === 0 || fb.size === 0) return 0;
  let shared = 0;
  for (const s of fa) if (fb.has(s)) shared++;
  const union = fa.size + fb.size - shared;
  return Math.round((shared / union) * 100);
}

export function histogram(entries: AnimeEntry[]): HistBin[] {
  const counts = new Array<number>(10).fill(0);
  for (const e of entries) {
    if (e.score == null) continue;
    const bin = Math.min(10, Math.max(1, Math.round(e.score)));
    counts[bin - 1]++;
  }
  const max = Math.max(1, ...counts);
  return counts.map((v, i) => ({ bin: i + 1, px: Math.round((v / max) * 60) }));
}

const fmt1 = (v: number) => (Math.round(v * 10) / 10).toFixed(1);

function summarize(list: AnilistUserList): UserSummary & { avatar: string | null } {
  const completed = completedOf(list);
  const scored = completed.filter((e) => e.score != null);
  const mean = scored.length ? scored.reduce((s, e) => s + (e.score ?? 0), 0) / scored.length : 0;
  return {
    name: list.name,
    initial: list.name.charAt(0).toUpperCase(),
    completed: completed.length,
    mean: Number(fmt1(mean)),
    avatar: list.avatar,
  };
}

function metaOf(e: AnimeEntry): string {
  const parts = [e.format ?? '—', e.year != null ? String(e.year) : '—'];
  if (e.genres.length) parts.push(e.genres.slice(0, 2).join(' / '));
  return parts.join(' · ');
}

export const completedOf = (list: AnilistUserList): AnimeEntry[] =>
  list.entries.filter((e) => e.status === 'COMPLETED');

export interface PairScore {
  r: number;
  genrePct: number;
  completedPct: number;
  studioPct: number;
  sharedCount: number;
  sharedScoredCount: number;
  unionCount: number;
  score: number;
}

/** 0–100 taste match over two COMPLETED entry sets (45/30/15/10 weights). */
export function pairCompatScore(aEntries: AnimeEntry[], bEntries: AnimeEntry[]): PairScore {
  const bById = new Map(bEntries.map((e) => [e.mediaId, e]));
  const shared = aEntries.filter((e) => bById.has(e.mediaId)).map((e) => ({ a: e, b: bById.get(e.mediaId)! }));
  const sharedScored = shared.filter((p) => p.a.score != null && p.b.score != null);
  const r = pearson(
    sharedScored.map((p) => p.a.score!),
    sharedScored.map((p) => p.b.score!),
  );
  const genrePct = genreOverlap(aEntries, bEntries);
  const unionCount = aEntries.length + bEntries.length - shared.length;
  const completedPct = unionCount === 0 ? 0 : Math.round((shared.length / unionCount) * 100);
  const studioPct = studioAffinity(aEntries, bEntries);
  const score = Math.max(
    0,
    Math.min(100, Math.round(0.45 * Math.max(r, 0) * 100 + 0.3 * genrePct + 0.15 * completedPct + 0.1 * studioPct)),
  );
  return {
    r,
    genrePct,
    completedPct,
    studioPct,
    sharedCount: shared.length,
    sharedScoredCount: sharedScored.length,
    unionCount,
    score,
  };
}

export function buildComparison(a: AnilistUserList, b: AnilistUserList): ComparisonView {
  const aEntries = completedOf(a);
  const bEntries = completedOf(b);
  const bById = new Map(bEntries.map((e) => [e.mediaId, e]));
  const shared = aEntries
    .filter((e) => bById.has(e.mediaId))
    .map((e) => ({ a: e, b: bById.get(e.mediaId)! }));
  const sharedScored = shared.filter((p) => p.a.score != null && p.b.score != null);

  const pair = pairCompatScore(aEntries, bEntries);
  const { r, genrePct, completedPct, studioPct, unionCount } = pair;
  const compatScore = pair.score;

  const breakdown: BreakdownItem[] = [
    {
      label: 'Score correlation',
      note: `Pearson r on ${sharedScored.length} shared titles`,
      pct: Math.max(0, Math.round(r * 100)),
      val: (Math.round(r * 100) / 100).toFixed(2),
    },
    { label: 'Genre overlap', note: 'Cosine similarity of genre mix', pct: genrePct, val: `${genrePct}%` },
    {
      label: 'Completed overlap',
      note: `${shared.length} of ${unionCount} unique titles`,
      pct: completedPct,
      val: `${completedPct}%`,
    },
    { label: 'Studio affinity', note: 'Shared high-rated studios', pct: studioPct, val: `${studioPct}%` },
  ];

  const byDeltaDesc = [...sharedScored].sort(
    (p, q) => Math.abs(q.a.score! - q.b.score!) - Math.abs(p.a.score! - p.b.score!),
  );
  const disagreements: DisagreementView[] = byDeltaDesc.slice(0, 4).map((p) => ({
    title: p.a.title,
    meta: metaOf(p.a),
    a: fmt1(p.a.score!),
    b: fmt1(p.b.score!),
    diff: fmt1(Math.abs(p.a.score! - p.b.score!)),
    cover: p.a.cover,
  }));

  const byDeltaAsc = [...sharedScored].sort(
    (p, q) => Math.abs(p.a.score! - p.b.score!) - Math.abs(q.a.score! - q.b.score!),
  );
  const sharedRows: TableRow[] = byDeltaAsc.slice(0, 8).map((p) => ({
    title: p.a.title,
    a: fmt1(p.a.score!),
    b: fmt1(p.b.score!),
    d: fmt1(Math.abs(p.a.score! - p.b.score!)),
  }));
  const meanOf = (vals: number[]) => (vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0);
  const sharedFooter = sharedScored.length
    ? [
        `Mean (${sharedScored.length} shared)`,
        fmt1(meanOf(sharedScored.map((p) => p.a.score!))),
        fmt1(meanOf(sharedScored.map((p) => p.b.score!))),
        fmt1(meanOf(sharedScored.map((p) => Math.abs(p.a.score! - p.b.score!)))),
      ]
    : [];

  const genrePcts = (entries: AnimeEntry[]) => {
    const counts = new Map<string, number>();
    for (const e of entries) for (const g of e.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
    const total = Math.max(1, entries.length);
    return { counts, total };
  };
  const ga = genrePcts(aEntries);
  const gb = genrePcts(bEntries);
  const allGenres = new Set([...ga.counts.keys(), ...gb.counts.keys()]);
  const genres: GenreRow[] = [...allGenres]
    .map((name) => {
      const aPct = Math.round(((ga.counts.get(name) ?? 0) / ga.total) * 100);
      const bPct = Math.round(((gb.counts.get(name) ?? 0) / gb.total) * 100);
      return { name, aPct, bPct, pcts: `${aPct} / ${bPct}` };
    })
    .sort((x, y) => y.aPct + y.bPct - (x.aPct + x.bPct))
    .slice(0, 6);

  return {
    userA: summarize(a),
    userB: summarize(b),
    compatScore,
    breakdown,
    disagreements,
    sharedRows,
    sharedFooter,
    sharedTotal: sharedScored.length,
    disagreementTotal: sharedScored.filter((p) => Math.abs(p.a.score! - p.b.score!) >= 2).length,
    histA: histogram(aEntries),
    histB: histogram(bEntries),
    genres,
  };
}
