// Group comparison math over 2–5 users' full AniList lists.

import { AnilistUserList } from '../api/anilist.service';
import { ComparisonAttribute } from '../ui/comparison-table';
import { completedOf, pairCompatScore } from './comparison-engine';

export interface MatrixCell {
  v: string;
  kind: 'self' | 'strong' | 'medium' | 'weak';
}

export interface MatrixRow {
  user: string;
  cells: MatrixCell[];
}

export interface GroupBacklogItem {
  mediaId: number;
  title: string;
  meta: string;
  chip: string;
  chipKind: 'all' | 'most' | 'some';
  who: string;
}

export interface GroupView {
  users: string[];
  attrs: ComparisonAttribute[];
  highlight: Record<string, number>;
  matrixRows: MatrixRow[];
  backlog: GroupBacklogItem[];
  backlogTotal: number;
}

const fmt1 = (v: number) => (Math.round(v * 10) / 10).toFixed(1);

function topGenre(list: AnilistUserList): string {
  const counts = new Map<string, number>();
  for (const e of completedOf(list)) for (const g of e.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
  let best = '—';
  let bestN = 0;
  for (const [g, n] of counts) {
    if (n > bestN) {
      best = g;
      bestN = n;
    }
  }
  return best;
}

export function buildGroup(lists: AnilistUserList[]): GroupView {
  const users = lists.map((l) => l.name);
  const completed = lists.map((l) => completedOf(l));
  const n = lists.length;

  // pairwise 0–100 scores, symmetric
  const pair: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s = pairCompatScore(completed[i], completed[j]).score;
      pair[i][j] = s;
      pair[j][i] = s;
    }
  }

  // Bands calibrated to observed real-world pair scores: casual pairs land in
  // the 20s–40s, genuinely aligned pairs in the 60s+.
  const matrixRows: MatrixRow[] = users.map((user, i) => ({
    user,
    cells: users.map((_, j) => {
      if (i === j) return { v: '—', kind: 'self' as const };
      const v = pair[i][j];
      return { v: String(v), kind: v >= 60 ? ('strong' as const) : v >= 40 ? ('medium' as const) : ('weak' as const) };
    }),
  }));

  const fitWithGroup = lists.map((_, i) => {
    const others = pair[i].filter((_, j) => j !== i);
    return others.length ? Math.round(others.reduce((s, v) => s + v, 0) / others.length) : 0;
  });

  const means = completed.map((entries) => {
    const scored = entries.filter((e) => e.score != null);
    return scored.length ? scored.reduce((s, e) => s + e.score!, 0) / scored.length : 0;
  });
  const planning = lists.map((l) => l.entries.filter((e) => e.status === 'PLANNING'));

  const attrs: ComparisonAttribute[] = [
    { label: 'Mean score', values: means.map(fmt1) },
    { label: 'Completed', values: completed.map((c) => String(c.length)) },
    { label: 'Plan to watch', values: planning.map((p) => String(p.length)) },
    { label: 'Top genre', values: lists.map(topGenre) },
    { label: 'Fit with group', values: fitWithGroup.map((v) => `${v}%`) },
  ];

  const argMax = (vals: number[]) => vals.indexOf(Math.max(...vals));
  const highlight: Record<string, number> = {
    'Fit with group': argMax(fitWithGroup),
    Completed: argMax(completed.map((c) => c.length)),
  };

  // titles planned (or started) by 2+ members
  const interest = new Map<
    number,
    { mediaId: number; title: string; meta: string; popularity: number; members: string[] }
  >();
  lists.forEach((l) => {
    for (const e of l.entries) {
      if (e.status !== 'PLANNING' && e.status !== 'CURRENT') continue;
      const cur = interest.get(e.mediaId) ?? {
        mediaId: e.mediaId,
        title: e.title,
        meta: [e.format ?? '—', e.year != null ? String(e.year) : '—', e.genres.slice(0, 2).join(' / ')]
          .filter(Boolean)
          .join(' · '),
        popularity: e.popularity,
        members: [],
      };
      cur.members.push(l.name);
      interest.set(e.mediaId, cur);
    }
  });

  const shared = [...interest.values()]
    .filter((t) => t.members.length >= 2)
    .sort((a, b) => b.members.length - a.members.length || b.popularity - a.popularity);

  const whoOf = (members: string[]): string => {
    if (members.length === n) return 'everyone';
    if (members.length === n - 1) {
      const missing = users.find((u) => !members.includes(u));
      return `all but ${missing}`;
    }
    return members.join(', ');
  };

  const backlog: GroupBacklogItem[] = shared.slice(0, 8).map((t) => ({
    mediaId: t.mediaId,
    title: t.title,
    meta: t.meta,
    chip: `${t.members.length}/${n}`,
    chipKind: t.members.length === n ? 'all' : t.members.length === n - 1 ? 'most' : 'some',
    who: whoOf(t.members),
  }));

  return { users, attrs, highlight, matrixRows, backlog, backlogTotal: shared.length };
}
