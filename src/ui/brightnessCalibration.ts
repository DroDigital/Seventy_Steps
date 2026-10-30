/**
 * The brightness card (round 103): a sign and a strip of steps drawn through the picture's own tone curve
 * (render/toneCurve.ts), so the brightness is set to the screen in front of the player. It is adjusted until the sign is
 * only just visible against the black and the first bars of the strip part from it: a dim screen takes it up, a bright
 * one down. Shown once after the title first opens (ui/titleScreen.ts) and from Settings › Display. Every change is
 * applied at once and kept, as each setting is.
 */

import { t } from '../core/i18n';
import { BRIGHTNESS_TOE, brightnessGamma, CALIBRATION, SETTINGS } from '../data/tuning';
import { toneCurve } from '../render/toneCurve';
import { button, el, footer, heading, slider, type Page } from './menuKit';
import type { SettingId, Settings } from './settings';

const W = 320;
const H = 140; // (short enough that the card's buttons stand in the page's body with the slider)
const pct = (v: number): string => `${Math.round(v * 100)}%`;
const grey = (v: number): string => `rgb(${Math.round(v * 255)},${Math.round(v * 255)},${Math.round(v * 255)})`;

/** The picture before its curve, one level (0 to 255) a pixel: a ring about a pentagram on black, the strip of steps under it. */
function levels(): Uint8ClampedArray {
  const c = Object.assign(document.createElement('canvas'), { width: W, height: H });
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  const [cx, cy, r] = [W / 2, H * 0.42, H * 0.34];
  g.strokeStyle = grey(CALIBRATION.sign);
  g.lineWidth = 2;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  for (let k = 0; k <= 5; k++) { // (every second point of the star: a pentagram, closed where it began)
    const a = -Math.PI / 2 + (k * 4 * Math.PI) / 5;
    if (k === 0) g.moveTo(cx + r * 0.86 * Math.cos(a), cy + r * 0.86 * Math.sin(a));
    else g.lineTo(cx + r * 0.86 * Math.cos(a), cy + r * 0.86 * Math.sin(a));
  }
  g.stroke();
  const step = (W - 40) / CALIBRATION.strip.length;
  CALIBRATION.strip.forEach((v, i) => {
    g.fillStyle = grey(v);
    g.fillRect(20 + i * step, H - 40, step - 4, 22);
  });
  const px = g.getImageData(0, 0, W, H).data;
  const lum = new Uint8ClampedArray(W * H);
  for (let i = 0; i < lum.length; i++) lum[i] = px[i * 4]; // (grey: the red is the level)
  return lum;
}

/** The card as a page: its picture, the brightness slider, Default and Keep. `leave` closes it; `calibrated` marks it kept. */
export function brightnessPage(s: Settings, change: (id: SettingId, v: number) => void, leave: () => void, calibrated: () => void = () => undefined): Page {
  const lum = levels();
  let picture: CanvasRenderingContext2D | null = null;
  let frame: ImageData | null = null;
  /** The picture at brightness `v`, through the game's curve (shaders/post.ts `tone`). */
  const paint = (v: number): void => {
    if (!picture || !frame) return;
    const gamma = brightnessGamma(v);
    const shown = Array.from({ length: 256 }, (_, k) => Math.round(toneCurve(k / 255, gamma, BRIGHTNESS_TOE) * 255));
    const out = frame.data;
    for (let i = 0; i < lum.length; i++) {
      const o = shown[lum[i]];
      out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = o;
      out[i * 4 + 3] = 255;
    }
    picture.putImageData(frame, 0, 0);
  };
  const keep = (): void => (calibrated(), leave());
  const page: Page = {
    back: keep,
    build(panel) {
      heading(panel, t('cal.title'));
      const canvas = el(panel, 'canvas', '', `display:block;margin:0 auto 10px;width:min(${W}px,80vw);height:auto;border:1px solid #ffffff14`);
      canvas.width = W;
      canvas.height = H;
      picture = canvas.getContext('2d');
      frame = picture?.createImageData(W, H) ?? null;
      paint(s.brightness);
      el(panel, 'div', t('cal.hint'), 'opacity:.7;font-size:12px;line-height:1.5;max-width:420px;margin:0 auto 10px;text-align:center');
      slider(panel, t('set.brightness'), SETTINGS.brightness, s.brightness, (v) => (change('brightness', v), paint(v)), pct, t('set.hint.brightness'));
      const row = el(panel, 'div', '', 'display:flex;justify-content:center;gap:12px;margin-top:8px');
      button(row, t('cal.reset'), () => (change('brightness', SETTINGS.brightness[3]), page.redraw?.())).classList.add('tag');
      button(row, t('cal.keep'), keep);
      footer(panel, t('set.footer'), keep);
    },
  };
  return page;
}
