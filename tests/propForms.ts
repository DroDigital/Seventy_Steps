/** Round 111: a prop of each form a realm's look draws (data/propLooks.ts), found by its seed, for the tests and audits that build every form. */
import { createRng } from '../src/core/rng';
import { PROP_LOOKS, formOf, type PropLook } from '../src/data/propLooks';
import type { PropKind } from '../src/data/regions';
import { propAt, type Prop } from '../src/world/props';

/** The forms a look draws for a kind, by its key. */
export const FORM_KEYS: readonly [PropKind, keyof PropLook][] = [['tree', 'trees'], ['pine', 'pines'], ['rock', 'rocks'], ['bush', 'bushes'], ['stump', 'stumps'], ['log', 'logs'], ['grave', 'graves'], ['pillar', 'pillars'], ['monolith', 'monoliths']];

/** Every form any look draws for `key`. */
export const formsOf = (key: keyof PropLook): string[] => [...new Set(Object.values(PROP_LOOKS).flatMap((l) => Object.keys(l[key] as object)))];

/** The `nth` prop of `kind` whose look picks `form` in a region that draws it, and that region; null if none is found. */
export function propOfForm(kind: PropKind, key: keyof PropLook, form: string, nth = 0): { p: Prop; region: string } | null {
  let left = nth;
  for (const region of Object.keys(PROP_LOOKS)) {
    const weights = PROP_LOOKS[region][key] as Record<string, number>;
    if (!weights[form]) continue;
    for (let s = 1; s < 600; s++) {
      const p = propAt(kind, 0, 0, 0, createRng(s * 977 + kind.length), 0);
      if (formOf(weights, createRng(p.seed * 31 + 7)(), '') === form && left-- === 0) return { p, region };
    }
  }
  return null;
}
