import { Component } from '@angular/core';
import { HkBreadcrumbs } from '../ui/breadcrumbs';
import { HkButton } from '../ui/button';
import { HkComparisonTable } from '../ui/comparison-table';
import { HkModule } from '../ui/module';
import {
  GROUP_ATTRS,
  GROUP_BACKLOG,
  GROUP_HIGHLIGHT,
  GROUP_USERS,
  buildMatrixCells,
} from '../data/animatch-data';

@Component({
  selector: 'app-groups-page',
  imports: [HkBreadcrumbs, HkButton, HkComparisonTable, HkModule],
  templateUrl: './groups-page.html',
  styleUrl: './groups-page.css',
})
export class GroupsPage {
  readonly groupUsers = GROUP_USERS;
  readonly groupAttrs = GROUP_ATTRS;
  readonly groupHighlight = GROUP_HIGHLIGHT;
  readonly matrixCells = buildMatrixCells();
  readonly groupBacklog = GROUP_BACKLOG;
  readonly crumbs = [
    { label: 'Home', path: '/compare' },
    { label: 'Groups', path: '/groups' },
    { label: 'Saturday watch club' },
  ];
}
