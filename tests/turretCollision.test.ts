import { describe, expect, it } from 'vitest';
import { turret } from '../src/render/houseExtras';
import { propCollider, type Prop } from '../src/world/props';

const colour = [0.5, 0.5, 0.5] as const;

describe('house turret collision envelope', () => {
  it.each([-1, 1] as const)('keeps the turret on side %i within the house footprint', (side) => {
    const house: Prop = { kind: 'house', x: 0, y: 0, z: 0, w: 3.5, d: 3, h: 5, yaw: 0, seed: 1, style: 'brick' };
    const collider = propCollider(house)!;
    if (collider.kind !== 'obox') throw new Error('house must have a box collider');
    const pieces = turret(side, house.w, house.d, 0.4 + house.h + 1.5, colour, colour, colour);
    for (const geometry of [...pieces.wall, ...pieces.roof, ...pieces.trim]) {
      const positions = geometry.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        expect(Math.abs(positions.getX(i))).toBeLessThanOrEqual(collider.hx + 1e-6);
        expect(Math.abs(positions.getZ(i))).toBeLessThanOrEqual(collider.hz + 1e-6);
      }
    }
    for (const geometry of pieces.wall) {
      const positions = geometry.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        expect(positions.getY(i)).toBeLessThanOrEqual(collider.y1 + 1e-6);
      }
    }
  });
});
