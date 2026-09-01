// Single-user profile stats from a full AniList list.

import { AnilistUserList } from '../api/anilist.service';
import { HistBin, completedOf, histogram } from './comparison-engine';

export interface ProfileGenreRow {
  name: string;
  pct: number;
  mean: string | null;
  count: number;
}

export interface ProfileStudioRow {
  name: string;
  mean: string;
  count: number;
}

export interface ProfileView {
  name: string;
  avatar: string | null;
  initial: string;
  completed: number;
  planning: number;
  watching: number;
  dropped: number;
  paused: number;
  mean: string;
  scoredCount: number;
  episodesWatched: number;
  hist: HistBin[];
  genres: ProfileGenreRow[];
  studios: ProfileStudioRow[];
}

const fmt1 = (v: number) => (Math.round(v * 10) / 10).toFixed(1);

export function buildProfile(list: AnilistUserList): ProfileView {
  const completed = completedOf(list);
  const scored = completed.filter((e) => e.score != null);
  const mean = scored.length ? scored.reduce((s, e) => s + e.score!, 0) / scored.length : 0;
  const count = (status: string) => list.entries.filter((e) => e.status === status).length;

  const episodesWatched = list.entries.reduce((sum, e) => {
    if (e.status === 'COMPLETED') return sum + (e.episodes ?? 0);
    return sum + e.progress;
  }, 0);

  const genreAgg = new Map<string, { count: number; sum: number; scored: number }>();
  for (const e of completed) {
    for (const g of e.genres) {
      const st = genreAgg.get(g) ?? { count: 0, sum: 0, scored: 0 };
      st.count++;
      if (e.score != null) {
        st.sum += e.score;
        st.scored++;
      }
      genreAgg.set(g, st);
    }
  }
  const genres: ProfileGenreRow[] = [...genreAgg.entries()]
    .map(([name, st]) => ({
      name,
      count: st.count,
      pct: completed.length ? Math.round((st.count / completed.length) * 100) : 0,
      mean: st.scored >= 3 ? fmt1(st.sum / st.scored) : null,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const studioAgg = new Map<string, { sum: number; n: number }>();
  for (const e of scored) {
    for (const s of e.studios) {
      const st = studioAgg.get(s) ?? { sum: 0, n: 0 };
      st.sum += e.score!;
      st.n++;
      studioAgg.set(s, st);
    }
  }
  const studios: ProfileStudioRow[] = [...studioAgg.entries()]
    .filter(([, st]) => st.n >= 3)
    .map(([name, st]) => ({ name, mean: fmt1(st.sum / st.n), count: st.n }))
    .sort((a, b) => Number(b.mean) - Number(a.mean))
    .slice(0, 6);

  return {
    name: list.name,
    avatar: list.avatar,
    initial: list.name.charAt(0).toUpperCase(),
    completed: completed.length,
    planning: count('PLANNING'),
    watching: count('CURRENT') + count('REPEATING'),
    dropped: count('DROPPED'),
    paused: count('PAUSED'),
    mean: fmt1(mean),
    scoredCount: scored.length,
    episodesWatched,
    hist: histogram(completed),
    genres,
    studios,
  };
}
