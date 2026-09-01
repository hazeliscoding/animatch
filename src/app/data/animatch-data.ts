// Mock data for the AniMatch prototype, mirroring the design mockup.
// Replace with an AniList GraphQL-backed service when the API layer lands.

import { ComparisonAttribute } from '../ui/comparison-table';
import { TableColumn, TableRow } from '../ui/data-table';

export interface UserSummary {
  name: string;
  initial: string;
  completed: number;
  mean: number;
}

export const USER_A: UserSummary = { name: 'yuki_47', initial: 'Y', completed: 412, mean: 8.3 };
export const USER_B: UserSummary = { name: 'renko_lists', initial: 'R', completed: 388, mean: 8.4 };

export const COMPAT_SCORE = 78;

export const UTIL_LEFT = ['Help', 'What is AniMatch?'];
export const UTIL_RIGHT = ['Connect AniList', 'Sign in'];

export const NAV_ITEMS = [
  { label: 'Compare', path: '/compare' },
  { label: 'Shared backlog', path: '/backlog' },
  { label: 'Groups', path: '/groups' },
  { label: 'Recommendations', path: '/recommendations' },
  { label: 'My profile', path: '/profile' },
];

export interface BreakdownItem {
  label: string;
  note: string;
  pct: number;
  val: string;
}

export const BREAKDOWN: BreakdownItem[] = [
  { label: 'Score correlation', note: 'Pearson r on 118 shared titles', pct: 71, val: '0.71' },
  { label: 'Genre overlap', note: 'Weighted by hours watched', pct: 82, val: '82%' },
  { label: 'Completed overlap', note: '118 of 185 unique titles', pct: 64, val: '64%' },
  { label: 'Studio affinity', note: 'Shared high-rated studios', pct: 58, val: '58%' },
];

export interface Disagreement {
  title: string;
  meta: string;
  a: string;
  b: string;
  diff: string;
}

export const DISAGREEMENTS: Disagreement[] = [
  { title: 'Re:Zero', meta: 'TV · 2016 · Fantasy / Drama', a: '5.0', b: '9.1', diff: '4.1' },
  { title: 'Erased', meta: 'TV · 2016 · Mystery / Thriller', a: '8.8', b: '5.5', diff: '3.3' },
  { title: 'Bocchi the Rock!', meta: 'TV · 2022 · Comedy / Music', a: '9.2', b: '6.0', diff: '3.2' },
  { title: 'Oshi no Ko', meta: 'TV · 2023 · Drama / Supernatural', a: '6.5', b: '8.9', diff: '2.4' },
];

export const SHARED_COLS: TableColumn[] = [
  { key: 'title', label: 'Title' },
  { key: 'a', label: 'yuki_47', align: 'right', sortable: true },
  { key: 'b', label: 'renko_lists', align: 'right', sortable: true },
  { key: 'd', label: 'Δ', align: 'right', sortable: true },
];

export const SHARED_ROWS: TableRow[] = [
  { title: "Frieren: Beyond Journey's End", a: '9.8', b: '9.5', d: '0.3' },
  { title: 'Steins;Gate', a: '9.0', b: '8.5', d: '0.5' },
  { title: 'Vinland Saga', a: '8.5', b: '9.0', d: '0.5' },
  { title: 'Chainsaw Man', a: '7.0', b: '8.8', d: '1.8' },
  { title: 'Oshi no Ko', a: '6.5', b: '8.9', d: '2.4' },
  { title: 'Bocchi the Rock!', a: '9.2', b: '6.0', d: '3.2' },
];

export const SHARED_FOOTER = ['Mean (118 shared)', '8.3', '8.4', '1.4'];

export interface HistBin {
  bin: number;
  px: number;
}

const histFrom = (counts: number[], max: number): HistBin[] =>
  counts.map((v, i) => ({ bin: i + 1, px: Math.round((v / max) * 60) }));

export const HIST_A = histFrom([2, 3, 5, 8, 12, 18, 30, 52, 40, 24], 52);
export const HIST_B = histFrom([1, 2, 4, 6, 10, 22, 44, 50, 34, 16], 50);

export interface GenreRow {
  name: string;
  aPct: number;
  bPct: number;
  pcts: string;
}

export const GENRES: GenreRow[] = [
  { name: 'Action', aPct: 68, bPct: 54, pcts: '68 / 54' },
  { name: 'Drama', aPct: 61, bPct: 70, pcts: '61 / 70' },
  { name: 'Sci-Fi', aPct: 55, bPct: 38, pcts: '55 / 38' },
  { name: 'Romance', aPct: 22, bPct: 58, pcts: '22 / 58' },
  { name: 'Slice of Life', aPct: 48, bPct: 30, pcts: '48 / 30' },
  { name: 'Thriller', aPct: 40, bPct: 47, pcts: '40 / 47' },
];

export const BACKLOG_TABS = [
  { label: 'Both plan to watch', count: 34 },
  { label: 'Only in one backlog', count: 171 },
  { label: 'Watching together', count: 2 },
];

export interface BacklogItem {
  title: string;
  meta: string;
  note: string;
  chip: string;
  chipKind: 'both' | 'started';
  score: string;
}

