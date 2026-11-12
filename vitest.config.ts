/**
 * Two sets of tests (playtest round 24: `npm run check` took a minute and a half, most of it audits that
 * walk every dungeon and prop, or play every boss): the everyday set (`check`) and the audits (`audit`:
 * the random-play soak, the bots that fight every creature, the walks of every dungeon and prop, the
 * balance table). `check:all` runs both (what CI should).
 */
import { configDefaults, defineConfig } from 'vitest/config';
import { demoStrip, restStub } from './tools/demo/vitePlugin.ts';

export const AUDITS = [
  'tests/soak.test.ts',
  'tests/bossBot.test.ts',
  'tests/foeBot.test.ts',
  'tests/bossStand.test.ts',
  'tests/bossFxAudit.test.ts',
  'tests/dungeonView.test.ts',
  'tests/roofView.test.ts',
  'tests/outsideView.test.ts',
  'tests/objectView.test.ts',
  'tests/roam.test.ts',
  'tests/enclosedAudit.test.ts',
  'tests/houseWalk.test.ts',
  'tests/balance.test.ts',
  'tests/ngPlus.test.ts',
];

// Round 38: several tests build a whole world (npcLife, worldDeath, worldLights, nightWeather, outerGods, wanderers, overheard) and
// took longer than the default five seconds whenever the machine was busy (CI, or a browser open beside it): they failed by the clock, not the code.
const TIMEOUT = 30_000;

// `--mode demo` runs the demo's own tests (tests/demo) over the demo's build of the sources: __DEMO__ true and the rest of the game pruned out
// (tools/demo, docs/DEMO_BUILD.md). Every other mode has __DEMO__ false: the sources whole.
export default defineConfig(({ mode }) => ({
  define: { __DEMO__: JSON.stringify(mode === 'demo') },
  plugins: mode === 'demo' ? [demoStrip(), restStub()] : [],
  test: {
    testTimeout: TIMEOUT,
    ...(mode === 'demo'
      ? { include: ['tests/demo/**/*.test.ts'] }
      : mode === 'audit'
        ? { include: AUDITS }
        : mode === 'all'
          ? { exclude: [...configDefaults.exclude, 'tests/demo/**'] }
          : { exclude: [...configDefaults.exclude, ...AUDITS, 'tests/demo/**'] }),
  },
}));
