import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'hk-global-header',
  imports: [RouterLink],
  template: `
    <header class="header">
      <div class="inner">
        <a routerLink="/" class="brand hk-link-quiet">
          <span class="wordmark">{{ brand() }}</span>
          @if (tagline(); as t) {
            <span class="tagline">{{ t }}</span>
          }
        </a>
        <div class="middle"><ng-content /></div>
      </div>
    </header>
  `,
  styles: `
    .header { background: var(--color-surface); border-bottom: 2px solid var(--color-primary); }
    .inner {
      max-width: var(--container-max);
      margin: 0 auto;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .brand { display: flex; align-items: baseline; gap: 6px; text-decoration: none; white-space: nowrap; }
    .wordmark {
      font-size: 24px;
      font-weight: 700;
      color: var(--color-primary);
      letter-spacing: 0.02em;
      font-feature-settings: 'palt';
    }
    .tagline { font-size: var(--text-xs); color: var(--color-text-muted); }
    .middle { flex: 1; min-width: 0; }
  `,
})
export class HkGlobalHeader {
  readonly brand = input.required<string>();
  readonly tagline = input<string>();
}
