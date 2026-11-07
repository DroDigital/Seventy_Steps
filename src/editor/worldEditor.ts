/**
 * The world editor (round 110, development builds only: `npm run dev`, then F8 in the open world, or
 * `?edit`; docs/WORLD_EDITOR.md). The world stands still while a free camera flies; what is clicked
 * is held, and moved, turned, sized, raised, removed, copied or changed in the panel; props, lights
 * and foes' posts are added. Each change is kept in this browser and put in force at once; the whole
 * set is downloaded or copied as one file, which `tools/world_edits.mjs` takes into the game.
 */

import { Raycaster, Vector2, Vector3, type PerspectiveCamera, type WebGLRenderer } from 'three';
import { REGIONS } from '../data/regions';
import { WORLD_EDITS } from '../data/worldEdits';
import type { WorldScene } from '../render/worldScene';
import { propSpec } from '../world/edits/editApply';
import { editKey, takeExport } from '../world/edits/editFile';
import { putInForce } from '../world/edits/editRefresh';
import type { WorldEdit } from '../world/edits/editTypes';
import { surface } from '../world/terrain';
import { regionRect } from '../world/worldMap';
import { loadWorking, saveWorking } from './editorBoot';
import { createEditorCamera } from './editorCamera';
import type { FieldPatch } from './editorFields';
import { boxOf, hitGround, itemsAbout, pick, regionAt, type Item } from './editorItems';
import { LIGHT_PRESETS, newProp } from './editorKinds';
import { preview, startMode, type Mode, type ModeKind } from './editorModes';
import { createEditorOverlay } from './editorOverlay';
import { copyText, download, openFile } from './editorIO';
import { wireEditorInput } from './editorInput';
import { createEditorPanel, type PanelHooks } from './editorPanel';
import { spotsOf, touchedChunks } from './editorSpots';
import { addFoe, addProp, createSession, removeProp, removeSpawn, revertKey, setProp, setSite, setSpawn } from './editorSession';

export interface EditorContext {
  canvas: HTMLCanvasElement;
  world: WorldScene;
  resetInput(): void;
  /** Whether the game cannot be left for the editor now (a menu, a cutscene, a journey). */
  held(): boolean;
  openNow: boolean;
}

export interface WorldEditor {
  readonly active: boolean;
  /** What it holds and is doing, for a scripted check (?debug: `window.editor`). */
  readonly state: { held: string | null; mode: string | null; preview: unknown; edits: number };
  step(dt: number): void;
  apply(camera: PerspectiveCamera): void;
  draw(renderer: WebGLRenderer, camera: PerspectiveCamera): void;
}

type V3 = [number, number, number];
const REACH = 90; // metres about the camera that can be taken hold of
const MODE_KEYS: Readonly<Record<string, ModeKind>> = { KeyG: 'grab', KeyR: 'turn', KeyS: 'size', KeyH: 'raise' };
const round1 = (v: number): number => Math.round(v * 10) / 10;

