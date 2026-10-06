/**
 * Which maker's pad is in hand (round 47), from the id the browser or the shell's SDL gives it, so the prompts
 * name its buttons as they are printed on it (ui/glyphs.ts): Cross and R1 on a PlayStation pad, B and ZR on a
 * Nintendo one; Xbox names for the rest, a Steam Deck's own controls among them (Steam presents them as an Xbox
 * pad). The vendor ids are USB's: 054c Sony, 057e Nintendo.
 */

export type PadFamily = 'xbox' | 'playstation' | 'nintendo';

export function padFamily(id: string): PadFamily {
  const s = id.toLowerCase();
  if (/054c|dualshock|dualsense|playstation|ps[345]\b|sony/.test(s)) return 'playstation';
  if (/057e|nintendo|pro controller|joy-?con|switch/.test(s)) return 'nintendo';
  return 'xbox';
}
