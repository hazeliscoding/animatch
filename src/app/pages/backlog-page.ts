import { Component, signal } from '@angular/core';
import { HkBreadcrumbs } from '../ui/breadcrumbs';
import { HkButton } from '../ui/button';
import { HkModule } from '../ui/module';
import { HkTabs } from '../ui/tabs';
import { BACKLOG, BACKLOG_TABS, PICKS, USER_A, USER_B } from '../data/animatch-data';

@Component({
  selector: 'app-backlog-page',
  imports: [HkBreadcrumbs, HkButton, HkModule, HkTabs],
  templateUrl: './backlog-page.html',
  styleUrl: './backlog-page.css',
})
export class BacklogPage {
  readonly userA = USER_A;
  readonly userB = USER_B;
  readonly tabs = BACKLOG_TABS;
  readonly backlog = BACKLOG;
  readonly picks = PICKS;
  readonly activeTab = signal('Both plan to watch');
  readonly sort = signal('Predicted score');
  readonly sorts = ['Predicted score', 'Popularity', 'Year'];
  readonly crumbs = [
    { label: 'Home', path: '/compare' },
    { label: 'Compare', path: '/compare' },
    { label: 'Shared backlog' },
  ];
}
