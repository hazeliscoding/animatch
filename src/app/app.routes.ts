import { Routes } from '@angular/router';
import { AuthCallbackPage } from './pages/auth-callback-page';
import { BacklogPage } from './pages/backlog-page';
import { ComparePage } from './pages/compare-page';
import { GroupsPage } from './pages/groups-page';
import { HomePage } from './pages/home-page';
import { ProfilePage } from './pages/profile-page';
import { RecommendationsPage } from './pages/recommendations-page';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomePage,
    title: 'AniMatch — compare anime taste with friends',
    data: {
      description:
        'Compare two AniList profiles — scores, genres, and backlogs — to see how compatible your anime taste is and what to watch together. Free, no account needed.',
    },
  },
  {
    path: 'compare',
    component: ComparePage,
    title: 'Compare — AniMatch',
    data: {
      description:
        'Head-to-head AniList comparison: a 0–100 taste match with score correlation, genre overlap, biggest disagreements, and every title you both scored.',
    },
  },
  {
    path: 'backlog',
    component: BacklogPage,
    title: 'Shared backlog — AniMatch',
    data: {
      description:
        "See the anime in both AniList plan-to-watch lists, ranked by predicted mutual score, with watch-together picks and what you're both currently watching.",
    },
  },
  {
    path: 'groups',
    component: GroupsPage,
    title: 'Groups — AniMatch',
    data: {
      description:
        'Build a watch club from 2–5 AniList users: member stats side by side, a pairwise taste-match matrix, and the backlog your whole group shares.',
    },
  },
  {
    path: 'recommendations',
    component: RecommendationsPage,
    title: 'Recommendations — AniMatch',
    data: {
      description:
        "Anime recommendations for two AniList users: popular and highest-rated titles neither of you has listed, ranked by predicted mutual enjoyment.",
    },
  },
  {
    path: 'profile',
    component: ProfilePage,
    title: 'My profile — AniMatch',
    data: {
      description:
        'Your AniList profile at a glance: list counts, score distribution, genre taste with per-genre means, and your highest-rated studios.',
    },
  },
  { path: 'auth/callback', component: AuthCallbackPage, title: 'Connecting — AniMatch' },
  { path: '**', redirectTo: '' },
];
