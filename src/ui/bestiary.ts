/**
 * `?bestiary`: every reviewed creature and variant, plus the unprovided allies. The same authored
 * frames as the game cycle through all registered directions and actions. Only allies use the
 * procedural fallback. Clicking a card spawns that exact form in the arena.
 */

import * as THREE from 'three';
import { ENTITIES, paramsOf, variantOf, type Variant } from '../data/registry';
import { TIERS, type AssemblyRecipe, type EntityDef } from '../data/schema';
import { FX } from '../data/tuning';
import { buildAssembly, type Assembly } from '../render/assemblies';
import { WRONGNESS } from '../render/eldritch';
import { CELL, cellOrigin, SPRITE_STATES, spriteKey, STATE_POSES, type SpriteAtlas, type SpriteState } from '../render/sprites/atlas';
import { loopFrame, type SpriteDirection } from '../render/sprites/directional';
import { reviewedClips, type ReviewedArt, type ReviewedEntity } from '../render/sprites/reviewed';
import { worldUniforms } from '../render/worldMaterial';
import { spriteAtlas } from './loading';

const BONE = '#d9d0b8';
const TILE = 128; // CSS pixels per 64-pixel sprite
const TIER_NAMES: Record<string, string> = {
  lesser: 'Lesser',
  greater: 'Greater',
  named: 'Named',
  great_old_one: 'Great Old Ones',
  outer_god: 'Outer Gods',
  ally: 'Allies',
};

/** The frame sequence a tile loops through: every frame of every state, in order. */
const LOOP = SPRITE_STATES.flatMap((s) => STATE_POSES[s].map((_, f) => [s, f] as const));

function el<K extends keyof HTMLElementTagNameMap>(tag: K, style: string, text = '', parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.style.cssText = style;
  e.textContent = text;
  parent?.append(e);
  return e;
}

/** Copies one atlas cell into a 64×64 canvas; glow pixels are drawn opaque. */
function blit(ctx: CanvasRenderingContext2D, atlas: SpriteAtlas, cell: number): void {
  const [cx, cy] = cellOrigin(cell);
  const img = ctx.createImageData(CELL, CELL);
  for (let y = 0; y < CELL; y++) {
    const row = atlas.data.subarray(((cy + y) * atlas.width + cx) * 4, ((cy + y) * atlas.width + cx + CELL) * 4);
    img.data.set(row, y * CELL * 4);
  }
  for (let i = 3; i < img.data.length; i += 4) if (img.data[i] > 0) img.data[i] = 255;
  ctx.putImageData(img, 0, 0);
}

function tile(grid: HTMLElement, d: EntityDef, variant?: Variant): { canvas: HTMLCanvasElement; caption: HTMLElement } {
  const card = el('a', `display:block;width:${TILE + 16}px;padding:8px;background:#0c0c0e;border:1px solid #2a2a2e;color:${BONE};text-decoration:none;cursor:pointer`, '', grid);
  card.href = `?spawn=${d.id}${variant ? `&variant=${variant}` : ''}`;
  card.title = `Spawn ${d.name} in the arena`;
  const canvas = el('canvas', `width:${TILE}px;height:${TILE}px;image-rendering:pixelated;background:#16161a`, '', card);
  [canvas.width, canvas.height] = d.sprite ? [CELL, CELL] : [TILE, TILE];
  const caption = el('div', 'font:10px/1.5 monospace;opacity:.6;min-height:15px', '', card);
  el('div', 'font:bold 12px/1.3 monospace;margin-top:6px', d.name, card);
  el('div', 'font:11px/1.3 monospace;opacity:.6', `${TIER_NAMES[d.tier]}${variant ? ` · ${variant}` : ''} · ${paramsOf(d.behavior).hide !== 'none' ? `${d.behavior.archetype} (hidden)` : d.behavior.archetype}`, card);
  el('div', 'font:italic 11px/1.3 serif;opacity:.5', `${d.source}${d.canonLooks ? '' : ' · conjectured look'}`, card);
  const links = el('div', 'font:11px/1.6 monospace', '', card);
  for (const v of ['eldritch', 'boss'] as const) {
    if (!variantOf(d, v)) continue;
    const a = el('a', `color:${BONE};opacity:.7;margin-right:8px`, `${v} variant`, links);
    a.href = `?spawn=${d.id}&variant=${v}`;
    a.addEventListener('click', (e) => e.stopPropagation());
  }
  return { canvas, caption };
}

interface AuthoredClip { direction: SpriteDirection; state: SpriteState | 'stoop' | 'stoop_mid'; frames: readonly number[]; mirror: boolean; duration: number }
const CLIP_SECONDS = { idle: 2, move: 0.8, attack: 0.8, hurt: 0.6, stoop: 1.2, stoop_mid: 0.4 };

function authoredClips(entity: ReviewedEntity, key: string): AuthoredClip[] {
  const clips = reviewedClips(entity, key);
  return (['front', 'left', 'back', 'right'] as const).flatMap((direction) => {
    const view = clips[direction]!;
    return [...SPRITE_STATES, 'stoop' as const, 'stoop_mid' as const].flatMap((state) => {
      const clip = view[state];
      return clip?.frames.length ? [{ direction, state, frames: clip.frames, mirror: clip.mirror_horizontal, duration: CLIP_SECONDS[state] }] : [];
    });
  });
}

/** Copy the complete canvas, preserving authored transparency and a consistent pixel scale. */
function blitReviewed(ctx: CanvasRenderingContext2D, art: ReviewedArt, cell: number, mirror: boolean): void {
  const frame = art.manifest.frames[cell];
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  if (mirror) { ctx.translate(ctx.canvas.width, 0); ctx.scale(-1, 1); }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(art.pages[frame.page], frame.x, frame.y, frame.width, frame.height, 0, 0, frame.width, frame.height);
  ctx.restore();
}

