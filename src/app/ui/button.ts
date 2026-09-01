import { Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'neutral' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'hk-button',
  template: `
    <button
      [type]="type()"
      [disabled]="disabled()"
      class="hk-btn"
      [class]="'v-' + variant() + ' s-' + size()"
      [class.block]="block()"
    >
      <ng-content />
    </button>
  `,
  styles: `
    :host { display: inline-flex; }
    :host(.block) { display: flex; }
    .hk-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: var(--control-height);
      padding: 0 var(--control-px);
      font-size: var(--control-font);
      font-weight: 700;
      border-radius: var(--radius-control);
      cursor: pointer;
      white-space: nowrap;
      line-height: 1;
    }
    .hk-btn:disabled { cursor: default; opacity: 0.45; }
    .hk-btn.block { display: flex; width: 100%; }
    .s-sm { height: var(--control-height-sm); }
    /* comfortable touch targets on touch-sized viewports */
    @media (max-width: 719px) {
      .hk-btn { min-height: 44px; }
    }
    .s-lg { height: var(--control-height-lg); font-size: var(--text-base); }
    .v-primary { background: var(--color-primary); color: #fff; border: 1px solid var(--color-primary); }
    .v-primary:hover:not(:disabled) { filter: brightness(0.92); }
    /* --color-link equals --color-primary in light and stays readable in dark */
    .v-secondary { background: var(--color-surface); color: var(--color-link); border: 1px solid var(--color-link); }
    .v-neutral { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border-strong); }
    .v-danger { background: var(--color-danger); color: #fff; border: 1px solid var(--color-danger); }
    .v-danger:hover:not(:disabled) { filter: brightness(0.92); }
    .v-ghost { background: transparent; color: var(--color-link); border: 1px solid transparent; font-weight: 400; }
    .v-secondary:hover:not(:disabled), .v-neutral:hover:not(:disabled) { background: var(--color-surface-subtle); }
    .v-ghost:hover:not(:disabled) { text-decoration: underline; background: transparent; }
  `,
})
export class HkButton {
  readonly variant = input<ButtonVariant>('neutral');
  readonly size = input<ButtonSize>('md');
  readonly block = input(false);
  readonly disabled = input(false);
  readonly type = input<'button' | 'submit'>('button');
}
