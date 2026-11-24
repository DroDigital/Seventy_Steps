import { describe, expect, it } from 'vitest';
import { devConsoleOn, isRevealChord, revealChanges } from '../src/ui/devReveal';
import { defaultSettings } from '../src/ui/settings';

const chord = { code: 'KeyD', ctrlKey: true, altKey: true, shiftKey: true, metaKey: false, repeat: false };

describe('the hidden developer console', () => {
  it('is hidden and off by default', () => {
    const s = defaultSettings();
    expect(s.devRevealed).toBe(0);
    expect(s.devConsole).toBe(0);
    expect(devConsoleOn(s)).toBe(false);
  });
  it('is revealed by Ctrl+Alt+Shift+D alone', () => {
    expect(isRevealChord(chord)).toBe(true);
    expect(isRevealChord({ ...chord, altKey: false })).toBe(false);
    expect(isRevealChord({ ...chord, code: 'KeyF' })).toBe(false);
    expect(isRevealChord({ ...chord, repeat: true })).toBe(false);
  });
  it('opens only when revealed and turned on; hiding it turns it off', () => {
    const s = defaultSettings();
    expect(revealChanges(s)).toEqual([['devRevealed', 1]]);
    s.devRevealed = 1;
    expect(devConsoleOn(s)).toBe(false);
    s.devConsole = 1;
    expect(devConsoleOn(s)).toBe(true);
    expect(revealChanges(s)).toEqual([['devRevealed', 0], ['devConsole', 0]]);
  });
});
