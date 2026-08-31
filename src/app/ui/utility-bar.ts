import { Component, input } from '@angular/core';

@Component({
  selector: 'hk-utility-bar',
  template: `
    <div class="bar">
      <div class="inner">
        <div class="side left">
          @for (l of left(); track l) {
            <a href="#" class="hk-link-quiet" (click)="$event.preventDefault()">{{ l }}</a>
          }
        </div>
        <div class="side">
          @for (r of right(); track r) {
            <a href="#" class="hk-link-quiet" (click)="$event.preventDefault()">{{ r }}</a>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    .bar { background: var(--color-surface); border-bottom: var(--border-subtle); }
    .inner {
      max-width: var(--container-max);
      margin: 0 auto;
      padding: 4px 16px;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      color: var(--color-text-secondary);
    }
    .side { display: flex; gap: 14px; }
    .side.left { flex-wrap: wrap; }
    a { font-size: var(--text-xs); }
  `,
})
export class HkUtilityBar {
  readonly left = input<string[]>([]);
  readonly right = input<string[]>([]);
}
