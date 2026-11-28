/**
 * Every line of the story a player is shown, read from the English tables, by domain and by the id each table keys an entry by
 * (data/lang/story/index.ts). tests/storyI18n.test.ts holds every language's tables to it: a line here with no translation, or a
 * translation of a line no longer here, fails it. A domain's reader lists only what is shown (a performed line's words as shown,
 * never its [tags]).
 */

import { FIELD_NOTES } from '../src/data/bestiaryNotes';
import { OWN_SPECS, OWNER } from '../src/data/bossMoves';
import { EPITHETS } from '../src/data/bossCards';
import { WAKE, type Scene } from '../src/data/cutscenes';
import { ENDING_SCENES } from '../src/data/cutscenesEndings';
import { bespokeFall } from '../src/data/cutscenesFall';
import { arrivalOf } from '../src/data/cutscenesMore';
import { ENDINGS } from '../src/data/endings';
import { bossLine } from '../src/data/speechLines';
import { EDGES, FRAGMENTS, GENERIC, SEAS, TIPS as BLOW_TIPS } from '../src/data/deathLines';
import { PETRIFIED } from '../src/systems/deathNotes';
import { DOCUMENTS } from '../src/data/documents';
import { EPITAPHS } from '../src/data/epitaphs';
import { INTRO, introText } from '../src/data/intro';
import { DESCENT_LINE, QUOTES, TIPS as LESSONS } from '../src/data/loreLines';
import { NPCS, TRADERS } from '../src/data/npcs';
import { FATES } from '../src/data/epilogues';
import { OVERHEARD } from '../src/data/overheard';
import { POIS } from '../src/data/pois';
import { QUESTS } from '../src/data/quests';
import { REGIONS } from '../src/data/regions';
import { ENTITIES } from '../src/data/registry';
import { RUMORS } from '../src/data/rumors';
import { placesOf } from '../src/world/namedPlaces';
import { worldLayout } from '../src/world/placements';
import type { StoryDomain } from '../src/data/lang/story';

/** A domain's lines: the source's id -> the English of each line it shows. */
export type StorySource = ReadonlyMap<string, readonly string[]>;

const lines = (...all: (string | undefined | null | false)[]): string[] => all.filter((s): s is string => typeof s === 'string' && s.trim() !== '');

