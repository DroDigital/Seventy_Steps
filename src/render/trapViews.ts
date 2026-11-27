/**
 * The dungeons' traps drawn and moved (2026-11-27; systems/dungeonTraps.ts holds their state, render/trapShapes.ts their hardware): every
 * mechanism in plain sight before it strikes. A plate's sign glows faintly, and bright when pressed; a grate's spikes rattle under it and
 * then thrust; a slot's mouth glows as its catch is let go and its darts fly; pendulums swing from a beam under the ceiling; a nozzle's
 * throat brightens and hisses, then throws its jet; a slab sheds dust and shakes, drops, and is drawn up again on its chains; a boulder is
 * heard before it rolls in from the far wall; a vent puffs a cloud; an eye turns to follow. Made while the investigator is in a trapped
 * dungeon and put away after. Render only.
 */

import * as THREE from 'three';
import { TRAP } from '../data/tuning';
import type { Game } from '../systems/components';
import { bladeAt, boulderAt, trapRun, type LiveTrap, type TrapRun } from '../systems/dungeonTraps';
import { createHalos } from './halos';
import { tint } from './meshKit';
import type { Particles } from './particles';
import { ball, beam, dart, eye, grate, nozzle, pendulum, plate, slab, slot, spikes, vent } from './trapShapes';
import { wayLook } from './wayFx';
import { createWorldMaterial } from './worldMaterial';

export interface TrapViews {
  update(eye: THREE.Vector3, time: number, hidden: boolean): void;
}

interface View {
  l: LiveTrap;
  root: THREE.Group;
  moving?: THREE.Object3D; // spikes, a slab, a blade, a boulder, an eye
  glow?: THREE.ShaderMaterial; // a sign, a mouth, a throat, an iris
  chains?: THREE.Object3D[];
  darts: THREE.Mesh[];
}

const yawOf = (dx: number, dz: number): number => Math.atan2(dx, dz);

