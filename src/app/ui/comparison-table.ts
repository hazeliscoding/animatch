import { Component, input } from '@angular/core';

export interface ComparisonAttribute {
  label: string;
  values: string[];
}

@Component({
  selector: 'hk-comparison-table',
  template: `
    <div class="wrap">
      <table class="table">
        <thead>
          <tr>
            <th class="corner"></th>
            @for (p of products(); track p) {
              <th scope="col" class="prod">{{ p }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (attr of attributes(); track attr.label) {
            <tr>
              <th scope="row" class="attr">{{ attr.label }}</th>
              @for (v of attr.values; track $index; let c = $index) {
                <td class="val" [class.best]="highlight()[attr.label] === c">
                  {{ v }}
                  @if (highlight()[attr.label] === c) {
                    <span class="hk-visually-hidden">(highest)</span>
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .wrap { overflow-x: auto; }
    .table { width: 100%; font-size: var(--text-sm); border: var(--border-thin); }
    th, td { padding: var(--table-py) var(--table-px); border: var(--border-subtle); white-space: nowrap; }
    th {
      background: var(--color-surface-subtle);
      font-weight: 700;
      font-size: var(--text-xs);
    }
    .corner { width: 130px; position: sticky; left: 0; z-index: 1; }
    .prod { text-align: center; min-width: 120px; }
    .attr { text-align: left; position: sticky; left: 0; z-index: 1; }
    .val {
      text-align: center;
      font-variant-numeric: tabular-nums;
      background: var(--color-surface);
    }
    .val.best { background: var(--color-success-subtle); font-weight: 700; color: var(--green-700); }
    .corner, .attr { background: var(--color-surface-subtle); }
  `,
})
export class HkComparisonTable {
  readonly products = input<string[]>([]);
  readonly attributes = input<ComparisonAttribute[]>([]);
  readonly highlight = input<Record<string, number>>({});
}
