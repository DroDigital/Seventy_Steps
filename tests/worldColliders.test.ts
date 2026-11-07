import { describe, expect, it } from 'vitest';
import { propCollider, propColliders, worldColliders, type Prop } from '../src/world/props';

// A model with boxes about its opening: the planner reads its several boxes, the world its one box, as before round 110 (round 112).
const model: Prop = { kind: 'set', x: 10, y: 0, z: 10, w: 2, d: 0.4, h: 3.5, yaw: 0.3, seed: 7, set: { id: 'fh_wall_door' } };
const house: Prop = { kind: 'house', x: 0, y: 0, z: 0, w: 4, d: 3, h: 4, yaw: 0, seed: 12345, style: 'clapboard' };

describe("the world holds a prop's own collider (round 112)", () => {
  it("a model prop's world collider is its one box, not its model boxes", () => {
    expect(propColliders(model).length).toBeGreaterThan(1);
    expect(worldColliders(model)).toEqual([propCollider(model)]);
  });

  it("a house's world colliders are its walls and its wing, bay and porch posts", () => {
    expect(worldColliders(house)).toEqual(propColliders(house));
  });
});
