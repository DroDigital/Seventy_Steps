/** Reproduce the original PR #209 Cthulhu health cliff against a local checkout of d65611f.
 * Usage: node tools/ngplus_cthulhu_trace.mjs /path/to/pr-209-checkout > trace.jsonl
 * The target checkout needs the project's normal development dependencies installed.
 */
import { createServer } from 'vite';

const root = process.argv[2];
if (!root) throw new Error('Pass the path to a checkout of PR #209 at d65611f.');

const server = await createServer({ root, logLevel: 'silent', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
try {
  const { bossGame } = await server.ssrLoadModule('/tests/bossHelpers.ts');
  const { driveBot, clearFor } = await server.ssrLoadModule('/tests/botHelpers.ts');
  const { BOSS_NG_PLUS } = await server.ssrLoadModule('/src/data/bossNgPlus.ts');
  for (const health of [0, 0.2, 0.31]) {
    BOSS_NG_PLUS.cthulhu = [health, 0.247]; // process-local only: fixed +24.7% damage on NG+7
    for (const start of [6, 7, 8, 9, 10, 11, 12, 13, 14]) {
      const { g, boss } = bossGame('cthulhu', undefined, start);
      clearFor(g, boss);
      const phases = [];
      let summons = 0, slainServants = 0, ram = null;
      g.events.on('BossPhase', (e) => { if (e.entity === boss) phases.push({ phase: e.phase, seconds: g.frame / 60 }); });
      g.events.on('Summoned', (e) => { if (e.by === boss) summons++; });
      g.events.on('Died', (e) => { if (g.ecs.c.minion.get(e.entity) === boss) slainServants++; });
      g.events.on('Rammed', () => { ram = g.frame / 60; });
      const r = driveBot(g, boss, 36_000, false, { cycle: 7, levels: { vigour: 30, endurance: 30, might: 30 }, reinforced: 5, skill: 0.55, floor: true, smart: true, mind: true });
      console.log(JSON.stringify({ health, start, seconds: r.frames / 60, phases, summons, slainServants, ram, damage: r.taken }));
    }
  }
} finally {
  await server.close();
}
