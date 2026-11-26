/**
 * The shortcuts' barred doors, drawn and moved (round 125: systems/shortcuts.ts, data/shortcutLooks.ts): each stands shut in its doorway
 * with its bar across it on the side it is opened from (a beam in iron brackets, a bolt in its keepers, or a lever on the wall beside a
 * slab), and does not open as a body nears, as the other doors do. Worked from beyond, the bar goes first (the beam lifted out and leant
 * against the wall, the bolt drawn back, the lever thrown down), then the leaves swing away from whoever opened it, or the slab sinks, and
 * there it stays. Tried from the wrong side, it shudders on its bar. A door is made only while the camera is near it. Render only.
 */

import * as THREE from 'three';
import { BAR_SOUNDS, RATTLE } from '../data/shortcutSounds';
import { shortcutLook, type ShortcutLook } from '../data/shortcutLooks';
import { DOOR_GAIN, doorSound, materialOf } from '../data/doorSounds';
import { DUNGEON, SHORTCUT } from '../data/tuning';
import type { Game } from '../systems/components';
import { isOpened } from '../systems/shortcuts';
import { worldLayout } from '../world/placements';
import type { ShortcutPlace } from '../world/shortcutPlan';
import type { GameAudio } from './audio/gameAudio';
import { doorParts } from './doorShapes';
import { pose } from './doorViews';
import { box } from './meshKit';
import { createWorldMaterial } from './worldMaterial';

const MAKE = 70; // metres: nearer than this a door is made...
const KEEP = 100; // ...and farther than this it is put away
const RANGE = 26; // metres its sounds carry
const SHAKE = 0.45; // seconds a door tried from the wrong side shudders

interface View {
  s: ShortcutPlace;
  look: ShortcutLook;
  group: THREE.Group | null;
  leaves: [THREE.Group, THREE.Group] | null;
  bar: THREE.Group | null;
  since: number | null; // when its bar was worked, in this sitting
  heard: boolean; // its swing has been sounded
  tried: number; // when it was last tried from the wrong side
}

const ease = (k: number): number => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
let barMaterial: THREE.ShaderMaterial | null = null;
const WOOD: [number, number, number] = [0.72, 0.56, 0.4];
const IRON: [number, number, number] = [0.42, 0.4, 0.43];

/** The bar of a door `w` wide, in the doorway's frame (local -z is the side it is opened from), as a group the update moves. */
function barOf(look: ShortcutLook, w: number): THREE.Group {
  barMaterial ??= createWorldMaterial({ texture: 'wood', seed: 8, vertexColors: true, vary: 0.4 });
  const g = new THREE.Group();
  const add = (geo: THREE.BufferGeometry): void => void g.add(new THREE.Mesh(geo, barMaterial!));
  if (look.bar === 'beam') {
    add(box(w + 0.7, 0.22, 0.16, 0, 0, 0, WOOD));
    for (const s of [-1, 1]) add(box(0.1, 0.34, 0.3, s * (w / 2 + 0.12), 0, 0.06, IRON)); // its brackets' outer arms (the bar lies in them)
  } else if (look.bar === 'bolt') {
    add(box(0.95, 0.09, 0.09, 0, 0, 0, IRON));
    add(box(0.07, 0.24, 0.07, 0.32, -0.08, 0, IRON)); // its handle
  } else {
    add(box(0.07, 0.62, 0.07, 0, 0.31, 0, IRON)); // the handle, from its pivot up
    add(box(0.16, 0.16, 0.16, 0, 0.62, 0, IRON)); // its knob
  }
  return g;
}

/** Where a bar rests while barred, in the doorway's frame. */
function barHome(look: ShortcutLook, w: number): THREE.Vector3 {
  const back = -(DUNGEON.wall / 2 + (look.bar === 'lever' ? 0.06 : 0.22)); // before the leaves, or on the wall's face beside a slab
  if (look.bar === 'beam') return new THREE.Vector3(0, 1.3, back);
  if (look.bar === 'bolt') return new THREE.Vector3(0, 1.15, back);
  return new THREE.Vector3(w / 2 + 0.85, 1.05, back);
}

/** The bar's pose at `k` (0 barred, 1 worked) of its motion. */
function barPose(look: ShortcutLook, bar: THREE.Group, w: number, k: number): void {
  const home = barHome(look, w);
  bar.position.copy(home);
  bar.rotation.set(0, 0, 0);
  if (look.bar === 'beam') { // lifted clear of its brackets, then carried aside and leant against the wall
    const up = ease(Math.min(1, k / 0.35));
    const aside = ease(Math.max(0, (k - 0.35) / 0.65));
    bar.position.y += 0.32 * up - 0.55 * aside;
    bar.position.x += (w / 2 + 1.1) * aside;
    bar.position.z -= 0.12 * aside;
    bar.rotation.z = -1.35 * aside;
  } else if (look.bar === 'bolt') bar.position.x -= 0.5 * ease(k); // drawn back into its keeper
  else bar.rotation.x = 0.5 - 2.1 * ease(k); // thrown from up and out to down
}

