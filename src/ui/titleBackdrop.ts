/**
 * Atmospheric low-res gothic backdrop behind the title screen: starry indigo sky, silhouetted
 * Miskatonic spires and gambrel roofs, drifting volumetric mist bands, distant Seventy Steps arch,
 * and warm rising lantern motes — drawn at 320×180 and upscaled nearest-neighbour to match the game.
 */

const [W, H] = [320, 180];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

interface Star { x: number; y: number; b: number; ph: number }
interface Mote { x: number; y: number; vy: number; vx: number; ph: number; warm: boolean }

const rng = (seed: number): (() => number) => {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Builds the quiet nocturnal Arkham / Miskatonic skyline silhouette once onto an offscreen canvas. */
function buildSkyline(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  [c.width, c.height] = [W, H];
  const g = c.getContext('2d')!;
  const r = rng(1928);

  // Far misty mountain ridge
  g.fillStyle = '#0c0b14';
  g.beginPath();
  g.moveTo(0, H);
  for (let x = 0; x <= W; x += 8) {
    const h = 114 - Math.sin(x * 0.024) * 14 - Math.cos(x * 0.055 + 1.2) * 8 - Math.sin(x * 0.011) * 10;
    g.lineTo(x, h);
  }
  g.lineTo(W, H);
  g.closePath();
  g.fill();

  // Midground gothic Miskatonic spires (left-center & right-center, flanking the wordmark cleanly)
  const spire = (cx: number, baseY: number, w: number, h: number): void => {
    g.fillStyle = '#090810';
    g.fillRect(cx - w / 2, baseY - h * 0.48, w, h * 0.48);
    g.beginPath();
    g.moveTo(cx - w * 0.62, baseY - h * 0.46);
    g.lineTo(cx, baseY - h);
    g.lineTo(cx + w * 0.62, baseY - h * 0.46);
    g.closePath();
    g.fill();
  };
  spire(54, 146, 14, 58);
  spire(72, 148, 10, 40);
  spire(264, 146, 16, 62);
  spire(244, 148, 10, 42);

  // Gambrel New England rooflines along the lower horizon
  g.fillStyle = '#06060b';
  for (let x = -6; x < W + 10; x += 18 + Math.floor(r() * 14)) {
    const bw = 16 + Math.floor(r() * 18);
    const bh = 22 + Math.floor(r() * 22);
    const top = H - bh;
    g.fillRect(x, top + 8, bw, bh);
    g.beginPath();
    g.moveTo(x - 2, top + 9);
    g.lineTo(x + bw * 0.5, top);
    g.lineTo(x + bw + 2, top + 9);
    g.closePath();
    g.fill();
    // Occasional tiny warm mullioned attic window
    if (r() < 0.42 && Math.abs(x + bw * 0.5 - W / 2) > 44) {
      g.fillStyle = r() < 0.7 ? 'rgba(225,184,116,0.42)' : 'rgba(155,120,210,0.34)';
      g.fillRect(Math.round(x + bw * 0.45), Math.round(top + 13), 2, 3);
      g.fillStyle = '#06060b';
    }
  }

  // Subtle seventy-steps silhouette descending in the lower middle
  g.fillStyle = 'rgba(144,120,189,0.06)';
  for (let i = 0; i < 8; i++) {
    const sw = 18 + i * 7;
    g.fillRect(Math.round(W / 2 - sw / 2), 132 + i * 6, sw, 2);
  }
  return c;
}

export interface TitleBackdrop {
  readonly canvas: HTMLCanvasElement;
  show(on: boolean): void;
  remove(): void;
}

export function createTitleBackdrop(): TitleBackdrop {
  const canvas = document.createElement('canvas');
  [canvas.width, canvas.height] = [W, H];
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;image-rendering:pixelated;z-index:0;opacity:0;transition:opacity .8s ease';
  const ctx = canvas.getContext('2d')!;
  const skyline = buildSkyline();
  const r = rng(70);
  const stars: Star[] = Array.from({ length: 78 }, () => ({ x: Math.floor(r() * W), y: Math.floor(r() * 108), b: 0.25 + r() * 0.65, ph: r() * 6.28 }));
  const motes: Mote[] = Array.from({ length: 24 }, () => ({
    x: r() * W, y: 65 + r() * 115, vy: 2.2 + r() * 4.5, vx: (r() - 0.5) * 3, ph: r() * 6.28, warm: r() < 0.58,
  }));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = false;
  let raf = 0;
  let last = performance.now();

  const paint = (now: number): void => {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    const t = reduced ? 0 : now / 1000;

    // Nocturnal indigo-to-black gradient with subtle cosmic purple haze near horizon
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#040408');
    sky.addColorStop(0.45, '#090814');
    sky.addColorStop(0.74, '#151024');
    sky.addColorStop(1, '#050407');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Faint moonlit mist dome behind the wordmark
    const halo = ctx.createRadialGradient(W * 0.5, H * 0.42, 6, W * 0.5, H * 0.42, 130);
    halo.addColorStop(0, 'rgba(116,92,164,0.16)');
    halo.addColorStop(0.55, 'rgba(66,54,96,0.07)');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    // Subtle twinkling stars
    for (const s of stars) {
      const tw = s.b * (0.65 + 0.35 * Math.sin(t * 1.4 + s.ph));
      ctx.fillStyle = `rgba(217,208,184,${(tw * 0.55).toFixed(2)})`;
      ctx.fillRect(s.x, s.y, 1, 1);
    }

    // Horizon skyline
    ctx.drawImage(skyline, 0, 0);

    // Slow drifting dithered fog ribbons across the lower skyline
    for (let y = 104; y < 164; y += 2) {
      const band = Math.sin(y * 0.09 + t * 0.16) * 0.5 + 0.5;
      const env = Math.sin(((y - 104) / 60) * Math.PI);
      const a = env * (0.04 + 0.045 * band);
      ctx.fillStyle = `rgba(148,136,178,${a.toFixed(3)})`;
      const x0 = Math.floor((Math.sin(t * 0.22 + y * 0.13) * 18) % 4);
      for (let x = 0; x < W; x += 4) {
        if ((BAYER[((x + x0) & 3) + ((y >> 1) & 3) * 4] / 16) < env * 0.65) ctx.fillRect(x, y, 2, 1);
      }
    }

    // Rising lantern & eldritch dust motes
    for (const m of motes) {
      if (!reduced) {
        m.y -= m.vy * dt;
        m.x += (m.vx + Math.sin(t * 0.9 + m.ph) * 2.2) * dt;
        if (m.y < 24) { m.y = H + 4; m.x = ((m.x % W) + W) % W; }
      }
      const glow = 0.28 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2.4 + m.ph));
      ctx.fillStyle = m.warm ? `rgba(233,201,122,${glow.toFixed(2)})` : `rgba(164,132,224,${(glow * 0.85).toFixed(2)})`;
      ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
    }

    // Soft dark centre scrim behind menu buttons for crisp contrast
    const veil = ctx.createRadialGradient(W * 0.5, H * 0.62, 18, W * 0.5, H * 0.62, 165);
    veil.addColorStop(0, 'rgba(5,4,8,0.68)');
    veil.addColorStop(1, 'rgba(5,4,8,0.18)');
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, W, H);

    if (visible && !reduced) raf = requestAnimationFrame(paint);
  };

  return {
    canvas,
    show(on) {
      if (visible === on) return;
      visible = on;
      canvas.style.opacity = on ? '1' : '0';
      if (on) {
        last = performance.now();
        paint(last);
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    remove() {
      visible = false;
      if (raf) cancelAnimationFrame(raf);
      canvas.remove();
    },
  };
}
