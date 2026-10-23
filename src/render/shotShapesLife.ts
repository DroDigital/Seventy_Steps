/**
 * The shots of the living and the half-living (round 69; data/shotForms.ts): what the sea throws, what slimes and wriggles, and the
 * eyes, faces and skulls. Each is in its own frame, flying toward +z, about two units long. Render only: geometry.
 */

import * as THREE from 'three';
import { around, ball, BODY, BREATHE, DARK, FLAP, gem, HOT, limb, PALE, part, ring, rod, slab, SNAKE, solid } from './shotKit';

const sphere = (r: number): THREE.SphereGeometry => new THREE.SphereGeometry(r, 7, 5);

/** The fallback for a creature with no shot of its own: a cut stone with a bright heart. */
export const shard = (): THREE.BufferGeometry => solid([gem(1, BODY, [0, 0, 0], [0.42, 0.42, 1.35]), ball(0.26, HOT)]);

/** The fallback for spit: a glob with a bead behind it. */
export const glob = (): THREE.BufferGeometry => solid([ball(0.8, BODY, [0, 0, 0.1], [0.9, 0.9, 1.1], BREATHE), ball(0.22, HOT, [0.25, 0.35, 0.4]), ball(0.26, BODY, [0, 0, -1.05])]);

/** Dagon's silver fish: a spindle with a forked tail that beats, fins and an eye. */
export const fish = (): THREE.BufferGeometry =>
  solid([
    ball(1, BODY, [0, 0, 0.15], [0.5, 0.58, 1.1]),
    slab(0.1, 0.55, 0.85, PALE, [0, 0.62, -0.2], [-0.35, 0, 0]),
    ...[-1, 1].map((s) => slab(0.8, 0.1, 0.5, PALE, [s * 0.52, -0.18, 0.2], [0, 0, s * 0.45])),
    slab(0.1, 0.95, 0.5, BODY, [0, 0.38, -1.3], [0.55, 0, 0], SNAKE),
    slab(0.1, 0.95, 0.5, BODY, [0, -0.38, -1.3], [-0.55, 0, 0], SNAKE),
    ...[-1, 1].map((s) => ball(0.14, HOT, [s * 0.3, 0.16, 0.72])),
  ]);

/** The triton's conch: whorls that dwindle to a point, a flared lip, and the spiral banded. */
export const conch = (): THREE.BufferGeometry =>
  solid([
    ball(0.72, BODY, [0, 0, -0.25], [1, 1, 1.15]),
    ball(0.52, PALE, [0.1, 0.08, 0.5]),
    ball(0.36, BODY, [-0.06, 0.12, 0.98]),
    ball(0.22, PALE, [0, 0.1, 1.34]),
    ring(0.52, 0.14, PALE, [0, -0.08, -0.85], [0.35, 0, 0]),
    ball(0.2, HOT, [0, -0.05, -0.82]),
    ...[0, 1, 2].map((i) => gem(0.2, PALE, [Math.cos(i * 2.1) * 0.7, Math.sin(i * 2.1) * 0.7, -0.15 + i * 0.1])),
  ]);

/** Three bubbles of brine that cling, each with its glint. */
export const bubbles = (): THREE.BufferGeometry =>
  solid([
    ball(0.75, PALE, [0, 0, 0], [1, 1, 1], BREATHE),
    ball(0.5, BODY, [0.8, 0.45, 0.1], [1, 1, 1], BREATHE),
    ball(0.42, BODY, [-0.6, 0.6, -0.15], [1, 1, 1], BREATHE),
    ball(0.17, HOT, [0.28, 0.42, 0.5]),
    ball(0.12, HOT, [0.95, 0.7, 0.36]),
    ball(0.1, HOT, [-0.45, 0.86, 0.1]),
  ]);

/** Mother Hydra's tangle: a dark knot with a bright core, six tendrils of kelp streaming back and unravelling. */
export const tangle = (): THREE.BufferGeometry =>
  solid([
    ball(0.62, DARK, [0, 0, 0.15]),
    ball(0.32, HOT, [0, 0.08, 0.55]),
    ...around(6, (a, i) => {
      const bend = i % 2 ? 0.5 : -0.5;
      const pts: [number, number, number][] = [0, 1, 2, 3].map((k) => [Math.cos(a + bend * k * 0.45) * (0.45 + 0.26 * k), Math.sin(a + bend * k * 0.45) * (0.45 + 0.26 * k), 0.1 - 0.5 * k]);
      return solid([0, 1, 2].map((k) => limb(pts[k]!, pts[k + 1]!, 0.2 - k * 0.05, 0.15 - k * 0.05, i % 2 ? PALE : BODY, SNAKE)));
    }),
  ]);

/** The Ib-folk's spawn: a clot of eggs, each with its dark nucleus turned outward. */
export const spawn = (): THREE.BufferGeometry => {
  const at: [number, number, number][] = [[0, 0, 0], [0.62, 0, 0.15], [-0.62, 0.05, 0.1], [0.3, 0.55, -0.2], [-0.3, 0.55, 0.2], [0.3, -0.55, 0.15], [-0.3, -0.55, -0.15]];
  return solid(at.flatMap(([x, y, z]) => {
    const n = Math.hypot(x, y, z + 1.2);
    return [ball(0.4, PALE, [x, y, z], [1, 1, 1], BREATHE), ball(0.18, DARK, [x + (x / n) * 0.3, y + (y / n) * 0.3, z + ((z + 1.2) / n) * 0.3])];
  }));
};

