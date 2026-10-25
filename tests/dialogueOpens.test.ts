import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { strike } from '../src/systems/combat';
import { spawnCreature } from '../src/systems/creatures';
import { createWorldGame } from '../src/systems/game';
import { createDialogue } from '../src/ui/dialogue';
import { createSignMenu } from '../src/ui/signMenu';

// The screens are stood in for: what is under test is when a dialogue opens, not how it is drawn.
vi.mock('../src/ui/menuKit', () => ({
  createScreen() {
    return { open: false, show() { this.open = true; }, close() { this.open = false; } };
  },
  el: () => ({}),
  button: () => ({}),
  frame: () => '',
}));
// The mounts tab and its entitlement check are not under test; the sign's rest is.
vi.mock('../src/ui/mounts', () => ({
  mountsTab: () => {},
  refreshMountEntitlement: () => Promise.resolve(),
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('window', { setTimeout });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

const blow = { damage: 40, poise: 1000, guard: 0, hitstop: 3, parryable: false, interrupts: true };

/** A deep one a stride from the investigator, in the open world. */
function foeBeside() {
  const g = createWorldGame();
  const me = g.ecs.c.transform.get(g.player.id)!;
  const foe = spawnCreature(g, 'deep_one', { x: me.pos.x + 2, z: me.pos.z, yaw: 0 })!;
  return { g, foe };
}

describe('a dialogue that opens within a step holds the investigator safe for the rest of it', () => {
  it('a talk is protected the moment it opens, not at the start of the next step', () => {
    const { g, foe } = foeBeside();
    const dialogue = createDialogue(g);
    expect(g.sheltered).toBe(false);
    g.events.emit('Talked', { npc: 'nasht', name: 'Nasht', title: 'Priest', lines: ['Hello.'] });
    expect(dialogue.talking).toBe(true);
    expect(g.sheltered).toBe(true);
    expect(strike(g, foe, g.player.id, blow)).toBe('dodged');
  });

  it('a page is protected the moment it opens, as a tome is picked up within a step', () => {
    const { g, foe } = foeBeside();
    createDialogue(g);
    g.events.emit('Read', { name: 'Necronomicon' });
    expect(g.sheltered).toBe(true);
    expect(strike(g, foe, g.player.id, blow)).toBe('dodged');
  });

  it('a rest at an Elder Sign is protected the moment its menu opens, as the rest is made within a step', () => {
    const { g, foe } = foeBeside();
    const sign = createSignMenu(g, () => {});
    expect(g.sheltered).toBe(false);
    g.events.emit('Rested', { sign: 'arkham', name: 'Arkham' });
    expect(sign.open).toBe(true);
    expect(g.sheltered).toBe(true);
    expect(strike(g, foe, g.player.id, blow)).toBe('dodged');
  });
});
