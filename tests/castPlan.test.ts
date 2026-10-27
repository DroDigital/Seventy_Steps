/**
 * What a foe's cut-out does, as numbers (round 94; render/castPlan.ts and shaders/castSprite.ts): it leans back from the light until its shadow is as
 * long as the body is tall, stands behind the body for a lamp, is turned about through the shape the picture and its mirror share, is larger for a
 * horror and reaches as far as the moon's map; and the shaders say what castPlan says.
 */
import { describe, expect, it } from 'vitest';
import { CAST, LAMP_SHADOWS, LANTERN_SHADOW, SHADOW } from '../src/data/fxTuning';
import { LANTERN } from '../src/data/tuning';
import { bodyKept, castCorner, leanOf, loomOf, reachOf, shadowReach, standOff, turnOf } from '../src/render/castPlan';
import { CAST_FRAG, CAST_VERT } from '../src/render/shaders/castSprite';
import { SPRITE_VERT } from '../src/render/shaders/sprite';

const deg = (d: number): number => (d * Math.PI) / 180;
const high = (elevation: number): { x: number; y: number; z: number; point: false } => ({ x: Math.cos(deg(elevation)), y: Math.sin(deg(elevation)), z: 0, point: false });

describe('how a cut-out leans', () => {
  it('stands upright for a low light and leans back, but never past its limit, as the light climbs', () => {
    expect(leanOf(0)).toBe(0);
    expect(leanOf(Math.sin(deg(20)))).toBe(0);
    expect(leanOf(Math.sin(deg(35)))).toBeLessThan(deg(1));
    let last = 0;
    for (let e = 20; e <= 89; e += 1) {
      const lean = leanOf(Math.sin(deg(e)));
      expect(lean).toBeGreaterThanOrEqual(last - 1e-12);
      expect(lean).toBeLessThanOrEqual(CAST.lean + 1e-12);
      last = lean;
    }
    expect(leanOf(Math.sin(deg(60)))).toBeGreaterThan(deg(20));
  });

  it('makes a shadow `CAST.stretch` heights long under every moon the night has (a height of 21 to 63 degrees) where its light can give it so, as long as it can be above 60 degrees (1 / sin of the light\'s height), and the true length under a lower light', () => {
    for (let e = 8; e <= 63; e += 1) {
      const reach = shadowReach(Math.sin(deg(e)));
      expect(reach, `${e} degrees`).toBeGreaterThanOrEqual(Math.min(1 / Math.sin(deg(e)), CAST.stretch) - 1e-6);
      expect(reach, `${e} degrees`).toBeGreaterThanOrEqual(Math.min(1 / Math.tan(deg(e)), CAST.stretch) - 1e-6); // (a lean only ever lengthens)
    }
    expect(shadowReach(Math.sin(deg(50)))).toBeCloseTo(CAST.stretch, 6); // the lean does what it is for where it can
    expect(shadowReach(Math.sin(deg(63)))).toBeCloseTo(1 / Math.sin(deg(63)), 6); // and where it cannot, the shadow is as long as can be
    expect(shadowReach(Math.sin(deg(10)))).toBeCloseTo(1 / Math.tan(deg(10)), 6);
    expect(shadowReach(Math.sin(deg(63)))).toBeGreaterThan(1);
  });

  it('is what the corners of the cut-out do: across the light, away from it, leaning back, standing behind the body by `back`', () => {
    const right = { x: 1, z: 0 };
    const moon = high(50); // the moon is toward +x
    const origin = { x: 4, y: 1, z: 2 };
    const loom = { tall: 1, wide: 1 };
    const [tl, tr, bl] = [castCorner(origin, 0.2, 2, 3, loom, moon, 0, right, -0.5, 1), castCorner(origin, 0.2, 2, 3, loom, moon, 0, right, 0.5, 1), castCorner(origin, 0.2, 2, 3, loom, moon, 0, right, -0.5, 0)];
    expect(Math.hypot(tr.x - tl.x, tr.y - tl.y, tr.z - tl.z)).toBeCloseTo(2, 6); // as broad as the picture
    expect((tr.x - tl.x) * moon.x + (tr.z - tl.z) * moon.z).toBeCloseTo(0, 6); // across the light
    expect(tr.y).toBeCloseTo(tl.y, 6); // level
    expect(tl.y - bl.y).toBeLessThan(3); // leaned back (it is not the picture's whole height above its bottom)
    expect((tl.x - bl.x) * moon.x + (tl.z - bl.z) * moon.z).toBeLessThan(0); // its top lies away from the moon
    expect(tr.z).toBeLessThan(tl.z); // the picture's right is toward -z for a moon toward +x (and `vTurn` is about this: the cut-out's right is `side`)
    const stood = castCorner(origin, 0.2, 2, 3, loom, { x: 20, y: 1.25, z: 2, point: true }, 0.25, { x: 0, z: 1 }, 0, 0.2 / 3);
    expect(stood.x).toBeCloseTo(4 - 0.25, 3); // a lamp's cut-out stands behind the body's feet, away from the lamp (at +x), the camera looking along the ray: the picture is across it
    expect(stood.y).toBeCloseTo(1.2, 3); // and its feet are the picture's, 0.2 above its bottom
  });

  it('is larger about the feet, which stay where they are, and as broad and as tall as the loom says', () => {
    const right = { x: 1, z: 0 };
    const [loom, feet, origin, moon] = [{ tall: 1.5, wide: 1.25 }, 0.6, { x: 4, y: 1, z: 2 }, high(35)];
    const at = (px: number, py: number) => castCorner(origin, feet, 2, 3, loom, moon, 0, right, px, py);
    const foot = at(0, feet / 3); // the row of the picture the feet are on
    expect([foot.x, foot.y, foot.z].map((n) => +n.toFixed(6))).toEqual([4, 1 + feet, 2]);
    const [l, r, top] = [at(-0.5, 1), at(0.5, 1), at(0, 1)];
    expect(Math.hypot(r.x - l.x, r.y - l.y, r.z - l.z)).toBeCloseTo(2 * loom.wide, 6);
    expect(Math.hypot(top.x - foot.x, top.y - foot.y, top.z - foot.z)).toBeCloseTo((3 - feet) * loom.tall, 6); // (the cut-out's own up has length 1)
  });

  it('stands a lamp\'s cut-out behind the whole breadth of the picture along the light\'s ray, so that no pixel of the picture lies deeper than it', () => {
    expect(standOff(CAST.back, 6, 0)).toBe(CAST.back); // the camera looks along the ray: the picture is across it
    expect(standOff(CAST.back, 6, 1)).toBeCloseTo(CAST.back + 3, 6); // across the camera's view: half of its breadth is farther from the lamp than its middle
    expect(standOff(CAST.back, 6, -0.5)).toBeCloseTo(CAST.back + 1.5, 6);
    const lamp = { x: 0, y: 1.5, z: 0, point: true as const };
    for (const [bx, bz] of [[6, 0], [0, 6], [4, 4], [-5, 3]]) {
      const [w, right] = [5, { x: 1, z: 0 }];
      const cut = castCorner({ x: bx, y: 0, z: bz }, 0, w, 3, { tall: 1, wide: 1 }, lamp, CAST.back, right, 0, 0.5);
      const toward = { x: -bx / Math.hypot(bx, bz), z: -bz / Math.hypot(bx, bz) }; // from the body to the lamp
      const depth = (p: { x: number; z: number }): number => (p.x - bx) * toward.x + (p.z - bz) * toward.z; // how much nearer the lamp (negative: farther)
      for (const px of [-0.5, -0.25, 0, 0.25, 0.5]) {
        const pixel = { x: bx + right.x * px * w, z: bz + right.z * px * w }; // a pixel of the billboard, which runs along the camera's right
        expect(depth(pixel), `${bx},${bz} ${px}`).toBeGreaterThan(depth(cut) - 1e-9); // the pixel is nearer the lamp than the cut-out
      }
    }
  });

  it('casts the shadow on the ground a taller body casts: longer as the body is taller, and as the loom is', () => {
    const ground = (h: number, loom: { tall: number; wide: number }): number => {
      const moon = high(30);
      const top = castCorner({ x: 0, y: 0, z: 0 }, 0, 1, h, loom, moon, 0, { x: 0, z: 1 }, 0, 1);
      return -(top.x - (top.y * moon.x) / moon.y) * Math.sign(moon.x); // where the moon's ray through the top meets the ground, behind the foot
    };
    expect(ground(4, { tall: 1, wide: 1 })).toBeGreaterThan(ground(2, { tall: 1, wide: 1 }) * 1.9);
    expect(ground(2, { tall: 1.5, wide: 1.25 })).toBeCloseTo(ground(3, { tall: 1, wide: 1 }), 6);
    expect(ground(2, { tall: 1, wide: 1 })).toBeCloseTo(2 / Math.tan(deg(30)), 5);
  });

  it('is turned about through the shape the two share, not all at once', () => {
    expect(turnOf(1)).toBe(1);
    expect(turnOf(CAST.turn)).toBe(1);
    expect(turnOf(0)).toBeCloseTo(0.5, 6);
    expect(turnOf(-CAST.turn)).toBe(0);
    expect(turnOf(-1)).toBe(0);
    expect(turnOf(0.1)).toBeGreaterThan(turnOf(-0.1));
  });
});