/** Tsathoggua's spawn: a black blob that puts out and draws in its stubs, with one bright bubble of ichor in it. */
export const ooze = (): THREE.BufferGeometry =>
  solid([
    ball(1, BODY, [0, 0, 0], [1.05, 0.8, 1], BREATHE),
    ...([[0.85, 0.1, 0.2], [-0.8, 0.15, -0.1], [0.1, 0.75, 0.4], [-0.1, -0.5, -0.7]] as const).map((p) => ball(0.38, PALE, p, [1, 1, 1], BREATHE)),
    ball(0.2, HOT, [0.2, 0.3, 0.72]),
    ball(0.3, DARK, [-0.3, 0.4, 0.62], [1, 1, 0.5]),
  ]);

/** The toad-god's glob: broad and black with two eyes on its brow and a wide mouth. */
export const eyeglob = (): THREE.BufferGeometry =>
  solid([
    ball(1, BODY, [0, 0, 0], [1.1, 0.8, 1], BREATHE),
    ...[-1, 1].flatMap((s) => [ball(0.34, PALE, [s * 0.42, 0.55, 0.35]), ball(0.15, HOT, [s * 0.42, 0.6, 0.64])]),
    slab(1.1, 0.1, 0.25, DARK, [0, -0.05, 0.9]),
  ]);

/** The dhole's grub: pale rings that squirm, and a dark mouth. */
export const grub = (): THREE.BufferGeometry =>
  solid([
    ...([[0.55, 1.0], [0.66, 0.45], [0.68, -0.15], [0.58, -0.7], [0.4, -1.2]] as const).map(([r, z], i) => ball(r, i % 2 ? BODY : PALE, [0, 0, z], [1, 1, 0.85], SNAKE)),
    ring(0.3, 0.1, DARK, [0, 0, 1.3]),
    ball(0.18, HOT, [0, 0, 1.2]),
  ]);

/** Yig's snake: a diamond-backed body, head first, a forked tongue's worth of fang, the tail lashing. */
export const viper = (): THREE.BufferGeometry => {
  const spine = [[1.2, 0.42], [0.82, 0.3], [0.5, 0.34], [0.16, 0.36], [-0.16, 0.34], [-0.5, 0.3], [-0.82, 0.22], [-1.15, 0.12]] as const;
  return solid([
    ...spine.map(([z, r], i) => ball(r, i === 0 ? BODY : i % 2 ? DARK : BODY, [0, 0, z], i === 0 ? [0.9, 0.7, 1.3] : [1, 0.9, 1.25], SNAKE)),
    ...[-1, 1].flatMap((s) => [ball(0.09, HOT, [s * 0.22, 0.18, 1.28]), slab(0.06, 0.3, 0.06, PALE, [s * 0.12, -0.24, 1.5])]),
  ]);
};

/** The serpent-man's fang: curved, with a bead of venom at its tip and the gland at its root. */
export const fang = (): THREE.BufferGeometry => {
  const R = 1.9;
  const bits = [0, 1, 2, 3, 4].map((k) => {
    const [a, b] = [k * 0.27, (k + 1) * 0.27];
    const m = (a + b) / 2;
    return rod(0.3 - k * 0.055, 0.3 - (k + 1) * 0.055, R * 0.27 * 1.1, PALE, [0, -(1 - Math.cos(m)) * R + 0.6, Math.sin(m) * R - 1.1], [m, 0, 0]);
  });
  const tip = 5 * 0.27;
  return solid([...bits, ball(0.5, BODY, [0, 0.6, -1.15]), ball(0.17, HOT, [0, -(1 - Math.cos(tip)) * R + 0.6 - 0.05, Math.sin(tip) * R - 1.1 + 0.08])]);
};

/** Spat venom: a heavy teardrop with its glint, shedding two beads. */
export const venom = (): THREE.BufferGeometry =>
  solid([ball(0.72, BODY, [0, 0, 0.1], [0.9, 0.9, 1.15], BREATHE), ball(0.2, HOT, [0.25, 0.38, 0.45]), ball(0.3, BODY, [0, 0, -0.85]), ball(0.17, BODY, [0, 0.05, -1.3])]);

/** A hand from Yeb: palm and four fingers that flex, a thumb, a bright claw on each. */
export const hand = (): THREE.BufferGeometry =>
  solid([
    slab(0.95, 0.3, 0.8, BODY, [0, 0, -0.3]),
    rod(0.2, 0.3, 0.5, DARK, [0, 0, -0.85]),
    ...[-0.36, -0.12, 0.12, 0.36].flatMap((x) => [
      rod(0.1, 0.09, 0.6, BODY, [x, 0, 0.4], [0, 0, 0], FLAP),
      rod(0.09, 0.06, 0.5, BODY, [x, -0.14, 0.88], [0.55, 0, 0], FLAP),
      gem(0.1, HOT, [x, -0.33, 1.12], [1, 1, 1.6]),
    ]),
    rod(0.12, 0.09, 0.55, BODY, [0.62, 0.04, -0.05], [0, 0.7, 0]),
  ]);

