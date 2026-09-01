import { Injectable, signal } from '@angular/core';

export interface RecentComparison {
  a: string;
  b: string;
  score: number;
  at: number;
}

export interface RecentGroup {
  users: string[];
  at: number;
}

const COMPARISONS_KEY = 'animatch.recentComparisons';
const GROUPS_KEY = 'animatch.recentGroups';
const LIMIT = 10;

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Local-first persistence of what the user compared — backend syncing later. */
@Injectable({ providedIn: 'root' })
export class HistoryStore {
  readonly comparisons = signal<RecentComparison[]>(read<RecentComparison>(COMPARISONS_KEY));
  readonly groups = signal<RecentGroup[]>(read<RecentGroup>(GROUPS_KEY));

  recordComparison(a: string, b: string, score: number) {
    const key = (x: RecentComparison) => `${x.a.toLowerCase()}|${x.b.toLowerCase()}`;
    const next: RecentComparison = { a, b, score, at: Date.now() };
    const rest = this.comparisons().filter((c) => key(c) !== key(next));
    this.comparisons.set([next, ...rest].slice(0, LIMIT));
    localStorage.setItem(COMPARISONS_KEY, JSON.stringify(this.comparisons()));
  }

  recordGroup(users: string[]) {
    const key = (u: string[]) => u.map((x) => x.toLowerCase()).sort().join(',');
    const next: RecentGroup = { users, at: Date.now() };
    const rest = this.groups().filter((g) => key(g.users) !== key(users));
    this.groups.set([next, ...rest].slice(0, LIMIT));
    localStorage.setItem(GROUPS_KEY, JSON.stringify(this.groups()));
  }
}

/** "3m ago" / "2h ago" / "5d ago" */
export function relativeTime(at: number, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - at) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
