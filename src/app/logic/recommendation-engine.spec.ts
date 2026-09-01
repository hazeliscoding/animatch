import { AnimeEntry, AnilistUserList, CandidateMedia, EntryStatus } from '../api/anilist.service';
import { buildRecommendations } from './recommendation-engine';

let nextId = 100;
const entry = (over: Partial<AnimeEntry> & { status: EntryStatus }): AnimeEntry => ({
  mediaId: over.mediaId ?? nextId++,
  title: `Anime ${over.mediaId ?? nextId}`,
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

const media = (id: number, title: string, over: Partial<CandidateMedia> = {}): CandidateMedia => ({
  id,
  title,
  format: 'TV',
  year: 2021,
  episodes: 12,
  genres: [],
  cover: null,
  averageScore: 75,
  popularity: 1000,
  ...over,
});

const list = (name: string, entries: AnimeEntry[]): AnilistUserList => ({ id: 1, name, avatar: null, entries });

// both users score Action well above their means
const history = (): AnimeEntry[] => [
  entry({ status: 'COMPLETED', score: 9, genres: ['Action'] }),
  entry({ status: 'COMPLETED', score: 9, genres: ['Action'] }),
  entry({ status: 'COMPLETED', score: 9, genres: ['Action'] }),
  entry({ status: 'COMPLETED', score: 5, genres: ['Romance'] }),
  entry({ status: 'COMPLETED', score: 5, genres: ['Romance'] }),
  entry({ status: 'COMPLETED', score: 5, genres: ['Romance'] }),
];

describe('buildRecommendations', () => {
  const a = list('alice', [...history(), entry({ mediaId: 1, status: 'PLANNING' })]);
  const b = list('bob', [...history(), entry({ mediaId: 2, status: 'COMPLETED', score: 7 })]);
  const candidates = [
    media(1, 'Already Planned'),
    media(2, 'Already Seen'),
    media(3, 'Action Hit', { genres: ['Action'], averageScore: 80 }),
    media(4, 'Romance Slog', { genres: ['Romance'], averageScore: 80 }),
    media(5, 'Acclaimed Unknown-Genre', { genres: ['Mystery'], averageScore: 90 }),
    media(6, 'Mid Popular', { genres: ['Sports'], averageScore: 70 }),
  ];
  const recs = buildRecommendations(a, b, candidates);

  it('excludes anything either user already has listed, any status', () => {
    const titles = recs.map((r) => r.title);
    expect(titles).not.toContain('Already Planned');
    expect(titles).not.toContain('Already Seen');
    expect(titles).toHaveLength(4);
  });

  it('ranks genre-fitting titles above equally-rated poor fits', () => {
    const actionIdx = recs.findIndex((r) => r.title === 'Action Hit');
    const romanceIdx = recs.findIndex((r) => r.title === 'Romance Slog');
    expect(actionIdx).toBeLessThan(romanceIdx);
    expect(recs[actionIdx].predicted).toBeGreaterThan(8);
    expect(recs[romanceIdx].predicted).toBeLessThan(8);
  });

  it('writes reasons by best available signal', () => {
    expect(recs.find((r) => r.title === 'Action Hit')!.reason).toBe("Fits both users' Action taste");
    expect(recs.find((r) => r.title === 'Acclaimed Unknown-Genre')!.reason).toBe('Loved site-wide · 90/100');
    expect(recs.find((r) => r.title === 'Mid Popular')!.reason).toBe('Popular with AniList users');
  });

  it('respects the limit', () => {
    expect(buildRecommendations(a, b, candidates, 2)).toHaveLength(2);
  });
});
