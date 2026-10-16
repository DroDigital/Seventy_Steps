/// <reference types="vite/client" />
/** Lossless reviewed PNG pages and their authored animation registrations. */
import type { DirectionalClips, SpriteAction, SpriteDirection } from './directional';

export interface ReviewedFrame {
  source: string;
  sourceSha256: string;
  pixelSha256: string;
  width: number;
  height: number;
  bounds: [number, number, number, number];
  page: number;
  x: number;
  y: number;
}
export interface ReviewedEntity {
  id: string;
  name: string;
  assetGroup: 'sprites' | 'bosses';
  scale: number;
  scaleUnit: string;
  page: number;
  directions: Record<SpriteDirection, {
    sourceDirection: SpriteDirection;
    mirror: boolean;
    actions: Partial<Record<SpriteAction, number[]>>;
  }>;
}
export interface ReviewedManifest {
  format: 'seventy-steps-reviewed-atlas-v1';
  entityCount: number;
  frameCount: number;
  pages: { file: string; width: number; height: number; sha256: string }[];
  frames: ReviewedFrame[];
  entities: Record<string, ReviewedEntity>;
}
export interface ReviewedArt {
  manifest: ReviewedManifest;
  pages: HTMLImageElement[];
}

/** Adapt registration flags once; right-facing art is mirrored only when the index says so. */
export function reviewedClips(entity: ReviewedEntity, key: string): DirectionalClips<number> {
  const clips: DirectionalClips<number> = {};
  for (const direction of ['front', 'back', 'left', 'right'] as const) {
    // This base creature's authored physical side folders are labelled in reverse.
    // Route the complete view (idle and walk) to the correct facing without altering its pixels.
    const authored = key === 'innsmouth_hybrid' && direction === 'left' ? 'right'
      : key === 'innsmouth_hybrid' && direction === 'right' ? 'left' : direction;
    const view = entity.directions[authored];
    clips[direction] = {};
    for (const state of ['idle', 'move', 'flight', 'attack', 'hurt', 'stoop', 'stoop_mid'] as const) {
      const frames = view.actions[state];
      if (frames) clips[direction]![state] = { frames, mirror_horizontal: view.mirror };
    }
  }
  // A boss's combat art is drawn from its left and its back; its right is the left mirrored once (its walk and idle on that side are its own).
  const [left, right] = [clips.left!, clips.right!];
  for (const state of ['attack', 'hurt'] as const) {
    if (left[state] && !right[state]) right[state] = { frames: left[state]!.frames, mirror_horizontal: !left[state]!.mirror_horizontal };
  }
  return clips;
}

/** One fixed canvas scale and ground line for every pose; authored bob remains intact. */
export function reviewedSize(entity: ReviewedEntity, manifest: ReviewedManifest): { width: number; height: number; groundOffset: number } {
  const idle = entity.directions.front.actions.idle![0];
  const reference = manifest.frames[idle];
  const height = entity.assetGroup === 'bosses'
    ? entity.scale * reference.height / (reference.bounds[3] - reference.bounds[1])
    : entity.scale;
  return {
    width: height * reference.width / reference.height,
    height,
    groundOffset: height * (1 - reference.bounds[3] / reference.height),
  };
}

/** Assets resolve under both a hosted subdirectory and Electron's app:// package. */
export async function loadReviewedArt(made: (share: number) => void): Promise<ReviewedArt> {
  const base = `${import.meta.env.BASE_URL}creatures/reviewed/`;
  const response = await fetch(`${base}index.json`);
  if (!response.ok) throw new Error(`Creature artwork index could not load (${response.status}).`);
  const manifest = await response.json() as ReviewedManifest;
  if (manifest.format !== 'seventy-steps-reviewed-atlas-v1' || manifest.entityCount !== 105 || manifest.frames.length !== manifest.frameCount) {
    throw new Error('Creature artwork index is incomplete or incompatible.');
  }
  let completed = 0;
  const pages = await Promise.all(manifest.pages.map((page) => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth !== page.width || image.naturalHeight !== page.height) return reject(new Error(`Creature artwork page has the wrong dimensions: ${page.file}`));
      made(++completed / manifest.pages.length);
      resolve(image);
    };
    image.onerror = () => reject(new Error(`Creature artwork page could not load: ${page.file}`));
    image.src = `${base}${page.file}`;
  })));
  return { manifest, pages };
}
