import { describe, expect, it } from 'vitest';
import { pruneModule, pruneRule } from '../tools/demo/prune.ts';

const run = (code: string, rule: Parameters<typeof pruneRule>[1]): string => pruneRule(code, rule).code;

describe('the demo build prunes a data table by id (tools/demo/prune.ts)', () => {
  it('cuts the elements of an array whose id is not kept, and nothing else', () => {
    const code = `const k = 1;\nexport const A = [\n  { id: 'a', n: 1 },\n  { id: 'b', n: 2 },\n  { id: 'c', n: 3 },\n];\nexport const B = [{ id: 'b' }];`;
    const out = run(code, { file: 'x', decl: 'A', shape: 'elements', keep: ['a', 'c'] });
    expect(out).toContain(`id: 'a'`);
    expect(out).toContain(`id: 'c'`);
    expect(out).not.toContain(`n: 2`);
    expect(out).toContain(`export const B = [{ id: 'b' }]`); // another table is left alone
    expect(() => new Function(out.replace(/export /g, ''))).not.toThrow();
  });

  it('leaves no hole where the last, a middle or the only element goes', () => {
    for (const [keep, expected] of [[['a'], [1]], [['b'], [2]], [['c'], [3]], [['a', 'c'], [1, 3]], [[], []]] as const) {
      const out = run(`export const A = [{ id: 'a', v: 1 }, { id: 'b', v: 2 }, { id: 'c', v: 3 }]`, { file: 'x', decl: 'A', shape: 'elements', keep, mustRemove: false });
      const A = new Function(out.replace('export const A =', 'return')) as () => { v: number }[];
      expect(A().map((e) => e.v)).toEqual(expected);
      expect(A().length).toBe(expected.length); // (a hole would count)
    }
  });

  it('reads an id from a property, a first argument, a first tuple item or a string', () => {
    expect(run(`export const A = [{ boss: 'x' }, { boss: 'y' }]`, { file: 'x', decl: 'A', shape: 'elements', by: { prop: 'boss' }, keep: ['x'] })).not.toContain(`'y'`);
    expect(run(`export const A = [mk('x', 1), mk('y', 2)]`, { file: 'x', decl: 'A', shape: 'elements', by: 'arg0', keep: ['x'] })).not.toContain(`'y'`);
    expect(run(`export const A = [['x', 1], ['y', 2]]`, { file: 'x', decl: 'A', shape: 'elements', by: 'tuple0', keep: ['x'] })).not.toContain(`'y'`);
    expect(run(`export const A = ['x', 'y', 'z']`, { file: 'x', decl: 'A', shape: 'elements', by: 'self', keep: (id) => id === 'z' })).not.toMatch(/'x'|'y'/);
  });

  it('keeps an element whose id it cannot read, and a spread', () => {
    const out = run(`export const A = [{ id: 'a' }, { name: 'no id' }, ...more, { id: 'b' }]`, { file: 'x', decl: 'A', shape: 'elements', keep: ['a'] });
    expect(out).toContain('no id');
    expect(out).toContain('...more');
    expect(out).not.toContain(`'b'`);
  });

  it('cuts the properties of a record by key, identifier or string, and keeps spreads and computed keys', () => {
    const out = run(`export const R = { keep: 1, drop: 2, 'also-drop': 3, 'kept-too': 4, [k]: 5, ...rest, fn() {} };`, { file: 'x', decl: 'R', shape: 'properties', keep: ['keep', 'kept-too'], mustRemove: true });
    expect(out).toContain('keep: 1');
    expect(out).toContain(`'kept-too'`);
    expect(out).toContain('[k]: 5');
    expect(out).toContain('...rest');
    expect(out).not.toMatch(/drop: 2|also-drop/);
  });

  it('finds the table inside a call, a `new`, or an exported default', () => {
    expect(run(`export const A = tier('lesser', [{ id: 'a' }, { id: 'b' }]);`, { file: 'x', decl: 'A', shape: 'elements', keep: ['a'] })).not.toContain(`'b'`);
    expect(run(`export const M = new Map([['a', 1], ['b', 2]]);`, { file: 'x', decl: 'M', shape: 'elements', by: 'tuple0', keep: ['a'] })).not.toContain(`'b'`);
    expect(run(`export default { a: 1, b: 2 };`, { file: 'x', decl: 'default', shape: 'properties', keep: ['a'] })).not.toContain('b: 2');
  });

  it('fails loudly when its rule is stale: no such declaration, no such table, or nothing to cut', () => {
    const rule = { file: 'src/x.ts', shape: 'elements' as const, keep: ['a'] };
    expect(() => run(`export const A = [{ id: 'a' }]`, { ...rule, decl: 'Z' })).toThrow(/no top-level 'Z'/);
    expect(() => run(`export const A = 5`, { ...rule, decl: 'A' })).toThrow(/no array literal/);
    expect(() => run(`export const A = [{ id: 'a' }]`, { ...rule, decl: 'A' })).toThrow(/removed nothing/);
  });

  it('survives a comment-led element in parentheses, as the compiler prints one (the first cut broke on `( // comment )`)', () => {
    const code = `export const A = [\n  ( // the first\n  { id: 'a', v: 1 }),\n  ( // the second\n  { id: 'b', v: 2 }),\n  { id: 'c', v: 3 },\n];`;
    const out = run(code, { file: 'x', decl: 'A', shape: 'elements', keep: ['a', 'c'] });
    const A = new Function(out.replace('export const A =', 'return')) as () => { v: number }[];
    expect(A().map((e) => e.v)).toEqual([1, 3]);
    const out2 = run(code, { file: 'x', decl: 'A', shape: 'elements', keep: ['b'] });
    expect((new Function(out2.replace('export const A =', 'return')) as () => { v: number }[])().map((e) => e.v)).toEqual([2]);
  });

  it('follows a path of property keys to a table inside an object', () => {
    const code = `export const SKY = { rate: 3, regions: { hub: 1, dunwich: 2, arkham: 3 }, other: { dunwich: 9 } };`;
    const out = run(code, { file: 'x', decl: 'SKY', path: ['regions'], shape: 'properties', keep: ['hub', 'arkham'] });
    expect(out).toContain('hub: 1');
    expect(out).toContain('arkham: 3');
    expect(out).not.toContain('dunwich: 2');
    expect(out).toContain('dunwich: 9'); // (the other table is another's)
    expect(() => run(code, { file: 'x', decl: 'SKY', path: ['nope'], shape: 'properties', keep: [] })).toThrow(/no 'nope'/);
  });

  it('cuts the strings of an array each entry holds, and leaves the entries', () => {
    const code = `export const E = [{ id: 'a', regions: ['hub', 'dunwich', 'arkham'] }, { id: 'b', regions: ['dunwich'] }, { id: 'c' }];`;
    const r = pruneRule(code, { file: 'x', decl: 'E', shape: 'elements', nested: 'regions', keep: ['hub', 'arkham'] });
    const E = new Function(r.code.replace('export const E =', 'return')) as () => { id: string; regions?: string[] }[];
    expect(E().map((e) => [e.id, e.regions])).toEqual([['a', ['hub', 'arkham']], ['b', []], ['c', undefined]]);
    expect(r.removed).toEqual(['dunwich', 'dunwich']);
    const props = pruneRule(`export const P = { a: { regions: ['x', 'y'] }, b: { regions: ['y'] } };`, { file: 'x', decl: 'P', shape: 'properties', nested: 'regions', keep: ['x'] });
    expect(props.code).not.toContain(`'y'`);
  });

  it('applies several rules to one module in turn', () => {
    const out = pruneModule(`export const A = [{ id: 'a' }, { id: 'b' }];\nexport const R = { a: 1, b: 2 };`, [
      { file: 'x', decl: 'A', shape: 'elements', keep: ['a'] },
      { file: 'x', decl: 'R', shape: 'properties', keep: ['a'] },
    ]);
    expect(out.removed).toEqual(['b', 'b']);
    expect(out.code).not.toMatch(/b/);
  });
});
