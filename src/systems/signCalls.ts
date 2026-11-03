/**
 * Why an Elder Sign is worth resting at now (2026-11-03, asked): the things done only by resting at one, each its own
 * call, so the sign can say which (render/signCallViews.ts hangs a distinct mark over it; the HUD's rest line names it).
 *
 * - `descend`: the lead's way runs down the Seventy Steps at the Sleeper's Sign (leadWay.ts).
 * - `travel`: the lead lies in a realm no gate reaches from here, so its way begins with travel from this sign.
 *   Both only where the sign is a waypoint on the way: never where the lead's own goal is the sign (a sign to reach, the Court's ending).
 * - `ending`: the Court's sign, once Azathoth slumbers: the endings wait (endings.ts).
 * - `level`: Echoes enough for a level (levels.ts), at the nearest lit sign only.
 * - `stones`: star-stones enough to reinforce a weapon owned or the revolver (arms.ts, gun.ts), nearest lit sign only.
 * - `relic`: a relic found and not yet looked at, to be worn at a sign (finds.ts), nearest lit sign only.
 *
 * The lead's calls are where its way begins, wherever the investigator is; the others are at the nearest lit sign of the
 * investigator's realm, so not every stone in the land is crowned. Pure: no Three.js.
 */

import { distXZ } from '../core/geom';
import { worldLayout } from '../world/placements';
import { canReinforce } from './arms';
import { descentOpen } from './checkpoints';
import type { Game } from './components';
import { courtEndings } from './endings';
import { canUpgradeGun } from './gun';
import { currentLead, goalPlace } from './lead';
import { placeKey } from './leadWay';
import { canLevel, LEVEL_IDS } from './levels';

export type SignCall = 'descend' | 'travel' | 'ending' | 'level' | 'stones' | 'relic';
/** In the order they are hung, left to right, and named. */
export const SIGN_CALLS: readonly SignCall[] = ['descend', 'travel', 'ending', 'level', 'stones', 'relic'];

const SAME = 0.5; // metres: the lead's way point is this sign

/** Each sign with a reason to rest at it now, its calls in `SIGN_CALLS` order. */
export function signCalls(g: Game): Map<string, SignCall[]> {
  const out = new Map<string, SignCall[]>();
  const ow = g.overworld;
  if (!ow) return out;
  const add = (sign: string, c: SignCall): void => {
    const list = out.get(sign) ?? [];
    if (!list.includes(c)) list.push(c);
    out.set(sign, list);
  };
  const signs = worldLayout().signs;
  const lead = currentLead(g);
  const goal = lead?.goal;
  if (lead?.at) {
    const at = lead.at;
    const s = signs.find((x) => distXZ(x, at) < SAME);
    const dest = goal ? goalPlace(goal) : null;
    const isGoal = !!dest && !!s && distXZ(dest, s) < SAME; // the lead ends at this sign (a sign reached, the Court's ending): not a waypoint, so no descend or travel
    if (s && !isGoal) add(s.id, s.dream && descentOpen(g) && !g.demo ? 'descend' : 'travel');
  }
  for (const s of signs) if (courtEndings(g, s.id).length) add(s.id, 'ending');
  const me = g.ecs.c.transform.get(g.player.id)?.pos;
  if (me) {
    const here = placeKey(me);
    const lit = signs.filter((s) => ow.discovered.has(s.id) && placeKey(s) === here).sort((a, b) => distXZ(a, me) - distXZ(b, me))[0];
    if (lit) {
      if (LEVEL_IDS.some((id) => canLevel(g, id))) add(lit.id, 'level');
      if (g.player.arms.some((id) => canReinforce(g, id)) || canUpgradeGun(g)) add(lit.id, 'stones');
      if ([...ow.told].some((k) => k.startsWith('new:relic:'))) add(lit.id, 'relic');
    }
  }
  for (const list of out.values()) list.sort((a, b) => SIGN_CALLS.indexOf(a) - SIGN_CALLS.indexOf(b));
  return out;
}
