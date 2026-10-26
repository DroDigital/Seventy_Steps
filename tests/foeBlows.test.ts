/**
 * The 51 quiet blows (round 88; asked: the lower tiers' blows were overly elaborate and their colours clustered, a third of them amber).
 * Every creature that is not a horror (not in `BOSS_ATTACK_THEME`) has one entry in `data/foeBlows.ts`: this holds that the table covers them,
 * that each colour path is a real drift, and that the blows are told apart: no two the same mark, tempo and hue, no hue crowded, and no two
 * creatures that can be met together drawn alike. A failure prints the whole table.
 */

import { describe, expect, it } from 'vitest';
import { BOSS_ATTACK_THEME } from '../src/data/bossAttackTheme';
import { FOE_BLOWS, MARKS, MATTERS, TEMPOS, blowOf, type FoeBlow } from '../src/data/foeBlows';
import { ENTITIES, getEntity } from '../src/data/registry';
import { LIGHT_FLOOR } from '../src/render/attackLook';
import { luma, rgbToHsv, type Rgb } from '../src/render/palette';

type Table = Readonly<Record<string, FoeBlow>>;

// The rules, in numbers (the asking's: how far apart and how many).
const START_LUMA = Math.max(0.6, LIGHT_FLOOR); // a mark begins bright, so it is found on any ground
const PALE_BELOW = 0.25; // a middle with less saturation than this is a pale one (the bone and ash things)
const PALE_MOST = 5; // and there may be this many
const BUCKET = 30; // degrees of hue
const BUCKET_MOST = 7; // creatures whose middle falls in one bucket
const AMBER: readonly [number, number] = [20, 65]; // the hues of fire and gold and sand ...
const AMBER_MOST = 6; // ... are for those that burn or are sand and gold
const MARK_USE: readonly [number, number] = [3, 9]; // creatures with each mark as theirs
const TEMPO_LEAST = 4;
const MATTER_LEAST = 2; // each matter but 'none'
const FAR = 40; // two that can be met together, with one mark: their middles this many degrees apart ...
const NEAR = 25; // ... or this many, if their tempos differ
// 'A real drift' (the asking: "a real change of hue, never a mere darkening"; stricter than a clear luma step, which is a darkening): each leg of the path,
// start to middle and middle to end, TURNS: its hue moves by HUE_TURN degrees (both ends carrying colour, saturation of GREY or more, else a hue is noise) or its
// saturation by SAT_STEP (pale to strong, strong to ash); so does the whole path, start to end (a leg out and back is no drift); and the end is darker than
// the middle by END_DARKER of luma (it fades into the dark). A luma step alone never counts.
const HUE_TURN = 25;
const GREY = 0.1;
const SAT_STEP = 0.25;
const END_DARKER = 0.1;

const rgbOf = (hex: number): Rgb => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
const hsv = (hex: number): { hue: number; sat: number } => {
  const [h, s] = rgbToHsv(rgbOf(hex));
  return { hue: h * 360, sat: s };
};
const lumaOf = (hex: number): number => luma(rgbOf(hex));
const hueGap = (a: number, b: number): number => Math.min(Math.abs(a - b) % 360, 360 - (Math.abs(a - b) % 360));
const isPale = (hex: number): boolean => hsv(hex).sat < PALE_BELOW;
const isAmber = (hex: number): boolean => !isPale(hex) && hsv(hex).hue >= AMBER[0] && hsv(hex).hue <= AMBER[1];
const bucketOf = (hex: number): string => (isPale(hex) ? 'pale' : String(Math.floor(hsv(hex).hue / BUCKET)));
/** How far apart two middles are: their hues' distance, and a pale one is as far from a coloured one as can be. */
const middleGap = (a: number, b: number): number => (isPale(a) !== isPale(b) ? 180 : hueGap(hsv(a).hue, hsv(b).hue));
/** Whether the step from colour `a` to colour `b` is a turn of hue or of saturation (not only of lightness). */
const turns =(a: number, b: number): boolean => {
  const [x, y] = [hsv(a), hsv(b)];
  return (Math.min(x.sat, y.sat) >= GREY && hueGap(x.hue, y.hue) >= HUE_TURN) || Math.abs(x.sat - y.sat) >= SAT_STEP;
};
const hex6 = (n: number): string => '0x' + n.toString(16).padStart(6, '0');

