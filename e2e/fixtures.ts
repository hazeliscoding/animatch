// Mocked AniList GraphQL responses shared by the e2e specs.

export const gqlMedia = (id: number, title: string, genres: string[], studio: string, extra: object = {}) => ({
  id,
  title: { userPreferred: title },
  format: 'TV',
  seasonYear: 2020,
  episodes: 12,
  genres,
  popularity: 1000,
  averageScore: 80,
  coverImage: { medium: null },
  studios: { nodes: [{ name: studio }] },
  ...extra,
});

const M1 = gqlMedia(1, 'Anime One', ['Action'], 'MAPPA');
const M2 = gqlMedia(2, 'Anime Two', ['Drama'], 'MAPPA');
const M3 = gqlMedia(3, 'Anime Three', ['Action'], 'Bones');
const M4 = gqlMedia(4, 'Anime Four', ['Romance'], 'Bones');
const P1 = gqlMedia(11, 'Monster Fixture', ['Mystery'], 'Madhouse', { averageScore: 87, popularity: 9000 });
const P2 = gqlMedia(12, 'Solo Plan', ['Comedy'], 'Bones', { popularity: 400 });
const P3 = gqlMedia(13, 'Started One', ['Drama'], 'MAPPA', { averageScore: 78 });

export const userFixture = (
  id: number,
  name: string,
  entries: { status: string; score: number; progress?: number; media: object }[],
) => ({
  data: {
    MediaListCollection: {
      user: { id, name, avatar: { medium: null } },
      lists: [{ isCustomList: false, entries: entries.map((e) => ({ progress: 0, ...e })) }],
    },
  },
});

export const FIXTURES: Record<string, unknown> = {
  alice: userFixture(1, 'alice', [
    { status: 'COMPLETED', score: 9, media: M1 },
    { status: 'COMPLETED', score: 4, media: M2 },
    { status: 'COMPLETED', score: 8, media: M3 },
    { status: 'PLANNING', score: 0, media: P1 },
    { status: 'PLANNING', score: 0, media: P2 },
    { status: 'PLANNING', score: 0, media: P3 },
  ]),
  bob: userFixture(2, 'bob', [
    { status: 'COMPLETED', score: 8.5, media: M1 },
    { status: 'COMPLETED', score: 9, media: M2 },
    { status: 'COMPLETED', score: 7, media: M4 },
    { status: 'PLANNING', score: 0, media: P1 },
    { status: 'CURRENT', score: 0, progress: 5, media: P3 },
  ]),
};
