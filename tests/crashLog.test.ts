import { describe, expect, it } from 'vitest';
import { note, recorded } from '../src/ui/crashLog';

describe('the crash record', () => {
  it('keeps the last sixty lines, each cut short, errors with their words', () => {
    for (let i = 0; i < 100; i++) note('error', `line ${i}`);
    expect(recorded().length).toBe(60);
    expect(recorded()[0]).toContain('line 40');
    expect(recorded().at(-1)).toContain('line 99');
    note('uncaught', new TypeError('x is not a function'));
    expect(recorded().at(-1)).toContain('TypeError: x is not a function');
    note('error', 'z'.repeat(5000));
    expect(recorded().at(-1)!.length).toBeLessThan(700);
  });
});
