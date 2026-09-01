import { Routes } from '@angular/router';
import { AuthCallbackPage } from './pages/auth-callback-page';
import { BacklogPage } from './pages/backlog-page';
import { ComparePage } from './pages/compare-page';
import { GroupsPage } from './pages/groups-page';
import { ProfilePage } from './pages/profile-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'compare' },
  { path: 'compare', component: ComparePage, title: 'Compare — AniMatch' },
  { path: 'backlog', component: BacklogPage, title: 'Shared backlog — AniMatch' },
  { path: 'groups', component: GroupsPage, title: 'Groups — AniMatch' },
  { path: 'profile', component: ProfilePage, title: 'My profile — AniMatch' },
  { path: 'auth/callback', component: AuthCallbackPage, title: 'Connecting — AniMatch' },
  { path: '**', redirectTo: 'compare' },
];
