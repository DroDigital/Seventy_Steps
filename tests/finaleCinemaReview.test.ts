import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_KEYS, keyLayout, rebind } from '../src/core/bindings';
import { shot, type Scene } from '../src/data/cutscenes';
import { createCinema } from '../src/render/cinema';
import { createDirector } from '../src/render/cinemaDirector';
import { signPlace } from '../src/systems/checkpoints';
import { COURT_SIGN } from '../src/systems/endings';
import { createWorldGame } from '../src/systems/game';
import type { CinemaUi } from '../src/ui/cinemaUi';

const makeUi = () => ({ bars: vi.fn(), fade: vi.fn(), caption: vi.fn(), title: vi.fn(), hint: vi.fn(), clear: vi.fn(), wipe: vi.fn(), ask: vi.fn(), holdCaption: vi.fn() } satisfies CinemaUi);
const setup = () => {
  let keydown: (event: KeyboardEvent) => void = () => undefined;
  vi.stubGlobal('addEventListener', (name: string, callback: (event: KeyboardEvent) => void) => { if (name === 'keydown') keydown = callback; });
  vi.stubGlobal('document', { addEventListener: vi.fn() });
  const g = createWorldGame();
  const ui = makeUi();
  const holdVoice = vi.fn();
  const spawn = vi.fn();
  const cinema = createCinema(g, ui, { stinger: vi.fn(), sample: vi.fn(), holdVoice } as never, { spawn } as never, { enabled: () => true });
  return { g, ui, holdVoice, spawn, cinema, keydown: (code: string) => keydown({ code, repeat: false, preventDefault: vi.fn(), stopImmediatePropagation: vi.fn() } as unknown as KeyboardEvent) };
};

afterEach(() => { Object.assign(keyLayout, DEFAULT_KEYS); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('ending scene review regressions', () => {
  it('holds the caption and voice until a rebound Space performs the gesture', () => {
    const { cinema, ui, holdVoice, keydown } = setup();
    expect(rebind(keyLayout, 'interact', 'Space')).toBe(true);
    const scene: Scene = { id: 'test', sim: 'frozen', shots: [shot({ dur: 5 })], beats: [{ at: 0, caption: 'A line', hold: 3 }, { at: 1, act: 'Act', kneel: true }] };
    void cinema.play(scene);
    cinema.step(1.1);
    expect(cinema.waiting).toBe(true);
    expect(ui.holdCaption).toHaveBeenCalledWith(true);
    expect(holdVoice).toHaveBeenCalledWith(true);
    cinema.step(30);
    expect(cinema.waiting).toBe(true);
    keydown('Space');
    expect(cinema.waiting).toBe(false);
    expect(ui.holdCaption).toHaveBeenLastCalledWith(false);
    expect(holdVoice).toHaveBeenLastCalledWith(false);
    expect(cinema.active).toBe(true);
    cinema.step(0.1);
    expect(cinema.active).toBe(true);
  });

  it('uses the Court for both bursts and kneeling when another sign is the checkpoint', () => {
    const { g, cinema, spawn } = setup();
    const court = signPlace(COURT_SIGN)!;
    expect(g.overworld!.sign).not.toBe(COURT_SIGN);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const scene: Scene = { id: 'court', sim: 'frozen', shots: [shot({ dur: 2, on: 'sign' })], beats: [{ at: 0, kneel: true, burst: { on: 'sign', kind: 'motes', count: 1 } }] };
    void cinema.play(scene, { sign: COURT_SIGN });
    expect(g.player.kneeling).toEqual({ x: court.x, z: court.z });
    expect(spawn).toHaveBeenCalledWith(expect.objectContaining({ x: court.x, z: court.z }));
  });

  it('passes the Court sign for both Court endings and leaves the Guide ending alone', () => {
    const { g } = setup();
    const play = vi.fn((_scene: Scene, _cast: { sign?: string; target?: number }) => Promise.resolve());
    createDirector(g, { play, active: false, heightOf: () => 2 } as never, () => undefined);
    g.events.emit('Ending', { id: 'seal' });
    g.events.emit('Ending', { id: 'herald' });
    g.events.emit('Ending', { id: 'silver_key' });
    expect(play.mock.calls[0][1]).toEqual({ sign: COURT_SIGN });
    expect(play.mock.calls[1][1]).toEqual({ sign: COURT_SIGN });
    expect(play.mock.calls[2][1]).not.toHaveProperty('sign');
  });
});

describe('caption animation', () => {
  it('pauses and resumes the active caption animation', async () => {
    class Node {
      style = { cssText: '' };
      textContent = '';
      children: Node[] = [];
      animations: { pause: ReturnType<typeof vi.fn>; play: ReturnType<typeof vi.fn>; cancel: ReturnType<typeof vi.fn> }[] = [];
      append(child: Node) { this.children.push(child); }
      replaceChildren(child: Node) { this.children = [child]; }
      animate() {
        const animation = { pause: vi.fn(), play: vi.fn(), cancel: vi.fn() };
        this.animations.push(animation);
        return animation;
      }
      getAnimations() { return this.animations; }
    }
    const body = new Node();
    vi.stubGlobal('document', { body, createElement: () => new Node() });
    const { createCinemaUi } = await import('../src/ui/cinemaUi');
    const ui = createCinemaUi();
    ui.caption('The words', 3);
    const animation = body.children[0].children[3].animations[0];
    ui.holdCaption!(true);
    expect(animation.pause).toHaveBeenCalledOnce();
    ui.holdCaption!(false);
    expect(animation.play).toHaveBeenCalledOnce();
  });
});