export interface ShortcutViews {
  update(camera: THREE.Camera, time: number, hidden: boolean): void;
}

export function createShortcutViews(scene: THREE.Scene, g: Game, audio: GameAudio): ShortcutViews {
  const views: View[] = worldLayout().shortcuts.map((s) => ({ s, look: shortcutLook(s.kit), group: null, leaves: null, bar: null, since: null, heard: false, tried: -Infinity }));
  const byId = new Map(views.map((v) => [v.s.id, v]));
  const worked = new Set<string>(); // opened in the simulation since the last frame: its motion begins at the next
  const shaken = new Set<string>();
  g.events.on('ShortcutOpened', (e) => {
    worked.add(e.id);
    const v = byId.get(e.id);
    if (v) audio.recipe(`shortcut:${v.look.bar}`, BAR_SOUNDS[v.look.bar], { at: { x: e.x, y: e.y + 1.2, z: e.z }, range: RANGE, gain: 1.6, vary: 0.4 });
  });
  g.events.on('ShortcutTried', (e) => {
    shaken.add(e.id);
    audio.recipe('shortcut:rattle', RATTLE, { at: { x: e.x, y: e.y + 1.2, z: e.z }, range: RANGE, gain: 1.4, vary: 0.5 });
  });

  const make = (v: View): void => {
    const { s, look } = v;
    const parts = doorParts(look.door, s.width, s.height);
    const group = new THREE.Group();
    group.position.set(s.x, s.y, s.z);
    group.rotation.y = s.yaw; // local +z runs from the side it opens from into the room beyond
    const slab = look.door.kind === 'slab';
    const leaf = (part: { geo: THREE.BufferGeometry; glow?: THREE.BufferGeometry }, x: number): THREE.Group => {
      const pivot = new THREE.Group();
      pivot.position.x = x;
      pivot.add(new THREE.Mesh(part.geo, parts.solid));
      if (part.glow) pivot.add(new THREE.Mesh(part.glow, parts.shine));
      group.add(pivot);
      return pivot;
    };
    v.leaves = [leaf(parts.left, slab ? 0 : -s.width / 2), leaf(parts.right, s.width / 2)];
    if (slab) v.leaves[1].visible = false;
    if (parts.frame) group.add(new THREE.Mesh(parts.frame, parts.solid));
    v.bar = barOf(look, s.width);
    group.add(v.bar);
    scene.add(group);
    v.group = group;
  };
  const drop = (v: View): void => {
    if (v.group) scene.remove(v.group);
    v.group = v.leaves = v.bar = null;
  };

  return {
    update(camera, time, hidden) {
      for (const id of worked) {
        const v = byId.get(id);
        if (v) [v.since, v.heard] = [time, false];
      }
      worked.clear();
      for (const id of shaken) {
        const v = byId.get(id);
        if (v) v.tried = time;
      }
      shaken.clear();
      for (const v of views) {
        const far = Math.hypot(v.s.x - camera.position.x, v.s.z - camera.position.z);
        if (hidden || far > KEEP) {
          if (v.group) drop(v);
          continue;
        }
        if (!v.group) {
          if (far > MAKE) continue;
          make(v);
        }
        const open = isOpened(g, v.s.id);
        const age = v.since === null ? Infinity : time - v.since; // an open door not opened in this sitting is open already
        const barK = open ? Math.min(1, age / SHORTCUT.barSeconds) : 0;
        const swingK = open ? Math.min(1, Math.max(0, (age - SHORTCUT.barSeconds) / SHORTCUT.swingSeconds)) : 0;
        if (open && !v.heard && v.since !== null && age >= SHORTCUT.barSeconds) { // the leaves begin to move: their own sound, made to the swing's length
          v.heard = true;
          const made = doorSound(v.look.door, SHORTCUT.swingSeconds, false, Math.random);
          audio.recipe(`door:${materialOf(v.look.door)}:open`, made.sound, { at: { x: v.s.x, y: v.s.y + 1.7, z: v.s.z }, range: RANGE, gain: DOOR_GAIN[materialOf(v.look.door)], vary: 0.5, fit: SHORTCUT.swingSeconds });
        }
        barPose(v.look, v.bar!, v.s.width, barK);
        const p = pose(v.look.door, ease(swingK), -1, v.s.height, v.s.width, time); // away from the side it was opened from
        const shudder = time - v.tried < SHAKE ? Math.sin((time - v.tried) * 70) * 0.025 * (1 - (time - v.tried) / SHAKE) : 0;
        const [l, r] = v.leaves!;
        l.rotation.copy(p.left);
        r.rotation.copy(p.right);
        l.rotation.y += shudder;
        r.rotation.y -= shudder;
        for (const leaf of [l, r]) leaf.scale.set(p.scaleX, 1, p.scaleZ);
        if (v.look.door.kind === 'slab') {
          l.position.set(p.slide, p.lift, shudder * 4);
          l.rotation.z = v.look.door.tilt ?? 0;
        }
      }
    },
  };
}
