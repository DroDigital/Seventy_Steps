import { afterEach, describe, expect, it, vi } from 'vitest';
import { FOG_REACH, allFogs } from '../src/systems/fogGates';
import { HINT_IDS, HINT_KEPT } from '../src/data/fieldGuide';
import { createWorldGame } from '../src/systems/game';
import { createGateHint } from '../src/ui/hintWatch';
import { createHints } from '../src/ui/hints';
import type { Game } from '../src/systems/components';

const dom = vi.hoisted(() => ({ boxes: [] as { textContent: string; style: Record<string, string> }[] }));
vi.mock('../src/ui/hudKit', async (original) => ({
  ...await original<typeof import('../src/ui/hudKit')>(),
  el(_style: string, text = '') {
    const box = { textContent: text, style: {} };
    dom.boxes.push(box);
    return box;
  },
}));
afterEach(() => { dom.boxes.length = 0; vi.unstubAllGlobals(); });

const gate = () => allFogs().find((w) => w.kind === 'doorway')!;
function stand(g: Game, distance: number): void {
  const w = gate();
  Object.assign(g.ecs.c.transform.get(g.player.id)!.pos, { x: w.x - Math.sin(w.yaw) * distance, z: w.z - Math.cos(w.yaw) * distance });
}

describe('gate instructions can be read again', () => {
  it('gate instructions take priority over other nearby hints and a saved journey recap', () => {
    const g = createWorldGame();
    g.overworld!.quests.set('sleepers', 0);
    g.frame = 31;
    stand(g, FOG_REACH - 0.1);
    const e = g.ecs.spawn();
    const tr = g.ecs.c.transform.get(g.player.id)!;
    g.ecs.c.npc.set(e, 'nasht');
    g.ecs.c.transform.set(e, { ...tr, pos: { ...tr.pos } });
    vi.stubGlobal('localStorage', { getItem: () => '[]', setItem: vi.fn() });
    const hints = createHints(g, {} as HTMLElement);
    g.events.emit('CandleLit', { id: 'test', x: tr.pos.x, z: tr.pos.z });
    hints.update(0);
    expect(dom.boxes[0].textContent).toContain('passes through');
  });

  it('rearms after a small step back, with hysteresis to avoid flicker at the boundary', () => {
    const g = createWorldGame();
    const entered = createGateHint();
    stand(g, FOG_REACH - 0.1);
    expect(entered(g)).toBe(true);
    expect(entered(g)).toBe(false);
    stand(g, FOG_REACH + 0.1);
    expect(entered(g)).toBe(false);
    stand(g, FOG_REACH - 0.1);
    expect(entered(g)).toBe(false);
    stand(g, FOG_REACH + 0.7);
    expect(entered(g)).toBe(false);
    stand(g, FOG_REACH - 0.1);
    expect(entered(g)).toBe(true);
    for (const spawn of gate().spawns) g.overworld!.slain.add(spawn);
    expect(entered(g)).toBe(false); // a defeated encounter has no gate instructions
  });

  it('replays an already learned gate hint, holds it, and fades before hiding', () => {
    const g = createWorldGame();
    for (const id of HINT_IDS) g.overworld!.told.add(HINT_KEPT + id);
    vi.stubGlobal('localStorage', { getItem: () => '[]', setItem: vi.fn() });
    stand(g, FOG_REACH - 0.1);
    const hints = createHints(g, {} as HTMLElement);
    hints.update(0);
    const box = dom.boxes[0];
    expect(box.textContent).toContain('passes through');
    expect(box.style.opacity).toBe('1');
    hints.update(10000);
    expect(Number(box.style.opacity)).toBe(1);
    // The long instructions have their own reading time, followed by a 1.5-second fade.
    hints.update(3000);
    expect(Number(box.style.opacity)).toBeGreaterThan(0);
    expect(Number(box.style.opacity)).toBeLessThan(1);
    hints.update(2000);
    expect(Number(box.style.opacity)).toBe(0);
    stand(g, FOG_REACH + 0.7);
    hints.update(16);
    stand(g, FOG_REACH - 0.1);
    hints.update(16);
    expect(box.textContent).toContain('passes through');
    expect(box.style.opacity).toBe('1');
  });
});
