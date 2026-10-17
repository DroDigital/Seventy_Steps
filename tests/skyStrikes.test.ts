import { describe, expect, it } from 'vitest';
import type { V3 } from '../src/core/geom';
import { SIM, SKY_STRIKE } from '../src/data/tuning';
import { startMove } from '../src/systems/actions';
import { createWorldGame } from '../src/systems/game';
import { pendingStrikes, skyStrikeSystem } from '../src/systems/skyStrikes';
import { dungeonRoomAt } from '../src/world/terrain';
import { worldLayout } from '../src/world/placements';
import { place, scriptedGame } from './helpers';

/** The arena's players and foes under the open world's sky, a thunderstorm gathered over them. */
function stormy(kind: 'storm' | 'rain' | 'gale' | 'clear' = 'storm') {
  const base = scriptedGame();
  const g = base.g;
  g.overworld = createWorldGame().overworld;
  Object.assign(g.overworld!.weather, { kind, want: kind, amount: 1 });
  const warned: { at: V3; radius: number; frames: number; frame: number }[] = [];
  const landed: { at: V3; radius: number; frame: number }[] = [];
  g.events.on('StrikeWarned', (e) => void warned.push({ ...e, frame: g.frame }));
  g.events.on('StrikeLanded', (e) => void landed.push({ ...e, frame: g.frame }));
  const run = (frames: number): void => {
    for (let i = 0; i < frames; i++) {
      g.frame++;
      skyStrikeSystem(g);
    }
  };
  /** Runs until a strike is marked. */
  const untilWarned = (limit = 60 * 200): void => {
    for (let i = 0; i < limit && !warned.length; i++) run(1);
  };
  return { ...base, warned, landed, run, untilWarned };
}

