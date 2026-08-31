import { AnimeEntry, AnilistUserList, EntryStatus } from '../api/anilist.service';
import { buildGroup } from './group-engine';

const entry = (over: Partial<AnimeEntry> & { mediaId: number; status: EntryStatus }): AnimeEntry => ({
  title: `Anime ${over.mediaId}`,
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

// carol shares taste with alice; bob is disjoint from both
const alice = list('alice', [
  entry({ mediaId: 1, status: 'COMPLETED', score: 9, genres: ['Action'] }),
  entry({ mediaId: 2, status: 'COMPLETED', score: 8, genres: ['Action'] }),
  entry({ mediaId: 3, status: 'COMPLETED', score: 4, genres: ['Drama'] }),
  entry({ mediaId: 10, title: 'Group Pick', status: 'PLANNING', popularity: 500 }),
  entry({ mediaId: 11, title: 'Duo Pick', status: 'PLANNING' }),
]);
const carol = list('carol', [
  entry({ mediaId: 1, status: 'COMPLETED', score: 8.5, genres: ['Action'] }),
  entry({ mediaId: 2, status: 'COMPLETED', score: 7.5, genres: ['Action'] }),
  entry({ mediaId: 3, status: 'COMPLETED', score: 5, genres: ['Drama'] }),
  entry({ mediaId: 10, title: 'Group Pick', status: 'PLANNING', popularity: 500 }),
  entry({ mediaId: 11, title: 'Duo Pick', status: 'CURRENT' }),
]);
const bob = list('bob', [
  entry({ mediaId: 20, status: 'COMPLETED', score: 6, genres: ['Romance'] }),
  entry({ mediaId: 21, status: 'COMPLETED', score: 7, genres: ['Romance'] }),
  entry({ mediaId: 10, title: 'Group Pick', status: 'PLANNING', popularity: 500 }),
]);

describe('buildGroup', () => {
  const view = buildGroup([alice, bob, carol]);

  it('builds a symmetric pairwise matrix with heat kinds', () => {
    // 3 users -> 3 header cells + 9 value cells
    expect(view.matrixCells).toHaveLength(12);
    const cellAt = (row: number, col: number) => view.matrixCells[row * 4 + 1 + col];
    expect(cellAt(0, 0).kind).toBe('self');
    expect(cellAt(0, 2).v).toBe(cellAt(2, 0).v); // alice×carol symmetric
    expect(cellAt(0, 2).kind).toBe('strong'); // near-identical scores
    expect(cellAt(0, 1).kind).toBe('weak'); // alice×bob disjoint
  });

  it('computes member stats and highlights', () => {
    expect(view.attrs.find((a) => a.label === 'Completed')!.values).toEqual(['3', '2', '3']);
    expect(view.attrs.find((a) => a.label === 'Top genre')!.values).toEqual([
      'Action',
      'Romance',
      'Action',
    ]);
    // alice and carol fit best with each other; either may hold the highlight
    expect([0, 2]).toContain(view.highlight['Fit with group']);
  });

  it('collects titles planned by 2+ members with who labels', () => {
    expect(view.backlog[0].title).toBe('Group Pick');
    expect(view.backlog[0].chip).toBe('3/3');
    expect(view.backlog[0].who).toBe('everyone');
    const duo = view.backlog.find((b) => b.title === 'Duo Pick')!;
    expect(duo.chip).toBe('2/3');
    expect(duo.who).toBe('all but bob');
    expect(view.backlogTotal).toBe(2);
  });
});
