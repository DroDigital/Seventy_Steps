import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { reviewedSize, type ReviewedManifest } from '../src/render/sprites/reviewed';
import { creatureModel } from '../src/systems/creatures';
import { createGame } from '../src/systems/game';

const pack = JSON.parse(readFileSync('public/creatures/reviewed/index.json', 'utf8')) as ReviewedManifest;

describe('redrawn creature bodies fit their painted heights', () => {
  it.each([
    ['yig', 1.5],
    ['dhole', 1.5],
    ['shunned_house_entity', 0.84],
  ] as const)('%s spawns as tall as its idle poses, with its established radius', (id, radius) => {
    const art = pack.entities[id];
    const size = reviewedSize(art, pack);
    // A single capsule covers every view's idle poses, including the Shunned House's taller breath.
    const paintedHeight = Math.max(...Object.values(art.directions).flatMap((view) => view.actions.idle!).map((index) => {
      const frame = pack.frames[index];
      return size.height * (frame.bounds[3] - frame.bounds[1]) / frame.height;
    }));
    const g = createGame({ creature: id });
    const [e] = [...g.ecs.c.model].find(([, model]) => model === creatureModel(id))!;
    const body = g.ecs.c.body.get(e)!;
    expect(body.height).toBeCloseTo(paintedHeight, 9);
    expect(body.radius).toBeCloseTo(radius, 9);
  });
});
