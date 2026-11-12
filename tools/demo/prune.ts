/**
 * The demo build's pruning (docs/DEMO_BUILD.md): deletes the entries of a data table that the demo does not keep, from the
 * JavaScript Vite has made of a module, so the rest of the game is not in the demo's bundle at all. A rule names a module, one
 * top-level declaration in it (and, if the table lies deeper, the path to it) and what the table's entries are (the elements of
 * an array, or the properties of an object); an entry that names an id the demo does not keep is cut out, and what only that
 * entry used (an import, a helper, a whole module) is shaken out after it. Pure: a string in, a string out; no Vite, no Node.
 */

import { parseAst } from 'vite';

/** How an array element says which id it is. */
export type IdOf =
  | 'id' // { id: 'x', ... }
  | { prop: string } // { boss: 'x', ... }
  | 'arg0' // foo('x', ...)
  | 'tuple0' // ['x', ...]
  | 'self'; // 'x'

export interface PruneRule {
  /** The module, from the repository root: 'src/data/regions.ts'. */
  file: string;
  /** The top-level declaration whose table is pruned, or 'default' for `export default`. */
  decl: string;
  /** Property keys to follow from the declaration's object to the table: `SKY = { regions: { ... } }` is path ['regions']. */
  path?: readonly string[];
  /** The entries are the elements of an array literal, or the properties of an object literal (the key is the id). */
  shape: 'elements' | 'properties';
  /** For elements: where the id is read from (default 'id'). An element whose id cannot be read is kept. */
  by?: IdOf;
  /**
   * Instead of cutting entries, cut the strings of an array that each entry holds under this property (a kept creature's
   * `regions: ['hub', 'dunwich']` becomes `['hub']`): the entry itself (an element, or a property's value) must be an object literal.
   */
  nested?: string;
  /** The ids to keep, or what keeps one. */
  keep: readonly string[] | ReadonlySet<string> | ((id: string) => boolean);
  /** Fail the build when this removes nothing (a rule gone stale after a refactor): default true. */
  mustRemove?: boolean;
}

/** An ESTree node, as far as this reads one. */
interface Node {
  type: string;
  start: number;
  end: number;
  [key: string]: any; // (ESTree nodes are read by their shape)
}

export interface Pruned {
  code: string;
  /** The ids cut out. */
  removed: string[];
}

const keeps = (rule: PruneRule): ((id: string) => boolean) => {
  const k = rule.keep;
  if (typeof k === 'function') return k;
  const set = k instanceof Set ? k : new Set(k as readonly string[]);
  return (id) => set.has(id);
};

const stringOf = (n: Node | undefined): string | undefined => (n && n.type === 'Literal' && typeof n.value === 'string' ? n.value : undefined);

function propertyKey(p: Node): string | undefined {
  if (p.type !== 'Property' || p.computed) return undefined;
  if (p.key.type === 'Identifier') return p.key.name;
  const s = stringOf(p.key);
  if (s !== undefined) return s;
  return p.key.type === 'Literal' && typeof p.key.value === 'number' ? String(p.key.value) : undefined;
}

/** The literal a declaration's value is: the value itself, or the last array/object argument of the call or `new` that wraps it. */
function tableOf(init: Node, type: 'ArrayExpression' | 'ObjectExpression'): Node | undefined {
  if (init.type === type) return init;
  if (init.type === 'ParenthesizedExpression') return tableOf(init.expression, type);
  if (init.type === 'CallExpression' || init.type === 'NewExpression') {
    for (const a of [...(init.arguments as Node[])].reverse()) {
      const found = tableOf(a, type);
      if (found) return found;
    }
  }
  return undefined;
}

function declaredInit(body: Node[], decl: string): Node | undefined {
  for (const stmt of body) {
    if (decl === 'default') {
      if (stmt.type === 'ExportDefaultDeclaration') return stmt.declaration;
      continue;
    }
    const d = stmt.type === 'ExportNamedDeclaration' ? stmt.declaration : stmt;
    if (d?.type !== 'VariableDeclaration') continue;
    for (const v of d.declarations as Node[]) if (v.id.type === 'Identifier' && v.id.name === decl && v.init) return v.init;
  }
  return undefined;
}

/** The value of an object literal's property of that key. */
function valueAt(obj: Node, key: string): Node | undefined {
  for (const p of obj.properties as Node[]) if (propertyKey(p) === key) return p.value;
  return undefined;
}

