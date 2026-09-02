// Renders a 1200x630 share card for a comparison, drawn from the live CSS
// tokens so it matches the user's current theme (light or dark).

import { SITE_URL } from '../anilist.config';
import { ComparisonView } from './comparison-engine';

const W = 1200;
const H = 630;

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const done = (ok: boolean) => resolve(ok ? img : null);
    img.onload = () => done(true);
    img.onerror = () => done(false);
    setTimeout(() => done(false), 4000);
    // cache-bust: the page's plain <img> may have cached this URL without
    // CORS headers, which would make the crossOrigin request here fail
    img.src = url + (url.includes('?') ? '&' : '?') + 'card=1';
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawAvatar(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  initial: string,
  x: number,
  y: number,
  size: number,
  tintBg: string,
  tintFg: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  if (img) {
    try {
      ctx.drawImage(img, x, y, size, size);
    } catch {
      img = null;
    }
  }
  if (!img) {
    ctx.fillStyle = tintBg;
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = tintFg;
    ctx.font = `700 ${Math.round(size * 0.42)}px "Noto Sans JP", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial, x + size / 2, y + size / 2 + size * 0.03);
  }
  ctx.restore();
}

export async function renderShareCard(view: ComparisonView, scoreHint: string): Promise<Blob> {
  await document.fonts.ready;
  await Promise.allSettled([
    document.fonts.load('700 120px "Noto Sans JP"'),
    document.fonts.load('400 24px "Noto Sans JP"'),
  ]);

  const [imgA, imgB] = await Promise.all([
    view.userA.avatar ? loadImage(view.userA.avatar) : Promise.resolve(null),
    view.userB.avatar ? loadImage(view.userB.avatar) : Promise.resolve(null),
  ]);

  const bg = token('--color-background') || '#f4f5f7';
  const surface = token('--color-surface') || '#ffffff';
  const text = token('--color-text') || '#1f2328';
  const secondary = token('--color-text-secondary') || '#5f6673';
  const muted = token('--color-text-muted') || '#6b7280';
  const primary = token('--color-primary') || '#0f57c2';
  const scoreColor = token('--blue-700') || '#0c46a0';
  const track = token('--gray-150') || '#eceef1';
  const blueTintBg = token('--blue-100') || '#dbe8fb';
  const orangeTintBg = token('--orange-50') || '#fdf3e7';
  const orangeFg = token('--orange-700') || '#a35000';

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // background + top accent
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = primary;
  ctx.fillRect(0, 0, W, 10);

  // panel
  ctx.fillStyle = surface;
  roundRect(ctx, 40, 44, W - 80, H - 88, 14);
  ctx.fill();

  // brand: AM mark + wordmark
  ctx.fillStyle = primary;
  roundRect(ctx, 80, 84, 56, 56, 13);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 24px "Noto Sans JP", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AM', 108, 114);
  ctx.textAlign = 'left';
  ctx.fillStyle = primary;
  ctx.font = '700 34px "Noto Sans JP", sans-serif';
  ctx.fillText('AniMatch', 152, 114);
  ctx.fillStyle = muted;
  ctx.font = '400 18px "Noto Sans JP", sans-serif';
  ctx.fillText('for AniList', 318, 118);

  // users: avatar A  nameA × nameB  avatar B
  const avatarSize = 76;
  const namesY = 226;
  ctx.font = '700 40px "Noto Sans JP", sans-serif';
  const nameAWidth = ctx.measureText(view.userA.name).width;
  const xWidth = ctx.measureText(' × ').width;
  const nameBWidth = ctx.measureText(view.userB.name).width;
  const total = avatarSize + 20 + nameAWidth + xWidth + nameBWidth + 20 + avatarSize;
  let x = (W - total) / 2;
  drawAvatar(ctx, imgA, view.userA.initial, x, namesY - avatarSize / 2, avatarSize, blueTintBg, scoreColor);
  x += avatarSize + 20;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = text;
  ctx.font = '700 40px "Noto Sans JP", sans-serif';
  ctx.fillText(view.userA.name, x, namesY);
  x += nameAWidth;
  ctx.fillStyle = muted;
  ctx.fillText(' × ', x, namesY);
  x += xWidth;
  ctx.fillStyle = text;
  ctx.fillText(view.userB.name, x, namesY);
  x += nameBWidth + 20;
  drawAvatar(ctx, imgB, view.userB.initial, x, namesY - avatarSize / 2, avatarSize, orangeTintBg, orangeFg);

  // score
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = scoreColor;
  ctx.font = '700 130px "Noto Sans JP", sans-serif';
  const scoreText = String(view.compatScore);
  const scoreW = ctx.measureText(scoreText).width;
  ctx.font = '400 34px "Noto Sans JP", sans-serif';
  const suffix = '/100 taste match';
  const suffixW = ctx.measureText(suffix).width;
  const scoreX = (W - scoreW - 16 - suffixW) / 2;
  ctx.textAlign = 'left';
  ctx.fillStyle = scoreColor;
  ctx.font = '700 130px "Noto Sans JP", sans-serif';
  ctx.fillText(scoreText, scoreX, 400);
  ctx.fillStyle = secondary;
  ctx.font = '400 34px "Noto Sans JP", sans-serif';
  ctx.fillText(suffix, scoreX + scoreW + 16, 400);

  // score bar
  const barW = 560;
  const barX = (W - barW) / 2;
  ctx.fillStyle = track;
  roundRect(ctx, barX, 428, barW, 14, 7);
  ctx.fill();
  ctx.fillStyle = primary;
  roundRect(ctx, barX, 428, Math.max(14, (barW * view.compatScore) / 100), 14, 7);
  ctx.fill();

  // verdict + stats
  ctx.textAlign = 'center';
  ctx.fillStyle = text;
  ctx.font = '700 30px "Noto Sans JP", sans-serif';
  ctx.fillText(scoreHint, W / 2, 496);
  ctx.fillStyle = secondary;
  ctx.font = '400 22px "Noto Sans JP", sans-serif';
  const r = view.breakdown[0]?.val ?? '—';
  const genre = view.breakdown[1]?.val ?? '—';
  ctx.fillText(
    `${view.sharedTotal} shared titles · score correlation ${r} · genre overlap ${genre}`,
    W / 2,
    534,
  );

  // footer
  ctx.fillStyle = muted;
  ctx.font = '400 19px "Noto Sans JP", sans-serif';
  ctx.fillText(new URL(SITE_URL).host, W / 2, 566);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Card rendering failed'))), 'image/png');
  });
}
