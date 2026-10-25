/**
 * Round 78, the realm title cards: the first time in a save that the investigator comes into a realm, its name is inked in across the
 * screen, tinted toward its own colour, a hairline drawn beneath it and an epigraph of Lovecraft's a beat after (data/regionEpigraphs.ts).
 * A realm met again, a place reached by fast travel and a gate's far side get the same ink in a smaller card, with no epigraph. It is the
 * event that was always there (`RegionEntered`, `Travelled`), now waiting for the veil to lift and a cutscene to end, so it is seen from its
 * first letter; which realms have been met is kept in the save's `told` set under `seen:<id>`, a cosmetic key like the hints'.
 */

import { t } from '../core/i18n';
import { epigraphKey } from '../data/regionEpigraphs';
import { getRegion } from '../data/regions';
import { CARD } from '../data/uiMood';
import { gatePlace, signPlace } from '../systems/checkpoints';
import type { Game } from '../systems/components';
import type { Banner } from './banner';
import { realmTint } from './inkTitle';
import { saidUnderVeil } from './loreLine';

const SEEN = 'seen:';

export interface RealmCards {
  /** Each frame: shows the card that was waiting for the veil, or a cutscene, once they are gone. */
  update(): void;
}

interface Waiting {
  args: Parameters<Banner['show']>;
  region: string | null; // the realm whose card this is, marked seen once it is shown
  at: number;
}

/** `held`: the screen is not the world's yet (the veil falls, a cutscene plays, a journey is made). */
export function createRealmCards(g: Game, banner: Pick<Banner, 'show'>, held: () => boolean): RealmCards {
  let waiting: Waiting | null = null;
  const queue = (region: string | null, name: string): void => {
    const told = g.overworld?.told;
    const first = !!region && !!told && !told.has(SEEN + region);
    const key = first && !saidUnderVeil(region!) ? epigraphKey(region) : undefined; // (the veil may have said it on the way)
    const args: Waiting['args'] = [name.toUpperCase(), first ? 'realm' : 'place', undefined, key ? t(key) : '', region ? realmTint(region) : undefined];
    if (waiting?.args[1] === 'realm' && args[1] === 'place' && !region) return; // (a realm's first card is not given up for a place's)
    waiting = { args, region, at: performance.now() };
  };
  g.events.on('RegionEntered', (e) => queue(e.region, getRegion(e.region)?.name ?? e.name));
  g.events.on('Travelled', (e) => {
    const there = signPlace(e.to)?.region ?? gatePlace(e.to)?.region;
    if (there && there !== g.overworld?.region) return; // another realm: its own card follows, the step after
    queue(null, e.name);
  });
  return {
    update() {
      if (!waiting || held()) return;
      const w = waiting;
      waiting = null;
      if (performance.now() - w.at > CARD.stale * 1000) return;
      if (w.region) g.overworld?.told.add(SEEN + w.region);
      banner.show(...w.args);
    },
  };
}