describe('how the picture is turned about', () => {
  // a body of eight texels across with a claw to its right, and the same turned about
  const picture = [1, 1, 1, 1, 1, 0, 0, 0];
  const mirror = [...picture].reverse();
  const shape = (t: number, cut = CAST.alpha.reviewed): string => picture.map((a, i) => (bodyKept(a, mirror[i], t, cut) ? '#' : '.')).join('');

  it('is the picture whole at one end and its mirror whole at the other', () => {
    expect(shape(1)).toBe('#####...');
    expect(shape(0)).toBe('...#####');
  });

  it('is the shape the two share in the middle of the turn, never the one swapped for the other at once', () => {
    expect(shape(0.5)).toBe('...##...');
    let [picked, mirrored, widest] = [false, false, ''];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const kept = shape(t);
      const onlyPicture = [...kept].some((c, n) => c === '#' && picture[n] === 1 && mirror[n] === 0);
      const onlyMirror = [...kept].some((c, n) => c === '#' && picture[n] === 0 && mirror[n] === 1);
      expect(onlyPicture && onlyMirror, `t = ${t}`).toBe(false); // (the one is gone before the other is back)
      expect(kept.includes('##'), `t = ${t}`).toBe(true); // and something is always left
      picked ||= onlyPicture;
      mirrored ||= onlyMirror;
      if (!onlyPicture && !onlyMirror) widest = kept;
    }
    expect(picked && mirrored).toBe(true);
    expect(widest).toBe('...##...');
  });

  it('only ever loses a texel of the picture as it turns toward its mirror, and gains one of the mirror\'s as it passes the middle', () => {
    let last = shape(1);
    for (let i = 99; i >= 50; i--) {
      const now = shape(i / 100);
      for (let n = 0; n < now.length; n++) if (now[n] === '#') expect(last[n], `t = ${i / 100}`).toBe('#'); // nothing comes back on the way in
      last = now;
    }
    for (let i = 49; i >= 0; i--) {
      const now = shape(i / 100);
      for (let n = 0; n < now.length; n++) if (last[n] === '#') expect(now[n], `t = ${i / 100}`).toBe('#'); // nothing is lost on the way out
      last = now;
    }
  });

  it('turns about a shape the procedural atlas draws with glows too: a mark of 0.63 opacity stays while the picture is as drawn and is gone at the middle', () => {
    expect(bodyKept(0.63, 0, 1, CAST.alpha.drawn)).toBe(true);
    expect(bodyKept(0.63, 0.63, 0.5, CAST.alpha.drawn)).toBe(false);
    expect(bodyKept(1, 1, 0.5, CAST.alpha.drawn)).toBe(true);
  });
});