type Rule = 'form' | 'start' | 'drift' | 'buckets' | 'triples' | 'usage' | 'neighbours' | 'teeth';
const RULES: readonly Rule[] = ['form', 'start', 'drift', 'buckets', 'triples', 'usage', 'neighbours', 'teeth'];

/** Every rule held against `table`: for each, the creatures that break it (empty when it holds). */
function audit(table: Table): Record<Rule, string[]> {
  const out = Object.fromEntries(RULES.map((r) => [r, [] as string[]])) as Record<Rule, string[]>;
  const ids = Object.keys(table);
  const count = <T>(of: (id: string) => T): Map<T, string[]> => {
    const m = new Map<T, string[]>();
    for (const id of ids) m.set(of(id), [...(m.get(of(id)) ?? []), id]);
    return m;
  };
  for (const id of ids) {
    const b = table[id];
    const attacks = getEntity(id)?.behavior.attacks ?? [];
    if (!(MARKS as readonly string[]).includes(b.mark) || !(TEMPOS as readonly string[]).includes(b.tempo) || !(MATTERS as readonly string[]).includes(b.matter)) out.form.push(`${id}: a word outside the vocabulary`);
    if (b.accent !== undefined && (!(MARKS as readonly string[]).includes(b.accent) || b.accent === b.mark)) out.form.push(`${id}: its accent ${b.accent} is not another mark`);
    if (b.hues.length !== 3 || b.hues.some((h) => !Number.isInteger(h) || h < 0 || h > 0xffffff)) out.form.push(`${id}: hues are not three 0xrrggbb`);
    const [start, mid, end] = b.hues;
    if (lumaOf(start) < START_LUMA) out.start.push(`${id}: starts at luma ${lumaOf(start).toFixed(2)}, under ${START_LUMA}`);
    if (!turns(start, mid)) out.drift.push(`${id}: start to middle does not turn in hue or saturation`);
    if (!turns(mid, end)) out.drift.push(`${id}: middle to end does not turn in hue or saturation`);
    if (!turns(start, end)) out.drift.push(`${id}: start to end is only a darkening`);
    if (lumaOf(end) > lumaOf(mid) - END_DARKER) out.drift.push(`${id}: its end is not darker than its middle`);
    if ((b.mark === 'jaws' || b.accent === 'jaws') && !attacks.includes('bite')) out.teeth.push(`${id}: jaws, and it does not bite`); // teeth are for those that bite
    if (b.mark === 'ripple' && !attacks.includes('slam')) out.teeth.push(`${id}: a ripple for its mark, and it does not slam`); // a ripple on the ground is a slam's
  }
  const buckets = count((id) => bucketOf(table[id].hues[1]));
  for (const [k, who] of buckets) {
    if (k === 'pale' && who.length > PALE_MOST) out.buckets.push(`${who.length} pale middles (at most ${PALE_MOST}): ${who.join(', ')}`);
    if (k !== 'pale' && who.length > BUCKET_MOST) out.buckets.push(`${who.length} middles in hue ${Number(k) * BUCKET}-${Number(k) * BUCKET + BUCKET - 1} (at most ${BUCKET_MOST}): ${who.join(', ')}`);
  }
  const amber = ids.filter((id) => isAmber(table[id].hues[1]));
  if (amber.length > AMBER_MOST) out.buckets.push(`${amber.length} amber middles, hue ${AMBER[0]}-${AMBER[1]} (at most ${AMBER_MOST}): ${amber.join(', ')}`);
  for (const [k, who] of count((id) => `${table[id].mark}/${table[id].tempo}/${bucketOf(table[id].hues[1])}`)) if (who.length > 1) out.triples.push(`${who.join(' and ')} are both mark/tempo/hue ${k}`);
  for (const mark of MARKS) {
    const n = ids.filter((id) => table[id].mark === mark).length;
    if (n < MARK_USE[0] || n > MARK_USE[1]) out.usage.push(`mark ${mark}: ${n} creatures (${MARK_USE[0]} to ${MARK_USE[1]})`);
  }
  for (const tempo of TEMPOS) if (ids.filter((id) => table[id].tempo === tempo).length < TEMPO_LEAST) out.usage.push(`tempo ${tempo}: under ${TEMPO_LEAST} creatures`);
  for (const matter of MATTERS) if (matter !== 'none' && ids.filter((id) => table[id].matter === matter).length < MATTER_LEAST) out.usage.push(`matter ${matter}: under ${MATTER_LEAST} creatures`);
  for (const [i, a] of ids.entries()) {
    for (const b of ids.slice(i + 1)) {
      const [x, y] = [table[a], table[b]];
      const shared = (getEntity(a)?.regions ?? []).filter((r) => (getEntity(b)?.regions ?? []).includes(r));
      if (!shared.length || x.mark !== y.mark) continue;
      const gap = middleGap(x.hues[1], y.hues[1]);
      if (!(gap >= FAR || (x.tempo !== y.tempo && gap >= NEAR))) out.neighbours.push(`${a} and ${b}: both ${x.mark} in ${shared[0]}, ${x.tempo}/${y.tempo}, only ${gap.toFixed(0)} degrees apart`);
    }
  }
  return out;
}

