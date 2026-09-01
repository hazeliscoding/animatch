import { Component, input, output } from '@angular/core';

@Component({
  selector: 'hk-search-input',
  template: `
    <form role="search" class="search" [class.lg]="size() === 'lg'" (submit)="onSubmit($event)">
      <input
        #q
        type="search"
        [placeholder]="placeholder()"
        [attr.aria-label]="placeholder()"
        class="input"
        (input)="query.emit(q.value)"
        (keydown.escape)="q.value = ''; query.emit('')"
      />
      <button type="submit" class="submit">{{ buttonLabel() }}</button>
    </form>
  `,
  styles: `
    .search { display: flex; align-items: stretch; height: var(--control-height); }
    .search.lg { height: var(--control-height-lg); }
    .input {
      flex: 1;
      min-width: 0;
      padding: 0 12px;
      font-size: var(--control-font);
      border: 2px solid var(--color-primary);
      border-right: 0;
      border-radius: var(--radius-control) 0 0 var(--radius-control);
      background: var(--color-surface);
    }
    .search.lg .input { font-size: var(--text-base); }
    .submit {
      padding: 0 20px;
      font-size: var(--control-font);
      font-weight: 700;
      color: #fff;
      background: var(--color-primary);
      border: 2px solid var(--color-primary);
      border-radius: 0 var(--radius-control) var(--radius-control) 0;
      cursor: pointer;
    }
    .search.lg .submit { font-size: var(--text-base); }
  `,
})
export class HkSearchInput {
  readonly placeholder = input('Search');
  readonly buttonLabel = input('Search');
  readonly size = input<'md' | 'lg'>('md');
  readonly search = output<string>();
  /** Emits on every keystroke (typeahead); empty string on Escape. */
  readonly query = output<string>();

  onSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const value = (form.querySelector('input') as HTMLInputElement).value;
    this.search.emit(value);
  }
}
