import { describe, expect, it } from 'vitest';
import { BOSS_ATTACK_THEME } from '../src/data/bossAttackTheme';
import { ENTITIES } from '../src/data/registry';

const bosses = ENTITIES.filter((e) => e.bossScript || e.bossVariant?.bossScript).map((e) => e.id);

describe('boss attack colours', () => {
  it('gives every scripted horror its own colours, and leaves the blows themselves alone', () => {
    expect(bosses.length).toBeGreaterThan(40);
    expect(Object.keys(BOSS_ATTACK_THEME).sort()).toEqual([...bosses].sort());
    const seen = new Set<string>();
    for (const id of bosses) {
      const theme = BOSS_ATTACK_THEME[id]!;
      const sig = [theme.danger, theme.line, theme.ring, theme.mind].map((c) => c.join(',')).join('|');
      expect(seen.has(sig), id).toBe(false);
      seen.add(sig);
      for (const c of [theme.danger, theme.line, theme.ring, theme.mind]) {
        expect(c).toHaveLength(3);
        for (const n of c) expect(n).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
