import { Component, computed, input, signal } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
}

export type TableRow = Record<string, string>;

@Component({
  selector: 'hk-data-table',
  template: `
    <div class="wrap">
      <table class="table">
        <thead>
          <tr>
            @for (c of columns(); track c.key) {
              <th
                scope="col"
                [style.text-align]="c.align || 'left'"
                [attr.aria-sort]="sortKey() === c.key ? (sortDir() === 'asc' ? 'ascending' : 'descending') : null"
              >
                @if (c.sortable) {
                  <button type="button" class="sort-btn" (click)="toggleSort(c.key)">
                    {{ c.label }}
                    <span aria-hidden="true" class="arrows" [class.on]="sortKey() === c.key">{{
                      sortKey() === c.key ? (sortDir() === 'asc' ? '▲' : '▼') : '▲▼'
                    }}</span>
                  </button>
                } @else {
                  {{ c.label }}
                }
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of sortedRows(); track $index; let odd = $odd) {
            <tr [class.odd]="odd">
              @for (c of columns(); track c.key) {
                <td [style.text-align]="c.align || 'left'" [class.num]="c.align === 'right'">{{ row[c.key] }}</td>
              }
            </tr>
          } @empty {
            <tr><td class="empty" [attr.colspan]="columns().length">No matching items</td></tr>
          }
        </tbody>
        @if (footer().length) {
          <tfoot>
            <tr>
              @for (f of footer(); track $index; let i = $index) {
                <td [style.text-align]="columns()[i]?.align || 'left'">{{ f }}</td>
              }
            </tr>
          </tfoot>
        }
      </table>
    </div>
  `,
  styles: `
    .wrap { overflow-x: auto; }
    .table { width: 100%; font-size: var(--text-sm); border-top: 2px solid var(--color-border-strong); }
    th {
      padding: var(--table-py) var(--table-px);
      background: var(--color-surface-subtle);
      border-bottom: 1px solid var(--color-border);
      font-weight: 700;
      font-size: var(--text-xs);
      color: var(--color-text-secondary);
      white-space: nowrap;
    }
    .sort-btn {
      border: 0;
      background: transparent;
      padding: 0;
      font: inherit;
      color: inherit;
      cursor: pointer;
      white-space: nowrap;
    }
    .arrows { margin-left: 4px; font-size: 10px; color: var(--color-text-muted); }
    .arrows.on { color: var(--color-primary); }
    td { padding: var(--table-py) var(--table-px); border-bottom: var(--border-subtle); line-height: 1.5; }
    td.num { font-variant-numeric: tabular-nums; }
    tbody tr { background: var(--color-surface); }
    tbody tr.odd { background: var(--color-surface-subtle); }
    td.empty { padding: 24px 12px; text-align: center; color: var(--color-text-muted); }
    tfoot td {
      font-weight: 700;
      background: var(--color-surface-subtle);
      border-top: 2px solid var(--color-border-strong);
    }
  `,
})
export class HkDataTable {
  readonly columns = input<TableColumn[]>([]);
  readonly rows = input<TableRow[]>([]);
  readonly footer = input<string[]>([]);

  readonly sortKey = signal<string | null>(null);
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  readonly sortedRows = computed(() => {
    const key = this.sortKey();
    if (!key) return this.rows();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return [...this.rows()].sort((a, b) => {
      const av = a[key] ?? '';
      const bv = b[key] ?? '';
      const an = parseFloat(av);
      const bn = parseFloat(bv);
      if (!isNaN(an) && !isNaN(bn)) return (an - bn) * dir;
      return av.localeCompare(bv) * dir;
    });
  });

  toggleSort(key: string) {
    if (this.sortKey() === key) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }
}
