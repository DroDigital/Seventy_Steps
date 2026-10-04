import { describe, expect, it } from 'vitest';
import { WAKE } from '../src/data/cutscenes';
import { frameOf, sceneLength, shotAt, type Anchor } from '../src/render/cinemaPlan';

const ME: Anchor = { x: 0, y: 0, z: 0, yaw: 0, height: 1.8 };
const DT = 1 / 120;

/** The lens's pace (metres, and degrees of view, per second) through a scene. */
function pace(): number[] {
  const out: number[] = [];
  let last = frameOf(shotAt(WAKE, 0).shot, 0, ME, null, 0);
  for (let t = DT; t <= sceneLength(WAKE); t += DT) {
    const { shot, u } = shotAt(WAKE, t);
    const f = frameOf(shot, u, ME, null, t);
    out.push((Math.hypot(f.pos.x - last.pos.x, f.pos.y - last.pos.y, f.pos.z - last.pos.z) + Math.abs(f.fov - last.fov) * 0.02) / DT);
    last = f;
  }
  return out;
}

describe('the wake crane (round 39)', () => {
  const v = pace();
  const peak = Math.max(...v);
  it('never comes to a stop on its way up: it was three moves, each easing to rest and away again', () => {
    const [from, to] = [Math.floor(v.length * 0.15), Math.floor(v.length * 0.85)];
    expect(Math.min(...v.slice(from, to))).toBeGreaterThan(peak * 0.15);
  });
  it('changes its pace smoothly: no frame is a step', () => {
    let worst = 0;
    for (let i = 1; i < v.length; i++) worst = Math.max(worst, Math.abs(v[i] - v[i - 1]));
    expect(worst).toBeLessThan(peak * 0.05);
  });
});