describe('how far off a body still casts', () => {
  it('is as far as the moon\'s map, and as far again as the longest shadow its sheet could throw', () => {
    const [man, horror, giant] = [loomOf(2), loomOf(14), loomOf(40, 1)];
    expect(reachOf(2, man)).toBeCloseTo(CAST.reach + CAST.longest * 2 * man.tall, 6);
    expect(reachOf(2, man)).toBeGreaterThan(CAST.reach);
    expect(reachOf(14, horror)).toBeGreaterThan(reachOf(2, man) + 40);
    expect(reachOf(40, giant)).toBeGreaterThan(200); // a horror in its court: its shadow reaches the map from the court's far wall
  });
});

describe('how large a shadow is', () => {
  it('is larger than the body for every foe, larger for a taller one, and larger again deep in a horror\'s fight', () => {
    const [small, big, horror] = [loomOf(2), loomOf(14), loomOf(14, 1)];
    expect(small.tall).toBeCloseTo(1 + CAST.loom.base + CAST.loom.size * 0, 6);
    expect(big.tall).toBeGreaterThan(small.tall);
    expect(horror.tall).toBeCloseTo(big.tall + CAST.loom.deep, 6);
    expect(loomOf(14, 5).tall).toBe(horror.tall); // (deep is a share)
    expect(loomOf(14, -1).tall).toBe(big.tall);
    for (const l of [small, big, horror]) expect(l.wide).toBeCloseTo(1 + (l.tall - 1) * CAST.loom.wide, 6);
  });
});

