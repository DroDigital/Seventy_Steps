import { describe, expect, it } from 'vitest';
import { padFamily } from '../src/core/padFamily';
import { padName } from '../src/ui/glyphs';

describe("the pad in hand's own button names", () => {
  it('knows the maker from the id the browser or SDL gives', () => {
    expect(padFamily('DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)')).toBe('playstation');
    expect(padFamily('PS4 Controller')).toBe('playstation');
    expect(padFamily('Pro Controller (STANDARD GAMEPAD Vendor: 057e Product: 2009)')).toBe('nintendo');
    expect(padFamily('Xbox 360 Controller (XInput STANDARD GAMEPAD)')).toBe('xbox');
    expect(padFamily('Steam Deck Controller')).toBe('xbox');
    expect(padFamily('')).toBe('xbox');
  });

  it('names each act on the button it is read from, as that pad prints it', () => {
    expect([padName('interact', 'xbox'), padName('interact', 'playstation'), padName('interact', 'nintendo')]).toEqual(['A', '✕', 'B']); // the south button
    expect([padName('dodge', 'xbox'), padName('dodge', 'playstation'), padName('dodge', 'nintendo')]).toEqual(['B', '○', 'A']); // the east
    expect([padName('shoot', 'nintendo'), padName('heal', 'nintendo')]).toEqual(['Y', 'X']); // west and north
    expect([padName('light', 'playstation'), padName('heavy', 'nintendo')]).toEqual(['R1', 'ZR']);
    expect(padName('reload', 'playstation')).toBe(padName('reload', 'xbox')); // the d-pad is the d-pad
  });
});
