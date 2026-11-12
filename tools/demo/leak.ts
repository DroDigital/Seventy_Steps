/**
 * The demo's leak check (docs/DEMO_BUILD.md): what the demo's built files may hold, and what they may not. A build is read as
 * JavaScript (its string literals and property names, parsed, so a minified name is not a hit) and as text (html, json, css), and
 * every file's own path is read too. A forbidden id is a whole word in those: `dunwich_horror` in `'boss-dunwich_horror.mp3'` is a
 * hit, and `dunwich` alone in an interface sentence is not. A forbidden name is a display name, matched without case. Pure: the
 * catalog of what is forbidden is `leak/catalog.ts`, and the test that builds the demo and reads it is `tests/demoLeak.test.ts`.
 * An unminified build names the source module of each hit (its `//#region` markers), which is how a cut is found.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseAst } from 'vite';

/** What the leak check forbids: content ids (whole words, lower case), display names, and the words that are ids and also plain English. */
export interface Forbidden {
  ids: ReadonlySet<string>;
  names: readonly string[];
}

export interface Hit {
  file: string;
  kind: 'id' | 'name' | 'file' | 'unlisted';
  what: string;
  /** The source module of a hit in an unminified script (from its `//#region` marker), when there is one. */
  module?: string;
  /** The line of a hit in its script (unminified scripts, for the report). */
  line?: number;
}

export interface Report {
  files: number;
  hits: Hit[];
}

/** The words of a text, lower case: letters, digits and underscores, split at anything else. */
const wordsOf = (text: string): string[] => text.toLowerCase().split(/[^a-z0-9_]+/).filter(Boolean);
/**
 * A text with its words spaced, lower case, padded at both ends: a display name matches as whole words (`Cthulhu` in `Cthulhu Cultist`,
 * not in the id `cthulhu_cultist`, where an underscore joins the words).
 */
const spaced = (text: string): string => ' ' + text.toLowerCase().replace(/[^a-z0-9_]+/g, ' ').trim() + ' ';

interface Node {
  type: string;
  [key: string]: unknown;
}

/** Every node of a parsed program, depth first, without recursion (a minified bundle nests deeper than a stack likes). */
function* nodesOf(root: Node): Generator<Node> {
  const stack: unknown[] = [root];
  while (stack.length) {
    const v = stack.pop();
    if (Array.isArray(v)) {
      for (const x of v) stack.push(x);
    } else if (v && typeof v === 'object' && typeof (v as Node).type === 'string') {
      const n = v as Node;
      yield n;
      for (const k of Object.keys(n)) if (k !== 'type' && k !== 'start' && k !== 'end') stack.push(n[k]);
    }
  }
}

/** Every forbidden id and name a script holds in its strings and its property names, at the offset of each (in order). */
export function scanScript(code: string, forbidden: Forbidden): { what: string; kind: 'id' | 'name'; at: number }[] {
  const found: { what: string; kind: 'id' | 'name'; at: number }[] = [];
  let at = 0;
  const names = forbidden.names.map((n) => [n, spaced(n)] as const);
  const text = (s: string) => {
    for (const w of wordsOf(s)) if (forbidden.ids.has(w)) found.push({ what: w, kind: 'id', at });
    const low = spaced(s);
    for (const [n, sp] of names) if (low.includes(sp)) found.push({ what: n, kind: 'name', at });
  };
  const program = parseAst(code, { lang: 'js' }) as unknown as Node;
  for (const n of nodesOf(program)) {
    at = typeof n.start === 'number' ? n.start : 0;
    if (n.type === 'Literal' && typeof n.value === 'string') text(n.value);
    else if (n.type === 'TemplateElement') text(String((n.value as { cooked?: string })?.cooked ?? ''));
    else if (n.type === 'Property' && !n.computed && (n.key as Node).type === 'Identifier') text((n.key as { name: string }).name);
    else if (n.type === 'MemberExpression' && !n.computed) text((n.property as { name: string }).name);
  }
  return found.sort((a, b) => a.at - b.at);
}

/** Every string a script holds as a literal or as template text (cooked): what its bundle names, the demo's voice lines among them. */
export function literalsOf(code: string): Set<string> {
  const out = new Set<string>();
  const program = parseAst(code, { lang: 'js' }) as unknown as Node;
  for (const n of nodesOf(program)) {
    if (n.type === 'Literal' && typeof n.value === 'string') out.add(n.value);
    else if (n.type === 'TemplateElement') out.add(String((n.value as { cooked?: string })?.cooked ?? ''));
  }
  return out;
}

/** The literals of every script a built directory holds (its `.js` and `.mjs` files), as one set. */
export function buildLiterals(dir: string): Set<string> {
  const out = new Set<string>();
  for (const f of filesUnder(dir)) if (/\.m?js$/.test(f)) for (const s of literalsOf(readFileSync(join(dir, f), 'utf8'))) out.add(s);
  return out;
}

/** The module each offset of an unminified script lies in: the last `//#region` marker before it. */
export function moduleMap(code: string): (at: number) => string | undefined {
  const marks: { at: number; name: string }[] = [];
  for (const m of code.matchAll(/^\/\/#region (.+)$/gm)) marks.push({ at: m.index ?? 0, name: m[1]!.trim() });
  return (at) => {
    let name: string | undefined;
    for (const mk of marks) {
      if (mk.at > at) break;
      name = mk.name;
    }
    return name;
  };
}

/** Every file under a directory, relative to it, with forward slashes. */
export function filesUnder(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else out.push(relative(dir, p).split('\\').join('/'));
    }
  };
  walk(dir);
  return out.sort();
}

const TEXT = /\.(js|mjs|html|css|json|txt|svg)$/;

/**
 * Checks a built directory: every file must pass the allowlist (`allowed`, given a path relative to the directory), and no file may hold
 * a forbidden id or name, in its text or in its own path.
 */
export function checkBuild(dir: string, forbidden: Forbidden, allowed: (file: string) => boolean): Report {
  const files = filesUnder(dir);
  const hits: Hit[] = [];
  for (const f of files) {
    if (!allowed(f)) hits.push({ file: f, kind: 'unlisted', what: f });
    for (const w of wordsOf(f)) if (forbidden.ids.has(w)) hits.push({ file: f, kind: 'file', what: w });
    if (!TEXT.test(f)) continue;
    const code = readFileSync(join(dir, f), 'utf8');
    if (f.endsWith('.js') || f.endsWith('.mjs')) {
      const module = moduleMap(code);
      const seen = new Set<string>();
      for (const s of scanScript(code, forbidden)) {
        const m = module(s.at);
        const key = `${s.kind}|${s.what}|${m ?? ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        hits.push({ file: f, kind: s.kind, what: s.what, module: m, line: code.slice(0, s.at).split('\n').length });
      }
    } else {
      for (const w of new Set(wordsOf(code))) if (forbidden.ids.has(w)) hits.push({ file: f, kind: 'id', what: w });
      const low = spaced(code);
      for (const n of forbidden.names) if (low.includes(spaced(n))) hits.push({ file: f, kind: 'name', what: n });
    }
  }
  return { files: files.length, hits };
}