export function createTrapViews(scene: THREE.Scene, g: Game, particles: Particles): TrapViews {
  const halos = createHalos(32, 0.5);
  scene.add(halos.mesh);
  const stone = createWorldMaterial({ texture: 'stone', seed: 11, vertexColors: true, vary: 0.3 });
  const shine = (): THREE.ShaderMaterial => createWorldMaterial({ texture: 'cloth', seed: 5, vertexColors: true, emissive: 0.3 });
  const dartGeo = dart();
  let built: TrapRun | null = null;
  let views: View[] = [];
  const own: THREE.Material[] = [];

  const drop = (): void => {
    for (const v of views) {
      scene.remove(v.root);
      v.root.traverse((o) => void (o instanceof THREE.Mesh && o.geometry !== dartGeo && o.geometry.dispose()));
    }
    for (const m of own.splice(0)) m.dispose();
    views = [];
    built = null;
  };

  const make = (l: LiveTrap): View => {
    const p = l.p;
    const root = new THREE.Group();
    const v: View = { l, root, darts: [] };
    const hue = wayLook(p.look).look.danger;
    const lit = (geo: THREE.BufferGeometry): THREE.Mesh => {
      const m = shine();
      own.push(m);
      v.glow = m;
      return new THREE.Mesh(tint(geo, hue), m);
    };
    root.position.set(p.at.x, p.at.y, p.at.z);
    switch (p.kind) {
      case 'spikes': {
        root.add(new THREE.Mesh(grate(TRAP.spikes.half), stone));
        v.moving = new THREE.Mesh(spikes(TRAP.spikes.half), stone);
        root.add(v.moving);
        break;
      }
      case 'darts':
      case 'boulder': {
        const pl = plate(p.kind === 'darts' ? 1 : 2);
        root.add(new THREE.Mesh(pl.stone, stone), lit(pl.sign));
        const mouth = new THREE.Group();
        mouth.position.set(p.from!.x - p.at.x, p.from!.y - p.at.y, p.from!.z - p.at.z);
        mouth.rotation.y = yawOf(p.to!.x - p.from!.x, p.to!.z - p.from!.z);
        if (p.kind === 'darts') {
          const s = slot();
          mouth.position.x -= Math.sin(mouth.rotation.y) * 0.32; // (set into the wall the mouth looks out of)
          mouth.position.z -= Math.cos(mouth.rotation.y) * 0.32;
          mouth.add(new THREE.Mesh(s.head, stone), new THREE.Mesh(tint(s.mouth, hue), v.glow!));
          for (let i = 0; i < TRAP.darts.volley; i++) {
            const d = new THREE.Mesh(dartGeo, stone);
            d.visible = false;
            v.darts.push(d);
            root.add(d);
          }
        } else {
          v.moving = new THREE.Mesh(ball(TRAP.boulder.radius), stone);
          v.moving.visible = false;
          root.add(v.moving);
        }
        root.add(mouth);
        break;
      }
      case 'blades': {
        const len = Math.max(1.6, p.top - p.at.y - 1.1);
        const swing = new THREE.Vector3(p.to!.x - p.from!.x, 0, p.to!.z - p.from!.z).normalize();
        const bar = new THREE.Mesh(beam(3.4), stone);
        bar.position.set(0, p.top - p.at.y, 0);
        bar.rotation.y = Math.atan2(-swing.x, -swing.z); // along the hinge, square to the swing: the beam its pivot hangs from
        const pivot = new THREE.Group();
        pivot.position.set(0, p.top - p.at.y - 0.1, 0);
        pivot.rotation.order = 'YXZ';
        pivot.rotation.y = Math.atan2(-swing.z, swing.x); // its local x along the swing
        pivot.add(new THREE.Mesh(pendulum(len), stone));
        pivot.userData.len = len;
        root.add(bar, pivot);
        v.moving = pivot;
        break;
      }
      case 'flames': {
        const n = nozzle();
        const mouth = new THREE.Group();
        mouth.position.set(p.from!.x - p.at.x, p.from!.y - p.at.y, p.from!.z - p.at.z);
        mouth.rotation.y = yawOf(p.to!.x - p.from!.x, p.to!.z - p.from!.z);
        mouth.position.x -= Math.sin(mouth.rotation.y) * 0.3;
        mouth.position.z -= Math.cos(mouth.rotation.y) * 0.3;
        mouth.add(new THREE.Mesh(n.body, stone), lit(n.throat));
        root.add(mouth);
        break;
      }
      case 'crusher': {
        const s = slab(TRAP.crusher.half);
        const slabMesh = new THREE.Mesh(s.stone, stone);
        v.moving = slabMesh;
        v.chains = [-1, 1].flatMap((a) => [-1, 1].map((b) => {
          const c = new THREE.Mesh(s.chain, stone);
          c.position.set(a * TRAP.crusher.half * 0.7, 0, b * TRAP.crusher.half * 0.7);
          root.add(c);
          return c;
        }));
        root.add(slabMesh);
        break;
      }
      case 'gas':
        root.add(lit(vent()));
        break;
      case 'watcher': {
        const e = eye();
        const ball = new THREE.Group();
        ball.add(new THREE.Mesh(e.white, stone), lit(e.iris));
        v.moving = ball;
        root.add(ball);
        break;
      }
      case 'tide':
        break;
    }
    scene.add(root);
    return v;
  };

  const puff = (at: THREE.Vector3 | { x: number; y: number; z: number }, look: Parameters<typeof wayLook>[0], k: number, spread: number, up: number): void => {
    const m = wayLook(look).look;
    for (let i = 0; i < k; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = spread * Math.sqrt(Math.random());
      particles.spawn({ x: at.x + Math.sin(a) * d, y: at.y + 0.1, z: at.z + Math.cos(a) * d, vy: up * (0.5 + Math.random()), vx: Math.sin(a) * 0.3, vz: Math.cos(a) * 0.3, life: 1.4 + Math.random(), size: 0.6 + Math.random() * 0.6, grow: 2, color: m.line, colorEnd: m.ring, shape: 'disc', alpha: 0.5 });
    }
  };

  const animate = (v: View, time: number, near: boolean): void => {
    const { l } = v;
    const p = l.p;
    const warn = l.state === 'warn' ? 1 - l.left / Math.max(1, l.left + l.t) : 0;
    const m = wayLook(p.look).look;
    if (v.glow) v.glow.uniforms.uEmissive.value = l.state === 'warn' ? 0.8 + 0.8 * Math.abs(Math.sin(time * 14)) : l.state === 'on' ? 1.6 : 0.3 + 0.08 * Math.sin(time * 1.3);
    switch (p.kind) {
      case 'spikes':
        v.moving!.position.y = l.state === 'on' ? -0.7 * Math.max(0, 1 - l.t / 3) : l.state === 'warn' ? -0.62 + 0.03 * Math.sin(time * 70) : -0.72;
        break;
      case 'darts':
        v.darts.forEach((d, i) => {
          const f = l.darts[i];
          d.visible = !!f;
          if (!f) return;
          d.position.set(f.pos.x - p.at.x, f.pos.y - p.at.y, f.pos.z - p.at.z);
          d.rotation.y = yawOf(p.to!.x - p.from!.x, p.to!.z - p.from!.z);
        });
        break;
      case 'boulder': {
        const rolling = l.state === 'on';
        v.moving!.visible = rolling;
        if (rolling) {
          const b = boulderAt(l);
          v.moving!.position.set(b.x - p.at.x, b.y - p.at.y, b.z - p.at.z);
          const dist = Math.hypot(b.x - p.from!.x, b.z - p.from!.z);
          const axis = new THREE.Vector3(p.to!.z - p.from!.z, 0, -(p.to!.x - p.from!.x)).normalize();
          v.moving!.quaternion.setFromAxisAngle(axis, -dist / TRAP.boulder.radius);
          if (near && Math.random() < 0.5) puff(b, p.look, 1, 0.6, 0.4);
        } else if (l.state === 'warn' && near && Math.random() < 0.3) puff(p.from!, p.look, 1, 1.2, -0.2); // dust shaken off the far wall
        break;
      }
      case 'blades': {
        const now = bladeAt(g, p);
        const reach = Math.hypot(p.to!.x - p.from!.x, p.to!.z - p.from!.z) / 2;
        const len = v.moving!.userData.len as number;
        v.moving!.rotation.z = Math.asin(Math.max(-0.95, Math.min(0.95, (now.swing * reach) / len)));
        break;
      }
      case 'flames':
        if (l.state === 'on' && near) {
          for (let i = 0; i < 10; i++) {
            const k = Math.random();
            const x = p.from!.x + (p.to!.x - p.from!.x) * k;
            const z = p.from!.z + (p.to!.z - p.from!.z) * k;
            particles.spawn({ x, y: p.from!.y + (Math.random() - 0.5) * 0.4, z, vy: 0.6 + Math.random(), vx: (Math.random() - 0.5) * 0.6, vz: (Math.random() - 0.5) * 0.6, life: 0.35 + Math.random() * 0.25, size: 0.45 + 0.55 * k, grow: 1.8, color: m.core, colorEnd: m.line, glow: true, shape: 'disc', alpha: 1 });
          }
        } else if (l.state === 'warn' && near && Math.random() < 0.4) particles.spawn({ x: p.from!.x, y: p.from!.y, z: p.from!.z, vy: 0.4, life: 0.4, size: 0.12, color: m.line, colorEnd: m.ember, glow: true, shape: 'spark' });
        break;
      case 'crusher': {
        const hang = p.top - p.at.y - 0.65;
        const T = TRAP.crusher;
        const low = 0.3; // its points on the floor
        const y = l.state === 'on' ? (l.t <= T.fall ? hang - (hang - low) * (l.t / T.fall) : l.t <= T.fall + T.down ? low : low + (hang - low) * Math.min(1, (l.t - T.fall - T.down) / T.rise)) : hang;
        v.moving!.position.set(l.state === 'warn' ? 0.025 * Math.sin(time * 50) : 0, y, 0);
        for (const c of v.chains ?? []) {
          c.position.y = y + 0.55;
          c.scale.y = Math.max(0.05, p.top - p.at.y - y - 0.55);
        }
        if (l.state === 'warn' && near && Math.random() < 0.5) particles.spawn({ x: p.at.x + (Math.random() - 0.5) * 2, y: p.at.y + y, z: p.at.z + (Math.random() - 0.5) * 2, vy: -2, life: 0.8, size: 0.06, color: m.ring, colorEnd: m.ink, shape: 'disc', gravity: 6, alpha: 0.7 });
        if (l.state === 'on' && l.t === T.fall && near) puff(p.at, p.look, 14, TRAP.crusher.half * 1.2, 1.2);
        break;
      }
      case 'gas':
        if (l.state === 'on' && near) puff(p.at, p.look, 2, TRAP.gas.r * 0.75, 0.35); // the cloud as wide as it takes the breath
        break;
      case 'watcher': {
        const me = g.ecs.c.transform.get(g.player.id)?.pos;
        if (me) v.moving!.lookAt(me.x, me.y + 1.4, me.z);
        v.moving!.position.y = 0.15 * Math.sin(time * 0.9);
        break;
      }
    }
    if (near && l.state === 'warn' && p.kind !== 'watcher') halos.put(p.kind === 'flames' || p.kind === 'darts' ? p.from!.x : p.at.x, (p.kind === 'flames' || p.kind === 'darts' ? p.from!.y : p.at.y) + 0.3, p.kind === 'flames' || p.kind === 'darts' ? p.from!.z : p.at.z, 0.9 + warn, m.danger, 0.25 + 0.4 * warn);
  };

  return {
    update(eyeAt, time, hidden) {
      const run = hidden ? null : trapRun(g);
      if (run !== built) {
        drop();
        if (run) {
          views = run.live.map(make);
          built = run;
        }
      }
      halos.begin();
      for (const v of views) {
        const near = Math.hypot(v.l.p.at.x - eyeAt.x, v.l.p.at.z - eyeAt.z) < 30;
        v.root.visible = Math.hypot(v.l.p.at.x - eyeAt.x, v.l.p.at.z - eyeAt.z) < 60;
        if (v.root.visible) animate(v, time, near);
      }
      halos.end();
    },
  };
}
