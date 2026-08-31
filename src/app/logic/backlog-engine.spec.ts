import { AnimeEntry, AnilistUserList, EntryStatus } from '../api/anilist.service';
import { buildBacklog, sortBacklogItems } from './backlog-engine';

let nextId = 1;
const entry = (over: Partial<AnimeEntry> & { status: EntryStatus }): AnimeEntry => ({
  mediaId: over.mediaId ?? nextId++,
  title: over.title ?? `Anime ${over.mediaId ?? nextId}`,
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

const list = (name: string, entries: AnimeEntry[]): AnilistUserList => ({
  id: 1,
  name,
  avatar: null,
  entries,
});

// Both users love Action (score it well above their mean), dislike Romance.
const completedHistory = (): AnimeEntry[] => [
  entry({ mediaId: 101, status: 'COMPLETED', score: 9, genres: ['Action'] }),
  entry({ mediaId: 102, status: 'COMPLETED', score: 9, genres: ['Action'] }),
  entry({ mediaId: 103, status: 'COMPLETED', score: 9, genres: ['Action'] }),
  entry({ mediaId: 104, status: 'COMPLETED', score: 4, genres: ['Romance'] }),
  entry({ mediaId: 105, status: 'COMPLETED', score: 4, genres: ['Romance'] }),
  entry({ mediaId: 106, status: 'COMPLETED', score: 4, genres: ['Romance'] }),
  entry({ mediaId: 107, status: 'COMPLETED', score: 7, genres: ['Drama'] }),
];

describe('buildBacklog', () => {
  const a = list('alice', [
    ...completedHistory(),
    entry({ mediaId: 1, title: 'Planned By Both', status: 'PLANNING', genres: ['Action'], averageScore: 80, popularity: 5000 }),
    entry({ mediaId: 2, title: 'Bob Started It', status: 'PLANNING', genres: ['Drama'], averageScore: 75, popularity: 100 }),
    entry({ mediaId: 3, title: 'Only Alice Plans', status: 'PLANNING', popularity: 900 }),
    entry({ mediaId: 4, title: 'Watching Together', status: 'CURRENT', progress: 4 }),
  ]);
  const b = list('bob', [
    ...completedHistory().map((e) => ({ ...e, mediaId: e.mediaId + 100 })),
    entry({ mediaId: 1, title: 'Planned By Both', status: 'PLANNING', genres: ['Action'], averageScore: 80, popularity: 5000 }),
    entry({ mediaId: 2, title: 'Bob Started It', status: 'CURRENT', progress: 2, genres: ['Drama'], averageScore: 75 }),
    entry({ mediaId: 4, title: 'Watching Together', status: 'CURRENT', progress: 7 }),
    entry({ mediaId: 5, title: 'Only Bob Plans', status: 'PLANNING', popularity: 50 }),
  ]);
  const view = buildBacklog(a, b);

  it('partitions titles into both / only-one / watching tabs', () => {
    expect(view.items.map((i) => i.title).sort()).toEqual(['Bob Started It', 'Planned By Both']);
    expect(view.onlyOne.map((i) => i.title).sort()).toEqual(['Only Alice Plans', 'Only Bob Plans']);
    expect(view.watching.map((i) => i.title)).toEqual(['Watching Together']);
    expect(view.bothCount).toBe(2);
    expect(view.onlyOneCount).toBe(2);
    expect(view.watchingCount).toBe(1);
  });

  it('chips distinguish both-planned from started titles', () => {
    const both = view.items.find((i) => i.title === 'Planned By Both')!;
    const started = view.items.find((i) => i.title === 'Bob Started It')!;
    expect(both.chip).toBe('BOTH PLAN');
    expect(both.chipKind).toBe('both');
    expect(started.chip).toBe('BOB STARTED');
    expect(started.note).toContain('bob is 2 episodes in');
  });

  it('boosts predictions for genres both users score above their mean', () => {
    const action = view.items.find((i) => i.title === 'Planned By Both')!;
    // base 8.0 plus a positive Action-genre nudge from both users
    expect(action.predicted).toBeGreaterThan(8);
    expect(action.note).toContain('Action');
  });

  it('counts planning overlap', () => {
    expect(view.planningA).toBe(3);
    expect(view.planningB).toBe(2);
    // 1 both-planned of 4 unique planned titles
    expect(view.overlapPct).toBe(25);
  });

  it('ranks picks by predicted score with medals', () => {
    expect(view.picks[0].title).toBe('Planned By Both');
    expect(view.picks[0].medal).toBe('gold');
    expect(view.picks[1].medal).toBe('silver');
  });
});

describe('sortBacklogItems', () => {
  const items = buildBacklog(
    list('a', [
      entry({ mediaId: 1, title: 'Old Popular', status: 'PLANNING', year: 2001, popularity: 9000, averageScore: 70 }),
      entry({ mediaId: 2, title: 'New Niche', status: 'PLANNING', year: 2024, popularity: 10, averageScore: 85 }),
    ]),
    list('b', [
      entry({ mediaId: 1, title: 'Old Popular', status: 'PLANNING', year: 2001, popularity: 9000, averageScore: 70 }),
      entry({ mediaId: 2, title: 'New Niche', status: 'PLANNING', year: 2024, popularity: 10, averageScore: 85 }),
    ]),
  ).items;

  it('sorts by predicted, popularity, or year', () => {
    expect(sortBacklogItems(items, 'Predicted score')[0].title).toBe('New Niche');
    expect(sortBacklogItems(items, 'Popularity')[0].title).toBe('Old Popular');
    expect(sortBacklogItems(items, 'Year')[0].title).toBe('New Niche');
  });
});
