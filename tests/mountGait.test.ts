import { describe, expect, it } from 'vitest';
import { LEG, LEG_COUNT, STAND_SPEED, cyclesFor, footAt, gaitAt, hoofWeight, legPhase, strideLength, touchdowns } from '../src/systems/mountGait';

const SPEEDS = [0.5, 1.5, 3, 5.5, 8, 10, 11, 14, 17, 18];

describe('a horse\'s gait (round 50)', () => {
  it('goes from a walk to a trot to a canter to a gallop as the speed rises, its cycle ever longer', () => {
    expect(gaitAt(0).kind).toBe('stand');
    expect(gaitAt(1.5).kind).toBe('walk');
    expect(gaitAt(5.5).kind).toBe('trot');
    expect(gaitAt(11).kind).toBe('canter');
    expect(gaitAt(18).kind).toBe('gallop');
    let last = 0;
    for (const v of [1.5, 2, 3, 4, 5.5, 7, 9, 10, 12, 15, 17, 18]) {
      const { length } = gaitAt(v);
      expect(length, `${v} m/s`).toBeGreaterThanOrEqual(last);
      last = length;
    }
    expect(strideLength(11)).toBeCloseTo(gaitAt(11).length);
  });

  it('keeps a foot down for less of the cycle the faster it goes, and never lifts all four at once at a walk', () => {
    let last = 1;
    for (const v of [1.5, 3, 5.5, 8, 10, 14, 17]) {
      const { duty } = gaitAt(v);
      expect(duty, `${v} m/s`).toBeLessThanOrEqual(last);
      expect(duty).toBeGreaterThan(0.2);
      last = duty;
    }
    const walk = gaitAt(1.5);
    for (let i = 0; i < 200; i++) {
      const down = [0, 1, 2, 3].filter((leg) => legPhase(i / 200, walk.offsets[leg]) < walk.duty).length;
      expect(down).toBeGreaterThanOrEqual(2);
    }
  });

  it('a walk is four beats in the lateral sequence, a trot two (the diagonals), a canter three, a gallop four and a flight', () => {
    const beats = (v: number): number => new Set(gaitAt(v).offsets.map((o) => Math.round(o * 100) % 100)).size;
    expect(beats(1.5)).toBe(4);
    expect(beats(5.5)).toBe(2);
    expect(beats(10)).toBe(3);
    expect(beats(17)).toBe(4);
    const walk = gaitAt(1.5).offsets;
    const order = [LEG.LH, LEG.LF, LEG.RH, LEG.RF].map((leg) => walk[leg]);
    expect(order).toEqual([...order].sort((a, b) => a - b)); // hind, fore, hind, fore
    const trot = gaitAt(5.5).offsets;
    expect(trot[LEG.LF]).toBeCloseTo(trot[LEG.RH]);
    expect(trot[LEG.RF]).toBeCloseTo(trot[LEG.LH]);
    const canter = gaitAt(10).offsets;
    expect(canter[LEG.LH]).toBeCloseTo(canter[LEG.RF]);
  });

  it('between two gaits the beats move the short way round and never jump', () => {
    let last = gaitAt(1.5).offsets;
    for (let v = 1.5; v <= 18; v += 0.05) {
      const now = gaitAt(v).offsets;
      for (let leg = 0; leg < LEG_COUNT; leg++) {
        const d = Math.abs(now[leg] - last[leg]);
        expect(Math.min(d, 1 - d), `${v.toFixed(2)} m/s leg ${leg}`).toBeLessThan(0.05);
      }
      last = now;
    }
  });

  it('a foot on the ground stands still on it: it moves back along the body at exactly the speed the body goes forward', () => {
    for (const v of SPEEDS.filter((s) => s > STAND_SPEED)) {
      const { length, duty } = gaitAt(v);
      const sweep = duty * length;
      const dt = 1 / 600;
      const a = footAt(duty * 0.2, duty, sweep);
      const b = footAt(duty * 0.2 + (v * dt) / length, duty, sweep);
      expect(a.down && b.down).toBe(true);
      expect((a.z - b.z) / dt, `${v} m/s`).toBeCloseTo(v, 0);
    }
  });

  it('a foot is carried through the air from where it left to where it will come down, lifted in the middle', () => {
    const duty = 0.4;
    const left = footAt(duty, duty, 1.2);
    const mid = footAt((1 + duty) / 2, duty, 1.2);
    const end = footAt(0.9999, duty, 1.2);
    expect(left.z).toBeCloseTo(-0.6, 1);
    expect(end.z).toBeCloseTo(0.6, 1);
    expect(mid.lift).toBeGreaterThan(0.9);
    expect(left.lift).toBeLessThan(0.05);
    expect(footAt(0, duty, 1.2).z).toBeCloseTo(0.6, 5); // down where the swing ended
  });

  it('counts the feet that come down in a ride, each leg once a cycle and none at rest', () => {
    for (const v of [1.5, 5.5, 11, 18]) {
      let n = 0;
      const per = [0, 0, 0, 0];
      for (let c = 0; c < 10; c += 0.01) for (const leg of touchdowns(c, c + 0.01, v)) (n++, per[leg]++);
      for (const count of per) expect(count, `${v} m/s`).toBeGreaterThanOrEqual(9);
      expect(n).toBeGreaterThanOrEqual(36);
    }
    expect(touchdowns(0, 3, 0)).toEqual([]);
    expect(touchdowns(0, 3, STAND_SPEED / 2)).toEqual([]);
    expect(touchdowns(2, 1, 11)).toEqual([]);
    expect(touchdowns(1, 1, 11)).toEqual([]);
  });

  it('cycles are counted by metres: a longer stride is less of a cycle per metre; none for no distance', () => {
    expect(cyclesFor(0, 11)).toBe(0);
    expect(cyclesFor(-1, 11)).toBe(0);
    expect(cyclesFor(4.4, 11)).toBeCloseTo(1, 1);
    expect(cyclesFor(5, 18)).toBeLessThan(cyclesFor(5, 3));
  });

  it('a hoof comes down harder the faster it goes', () => {
    expect(hoofWeight(1.5)).toBeLessThan(hoofWeight(11));
    expect(hoofWeight(11)).toBeLessThan(hoofWeight(18));
    expect(hoofWeight(18)).toBeCloseTo(1);
    expect(hoofWeight(0)).toBeGreaterThan(0.3);
  });
});
