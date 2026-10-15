import { describe, expect, it } from 'vitest';
import { worldLayout } from '../src/world/placements';
import { auditOutside } from './outsideAudit';

/** The outsides of the mound-shelled dungeons (round 46): no outer wall stands out through its earth. */
describe('what the eye meets from outside a mound (round 46)', () => {
  it('no outer wall of a mound room shows through its heap', () => {
    const found = worldLayout().dungeons.flatMap((d) => auditOutside(d));
    expect(found.map((f) => `${f.dungeon} ${f.room} ${f.key} at ${f.at} rise ${f.rise.toFixed(1)} view ${f.deg} ends ${f.ends} span ${f.span}`)).toEqual([]);
  }, 900000);
});