export function installWorldEditor(ctx: EditorContext): WorldEditor {
  const cam = createEditorCamera();
  const overlay = createEditorOverlay();
  const committed = WORLD_EDITS.edits;
  const committedText = new Set(committed.map((e) => JSON.stringify(e)));
  const ray = new Raycaster();
  const keys = new Set<string>();
  let [active, last, items, held, hover, mode, shown, msg, since] = [false, null as PerspectiveCamera | null, [] as Item[], null as Item | null, null as Item | null, null as Mode | null, null as ReturnType<typeof preview> | null, '', 0];
  const io = { looking: false, mouse: [0, 0] as [number, number] };
  const session = createSession(loadWorking(), saveWorking);

  const rayAt = (x: number, y: number): [V3, V3] => {
    const r = ctx.canvas.getBoundingClientRect();
    ray.setFromCamera(new Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1), last!);
    const [o, d] = [ray.ray.origin, ray.ray.direction];
    return [[o.x, o.y, o.z], [d.x, d.y, d.z]];
  };
  const refresh = (): void => {
    items = itemsAbout(cam.position.x, cam.position.z, REACH);
    if (held) held = items.find((i) => i.key === held!.key) ?? held;
    since = 0;
  };
  const redraw = (): void => {
    const fresh = new Set(session.list.filter((e) => !committedText.has(JSON.stringify(e))).map(editKey));
    const gone = committed.filter((e) => !session.list.some((x) => editKey(x) === editKey(e))).length;
    panel.update(held, session.list, fresh, `${session.list.length} edits · ${fresh.size + gone} not yet in the game's files · pace ${Math.round(cam.speed)} m/s${msg ? ` · ${msg}` : ''}`);
  };
  const say = (text: string): void => {
    msg = text;
    redraw();
  };

  const show = (prev: readonly WorldEdit[], next: readonly WorldEdit[]): void => {
    const touched = touchedChunks(prev, next);
    putInForce(next);
    ctx.world.rebuild(touched);
    refresh();
    redraw();
  };
  const change = (next: readonly WorldEdit[]): void => {
    const prev = session.list;
    msg = '';
    session.change(next);
    show(prev, next);
  };
  const step = (back: boolean): void => {
    const prev = session.list;
    if (back ? session.undo() : session.redo()) show(prev, session.list);
  };

  const patch = (it: Item, p: FieldPatch): void => {
    const list = session.list;
    if ('prop' in p && it.type === 'prop') change(setProp(list, it.origin, p.prop));
    else if ('foe' in p && it.type === 'foe') change(setSpawn(list, it.spawn.id, p.foe));
    else if ('site' in p && it.type === 'site') {
      const rc = regionRect(REGIONS.find((r) => r.id === it.ref.region)!);
      const at = [round1((p.site.x ?? it.x) - rc.x0), round1((p.site.z ?? it.z) - rc.z0)] as const;
      change(setSite(list, it.ref, { at, ...(p.site.face && { face: p.site.face }) }, it.at));
    }
  };
  const frame = (x: number, y: number, z: number, size: number): void => {
    cam.frame(x, y, z, Math.max(6, size * 3));
    refresh();
  };
  const focus = (): void => {
    if (!held) return;
    const b = boxOf(held);
    frame(b.x, b.y + b.h / 2, b.z, Math.max(b.hx, b.hz, b.h / 2));
  };
  const take = (key: string): void => {
    refresh();
    held = items.find((i) => i.key === key) ?? held;
    redraw();
  };
  const addAtView = (make: (x: number, y: number, z: number, region: string, id: string) => WorldEdit[] | null): void => {
    const r = ctx.canvas.getBoundingClientRect();
    const [o, d] = rayAt(r.left + r.width / 2, r.top + r.height / 2); // the middle of the view
    const hit = hitGround(o, d) ?? [o[0] + d[0] * 10, 0, o[2] + d[2] * 10];
    const region = regionAt(hit[0], hit[2]);
    if (!region) return say('nothing can stand there');
    const id = session.newId();
    const next = make(hit[0], surface(hit[0], hit[2]), hit[2], region.id, id);
    if (!next) return say('no such piece');
    change(next);
    take(`add|${id}`);
  };
  /** A yaw that faces the camera. */
  const facing = (): number => {
    const f = last ? last.getWorldDirection(new Vector3()) : new Vector3(0, 0, 1);
    return Math.round(Math.atan2(-f.x, -f.z) * 1e4) / 1e4;
  };

  const hooks: PanelHooks = {
    patch: (p) => held && patch(held, p),
    remove() {
      if (held?.type === 'site') return say('a site is moved, not removed');
      if (held?.type === 'prop') change(removeProp(session.list, held.origin));
      else if (held?.type === 'foe') change(removeSpawn(session.list, held.spawn.id));
      held = null;
      redraw();
    },
    duplicate() {
      if (!held || held.type === 'site') return;
      const id = session.newId();
      if (held.type === 'prop') {
        const spec = propSpec(held.prop);
        change(addProp(session.list, id, held.region, { ...spec, x: spec.x + 1.5, y: spec.y + surface(spec.x + 1.5, spec.z) - surface(spec.x, spec.z), seed: Math.floor(Math.random() * 1e6) }));
      } else change(addFoe(session.list, id, { entity: held.spawn.entity, region: held.spawn.region, x: held.spawn.at.x + 1.5, z: held.spawn.at.z, yaw: held.spawn.at.yaw }));
      take(`add|${id}`);
    },
    revert: () => held && change(revertKey(session.list, held.key)),
    focus,
    addProp(kind, piece, presetName) {
      const preset = presetName ? LIGHT_PRESETS.find((l) => l.name === presetName) : undefined;
      addAtView((x, y, z, region, id) => {
        const spec = newProp(preset?.kind ?? kind, x, y, z, facing(), Math.floor(Math.random() * 1e6), preset?.piece ?? piece, preset?.lit);
        return spec && addProp(session.list, id, region, spec);
      });
    },
    addFoe: (entity) => addAtView((x, _y, z, region, id) => addFoe(session.list, id, { entity, region, x: round1(x), z: round1(z), yaw: facing() })),
    revertKey: (k) => change(revertKey(session.list, k)),
    focusKey(k) {
      const e = session.list.find((x) => editKey(x) === k);
      const at = spotsOf(e).at(-1);
      if (!at) return say('that edit has no place to show');
      frame(at[0], surface(at[0], at[1]) + 1, at[1], 2);
      take(k);
    },
    exportFile(note) {
      download(session.list, committed, note);
      say('downloaded: send the file in the project chat');
    },
    copy: (note) => void copyText(session.list, committed, note).then(() => say('copied: paste it in the project chat'), () => say('the clipboard refused: download the file instead')),
    importFile: (file) =>
      void openFile(file).then((f) => {
        if (typeof f === 'string') return say(f);
        change(takeExport(committed, f));
        say(`opened ${f.edits.length} edits`);
      }),
    reload() {
      saveWorking(session.list);
      const u = new URL(location.href);
      u.searchParams.set('edit', '');
      location.href = u.toString();
    },
    discard: () => change([...committed]),
    close: () => toggle(),
  };
  const panel = createEditorPanel(hooks);
  document.body.append(panel.root);

  const begin = (kind: ModeKind): void => {
    if (!held || !last) return;
    const [o, d] = rayAt(...io.mouse);
    mode = startMode(kind, held, io.mouse, o, d);
    shown = null;
    redraw();
  };
  const end = (keep: boolean): void => {
    const [m, view] = [mode, shown];
    mode = shown = null;
    if (keep && m && view?.patch) patch(m.item, view.patch);
    else redraw();
  };
  function toggle(): void {
    if (!active && (ctx.held() || !last)) return;
    active = !active;
    [io.looking, mode, shown] = [false, null, null];
    keys.clear();
    panel.show(active);
    ctx.canvas.style.cursor = active ? 'crosshair' : 'none';
    if (active) {
      if (document.pointerLockElement) document.exitPointerLock();
      cam.from(last!);
      refresh();
      redraw();
    } else ctx.resetInput();
  }
  const command = (e: KeyboardEvent): boolean => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (e.code === 'Escape') return mode ? end(false) : ((held = null), redraw()), true;
    if (e.code === 'Enter' && mode) return end(true), true;
    if (ctrl && e.code === 'KeyZ') return step(!e.shiftKey), true;
    if (ctrl && e.code === 'KeyY') return step(false), true;
    if (ctrl && e.code === 'KeyD') return !mode && hooks.duplicate(), true;
    if (mode?.kind === 'grab' && (e.code === 'KeyX' || e.code === 'KeyZ')) {
      const axis = e.code === 'KeyX' ? 'x' : 'z';
      mode.axis = mode.axis === axis ? null : axis;
      return true;
    }
    if (!mode && MODE_KEYS[e.code] && !ctrl) return begin(MODE_KEYS[e.code]!), true;
    if (!mode && (e.code === 'Delete' || e.code === 'Backspace' || e.code === 'KeyX')) return hooks.remove(), true;
    if (e.code === 'KeyF' && !ctrl) return focus(), true;
    return false;
  };

  wireEditorInput(ctx.canvas, keys, io, {
    active: () => active,
    toggle,
    command,
    click(x, y) {
      if (mode) return end(true);
      held = pick(items, ...rayAt(x, y));
      redraw();
    },
    right: () => (mode ? (end(false), false) : true),
    look: (dx, dy) => cam.look(dx, dy),
    wheel(dy) {
      cam.wheel(dy);
      redraw();
    },
  });

  return {
    get active() {
      return active;
    },
    get state() {
      return { held: held?.key ?? null, mode: mode?.kind ?? null, preview: shown?.patch ?? null, edits: session.list.length };
    },
    step(dt) {
      if (!active) {
        if (ctx.openNow && last && !ctx.held()) {
          ctx.openNow = false;
          toggle();
        }
        return;
      }
      if (io.looking) cam.step(keys, dt);
      if ((since += dt) > 0.5) refresh();
    },
    apply(camera) {
      last = camera;
      if (!active) return;
      cam.apply(camera);
      camera.updateMatrixWorld();
    },
    draw(renderer, camera) {
      if (!active) return;
      const r = ctx.canvas.getBoundingClientRect();
      const inside = io.mouse[0] >= r.left && io.mouse[0] <= r.right && io.mouse[1] >= r.top && io.mouse[1] <= r.bottom;
      if (mode) shown = preview(mode, io.mouse, ...rayAt(...io.mouse), keys.has('ControlLeft') || keys.has('ControlRight'));
      else hover = inside && !io.looking ? pick(items, ...rayAt(...io.mouse)) : null;
      const marks = items.filter((i) => i.type !== 'prop').map((i) => ({ box: boxOf(i), kind: i.type === 'site' ? ('site' as const) : ('foe' as const) }));
      overlay.set(shown?.box ?? (held && boxOf(held)), hover && boxOf(hover), marks);
      overlay.draw(renderer, camera);
    },
  };
}
