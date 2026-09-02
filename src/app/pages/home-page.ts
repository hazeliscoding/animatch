import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SAMPLE_PAIR } from '../anilist.config';
import { AuthService } from '../api/auth.service';
import { HistoryStore, relativeTime } from '../api/history-store';

@Component({
  selector: 'app-home-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly history = inject(HistoryStore);

  readonly nameA = signal('');
  readonly nameB = signal('');

  readonly rel = relativeTime;
  readonly samplePair = SAMPLE_PAIR;

  readonly steps = [
    {
      n: 1,
      title: 'Pick two AniList users',
      text: 'Any public profiles work — yours, a friend\'s, a stranger\'s with suspiciously good taste.',
    },
    {
      n: 2,
      title: 'See your taste match',
      text: 'A 0–100 score from real list data: score correlation, genre overlap, shared titles, and your biggest disagreements.',
    },
    {
      n: 3,
      title: 'Find what to watch together',
      text: 'Shared backlogs ranked by predicted mutual enjoyment, plus group matrices for whole watch clubs.',
    },
  ];

  readonly features = [
    {
      title: 'Head-to-head compare',
      text: 'Compatibility breakdown, score distributions, genre profiles, and the titles you scored furthest apart.',
      link: '/compare',
      cta: 'Open Compare',
    },
    {
      title: 'Shared backlog',
      text: 'Titles in both plan-to-watch lists, ranked by predicted mutual score, with watch-together picks.',
      link: '/backlog',
      cta: 'Open Shared backlog',
    },
    {
      title: 'Groups',
      text: 'Member stats, a pairwise taste-match matrix, and the backlog your whole watch club shares.',
      link: '/groups',
      cta: 'Open Groups',
    },
  ];

  constructor() {
    // When connected, you're probably one half of the comparison.
    effect(() => {
      const viewer = this.auth.viewer();
      if (viewer && !this.nameA()) this.nameA.set(viewer.name);
    });
  }

  compare() {
    const a = this.nameA().trim();
    const b = this.nameB().trim();
    if (!a && !b) return;
    void this.router.navigate(['/compare'], {
      queryParams: { a: a || b, b: a && b ? b : null },
    });
  }
}
