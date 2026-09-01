import { Routes } from '@angular/router';
import { AuthCallbackPage } from './pages/auth-callback-page';
import { BacklogPage } from './pages/backlog-page';
import { ComparePage } from './pages/compare-page';
import { GroupsPage } from './pages/groups-page';
import { HomePage } from './pages/home-page';
import { ProfilePage } from './pages/profile-page';
import { RecommendationsPage } from './pages/recommendations-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomePage, title: 'AniMatch — compare anime taste with friends' },
  { path: 'compare', component: ComparePage, title: 'Compare — AniMatch' },
  { path: 'backlog', component: BacklogPage, title: 'Shared backlog — AniMatch' },
  { path: 'groups', component: GroupsPage, title: 'Groups — AniMatch' },
  { path: 'recommendations', component: RecommendationsPage, title: 'Recommendations — AniMatch' },
  { path: 'profile', component: ProfilePage, title: 'My profile — AniMatch' },
  { path: 'auth/callback', component: AuthCallbackPage, title: 'Connecting — AniMatch' },
  { path: '**', redirectTo: '' },
];
