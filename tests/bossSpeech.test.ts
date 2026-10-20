// Every authored boss line must reach speech, including a horror that has no fight script.
import { describe, expect, it, vi } from 'vitest';
import type { Scene } from '../src/data/cutscenes';
import { getEntity } from '../src/data/registry';
import { BOSS_SAY } from '../src/data/speechBosses';
import { bossLine } from '../src/data/speechLines';
import { createDirector } from '../src/render/cinemaDirector';
import { createGame } from '../src/systems/game';

describe('all the horrors\' authored speech', () => {
  it('reaches a scene voice beat or a spoken notice at the encounter and the fall', () => {
    for (const [id, words] of Object.entries(BOSS_SAY)) {
      const g = createGame({ creature: id });
      const entity = [...g.ecs.c.dread].find(([, d]) => d.id === id)![0];
      const name = getEntity(id)!.name;
      const said: { speaker: string; text: string }[] = [];
      const scenes: Scene[] = [];
      g.events.on('Said', (line) => said.push(line));
      const play = vi.fn((scene: Scene) => {
        scenes.push(scene);
        return Promise.resolve();
      });
      createDirector(g, { play, active: false, heightOf: (e: number) => g.ecs.c.body.get(e)?.height ?? 2 } as never, () => undefined);
      const f = g.ecs.c.fight.get(entity);
      g.events.emit('FirstSight', { entity, name, sanity: 0, insight: 0 });
      if (f) g.events.emit('BossEngaged', { entity, name });
      g.events.emit('Vanquished', { entity, name });
      const heard = [...said, ...scenes.flatMap((s) => s.beats.flatMap((b) => b.voice ? [{ speaker: b.voice.by, text: b.voice.text }] : []))];
      for (const moment of ['arrive', 'fall'] as const) {
        const line = bossLine(id, moment);
        if (line) expect(heard.filter((l) => l.speaker === line.speaker && l.text === line.text), `${id} ${moment}`).toHaveLength(1);
      }
      expect(heard.length, id).toBe(Object.values(words).filter(Boolean).length);
    }
  });

  it('keeps a stationary horror from interrupting a scene or speaking over the investigator\'s death', () => {
    const g = createGame({ creature: 'voice_in_the_tomb' });
    const entity = [...g.ecs.c.dread].find(([, d]) => d.id === 'voice_in_the_tomb')![0];
    const cinema = { play: vi.fn(), active: true, heightOf: () => 2 };
    const said = vi.fn();
    g.events.on('Said', said);
    createDirector(g, cinema as never, () => undefined);
    const sight = { entity, name: 'The Voice in the Tomb', sanity: 0, insight: 0 };
    g.events.emit('FirstSight', sight);
    g.events.emit('Vanquished', sight);
    cinema.active = false;
    g.ecs.c.actor.get(g.player.id)!.move = 'death';
    g.events.emit('FirstSight', sight);
    g.events.emit('Vanquished', sight);
    expect(said).not.toHaveBeenCalled();
  });

  it('keeps narrative Outsider captions separate from speech that has not been authored or recorded', () => {
    expect(bossLine('the_outsider', 'arrive')).toBeUndefined();
    expect(bossLine('the_outsider', 'fall')).toBeUndefined();
  });
});
