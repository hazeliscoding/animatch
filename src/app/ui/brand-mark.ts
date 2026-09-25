import { Component, input } from '@angular/core';

/** Star paths for the twin-stars mark (64x64 viewBox), shared with the share card. */
export const MARK_FRONT_STAR = 'M22 8 Q24 22 38 24 Q24 26 22 40 Q20 26 6 24 Q20 22 22 8 Z';
export const MARK_BACK_STAR = 'M42 24 Q44 38 58 40 Q44 42 42 56 Q40 42 26 40 Q40 38 42 24 Z';

/** The AniMatch twin-stars mark; colors follow the theme via --color-brand-star*. */
@Component({
  selector: 'hk-brand-mark',
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path [attr.d]="back" fill="var(--color-brand-star-tint)" />
      <path [attr.d]="front" fill="var(--color-brand-star)" />
    </svg>
  `,
  styles: `
    :host { display: inline-flex; flex: none; }
  `,
})
export class HkBrandMark {
  readonly size = input(32);
  protected readonly front = MARK_FRONT_STAR;
  protected readonly back = MARK_BACK_STAR;
}
