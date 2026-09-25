import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HkBrandMark } from './brand-mark';

@Component({
  selector: 'hk-global-header',
  imports: [RouterLink, HkBrandMark],
  template: `
    <header class="header">
      <div class="inner">
        <a routerLink="/" class="brand hk-link-quiet">
          <hk-brand-mark [size]="30" />
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
    .brand { display: flex; align-items: center; gap: 8px; text-decoration: none; white-space: nowrap; }
    .tagline { align-self: flex-end; margin-bottom: 3px; }
    .wordmark {
      font-family: 'Outfit', sans-serif;
      font-size: 24px;
      font-weight: 700;
      line-height: 1;
      color: var(--color-text);
      letter-spacing: -0.02em;
    }
    .tagline { font-size: var(--text-xs); color: var(--color-text-muted); }
    .middle { flex: 1; min-width: 0; }
  `,
})
export class HkGlobalHeader {
  readonly brand = input.required<string>();
  readonly tagline = input<string>();
}