function elementId(el: Node, by: IdOf): string | undefined {
  switch (by) {
    case 'self':
      return stringOf(el);
    case 'arg0':
      return el.type === 'CallExpression' ? stringOf(el.arguments[0]) : undefined;
    case 'tuple0':
      return el.type === 'ArrayExpression' ? stringOf(el.elements[0]) : undefined;
    default: {
      if (el.type !== 'ObjectExpression') return undefined;
      const v = valueAt(el, by === 'id' ? 'id' : by.prop);
      return stringOf(v);
    }
  }
}

/** A table's parts: what it holds, and the id of each part that has one. */
interface Entry {
  node: Node;
  id?: string;
}

function entriesOf(table: Node, rule: PruneRule): Entry[] {
  if (table.type === 'ArrayExpression') {
    const by = rule.by ?? 'id';
    return (table.elements as (Node | null)[]).filter((e): e is Node => !!e).map((node) => ({ node, id: node.type === 'SpreadElement' ? undefined : elementId(node, by) }));
  }
  return (table.properties as Node[]).map((node) => ({ node, id: propertyKey(node) }));
}

/** A table's source with only the entries `kept` (in order), rebuilt from their own text so no comment, hole or parenthesis of a removed neighbour survives. */
function rebuilt(code: string, table: Node, kept: Entry[]): string {
  const [open, close] = table.type === 'ArrayExpression' ? ['[', ']'] : ['{', '}'];
  const body = kept.map((e) => code.slice(e.node.start, e.node.end)).join(',\n');
  return open + (body ? '\n' + body + '\n' : '') + close;
}

/** Applies one rule to a module's code. Throws when the declaration or its table cannot be found. */
export function pruneRule(code: string, rule: PruneRule): Pruned {
  const body = (parseAst(code, { lang: 'js' }) as unknown as { body: Node[] }).body;
  let node = declaredInit(body, rule.decl);
  if (!node) throw new Error(`demo prune: ${rule.file} has no top-level '${rule.decl}' (the rule is stale)`);
  for (const key of rule.path ?? []) {
    const obj = tableOf(node, 'ObjectExpression');
    const next = obj && valueAt(obj, key);
    if (!next) throw new Error(`demo prune: '${rule.decl}' in ${rule.file} has no '${key}' on the path ${JSON.stringify(rule.path)} (the rule is stale)`);
    node = next;
  }
  const want = rule.shape === 'elements' ? 'ArrayExpression' : 'ObjectExpression';
  const table = tableOf(node, want);
  if (!table) throw new Error(`demo prune: '${rule.decl}' in ${rule.file} holds no ${want === 'ArrayExpression' ? 'array' : 'object'} literal to prune`);
  const keep = keeps(rule);
  const removed: string[] = [];
  let out: string;
  if (rule.nested) {
    // each entry's own array of strings: cut from the last to the first so the offsets above stay true
    const cuts: { arr: Node; kept: Entry[] }[] = [];
    for (const e of entriesOf(table, rule)) {
      const holder = table.type === 'ArrayExpression' ? e.node : e.node.value;
      if (!holder || holder.type !== 'ObjectExpression') continue;
      const arr = valueAt(holder, rule.nested);
      if (!arr || arr.type !== 'ArrayExpression') continue;
      const all = entriesOf(arr, { ...rule, by: 'self' });
      const kept = all.filter((s) => s.id === undefined || keep(s.id));
      for (const s of all) if (s.id !== undefined && !keep(s.id)) removed.push(s.id);
      if (kept.length !== all.length) cuts.push({ arr, kept });
    }
    out = code;
    for (const c of cuts.reverse()) out = out.slice(0, c.arr.start) + rebuilt(code, c.arr, c.kept) + out.slice(c.arr.end);
  } else {
    const all = entriesOf(table, rule);
    const kept = all.filter((e) => e.id === undefined || keep(e.id));
    for (const e of all) if (e.id !== undefined && !keep(e.id)) removed.push(e.id);
    out = removed.length ? code.slice(0, table.start) + rebuilt(code, table, kept) + code.slice(table.end) : code;
  }
  if (!removed.length && rule.mustRemove !== false) throw new Error(`demo prune: '${rule.decl}' in ${rule.file}: the rule removed nothing (the table is already the demo's, or the rule is stale)`);
  return { code: out, removed };
}

/** Applies every rule of one module in turn (the code is parsed again after each, for its offsets have moved). */
export function pruneModule(code: string, rules: readonly PruneRule[]): Pruned {
  let out = code;
  const removed: string[] = [];
  for (const r of rules) {
    const p = pruneRule(out, r);
    out = p.code;
    removed.push(...p.removed);
  }
  return { code: out, removed };
}
