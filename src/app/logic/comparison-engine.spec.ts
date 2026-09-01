import { AnimeEntry, AnilistUserList } from '../api/anilist.service';
import {
  buildComparison,
  favoriteStudios,
  genreOverlap,
  histogram,
  pearson,
} from './comparison-engine';

const entry = (over: Partial<AnimeEntry> & { mediaId: number }): AnimeEntry => ({
  title: `Anime ${over.mediaId}`,
  status: 'COMPLETED',
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

describe('pearson', () => {
  it('is 1 for perfectly correlated scores', () => {
    expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
  });

  it('is -1 for perfectly anti-correlated scores', () => {
    expect(pearson([1, 2, 3], [6, 4, 2])).toBeCloseTo(-1);
  });

  it('is 0 with fewer than two points or zero variance', () => {
    expect(pearson([5], [5])).toBe(0);
    expect(pearson([5, 5, 5], [1, 2, 3])).toBe(0);
  });
});

describe('genreOverlap', () => {
  it('is 100 for identical genre mixes', () => {
    const a = [entry({ mediaId: 1, genres: ['Action', 'Drama'] })];
    const b = [entry({ mediaId: 2, genres: ['Action', 'Drama'] })];
    expect(genreOverlap(a, b)).toBe(100);
  });

  it('is 0 for disjoint genre mixes', () => {
    const a = [entry({ mediaId: 1, genres: ['Action'] })];
    const b = [entry({ mediaId: 2, genres: ['Romance'] })];
    expect(genreOverlap(a, b)).toBe(0);
  });
});

describe('favoriteStudios', () => {
  it('requires at least two scored titles with mean >= 8', () => {
    const entries = [
      entry({ mediaId: 1, score: 9, studios: ['Kyoto Animation'] }),
      entry({ mediaId: 2, score: 8, studios: ['Kyoto Animation'] }),
      entry({ mediaId: 3, score: 9, studios: ['One-Hit Studio'] }),
      entry({ mediaId: 4, score: 5, studios: ['Mid Studio'] }),
      entry({ mediaId: 5, score: 6, studios: ['Mid Studio'] }),
    ];
    const fav = favoriteStudios(entries);
    expect(fav.has('Kyoto Animation')).toBe(true);
    expect(fav.has('One-Hit Studio')).toBe(false);
    expect(fav.has('Mid Studio')).toBe(false);
  });
});

describe('histogram', () => {
  it('bins rounded scores 1-10 and scales the tallest bin to 60px', () => {
    const entries = [
      entry({ mediaId: 1, score: 8 }),
      entry({ mediaId: 2, score: 8.4 }),
      entry({ mediaId: 3, score: 10 }),
      entry({ mediaId: 4, score: null }),
    ];
    const bins = histogram(entries);
    expect(bins).toHaveLength(10);
    expect(bins[7]).toEqual({ bin: 8, px: 60, count: 2 });
    expect(bins[9]).toEqual({ bin: 10, px: 30, count: 1 });
    expect(bins[0]).toEqual({ bin: 1, px: 0, count: 0 });
  });
});

describe('buildComparison', () => {
  const a = list('alice', [
    entry({ mediaId: 1, score: 9, genres: ['Action'], studios: ['MAPPA'] }),
    entry({ mediaId: 2, score: 5, genres: ['Drama'], studios: ['MAPPA'] }),
    entry({ mediaId: 3, score: 8, genres: ['Action'] }),
  ]);
  const b = list('bob', [
    entry({ mediaId: 1, score: 8, genres: ['Action'], studios: ['MAPPA'] }),
    entry({ mediaId: 2, score: 9, genres: ['Drama'], studios: ['MAPPA'] }),
    entry({ mediaId: 4, score: 7, genres: ['Romance'] }),
  ]);

  it('summarizes users and counts shared titles', () => {
    const view = buildComparison(a, b);
    expect(view.userA.name).toBe('alice');
    expect(view.userA.completed).toBe(3);
    expect(view.userA.mean).toBeCloseTo(7.3, 1);
    expect(view.sharedTotal).toBe(2);
    expect(view.breakdown[2].note).toBe('2 of 4 unique titles');
  });

  it('ranks disagreements by absolute delta descending', () => {
    const view = buildComparison(a, b);
    expect(view.disagreements[0].diff).toBe('4.0');
    expect(view.disagreements[0].a).toBe('5.0');
    expect(view.disagreements[0].b).toBe('9.0');
  });

  it('keeps the compat score within 0-100', () => {
    const view = buildComparison(a, b);
    expect(view.compatScore).toBeGreaterThanOrEqual(0);
    expect(view.compatScore).toBeLessThanOrEqual(100);
  });
});
