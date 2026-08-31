import { Component } from '@angular/core';
import { HkBreadcrumbs } from '../ui/breadcrumbs';
import { HkButton } from '../ui/button';
import { HkDataTable } from '../ui/data-table';
import { HkModule } from '../ui/module';
import {
  BREAKDOWN,
  COMPAT_SCORE,
  DISAGREEMENTS,
  GENRES,
  HIST_A,
  HIST_B,
  SHARED_COLS,
  SHARED_FOOTER,
  SHARED_ROWS,
  USER_A,
  USER_B,
} from '../data/animatch-data';

@Component({
  selector: 'app-compare-page',
  imports: [HkBreadcrumbs, HkButton, HkDataTable, HkModule],
  templateUrl: './compare-page.html',
  styleUrl: './compare-page.css',
})
export class ComparePage {
  readonly userA = USER_A;
  readonly userB = USER_B;
  readonly compatScore = COMPAT_SCORE;
  readonly breakdown = BREAKDOWN;
  readonly disagreements = DISAGREEMENTS;
  readonly disagreementsMobile = DISAGREEMENTS.slice(0, 3);
  readonly sharedCols = SHARED_COLS;
  readonly sharedRows = SHARED_ROWS;
  readonly sharedFooter = SHARED_FOOTER;
  readonly histA = HIST_A;
  readonly histB = HIST_B;
  readonly genres = GENRES;
  readonly crumbs = [
    { label: 'Home', path: '/compare' },
    { label: 'Compare', path: '/compare' },
    { label: 'yuki_47 × renko_lists' },
  ];
}
