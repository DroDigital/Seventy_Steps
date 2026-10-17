/** Transient notices keep their reading time, even when several pickups arrive together. Time advances only while visible. */
import { TOOLTIPS } from '../data/tuning';

export function createNotices() {
  const waiting: string[] = [];
  let text = '';
  let age = 0;
  const hold = (): number => Math.max(TOOLTIPS.noticeHold, text.length * TOOLTIPS.noticeRead);
  return {
    say(words: string): void {
      if (!words || words === text || waiting.includes(words)) return;
      waiting.push(words);
    },
    update(ms: number): { text: string; opacity: number } {
      if (text) age += Math.max(0, ms);
      if (age >= hold() + TOOLTIPS.noticeFade) text = '';
      if (!text && waiting.length) {
        text = waiting.shift()!;
        age = 0;
      }
      return { text, opacity: text ? Math.min(1, Math.max(0, (hold() + TOOLTIPS.noticeFade - age) / TOOLTIPS.noticeFade)) : 0 };
    },
  };
}
