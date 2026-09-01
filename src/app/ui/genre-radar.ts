import { Component, computed, input } from '@angular/core';
import { GenreRow } from '../data/animatch-data';

interface Vertex {
  x: number;
  y: number;
  label: string;
  value: number;
  anchor: 'start' | 'middle' | 'end';
  labelX: number;
  labelY: number;
}

const CX = 180;
const CY = 128;
const R = 86;

@Component({
  selector: 'hk-genre-radar',
  template: `
    <svg viewBox="0 0 360 256" role="img" [attr.aria-label]="'Genre radar for ' + nameA() + ' and ' + nameB()">
      <!-- rings -->
      @for (ring of rings(); track ring.f) {
        <polygon [attr.points]="ring.points" class="ring" />
      }
      <!-- spokes + labels -->
      @for (v of vertsA(); track v.label) {
        <line [attr.x1]="cx" [attr.y1]="cy" [attr.x2]="v.x" [attr.y2]="v.y" class="spoke" />
      }
      @for (v of labelVerts(); track v.label) {
        <text [attr.x]="v.labelX" [attr.y]="v.labelY" [attr.text-anchor]="v.anchor" class="axis-label">
          {{ v.label }}
        </text>
      }
      <text [attr.x]="cx + 4" [attr.y]="cy - r - 2" class="scale-label">{{ scaleMax() }}%</text>
      <!-- series -->
      <polygon [attr.points]="pointsA()" class="series a" />
      <polygon [attr.points]="pointsB()" class="series b" />
      @for (v of vertsA(); track v.label) {
        <circle [attr.cx]="v.x" [attr.cy]="v.y" r="3.5" class="dot a" />
        <circle [attr.cx]="v.x" [attr.cy]="v.y" r="10" class="hit">
          <title>{{ v.label }} — {{ nameA() }}: {{ v.value }}%</title>
        </circle>
      }
      @for (v of vertsB(); track v.label) {
        <circle [attr.cx]="v.x" [attr.cy]="v.y" r="3.5" class="dot b" />
        <circle [attr.cx]="v.x" [attr.cy]="v.y" r="10" class="hit">
          <title>{{ v.label }} — {{ nameB() }}: {{ v.value }}%</title>
        </circle>
      }
    </svg>
  `,
  styles: `
    :host { display: block; }
    svg { width: 100%; height: auto; display: block; }
    .ring { fill: none; stroke: var(--color-border-subtle); stroke-width: 1; }
    .spoke { stroke: var(--color-border-subtle); stroke-width: 1; }
    .axis-label { font-size: 11px; fill: var(--color-text-secondary); }
    .scale-label { font-size: 9px; fill: var(--color-text-muted); }
    .series { stroke-width: 2; }
    .series.a { stroke: var(--blue-600); fill: var(--blue-600); fill-opacity: 0.14; }
    .series.b { stroke: var(--orange-600); fill: var(--orange-600); fill-opacity: 0.14; }
    .dot.a { fill: var(--blue-600); }
    .dot.b { fill: var(--orange-600); }
    .hit { fill: transparent; }
  `,
})
export class HkGenreRadar {
  readonly genres = input<GenreRow[]>([]);
  readonly nameA = input('');
  readonly nameB = input('');

  readonly cx = CX;
  readonly cy = CY;
  readonly r = R;

  readonly scaleMax = computed(() => {
    const max = Math.max(10, ...this.genres().flatMap((g) => [g.aPct, g.bPct]));
    return Math.ceil(max / 20) * 20;
  });

  private vertex(index: number, value: number): Vertex {
    const g = this.genres()[index];
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / this.genres().length;
    const rad = (value / this.scaleMax()) * R;
    const x = CX + Math.cos(angle) * rad;
    const y = CY + Math.sin(angle) * rad;
    const lx = CX + Math.cos(angle) * (R + 12);
    const ly = CY + Math.sin(angle) * (R + 12);
    const cos = Math.cos(angle);
    return {
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      label: g.name,
      value,
      anchor: cos > 0.35 ? 'start' : cos < -0.35 ? 'end' : 'middle',
      labelX: Math.round(lx * 10) / 10,
      labelY: Math.round((ly + (Math.sin(angle) > 0.35 ? 8 : Math.sin(angle) < -0.35 ? -2 : 4)) * 10) / 10,
    };
  }

  readonly vertsA = computed(() => this.genres().map((g, i) => this.vertex(i, g.aPct)));
  readonly vertsB = computed(() => this.genres().map((g, i) => this.vertex(i, g.bPct)));
  readonly labelVerts = computed(() => this.genres().map((_, i) => this.vertex(i, this.scaleMax())));

  readonly pointsA = computed(() => this.vertsA().map((v) => `${v.x},${v.y}`).join(' '));
  readonly pointsB = computed(() => this.vertsB().map((v) => `${v.x},${v.y}`).join(' '));

  readonly rings = computed(() =>
    [0.25, 0.5, 0.75, 1].map((f) => ({
      f,
      points: this.genres()
        .map((_, i) => {
          const angle = -Math.PI / 2 + (2 * Math.PI * i) / this.genres().length;
          const x = CX + Math.cos(angle) * R * f;
          const y = CY + Math.sin(angle) * R * f;
          return `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
        })
        .join(' '),
    })),
  );
}
