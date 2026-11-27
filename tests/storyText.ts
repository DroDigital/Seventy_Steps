/**
 * Every line of the story a player is shown, read from the English tables, by domain and by the id each table keys an entry by
 * (data/lang/story/index.ts). tests/storyI18n.test.ts holds every language's tables to it: a line here with no translation, or a
 * translation of a line no longer here, fails it. A domain's reader lists only what is shown (a performed line's words as shown,
 * never its [tags]).
 */

import { FIELD_NOTES } from '../src/data/bestiaryNotes';
import { EPITHETS } from '../src/data/bossCards';
import { DOCUMENTS } from '../src/data/documents';
import { EPITAPHS } from '../src/data/epitaphs';
import { INTRO, introText } from '../src/data/intro';
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
};
