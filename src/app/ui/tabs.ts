import { Component, input, output } from '@angular/core';

export interface TabItem {
  label: string;
  count?: number;
}

@Component({
  selector: 'hk-tabs',
  template: `
    <div role="tablist" class="tabs" [class.sm]="size() === 'sm'">
      @for (item of items(); track item.label) {
        <button
          role="tab"
          type="button"
          [attr.aria-selected]="item.label === active()"
          class="tab"
          [class.sel]="item.label === active()"
          (click)="change.emit(item.label)"
        >
          {{ item.label }}
          @if (item.count != null) {
            <span class="count">{{ item.count.toLocaleString() }}</span>
          }
        </button>
      }
    </div>
  `,
  styles: `
    .tabs { display: flex; border-bottom: 2px solid var(--color-primary); overflow-x: auto; }
    .tab {
      padding: 8px 16px;
      font-size: var(--text-md);
      font-weight: 400;
      color: var(--color-link);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-bottom: 0;
      border-radius: var(--radius-4) var(--radius-4) 0 0;
      margin-right: 2px;
      cursor: pointer;
      white-space: nowrap;
    }
    .tabs.sm .tab { padding: 5px 12px; font-size: var(--text-sm); }
    .tab.sel { font-weight: 700; color: #fff; background: var(--color-primary); }
    .count { margin-left: 5px; font-size: var(--text-xs); font-weight: 400; opacity: 0.85; font-variant-numeric: tabular-nums; }
  `,
})
export class HkTabs {
  readonly items = input<TabItem[]>([]);
  readonly active = input<string>();
  readonly size = input<'md' | 'sm'>('md');
  readonly change = output<string>();
}
