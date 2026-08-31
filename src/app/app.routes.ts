import { Routes } from '@angular/router';
import { BacklogPage } from './pages/backlog-page';
import { ComparePage } from './pages/compare-page';
import { GroupsPage } from './pages/groups-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'compare' },
  { path: 'compare', component: ComparePage, title: 'Compare — AniMatch' },
  { path: 'backlog', component: BacklogPage, title: 'Shared backlog — AniMatch' },
  { path: 'groups', component: GroupsPage, title: 'Groups — AniMatch' },
  { path: '**', redirectTo: 'compare' },
];
