/**
 * The creatures' 3D models (docs/MODELS.md): what each `public/models/<id>.glb` holds, gathered by
 * tools/blender/manifest.py into modelManifest.ts. A model is a skinned low-poly body with a clip for
 * each thing the game shows it doing; an attack's clip lands its blow on `strike`, the frame the fight's
 * hit (or bolt, or spell) does, so the picture can be laid on the move frame by frame. Pure data.
 */

import { MODEL_FACTS } from './modelManifest';

export interface ClipFacts {
  frames: number; // at 60 a second
  loop: boolean;
  strike?: number; // an attack's: the frame its blow lands
  end?: number; // and the frame its active window closes
  stride?: number; // a walk's: metres one cycle carries the body
}

export interface ModelFacts {
  id: string;
  height: number; // metres, at rest
  width: number;
  tris: number;
  bones: number;
  materials: readonly string[]; // each a world texture (render/textures.ts)
  layers: readonly string[]; // `eldritch`: parts shown only in the eldritch variant; `plain`: only out of it
  clips: Readonly<Record<string, ClipFacts>>;
  eyes: readonly (readonly [bone: string, x: number, y: number, z: number, r: number, g: number, b: number, layer: string])[]; // rest position in the model's frame (glTF: y up, +z its front), the colour they glow, and the layer they are drawn in ('' always)
  bytes: number;
}

/** The model a roster creature is drawn with, if it has one. */
export const modelOf = (id: string): ModelFacts | undefined => MODEL_FACTS[id];

/** Every creature that has a model. */
export const MODELLED: readonly string[] = Object.keys(MODEL_FACTS);