/** The Mi-Go's puffball: a pink sac with pale knobs, each tipped with a spore. */
export const pod = (): THREE.BufferGeometry =>
  solid([
    ball(0.85, BODY, [0, 0, 0], [1, 0.95, 1.05], BREATHE),
    ...around(6, (a, i) => ball(0.28, PALE, [Math.cos(a) * 0.78, Math.sin(a) * 0.78, i % 2 ? 0.45 : -0.45])),
    ...around(6, (a, i) => ball(0.1, HOT, [Math.cos(a) * 1.02, Math.sin(a) * 1.02, i % 2 ? 0.52 : -0.52])),
    ball(0.3, DARK, [0, 0, 0.8], [1, 1, 0.5]),
  ]);

/** An eye that stares where it flies: white, iris, pupil, a glint, and the nerve and veins trailing. */
export const eyeball = (): THREE.BufferGeometry =>
  solid([
    ball(0.85, PALE),
    ball(0.5, BODY, [0, 0, 0.6], [1, 1, 0.5]),
    ball(0.25, DARK, [0, 0, 0.84], [1, 1, 0.4]),
    ball(0.09, HOT, [0.15, 0.18, 0.95]),
    rod(0.14, 0.09, 1.0, DARK, [0, 0, -1.2], [0, 0, 0], SNAKE),
    rod(0.07, 0.04, 0.8, BODY, [0.22, 0.14, -1.0], [0.1, 0.35, 0], SNAKE),
    rod(0.07, 0.04, 0.8, BODY, [-0.2, -0.16, -1.0], [-0.1, -0.35, 0], SNAKE),
  ]);

/** The Haunter's eye: three lobes about a burning heart, ringed in black. */
export const trilobe = (): THREE.BufferGeometry =>
  solid([
    ...around(3, (a) => part(sphere(1), BODY, { at: [Math.cos(a + 1.57) * 0.62, Math.sin(a + 1.57) * 0.62, 0], sc: [0.34, 0.85, 0.34], rot: [0, 0, a] })),
    ball(0.42, HOT),
    ring(0.98, 0.08, DARK, [0, 0, -0.12]),
    ring(0.98, 0.05, HOT, [0, 0, 0.12], [0, 0, 0.5]),
  ]);

/** The High Priest's yellow mask: a long oval of silk, two dark eyes lit from behind, a slit of a mouth, tatters hanging. */
export const mask = (): THREE.BufferGeometry =>
  solid([
    ball(1, BODY, [0, 0, 0], [0.8, 1, 0.38]),
    ...[-1, 1].flatMap((s) => [ball(0.22, DARK, [s * 0.3, 0.22, 0.34], [1, 1.25, 0.5]), ball(0.07, HOT, [s * 0.3, 0.22, 0.43])]),
    slab(0.5, 0.08, 0.1, DARK, [0, -0.42, 0.34]),
    slab(0.1, 0.5, 0.2, DARK, [0, -0.05, 0.37]),
    ...[-0.3, 0, 0.3].map((x) => slab(0.1, 0.55, 0.06, PALE, [x, -1.1, 0], [0, 0, 0], FLAP)),
  ]);

/** A skull aflame: cranium, jaw, sockets with a light in each, and fire streaming up from the crown. */
export const skull = (): THREE.BufferGeometry =>
  solid([
    ball(0.75, PALE, [0, 0.1, 0]),
    slab(0.62, 0.28, 0.55, PALE, [0, -0.62, 0.12]),
    ...[-1, 1].flatMap((s) => [ball(0.24, DARK, [s * 0.28, 0.1, 0.62], [1, 1.1, 0.6]), ball(0.11, HOT, [s * 0.28, 0.1, 0.78])]),
    gem(0.12, DARK, [0, -0.2, 0.74]),
    slab(0.5, 0.08, 0.06, DARK, [0, -0.5, 0.42]),
    ball(0.3, HOT, [0, 0.55, -0.8], [0.9, 0.9, 2.1], BREATHE),
    ball(0.22, BODY, [0.36, 0.42, -0.75], [0.8, 0.8, 1.9], BREATHE),
    ball(0.22, BODY, [-0.36, 0.42, -0.75], [0.8, 0.8, 1.9], BREATHE),
  ]);

/** The Yekubians' lens: a disc of faceted glass in a rim, a bright point at its middle, four studs. */
export const lens = (): THREE.BufferGeometry =>
  solid([
    ball(1, PALE, [0, 0, 0], [1, 1, 0.22]),
    ring(1, 0.12, BODY, [0, 0, 0], [0, 0, 0], [1, 1, 1], 10),
    ball(0.3, HOT, [0, 0, 0.18]),
    ...around(4, (a) => gem(0.14, BODY, [Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0])),
  ]);
