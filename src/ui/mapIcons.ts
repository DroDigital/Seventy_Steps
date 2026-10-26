/**
 * The map's marks, drawn (round 60: "make all the icons more thematically fitting, e.g. the Elder Sign as the resting sign"; overhauled
 * 2026-10-25: "I want a complete overhaul"). Each thing the map shows is a small relic of its own, in one light and one view, with a shadow
 * on the ground and a dark halo about it, not a glyph on a medallion: the Elder Sign cut in a standing stone for a resting place (lit, it
 * burns), a stone portal with its veil for a gate, a cellar's stair and iron door for a dungeon, a great eye in bone and tentacle for a
 * horror (shut and grey once slain), a locket (met) or a sealed letter (not yet) for a person, a lamp with a wisp in it for lost Echoes,
 * a brass key for the story's lead, a cairn for a place, a flint arrowhead for the investigator, a stake and pennant for their marker.
 * The legend draws these same figures (`drawMark` into a small canvas), so a key and the map never differ. Pure drawing: no state.
 */

import { type MarkKind, type MarkState } from './mapIconKit';
import { eye } from './mapIconsBoss';
import { echo, lead, person } from './mapIconsLive';
import { marker, place, you } from './mapIconsMine';
import { secret } from './mapIconsSecret';
import { dungeon, gate, sign } from './mapIconsStone';

export * from './mapIconKit';

/** Draws one mark of `kind` at (x, y), about `r` pixels in radius: the figure is drawn in units of `r`, about its centre. */
export function drawMark(ctx: CanvasRenderingContext2D, kind: MarkKind, x: number, y: number, r: number, s: MarkState = {}): void {
  ctx.save();
  ctx.setLineDash([]);
  ctx.translate(x, y);
  ctx.scale(r, r);
  if (kind === 'sign') sign(ctx, r, !!s.lit);
  else if (kind === 'gate') gate(ctx, r);
  else if (kind === 'dungeon') dungeon(ctx, r);
  else if (kind === 'boss') eye(ctx, r, !!s.slain);
  else if (kind === 'person') person(ctx, r, !!s.met);
  else if (kind === 'echo') echo(ctx, r, s.now ?? 0);
  else if (kind === 'lead') lead(ctx, r, s.now ?? 0);
  else if (kind === 'place') place(ctx, r);
  else if (kind === 'marker') marker(ctx, r);
  else if (kind === 'secret') secret(ctx, r, s);
  else you(ctx, r, s.turn ?? 0);
  ctx.restore();
}
