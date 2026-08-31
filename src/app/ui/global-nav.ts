import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface NavItem {
  label: string;
  path?: string;
}

@Component({
  selector: 'hk-global-nav',
  imports: [RouterLink],
  template: `
    <nav aria-label="Global navigation" class="nav">
      <ul class="list">
        @for (item of items(); track item.label) {
          <li>
            @if (item.path) {
              <a
                class="item hk-link-plain"
                [routerLink]="item.path"
                [class.active]="item.label === active()"
                [attr.aria-current]="item.label === active() ? 'page' : null"
              >{{ item.label }}</a>
            } @else {
              <a class="item hk-link-plain" href="#" (click)="$event.preventDefault()">{{ item.label }}</a>
            }
          </li>
        }
      </ul>
    </nav>
  `,
  styles: `
    .nav { background: var(--color-primary); }
    .list {
      max-width: var(--container-max);
      margin: 0 auto;
      padding: 0 8px;
      display: flex;
      list-style: none;
      overflow-x: auto;
    }
    .item {
      display: block;
      padding: var(--nav-py) 14px;
      color: #fff;
      font-size: var(--text-md);
      font-weight: 400;
      text-decoration: none;
      white-space: nowrap;
    }
    .item:hover { background: var(--color-primary-hover); color: #fff; text-decoration: none; }
    .item.active { background: var(--color-primary-active); font-weight: 700; }
  `,
})
export class HkGlobalNav {
  readonly items = input<NavItem[]>([]);
  readonly active = input<string>();
}
