// Pair recommendations: rank catalog candidates neither user has listed
// by predicted mutual enjoyment (site average + both users' genre affinity).

import { AnilistUserList, CandidateMedia } from '../api/anilist.service';
import { bestGenre, genreStatsOf, predictedScore } from './backlog-engine';
import { completedOf } from './comparison-engine';

export interface RecommendationView {
  mediaId: number;
  title: string;
  meta: string;
  genres: string;
  cover: string | null;
  predicted: number;
  avg: number | null;
  reason: string;
}

const fmt1 = (v: number) => (Math.round(v * 10) / 10).toFixed(1);
export const fmtRec = fmt1;

export function buildRecommendations(
  a: AnilistUserList,
  b: AnilistUserList,
  candidates: CandidateMedia[],
  limit = 20,
): RecommendationView[] {
  const owned = new Set<number>([
    ...a.entries.map((e) => e.mediaId),
    ...b.entries.map((e) => e.mediaId),
  ]);
  const statsA = genreStatsOf(completedOf(a));
  const statsB = genreStatsOf(completedOf(b));

  return candidates
    .filter((c) => !owned.has(c.id))
    .map((c) => {
      const genre = bestGenre(statsA, statsB, c);
      const reason = genre
        ? `Fits both users' ${genre} taste`
        : c.averageScore != null && c.averageScore >= 85
          ? `Loved site-wide · ${c.averageScore}/100`
          : 'Popular with AniList users';
      return {
        mediaId: c.id,
        title: c.title,
        meta: [c.format ?? '—', c.year != null ? String(c.year) : '—', c.episodes != null ? `${c.episodes} ep` : null]
          .filter(Boolean)
          .join(' · '),
        genres: c.genres.slice(0, 3).join(' / '),
        cover: c.cover,
        predicted: predictedScore(statsA, statsB, c),
        avg: c.averageScore,
        reason,
      };
    })
    .sort((x, y) => y.predicted - x.predicted)
    .slice(0, limit);
}
