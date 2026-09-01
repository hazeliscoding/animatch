import { Component, input } from '@angular/core';

export type ModuleAccent = 'bar' | 'tint' | 'none';

@Component({
  selector: 'hk-module',
  template: `
    <section class="module">
      <header class="head" [class.tint]="accent() === 'tint'" [class.bar]="accent() === 'bar'">
        <h2 class="title">{{ title() }}</h2>
        @if (action(); as a) {
          <span class="action">{{ a }}</span>
        }
      </header>
      <div class="body" [class.pad]="pad()">
        <ng-content />
      </div>
      @if (footer(); as f) {
        <footer class="foot">{{ f }}</footer>
      }
    </section>
  `,
  styles: `
    .module {
      background: var(--color-surface);
      border: var(--border-thin);
      border-radius: var(--radius-module);
      overflow: hidden;
    }
    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 7px var(--module-pad);
      background: var(--color-surface-subtle);
      border-bottom: var(--border-thin);
    }
    .head.bar { border-left: 3px solid var(--color-primary); }
    .head.tint { background: var(--color-primary-subtle); }
    .title { font-size: var(--text-md); font-weight: 700; }
    .action { font-size: var(--text-xs); white-space: nowrap; color: var(--color-text-secondary); }
    .body.pad { padding: var(--module-pad); }
    .foot {
      padding: 6px var(--module-pad);
      border-top: var(--border-subtle);
      background: var(--color-surface-subtle);
      font-size: var(--text-sm);
      text-align: right;
    }
  `,
})
export class HkModule {
  readonly title = input.required<string>();
  readonly action = input<string>();
  readonly footer = input<string>();
  readonly accent = input<ModuleAccent>('bar');
  readonly pad = input(false);
}
