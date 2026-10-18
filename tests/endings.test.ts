import { describe, expect, it } from 'vitest';
import { ENDING_IDS, ENDINGS } from '../src/data/endings';
import { COURT_SIGN, courtEndings, courtOpen, endGame, parted } from '../src/systems/endings';
import { createWorldGame } from '../src/systems/game';
import { applySave, parseSave, snapshot } from '../src/systems/save';
import { signPlace } from '../src/systems/checkpoints';
import { record } from './worldHelpers';

describe('the three endings (spec §5)', () => {
  it('are wake and seal the Gate, pass through with ’Umr at-Tawil, and become Nyarlathotep’s herald', () => {
    expect([...ENDING_IDS]).toEqual(['seal', 'silver_key', 'herald']);
    for (const id of ENDING_IDS) {
      expect(ENDINGS[id].title.trim()).not.toBe('');
      expect(ENDINGS[id].lines.length).toBeGreaterThan(0);
    }
  });

  it("the Court's Elder Sign offers the Gate's sealing and the herald's kneeling once Azathoth slumbers", () => {
    const g = createWorldGame();
    expect(signPlace(COURT_SIGN)).toBeDefined();
    expect(courtOpen(g)).toBe(false);
    expect(courtEndings(g, COURT_SIGN)).toEqual([]);
    g.overworld!.slain.add('boss:azathoth');
    expect(courtEndings(g, COURT_SIGN)).toEqual(['seal', 'herald']);
    expect(courtEndings(g, 'hub_quad')).toEqual([]);
  });

  it('an ending is announced and remembered, through a save', () => {
    const g = createWorldGame();
    const told = record(g, 'Ending');
    endGame(g, 'herald');
    expect(told).toEqual([{ id: 'herald' }]);
    expect(g.overworld!.ending).toBe('herald');
    const loaded = createWorldGame();
    applySave(loaded, parseSave(JSON.stringify(snapshot(g)))!);
    expect(loaded.overworld!.ending).toBe('herald');
    expect(parseSave(JSON.stringify({ ...snapshot(g), ending: 'dreamless' }))).toBeNull();
  });

  it('the dream ends once: the Court offers nothing after an ending, and a second choice tells nothing more (round 55)', () => {
    const g = createWorldGame();
    g.overworld!.slain.add('boss:azathoth');
    const told = record(g, 'Ending');
    expect(courtEndings(g, COURT_SIGN)).toEqual(['seal', 'herald']);
    endGame(g, 'seal');
    expect(courtEndings(g, COURT_SIGN)).toEqual([]);
    endGame(g, 'herald'); // (a stale menu, or any other way to a second)
    endGame(g, 'silver_key');
    expect(told).toEqual([{ id: 'seal' }]);
    expect(g.overworld!.ending).toBe('seal');
  });

  it('the Guide is parted from in peace only by going through the Gate with it, and a save keeps it so', () => {
    const g = createWorldGame();
    expect(parted(g, 'umr_at_tawil')).toBe(false);
    endGame(g, 'silver_key');
    expect(parted(g, 'umr_at_tawil')).toBe(true);
    expect(parted(g, 'yog_sothoth')).toBe(false);
    expect(parted(g, undefined)).toBe(false);
    const loaded = createWorldGame();
    applySave(loaded, parseSave(JSON.stringify(snapshot(g)))!);
    expect(parted(loaded, 'umr_at_tawil')).toBe(true);
    const sealed = createWorldGame();
    endGame(sealed, 'seal');
    expect(parted(sealed, 'umr_at_tawil')).toBe(false);
  });
});
