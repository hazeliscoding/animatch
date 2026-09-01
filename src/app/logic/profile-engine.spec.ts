import { AnimeEntry, AnilistUserList, EntryStatus } from '../api/anilist.service';
import { buildProfile } from './profile-engine';

let id = 0;
const entry = (over: Partial<AnimeEntry> & { status: EntryStatus }): AnimeEntry => ({
  mediaId: ++id,
  title: `Anime ${id}`,
  score: null,
  progress: 0,
  genres: [],
  studios: [],
  format: 'TV',
  year: 2020,
  cover: null,
  episodes: 12,
  averageScore: null,
  popularity: 0,
  ...over,
});

const list = (entries: AnimeEntry[]): AnilistUserList => ({
  id: 1,
  name: 'alice',
  avatar: null,
  entries,
});

describe('buildProfile', () => {
  const profile = buildProfile(
    list([
      entry({ status: 'COMPLETED', score: 9, genres: ['Action'], studios: ['MAPPA'], episodes: 12 }),
      entry({ status: 'COMPLETED', score: 8, genres: ['Action'], studios: ['MAPPA'], episodes: 24 }),
      entry({ status: 'COMPLETED', score: 7, genres: ['Drama'], studios: ['MAPPA'], episodes: 12 }),
      entry({ status: 'COMPLETED', genres: ['Action'], episodes: 10 }),
      entry({ status: 'CURRENT', progress: 5, episodes: 12 }),
      entry({ status: 'PLANNING', episodes: 12 }),
      entry({ status: 'DROPPED', progress: 3, episodes: 12 }),
    ]),
  );

  it('counts statuses and episodes watched', () => {
    expect(profile.completed).toBe(4);
    expect(profile.watching).toBe(1);
    expect(profile.planning).toBe(1);
    expect(profile.dropped).toBe(1);
    // completed episodes (12+24+12+10) + progress on current (5) + dropped (3)
    expect(profile.episodesWatched).toBe(66);
  });

  it('means only scored titles', () => {
    expect(profile.mean).toBe('8.0');
    expect(profile.scoredCount).toBe(3);
  });

  it('ranks genres by completed share with means for 3+ scored', () => {
    expect(profile.genres[0].name).toBe('Action');
    expect(profile.genres[0].pct).toBe(75);
    expect(profile.genres[0].mean).toBeNull(); // only 2 scored Action titles
  });

  it('lists studios with 3+ scored titles', () => {
    expect(profile.studios).toHaveLength(1);
    expect(profile.studios[0]).toEqual({ name: 'MAPPA', mean: '8.0', count: 3 });
  });
});
