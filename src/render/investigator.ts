/**
 * The investigator (spec §3B). Round 80: modelled in Blender (tools/player/, docs/PLAYER.md) and baked into `data/player`: a 1920s field coat cinched at the waist with its
 * sloped shoulders, double row of buttons and turned-up collar, a rust scarf with its two ends, a belt with its buckle, cartridge loop and half-belt, a satchel slung over
 * the left shoulder to the right hip behind, a fedora with its band and pin over short hair and a lean face, gloves that close round what they hold, laced boots, the
 * lantern at the belt, the revolver in its holster, an oil flask on the belt; and what they take up: the sword-cane (a stick, and the blade drawn from it), the found
 * weapons, the revolver, the lobbed flask, the Laudanum, the Reagent's syringe, the Powder of Ibn Ghazi, a match, the book of the incantation. The joints are the
 * old figure's (a pose written for it fits), the parts hang on them as figures.ts's `skeleton` has them. The people's coat skirts (npcFigures.ts) are still `skirtPanel`.
 */

import * as THREE from 'three';
import { PLAYER_PARTS, type PlayerPart } from '../data/player/playerIndex';
import { part, skeleton, type Figure } from './figures';
import { tint } from './meshKit';
import { partGeometry } from './playerParts';
import type { Rgb } from './palette';

/**
 * One half of the coat's skirt, a closed flared shell from the belt to the knee that hangs at the hip
 * and swings with its thigh (poses.ts), so a striding leg stays inside the coat. (The people's: the investigator's are baked.)
 */
export function skirtPanel(side: 1 | -1, c: Rgb): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(1, 1, 1);
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const t = 0.5 - p.getY(i); // 0 at the belt, 1 at the hem
    const out = p.getX(i) + 0.5; // 0 at the middle, 1 at the side
    p.setXYZ(i, side * (0.006 + out * (0.205 + 0.035 * t)), 0.03 - 0.46 * t, p.getZ(i) * 2 * (0.125 + 0.045 * t));
  }
  g.computeVertexNormals();
  return tint(g, c);
}

/** The figure's frame, as `skeleton` builds it for the investigator (tools/player/frame.py has the same numbers). */
const FRAME = { hip: 0.92, shoulder: [0.28, 0.58], hipX: 0.11, neck: [0.64, 0], leg: 0.9, thigh: 0.42, upper: 0.3, fore: 0.28, ankle: 0.07 } as const;

/** What the figure's parts hang from: a joint's name in the data is the figure's own field. */
const joint = (f: Figure, p: PlayerPart): THREE.Object3D => {
  switch (p.joint) {
    case 'skirtR': return f.skirt[0];
    case 'skirtL': return f.skirt[1];
    case 'lantern': return f.lantern!;
    default: return f[p.joint];
  }
};

export function investigator(): Figure {
  const f = skeleton('humanoid', { ...FRAME, shoulder: [...FRAME.shoulder], neck: [...FRAME.neck] });
  f.character = 'player';
  for (let i = 0; i < 2; i++) {
    const panel = new THREE.Group();
    f.body.add(panel);
    f.skirt.push(panel); // right, then left: the baked parts name them
  }
  f.lantern = new THREE.Group(); // the pivot where the strap ends at the belt: tools/player/frame.py
  f.lantern.position.set(0.29, -0.005, 0.02);
  f.torso.add(f.lantern);
  f.arms = {};
  f.props = {};
  const merged = new Map<string, PlayerPart[]>(); // the body's parts on one joint and texture are one mesh
  for (const p of PLAYER_PARTS.filter((q) => q.group === 'body')) {
    const k = `${p.joint}|${p.tex}|${p.glow}`;
    merged.get(k)?.push(p) ?? merged.set(k, [p]);
  }
  for (const group of merged.values()) part(f, joint(f, group[0]), partGeometry(group.map((p) => p.id)), group[0].tex, group[0].glow);
  for (const p of PLAYER_PARTS.filter((q) => q.group !== 'body')) {
    const [kind, name] = p.group.split(':');
    const parent = joint(f, p);
    const holder = p.at ? new THREE.Group() : parent; // a part with a place of its own (the flame, the muzzle's flash) is an object there: the game moves and lights by it
    if (holder !== parent) {
      holder.position.set(...p.at!);
      parent.add(holder);
    }
    const mesh = part(f, holder, partGeometry([p.id]), p.tex, p.glow);
    mesh.visible = false;
    if (kind === 'arm') f.arms[name] = mesh;
    else if (kind === 'prop') f.props[name] = mesh;
    else if (kind === 'gun') f.gun = mesh;
    else if (kind === 'holstered') (f.holstered = mesh).visible = true;
    else if (kind === 'flash') f.flash = holder;
    else if (kind === 'flame') {
      f.flame = holder;
      f.flameMesh = mesh;
      mesh.visible = true;
    }
  }
  f.arms.cane.visible = true;
  return f;
}
