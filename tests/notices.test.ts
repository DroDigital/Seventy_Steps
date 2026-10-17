import { describe, expect, it } from 'vitest';
import { createNotices } from '../src/ui/notices';

describe('readable acquisition notices', () => {
  it('holds a pickup for several seconds, fades gradually, then shows the next pickup', () => {
    const notices = createNotices();
    notices.say('A STAR-STONE');
    notices.say('A NEW WEAPON');
    expect(notices.update(0)).toEqual({ text: 'A STAR-STONE', opacity: 1 });
    expect(notices.update(3000)).toEqual({ text: 'A STAR-STONE', opacity: 1 });
    const fading = notices.update(1000);
    expect(fading.text).toBe('A STAR-STONE');
    expect(fading.opacity).toBeGreaterThan(0);
    expect(fading.opacity).toBeLessThan(1);
    expect(notices.update(1000)).toEqual({ text: 'A NEW WEAPON', opacity: 1 });
    expect(notices.update(5000)).toEqual({ text: '', opacity: 0 });
  });

  it('gives long instructions extra reading time and preserves every distinct queued pickup', () => {
    const notices = createNotices();
    const instruction = 'A WEAPON · TAKE IT UP FROM THE MENU AND CHOOSE THE ARMS YOU WANT TO CARRY AT THE NEXT ELDER SIGN';
    notices.say(instruction);
    for (let i = 0; i < 6; i++) notices.say(`PICKUP ${i}`);
    expect(notices.update(0).text).toBe(instruction);
    expect(notices.update(4000)).toEqual({ text: instruction, opacity: 1 });
    expect(notices.update(3000).text).toBe('PICKUP 0');
    for (let i = 1; i < 6; i++) expect(notices.update(5000).text).toBe(`PICKUP ${i}`);
  });

  it('coalesces duplicates, keeps time while hidden, and allows a later identical pickup', () => {
    const notices = createNotices();
    notices.say('REVOLVER ROUNDS');
    notices.say('REVOLVER ROUNDS');
    notices.update(0);
    notices.say('REVOLVER ROUNDS');
    notices.update(3000);
    for (let i = 0; i < 60; i++) expect(notices.update(0).opacity).toBe(1); // menu/cinema owns the picture
    expect(notices.update(2000).text).toBe('');
    notices.say('REVOLVER ROUNDS');
    expect(notices.update(0)).toEqual({ text: 'REVOLVER ROUNDS', opacity: 1 });
  });
});
