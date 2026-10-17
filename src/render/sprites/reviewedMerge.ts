/** Combine independently packed artwork in memory; existing atlas pixels stay untouched. */
import type { ReviewedArt, ReviewedEntity, ReviewedManifest } from './reviewed';

export const ALLIED_ART_KEYS = [
  'nodens', 'tritons', 'cats_of_ulthar', 'pickman', 'nasht_kaman_thah', 'algol_light_being', 'yithian_archivist',
] as const;

export function validateReviewedManifest(manifest: ReviewedManifest, expectedCount: number): void {
  if (manifest.format !== 'seventy-steps-reviewed-atlas-v1'
    || manifest.entityCount !== expectedCount
    || Object.keys(manifest.entities).length !== expectedCount
    || manifest.frames.length !== manifest.frameCount
    || !manifest.pages.length) throw new Error('Creature artwork index is incomplete or incompatible.');
  for (const frame of manifest.frames) {
    const page = manifest.pages[frame.page];
    if (!page || frame.width < 1 || frame.height < 1 || frame.x < 0 || frame.y < 0
      || frame.x + frame.width > page.width || frame.y + frame.height > page.height) {
      throw new Error('Creature artwork frame lies outside its atlas page.');
    }
  }
  for (const entity of Object.values(manifest.entities)) for (const view of Object.values(entity.directions)) {
    for (const frames of Object.values(view.actions)) if (!frames?.length || frames.some(index => !Number.isInteger(index) || !manifest.frames[index])) {
      throw new Error('Creature artwork action references an invalid frame.');
    }
  }
}

export function validateAlliedManifest(manifest: ReviewedManifest): void {
  validateReviewedManifest(manifest, ALLIED_ART_KEYS.length);
  const keys = Object.keys(manifest.entities);
  if (keys.some(key => !ALLIED_ART_KEYS.some(expected => expected === key))) throw new Error('Allied artwork roster is incomplete or incompatible.');
  for (const entity of Object.values(manifest.entities)) {
    const move = entity.id === 'algol_light_being' || entity.id === 'yithian_archivist' ? 4 : 6;
    const counts = { idle: 2, move, attack: 3, hurt: 2 };
    for (const direction of ['front', 'left', 'back', 'right'] as const) {
      const view = entity.directions[direction];
      if (!view) throw new Error(`Allied artwork view is missing: ${entity.id}/${direction}`);
      for (const action of ['idle', 'move', 'attack', 'hurt'] as const) {
        if (view.actions[action]?.length !== counts[action]) throw new Error(`Allied artwork action is incomplete: ${entity.id}/${direction}/${action}`);
      }
    }
  }
}

export function mergeReviewedArt(base: ReviewedArt, allies: ReviewedArt): ReviewedArt {
  validateReviewedManifest(base.manifest, 105);
  validateAlliedManifest(allies.manifest);
  const pageOffset = base.manifest.pages.length;
  const frameOffset = base.manifest.frames.length;
  const entries: Record<string, ReviewedEntity> = { ...base.manifest.entities };
  for (const [key, entity] of Object.entries(allies.manifest.entities)) {
    if (entries[key]) throw new Error(`Artwork packs contain the same creature: ${key}`);
    entries[key] = {
      ...entity,
      page: entity.page + pageOffset,
      directions: Object.fromEntries(Object.entries(entity.directions).map(([direction, view]) => [direction, {
        ...view,
        actions: Object.fromEntries(Object.entries(view.actions).map(([action, frames]) => [action, frames!.map(index => index + frameOffset)])),
      }])) as ReviewedEntity['directions'],
    };
  }
  return {
    manifest: {
      ...base.manifest,
      entityCount: base.manifest.entityCount + allies.manifest.entityCount,
      frameCount: frameOffset + allies.manifest.frameCount,
      pages: [...base.manifest.pages, ...allies.manifest.pages],
      frames: [...base.manifest.frames, ...allies.manifest.frames.map(frame => ({ ...frame, page: frame.page + pageOffset }))],
      entities: entries,
    },
    pages: [...base.pages, ...allies.pages],
  };
}