describe('the shadow shaders', () => {
  const varyings = (src: string): Map<string, string> => new Map([...src.matchAll(/^\s*varying\s+(\w+)\s+(\w+)\s*;/gm)].map(([, type, name]) => [name, type]));

  it('hand over every varying the fragment reads, of the type it reads it as', () => {
    const [vert, frag] = [varyings(CAST_VERT), varyings(CAST_FRAG)];
    expect(frag.size).toBeGreaterThan(5);
    for (const [name, type] of frag) expect(vert.get(name), name).toBe(type);
  });

  it('say what castPlan says: the stretch, the lean and the turn, and the alpha the picture is cut at', () => {
    expect(CAST_VERT).toContain(`${CAST.stretch.toFixed(4)} * sy`);
    expect(CAST_VERT).toContain(`0.0, ${CAST.lean.toFixed(4)})`);
    expect(CAST_VERT).toContain(`smoothstep(${(-CAST.turn).toFixed(4)}, ${CAST.turn.toFixed(4)}, dot(side, uCastRight))`);
    expect(CAST_FRAG).toContain('uCastMin');
    expect(CAST_FRAG).toContain(`mix(uCastMin, ${CAST.merge.toFixed(4)}, k)`);
    expect(CAST_FRAG).toContain('fxKeep(src.xy'); // a body that crumbles crumbles in its shadow
    expect(CAST_FRAG).toContain('slip(uv)'); // and one whose rows slip slips
    expect(CAST_FRAG).toMatch(/discard;/);
  });

  // castPlan.ts is the vertex shader's arithmetic written again, where it can be run: so the lines that matter are pinned here, as they stand
  it('place a corner by the lines castCorner places it by: across, away, up, the feet kept, a body that casts none a point', () => {
    for (const line of [
      'float wBody = length(instanceMatrix[0].xyz);',
      'float w = wBody * aCast.z;',
      'float h = length(instanceMatrix[1].xyz) * aCast.y;',
      'vec3 feet = origin + vec3(0.0, aCast.w, 0.0);',
      'vec3 to = uCastLight.w > 0.5 ? uCastLight.xyz - (feet + vec3(0.0, 0.5 * h, 0.0)) : uCastLight.xyz;',
      'vec3 dir = normalize(to + vec3(0.0, 1e-4, 0.0));',
      'vec2 f = fl > 1e-3 ? flat2 / fl : vec2(-uCastRight.z, uCastRight.x);',
      'vec3 away = vec3(-f.x, 0.0, -f.y);',
      'vec3 side = vec3(f.y, 0.0, -f.x);',
      'float stand = uCastLight.w > 0.5 ? uCastBack + 0.5 * wBody * abs(dot(f, uCastRight.xz)) : 0.0;',
      'vec3 up = vec3(0.0, cos(lean), 0.0) + away * sin(lean);',
      'vec3 p = feet + away * stand + side * (position.x * w) + up * (position.y * h - aCast.w * aCast.y);',
      'p = mix(origin, p, aCast.x);',
      'float u = aInfo.z > 0.5 ? 1.0 - uv.x : uv.x;',
      'vUvB = vec2(mix(aCell.x, aCell.z, 1.0 - u), v);',
      'vFx = aFx;',
    ]) expect(CAST_VERT, line).toContain(line);
    expect(CAST_VERT).not.toMatch(/vUvB\s*=\s*vUv\b/);
  });

  it('keep the points the sprite reads its own light at in front of its cut-out, by more than the maps\' bias', () => {
    expect(SPRITE_VERT).toContain('(0.32 * w + 0.3) + vec3(0.0, 0.8, 0.0)'); // the moon's, toward it from the body's middle (the cut-out in the moon's map stands at the body)
    expect(SPRITE_VERT).toContain('lanternLit(origin + vec3(0.0, 0.8, 0.0)'); // the lantern's, at the body's middle
    expect(0.3).toBeGreaterThan(SHADOW.bias + SHADOW.offset);
    expect(CAST.back).toBeGreaterThan(LANTERN_SHADOW.bias + 0.01 * LANTERN.range); // (the lantern's bias grows 1 cm a metre)
    expect(CAST.back).toBeGreaterThan(LAMP_SHADOWS.bias + 0.012 * 10); // (a lamp's, 1.2 cm, and a lamp ten metres off)
  });

  it('write nothing but depth', () => {
    expect(CAST_FRAG).toContain('gl_FragColor = vec4(1.0)');
  });
});