export const BACKLOG: BacklogItem[] = [
  {
    title: 'Monster',
    meta: 'TV · 2004 · 74 ep · Mystery / Thriller',
    note: "In renko's backlog since 2024 · you added it in March",
    chip: 'BOTH PLAN',
    chipKind: 'both',
    score: '9.1',
  },
  {
    title: 'Ping Pong the Animation',
    meta: 'TV · 2014 · 11 ep · Sports / Drama',
    note: 'You both rated Tatami Galaxy 8+ — same director',
    chip: 'BOTH PLAN',
    chipKind: 'both',
    score: '8.8',
  },
  {
    title: 'The Tatami Galaxy',
    meta: 'TV · 2010 · 11 ep · Comedy / Psychological',
    note: 'renko is 2 episodes in — easy to sync up',
    chip: 'RENKO STARTED',
    chipKind: 'started',
    score: '8.6',
  },
  {
    title: 'Sonny Boy',
    meta: 'TV · 2021 · 12 ep · Sci-Fi / Mystery',
    note: "Matches both users' Sci-Fi profiles",
    chip: 'BOTH PLAN',
    chipKind: 'both',
    score: '8.2',
  },
  {
    title: 'Land of the Lustrous',
    meta: 'TV · 2017 · 12 ep · Action / Drama',
    note: 'High score among users with similar taste',
    chip: 'BOTH PLAN',
    chipKind: 'both',
    score: '8.0',
  },
  {
    title: 'Mushishi',
    meta: 'TV · 2005 · 26 ep · Supernatural / Slice of Life',
    note: "Slow pace — flagged: differs from renko's usual picks",
    chip: 'BOTH PLAN',
    chipKind: 'both',
    score: '7.9',
  },
];

export interface Pick {
  rank: number;
  title: string;
  reason: string;
  medal: 'gold' | 'silver' | 'bronze' | 'none';
}

export const PICKS: Pick[] = [
  { rank: 1, title: 'Monster', reason: 'Highest predicted mutual score · 9.1', medal: 'gold' },
  { rank: 2, title: 'Ping Pong the Animation', reason: 'Shared director affinity', medal: 'silver' },
  { rank: 3, title: 'The Tatami Galaxy', reason: 'renko already started it', medal: 'bronze' },
  { rank: 4, title: 'Sonny Boy', reason: 'Fits both Sci-Fi profiles', medal: 'none' },
  { rank: 5, title: 'Land of the Lustrous', reason: 'Loved by similar pairs', medal: 'none' },
];

export const GROUP_USERS = ['yuki_47', 'renko_lists', 'taro_cel', 'mimi_bl'];

export const GROUP_ATTRS: ComparisonAttribute[] = [
  { label: 'Mean score', values: ['8.3', '8.4', '6.9', '7.8'] },
  { label: 'Completed', values: ['412', '388', '611', '205'] },
  { label: 'Plan to watch', values: ['96', '143', '58', '210'] },
  { label: 'Top genre', values: ['Action', 'Drama', 'Comedy', 'Romance'] },
  { label: 'Fit with group', values: ['82%', '79%', '61%', '74%'] },
];

export const GROUP_HIGHLIGHT: Record<string, number> = { 'Fit with group': 0, Completed: 2 };

const PAIR_MATCH: Record<string, number> = {
  'yuki_47|renko_lists': 78,
  'yuki_47|taro_cel': 55,
  'yuki_47|mimi_bl': 70,
  'renko_lists|taro_cel': 49,
  'renko_lists|mimi_bl': 66,
  'taro_cel|mimi_bl': 42,
};

export interface MatrixCell {
  v: string;
  kind: 'head' | 'self' | 'strong' | 'medium' | 'weak';
}

export function buildMatrixCells(): MatrixCell[] {
  const cells: MatrixCell[] = [];
  GROUP_USERS.forEach((row, i) => {
    cells.push({ v: row, kind: 'head' });
    GROUP_USERS.forEach((_, j) => {
      if (i === j) {
        cells.push({ v: '—', kind: 'self' });
        return;
      }
      const v = PAIR_MATCH[GROUP_USERS[Math.min(i, j)] + '|' + GROUP_USERS[Math.max(i, j)]];
      cells.push({ v: String(v), kind: v >= 70 ? 'strong' : v >= 50 ? 'medium' : 'weak' });
    });
  });
  return cells;
}

export interface GroupBacklogItem {
  title: string;
  meta: string;
  chip: string;
  chipKind: 'all' | 'most' | 'some';
  who: string;
}

export const GROUP_BACKLOG: GroupBacklogItem[] = [
  { title: 'Monster', meta: 'TV · 2004 · Mystery / Thriller', chip: '4/4', chipKind: 'all', who: 'everyone' },
  { title: 'Mushishi', meta: 'TV · 2005 · Supernatural', chip: '3/4', chipKind: 'most', who: 'all but taro_cel' },
  { title: 'Vinland Saga Season 2', meta: 'TV · 2023 · Action / Drama', chip: '3/4', chipKind: 'most', who: 'all but mimi_bl' },
  { title: 'Sonny Boy', meta: 'TV · 2021 · Sci-Fi / Mystery', chip: '2/4', chipKind: 'some', who: 'yuki, renko' },
  { title: 'Odd Taxi', meta: 'TV · 2021 · Mystery / Drama', chip: '2/4', chipKind: 'some', who: 'taro, mimi' },
];