/** The table as one readable block, for a failure's message. */
function report(table: Table): string {
  const rows = Object.entries(table).map(([id, b]) => {
    const mid = hsv(b.hues[1]);
    return `${id.padEnd(22)} ${b.mark.padEnd(8)} ${(b.accent ?? '-').padEnd(8)} ${b.tempo.padEnd(7)} ${b.matter.padEnd(6)} ${b.hues.map(hex6).join(' ')}  hue ${mid.hue.toFixed(0).padStart(3)} sat ${mid.sat.toFixed(2)} bucket ${bucketOf(b.hues[1])}`;
  });
  return `\nid                     mark     accent   tempo   matter hues (start, middle, end)\n${rows.join('\n')}\n`;
}

const mine = audit(FOE_BLOWS);
const roster = ENTITIES.filter((e) => !(e.id in BOSS_ATTACK_THEME)).map((e) => e.id);

describe('the quiet blows: every creature that is not a horror has its own (round 88)', () => {
  it('has an entry for exactly the creatures that are not themed: lesser, greater, allies and the plain named, no horror', () => {
    expect(Object.keys(FOE_BLOWS).sort()).toEqual([...roster].sort());
    expect(roster.length).toBeGreaterThanOrEqual(51);
    for (const tier of ['lesser', 'greater', 'ally', 'named']) expect(ENTITIES.some((e) => e.tier === tier && e.id in FOE_BLOWS), tier).toBe(true);
    expect(blowOf('cthulhu')).toBeUndefined();
    expect(blowOf(undefined)).toBeUndefined();
    expect(blowOf('deep_one')).toBe(FOE_BLOWS.deep_one);
  });

  it('says its mark, tempo, matter and accent in the vocabulary, with three colours 0xrrggbb', () => {
    expect(mine.form, report(FOE_BLOWS)).toEqual([]);
  });

  it('begins bright: the first colour of every mark is at least 0.6 of luma, so it is found on any ground', () => {
    expect(mine.start, report(FOE_BLOWS)).toEqual([]);
  });

  it('fades through a real drift of colour, not a mere darkening, and its end is darker than its middle', () => {
    expect(mine.drift, report(FOE_BLOWS)).toEqual([]);
  });

  it('spreads over the wheel: no hue crowded, few pale, amber only for what burns or is sand and gold', () => {
    expect(mine.buckets, report(FOE_BLOWS)).toEqual([]);
    const amber = roster.filter((id) => isAmber(FOE_BLOWS[id].hues[1]));
    expect(amber.length).toBeLessThanOrEqual(AMBER_MOST); // (a third of them were, before)
    expect(new Set(roster.map((id) => bucketOf(FOE_BLOWS[id].hues[1]))).size).toBeGreaterThanOrEqual(11); // the wheel in twelve parts, and the pale
  });

  it('is told apart: no two share a mark, a tempo and a hue; every mark, tempo and matter is used', () => {
    expect(mine.triples, report(FOE_BLOWS)).toEqual([]);
    expect(mine.usage, report(FOE_BLOWS)).toEqual([]);
  });

  it('draws two creatures that can be met together, with one mark, in colours far apart', () => {
    expect(mine.neighbours, report(FOE_BLOWS)).toEqual([]);
  });

  it('strikes with teeth only where it bites, and a ripple only where it slams', () => {
    expect(mine.teeth, report(FOE_BLOWS)).toEqual([]);
  });

  it('gives an accent to about half, where it adds something, never the same mark twice', () => {
    const n = roster.filter((id) => FOE_BLOWS[id].accent).length;
    expect(n).toBeGreaterThanOrEqual(Math.floor(roster.length * 0.35));
    expect(n).toBeLessThanOrEqual(Math.ceil(roster.length * 0.65));
  });

  it('is a check that bites: each rule flags a table that breaks it', () => {
    const broken = (change: (t: Record<string, FoeBlow>) => void): Record<Rule, string[]> => {
      const t = { ...FOE_BLOWS };
      change(t);
      return audit(t);
    };
    const hues = (a: number, b: number, c: number): FoeBlow['hues'] => [a, b, c];
    expect(broken((t) => void (t.zoog = t.ghoul)).triples.length).toBeGreaterThan(0); // the ghoul's blow under another name
    expect(broken((t) => void (t.zoog = { ...t.zoog, hues: hues(0x404040, t.zoog.hues[1], t.zoog.hues[2]) })).start.length).toBeGreaterThan(0); // begins dark
    expect(broken((t) => void (t.zoog = { ...t.zoog, hues: hues(t.zoog.hues[0], t.zoog.hues[1], 0x234a1c) })).drift.length).toBeGreaterThan(0); // a middle and an end of one hue: a darkening
    expect(broken((t) => void (t.zoog = { ...t.zoog, hues: hues(0x234a1c, 0x6fa85d, 0x234a1c) })).drift.length).toBeGreaterThan(0); // out and back
    expect(broken((t) => { for (const id of roster.slice(0, 10)) t[id] = { ...t[id], hues: hues(0xfff0d0, 0xd8a040, 0x502010) }; }).buckets.length).toBeGreaterThan(0); // ten of amber
    expect(broken((t) => void (t.innsmouth_hybrid = { ...t.deep_one, tempo: 'snap' })).neighbours.length).toBeGreaterThan(0); // one mark, one colour, in one place
    expect(broken((t) => void (t.ghoul = { ...t.ghoul, mark: 'ripple' })).teeth.length).toBeGreaterThan(0); // the ghoul does not slam
    expect(broken((t) => { for (const id of roster) if (t[id].mark === 'ripple') t[id] = { ...t[id], mark: 'rake' }; }).usage.length).toBeGreaterThan(0); // a mark no one has
    expect(broken((t) => void (t.zoog = { ...t.zoog, accent: t.zoog.mark })).form.length).toBeGreaterThan(0); // the accent is the mark
    expect(report(FOE_BLOWS)).toContain('deep_one'); // and a failure reads as a table
  });

});