export const STORY_SOURCES: Readonly<Record<StoryDomain, () => StorySource>> = {
  intro: () => new Map([['intro', INTRO.flatMap((c) => lines(c.heading, introText(c)))]]),
  // the people met: a name, a title, every line of every topic (the trader at the lamps is one man at every second sign: 'trader')
  people: () =>
    new Map([
      ...NPCS.map((n) => [n.id, lines(n.name, n.title, ...n.topics.flatMap((tp) => tp.lines))] as const),
      ['trader', [...new Set(TRADERS.flatMap((n) => lines(n.name, n.title, ...n.topics.flatMap((tp) => tp.lines))))]],
    ]),
  // what the people say of a horror's fall, by horror; what they mutter as one passes, by person; what became of them, by person
  rumors: () => new Map(Object.entries(RUMORS).map(([id, text]) => [id, lines(text)])),
  overheard: () => new Map(Object.entries(OVERHEARD).map(([id, said]) => [id, lines(...said)])),
  fates: () =>
    new Map(Object.entries(FATES).map(([id, f]) => [id, lines(f.done, f.undone, ...Object.values(f.endings ?? {}), ...Object.values(f.undoneEndings ?? {}))])),
  // the quests: a title, each stage's line in the journal, the line once done. A horror's discovery (`discover_<horror>`) is left out:
  // round 69 switched the discoveries off (systems/discovery.ts), so none begins and none is shown (docs/LOCALIZATION.md)
  quests: () =>
    new Map(Object.entries(QUESTS).filter(([id]) => !id.startsWith('discover_')).map(([id, q]) => [id, lines(q.title, ...q.stages.map((s) => s.note), q.done)])),
  // the tomes, notes and letters: a name and its paragraphs, by name (the pages of the horrors' courts and the Outer Dark among them)
  documents: () => new Map(Object.entries(DOCUMENTS).map(([name, doc]) => [name, lines(name, ...doc.text)])),
  // the places, by realm: its name, its lesser places' names (world/namedPlaces.ts), and its Elder Signs', gates' and dungeons' names
  places: () => {
    const by = new Map<string, Set<string>>();
    const add = (region: string, ...names: string[]): void => void names.forEach((n) => n && (by.get(region) ?? by.set(region, new Set()).get(region)!).add(n));
    for (const r of REGIONS) add(r.id, r.name, ...placesOf(r.id).map((p) => p.name));
    const w = worldLayout();
    for (const s of w.signs) add(s.region, s.name);
    for (const g of w.gates) add(g.region, g.name);
    for (const { layout: d } of w.dungeons) add(d.region, d.def.name);
    return new Map([...by].map(([id, names]) => [id, [...names]]));
  },
  // the creatures, by roster id: a name (and its variants'), the story it is from, its field note, the line under its name, its epitaph
  creatures: () =>
    new Map(
      ENTITIES.map((d) => [d.id, lines(d.name, d.eldritchVariant?.name, d.bossVariant?.name, d.source, FIELD_NOTES[d.id], EPITHETS[d.id], EPITAPHS[d.id])] as const)
        .map(([id, l]) => [id, [...new Set(l)]] as const),
    ),
  // the secrets of the land, by id: a name, the line said on finding it, and the line on coming back
  pois: () => new Map(POIS.map((p) => [p.id, lines(p.name, p.line, p.again)])),
  // what is read under UNMADE: how a library blow is met, a fall's and the sea's lines, the stone's, and a fragment of each realm
  deaths: () =>
    new Map<string, string[]>([
      ['library', lines(...Object.values(BLOW_TIPS))],
      ['edges', lines(...EDGES, PETRIFIED)],
      ['seas', lines(...SEAS)],
      ['generic', lines(...GENERIC)],
      ...Object.entries(FRAGMENTS).map(([region, f]) => [region, lines(...f)] as [string, string[]]),
    ]),
  // how each horror's own blows are met (data/bossMoves.ts), by the horror
  blows: () => {
    const by = new Map<string, string[]>();
    for (const [id, spec] of Object.entries(OWN_SPECS)) if (spec.tip) (by.get(OWNER[id]!) ?? by.set(OWNER[id]!, []).get(OWNER[id]!)!).push(spec.tip);
    return new Map([...by].map(([who, l]) => [who, [...new Set(l)]]));
  },
  // what the cutscenes show: each horror's arrival and fall captions and the lines it says (its name and epithet, put in by the
  // arrival, are the creatures'), the wake's words, and each ending's captions, its choice, title and lines
  scenes: () => {
    const words = (scene: Scene | undefined, skip: readonly (string | undefined)[] = []): string[] =>
      (scene?.beats ?? []).flatMap((b) => lines(b.caption, ...(b.title ?? []))).filter((w) => !skip.includes(w));
    const by = new Map<string, string[]>([['wake', words(WAKE)]]);
    for (const d of ENTITIES) {
      const [name, epithet] = [d.name, EPITHETS[d.id]];
      const l = [...words(arrivalOf(d.id, name, epithet), [name.toUpperCase(), name, epithet]), ...words(bespokeFall(d.id)), ...lines(bossLine(d.id, 'arrive')?.text, bossLine(d.id, 'fall')?.text)];
      if (l.length) by.set(d.id, [...new Set(l)]);
    }
    for (const [id, e] of Object.entries(ENDINGS)) by.set(id, [...new Set([...words(ENDING_SCENES[id]), ...lines(e.choice, e.title, ...e.lines)])]);
    return new Map([...by].filter(([, l]) => l.length));
  },
  // the lines under the veil: Lovecraft's (the one that names Cthulhu apart, which the demo leaves out), the lessons by their hint, the descent's
  lore: () => {
    const by = new Map<string, string[]>([['quotes', QUOTES.filter((q) => !q.includes('Cthulhu'))], ['cthulhu', QUOTES.filter((q) => q.includes('Cthulhu'))], ['descent', [DESCENT_LINE]]]);
    for (const l of LESSONS) (by.get(l.topic) ?? by.set(l.topic, []).get(l.topic)!).push(l.text);
    return new Map([...by].filter(([, l]) => l.length)); // (the demo has no quote that names Cthulhu)
  },
};