/** A tiny renderer for the colossi thumbnails; they share the world materials without fog. */
function assemblyRenderer(): { draw(asm: Assembly, r: AssemblyRecipe, ctx: CanvasRenderingContext2D, time: number): void } {
  THREE.ColorManagement.enabled = false;
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setSize(TILE, TILE, false);
  renderer.setClearColor(new THREE.Color(...FX.fogColor));
  worldUniforms.uRes.value.set(TILE, TILE);
  worldUniforms.uFogAmount.value = 0;
  worldUniforms.uSnap.value = 1;
  worldUniforms.uAffine.value = 1;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 400);
  return {
    draw(asm, r, ctx, time) {
      scene.add(asm.root);
      asm.root.rotation.y = time * 0.3;
      asm.animate(time, 0.3 + 0.3 * Math.sin(time), 0);
      const [aim, back] = r.body === 'mound' ? [0.25, 1.3] : [0.5, 1.9];
      camera.position.set(0, r.scale * (aim + 0.1), r.scale * back);
      camera.lookAt(0, r.scale * aim, 0);
      worldUniforms.uTime.value = time;
      renderer.render(scene, camera);
      ctx.drawImage(renderer.domElement, 0, 0);
      scene.remove(asm.root);
    },
  };
}

export async function startBestiary(): Promise<void> {
  document.documentElement.style.cssText = 'height:auto;overflow:auto;background:#050506';
  document.body.style.cssText = `display:block;height:auto;overflow:visible;margin:0;padding:24px;background:#050506;color:${BONE};font-family:monospace`;
  const header = el('div', 'margin-bottom:18px', '', document.body);
  el('div', 'font:bold 20px monospace;letter-spacing:.08em', 'BESTIARY', header);
  const status = el('div', 'opacity:.6;margin-top:4px', 'Loading creatures…', header);
  let atlas: SpriteAtlas;
  try {
    atlas = await spriteAtlas((share) => { status.textContent = `Loading creatures… ${Math.round(share * 100)}%`; });
  } catch (error) {
    status.textContent = `Creature artwork could not load. ${error instanceof Error ? error.message : String(error)} Reload to try again.`;
    console.error(error);
    return;
  }
  status.textContent = `${ENTITIES.length} entities · 105 reviewed forms + 7 allies · click a form to spawn it in the arena · `;
  status.append(
    Object.assign(el('a', `color:${BONE}`, 'back to the arena'), { href: '?arena' }),
  );
  const sprites: { ctx: CanvasRenderingContext2D; key: string }[] = [];
  const colossi: { ctx: CanvasRenderingContext2D; asm: Assembly; recipe: AssemblyRecipe }[] = [];
  const reviewed: { ctx: CanvasRenderingContext2D; caption: HTMLElement; clips: AuthoredClip[] }[] = [];
  const art = atlas.reviewed;
  for (const t of TIERS) {
    const defs = ENTITIES.filter((d) => d.tier === t);
    el('div', 'font:bold 14px monospace;margin:22px 0 10px;opacity:.85;letter-spacing:.06em', `${TIER_NAMES[t].toUpperCase()} (${defs.length})`, document.body);
    const grid = el('div', 'display:flex;flex-wrap:wrap;gap:10px', '', document.body);
    defs.forEach((base, i) => {
      const forms = [{ def: base, variant: undefined as Variant | undefined }];
      for (const variant of ['eldritch', 'boss'] as const) {
        const def = variantOf(base, variant);
        if (def) forms.push({ def, variant });
      }
      for (const { def: d, variant } of forms) {
        const { canvas, caption } = tile(grid, d, variant);
        const ctx = canvas.getContext('2d')!;
        const key = spriteKey(d.id, variant), source = art?.manifest.entities[key];
        if (source && art) {
          const clips = authoredClips(source, key), frame = art.manifest.frames[clips[0].frames[0]];
          [canvas.width, canvas.height] = [frame.width, frame.height];
          canvas.style.height = `${TILE * frame.height / frame.width}px`;
          canvas.dataset.creature = key;
          reviewed.push({ ctx, caption, clips });
        } else if (d.sprite) {
          sprites.push({ ctx, key });
        } else {
          colossi.push({ ctx, asm: buildAssembly(d.assembly!, i + 1, WRONGNESS[d.tier]), recipe: d.assembly! });
        }
      }
    });
  }
  const three = colossi.length > 0 ? assemblyRenderer() : null;
  const started = performance.now();
  const paint = (): void => {
    const time = (performance.now() - started) / 1000;
    const tick = Math.floor(time * 5);
    const [state, frame] = LOOP[Math.floor(tick / 2) % LOOP.length];
    for (const s of sprites) blit(s.ctx, atlas, atlas.frames.get(s.key)![state][frame]);
    for (const c of colossi) three?.draw(c.asm, c.recipe, c.ctx, tick * 0.2);
    if (art) for (const s of reviewed) {
      let phase = time % s.clips.reduce((sum, clip) => sum + clip.duration, 0);
      let clip = s.clips[0];
      for (const candidate of s.clips) {
        clip = candidate;
        if (phase < clip.duration) break;
        phase -= clip.duration;
      }
      const at = loopFrame(phase, clip.frames.length, clip.duration);
      blitReviewed(s.ctx, art, clip.frames[at], clip.mirror);
      s.caption.textContent = `${clip.direction} · ${clip.state} · ${at + 1}/${clip.frames.length}`;
      s.ctx.canvas.dataset.direction = clip.direction;
      s.ctx.canvas.dataset.action = clip.state;
      s.ctx.canvas.dataset.frame = String(at);
    }
  };
  paint();
  setInterval(paint, 100);
}
