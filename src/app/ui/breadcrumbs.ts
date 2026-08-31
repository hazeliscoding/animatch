import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Crumb {
  label: string;
  path?: string;
}

@Component({
  selector: 'hk-breadcrumbs',
  imports: [RouterLink],
  template: `
    <nav aria-label="Breadcrumbs">
      <ol class="crumbs">
        @for (item of items(); track item.label; let last = $last) {
          <li>
            @if (!last) {
              @if (item.path) {
                <a class="hk-link-plain" [routerLink]="item.path">{{ item.label }}</a>
              } @else {
                <a class="hk-link-plain" href="#" (click)="$event.preventDefault()">{{ item.label }}</a>
              }
              <span aria-hidden="true" class="sep">›</span>
            } @else {
              <span aria-current="page" class="current">{{ item.label }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    .crumbs {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: var(--text-xs);
    }
    li { display: flex; align-items: center; gap: 6px; }
    .sep { color: var(--color-text-muted); }
    .current { color: var(--color-text-secondary); }
  `,
})
export class HkBreadcrumbs {
  readonly items = input<Crumb[]>([]);
}