describe('a bolt on the ground, a ring of light before it (round 52)', () => {
  it('marks a spot in a gathered storm, then the bolt falls on it, exactly the warning later', () => {
    const s = stormy();
    s.untilWarned();
    expect(s.warned).toHaveLength(1);
    const [w] = s.warned;
    expect(w!.radius).toBe(SKY_STRIKE.radius);
    expect(w!.frames).toBe(SKY_STRIKE.warn);
    expect(w!.frame / SIM.hz).toBeGreaterThanOrEqual(SKY_STRIKE.first[0] - 1);
    expect(w!.frame / SIM.hz).toBeLessThanOrEqual(SKY_STRIKE.first[1] + 1);
    expect(pendingStrikes(s.g)).toHaveLength(1);
    s.run(SKY_STRIKE.warn - 1);
    expect(s.landed).toHaveLength(0); // the warning is the whole of it
    s.run(1);
    expect(s.landed).toHaveLength(1);
    expect(s.landed[0]!.at).toEqual(w!.at);
    expect(s.landed[0]!.frame - w!.frame).toBe(SKY_STRIKE.warn);
    expect(pendingStrikes(s.g)).toHaveLength(0);
  });

  it('falls near the investigator or near a foe, never farther than it may', () => {
    const s = stormy();
    const me = s.g.ecs.c.transform.get(s.player)!.pos;
    const dist: number[] = [];
    s.run(60 * 60 * 40);
    for (const w of s.warned) dist.push(Math.hypot(w.at.x - me.x, w.at.z - me.z));
    expect(s.warned.length).toBeGreaterThan(20);
    for (const d of dist) expect(d).toBeLessThan(SKY_STRIKE.scan + SKY_STRIKE.near[1] + 6);
    expect(dist.filter((d) => d <= SKY_STRIKE.near[1] + 0.01).length).toBeGreaterThan(dist.length * 0.4);
  });

  it('is rare: a strike now and then, a minute apart or so, not a barrage', () => {
    const s = stormy();
    s.run(60 * 60 * 10);
    expect(s.warned.length).toBeGreaterThanOrEqual(5);
    expect(s.warned.length).toBeLessThanOrEqual(22);
    for (let i = 1; i < s.warned.length; i++) {
      const gap = (s.warned[i]!.frame - s.warned[i - 1]!.frame) / SIM.hz;
      expect(gap).toBeGreaterThanOrEqual(SKY_STRIKE.every[0] - 1);
      expect(gap).toBeLessThanOrEqual(SKY_STRIKE.every[1] + 1);
    }
  });

  it('strikes only in a thunderstorm that has gathered, not in rain, a gale, clear skies or a storm that is going', () => {
    for (const kind of ['rain', 'gale', 'clear'] as const) {
      const s = stormy(kind);
      s.run(60 * 60 * 6);
      expect(s.warned, kind).toHaveLength(0);
    }
    const early = stormy();
    early.g.overworld!.weather.amount = SKY_STRIKE.gather - 0.05;
    early.run(60 * 60 * 6);
    expect(early.warned).toHaveLength(0);
    const going = stormy();
    going.g.overworld!.weather.want = 'clear';
    going.run(60 * 60 * 6);
    expect(going.warned).toHaveLength(0);
  });

  it('strikes nowhere near a body under a roof or on a dungeon floor, and not in a cutscene', () => {
    const s = stormy();
    const room = worldLayout().dungeons[0]!.layout.rooms[0]!;
    const c = { x: room.x, z: room.z };
    place(s.g, s.player, c.x, c.z, 0);
    expect(dungeonRoomAt(c.x, c.z)).not.toBeNull();
    s.run(60 * 60 * 5);
    expect(s.warned).toHaveLength(0);
    const quiet = stormy();
    quiet.g.cutscene = true;
    quiet.run(60 * 60 * 5);
    expect(quiet.warned).toHaveLength(0);
  });

  it('hurts the investigator in the ring, and a foe in it, and leaves one outside it untouched', () => {
    const s = stormy();
    s.untilWarned();
    const at = s.warned[0]!.at;
    const c = s.g.ecs.c;
    place(s.g, s.player, at.x + 0.5, at.z, 0);
    place(s.g, s.deepOne, at.x - 1, at.z + 1, 0);
    place(s.g, s.dummy, at.x + SKY_STRIKE.radius + 6, at.z, 0);
    for (const id of [s.player, s.deepOne, s.dummy]) c.transform.get(id)!.pos.y = at.y;
    const hp = (id: number): number => c.health.get(id)!.hp;
    const before = { me: hp(s.player), foe: hp(s.deepOne), far: hp(s.dummy) };
    s.run(SKY_STRIKE.warn);
    expect(s.landed).toHaveLength(1);
    expect(before.me - hp(s.player)).toBeCloseTo(SKY_STRIKE.player, 0);
    expect(before.foe - hp(s.deepOne)).toBeGreaterThan(SKY_STRIKE.foe[0] - 1);
    expect(hp(s.dummy)).toBe(before.far);
    expect(c.actor.get(s.player)!.move).toBe('stagger'); // the bolt staggers all it strikes
  });

  it('walking out of the ring in the time given is enough, and so is a roll through the fall', () => {
    const walk = stormy();
    walk.untilWarned();
    const at = walk.warned[0]!.at;
    walk.g.ecs.c.transform.get(walk.player)!.pos.y = at.y;
    place(walk.g, walk.player, at.x, at.z, 0);
    walk.g.ecs.c.transform.get(walk.player)!.pos.y = at.y;
    const hp = walk.g.ecs.c.health.get(walk.player)!.hp;
    walk.run(SKY_STRIKE.warn - 20);
    place(walk.g, walk.player, at.x + SKY_STRIKE.radius + 2, at.z, 0); // a few strides at a walk: the warning is a second and a half
    walk.g.ecs.c.transform.get(walk.player)!.pos.y = at.y;
    walk.run(20);
    expect(walk.landed).toHaveLength(1);
    expect(walk.g.ecs.c.health.get(walk.player)!.hp).toBe(hp);

    const roll = stormy();
    roll.untilWarned();
    const spot = roll.warned[0]!.at;
    place(roll.g, roll.player, spot.x, spot.z, 0);
    roll.g.ecs.c.transform.get(roll.player)!.pos.y = spot.y;
    roll.run(SKY_STRIKE.warn - 4);
    startMove(roll.g.ecs.c.actor.get(roll.player)!, 'roll');
    roll.g.ecs.c.actor.get(roll.player)!.frame = 6; // inside the roll's i-frames
    const rollHp = roll.g.ecs.c.health.get(roll.player)!.hp;
    roll.run(4);
    expect(roll.landed).toHaveLength(1);
    expect(roll.g.ecs.c.health.get(roll.player)!.hp).toBe(rollHp);
  });

  it('the same sky for the same game: a replay sees the same strikes', () => {
    const [a, b] = [stormy(), stormy()];
    a.run(60 * 60 * 5);
    b.run(60 * 60 * 5);
    expect(a.warned.map((w) => [w.frame, w.at.x.toFixed(3), w.at.z.toFixed(3)])).toEqual(b.warned.map((w) => [w.frame, w.at.x.toFixed(3), w.at.z.toFixed(3)]));
  });

  it('a strike that would kill the investigator is a death like another, and nothing is left behind of the bolt\'s own body', () => {
    const s = stormy();
    s.untilWarned();
    const at = s.warned[0]!.at;
    place(s.g, s.player, at.x, at.z, 0);
    s.g.ecs.c.transform.get(s.player)!.pos.y = at.y;
    s.g.ecs.c.health.get(s.player)!.hp = 10;
    let died = false;
    s.g.events.on('Died', ({ entity }) => void (entity === s.player && (died = true)));
    const bodies = s.g.ecs.c.transform.size;
    s.run(SKY_STRIKE.warn);
    expect(died).toBe(true);
    expect(s.g.ecs.c.actor.get(s.player)!.move).toBe('death');
    expect(s.g.ecs.c.transform.size).toBe(bodies); // the bolt's body is gone with it
  });
});
