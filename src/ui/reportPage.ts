/**
 * Report a problem (round 56): a page off the pause menu that writes down the game as it stands (where the investigator
 * is, what they are after, how the game is set) above the last errors the page raised (ui/crashLog.ts), shows it, copies
 * it, and opens the game's page, where it is pasted in a comment. The game sends nothing by itself.
 */

import { t } from '../core/i18n';
import type { Game } from '../systems/components';
import { currentLead } from '../systems/lead';
import { bossesSlain, playTime } from '../systems/tally';
import { worldLayout } from '../world/placements';
import { regionAt } from '../world/worldMap';
import { crashReport } from './crashLog';
import { openGamePage } from './desktop';
import { ACCENT, button, el, footer, title, type Page } from './menuKit';
import type { Settings } from './settings';

/** Where the game stands, in plain lines: what a report needs beside the system and the errors. */
export function gameState(g: Game, settings?: Settings): string {
  const p = g.player;
  const tr = g.ecs.c.transform.get(p.id);
  const hp = g.ecs.c.health.get(p.id);
  const ow = g.overworld;
  const lines = [`difficulty ${p.difficulty} · journey ${p.cycle + 1}${g.demo ? ' · the demo' : ''}`];
  if (tr) lines.push(`at ${regionAt(tr.pos.x, tr.pos.z)?.name ?? 'no region'} (${tr.pos.x.toFixed(1)}, ${tr.pos.y.toFixed(1)}, ${tr.pos.z.toFixed(1)})${p.mount.active ? ` · riding the ${p.mount.active}` : ''}`);
  if (hp) lines.push(`health ${Math.round(hp.hp)}/${hp.max} · sanity ${Math.round(g.mind.sanity)} · insight ${g.mind.insight} · echoes ${p.echoes} · weapon ${p.weapon}`);
  if (ow) {
    const [slain, of] = bossesSlain(g);
    lines.push(`played ${playTime(ow.tally.frames)} · horrors slain ${slain} of ${of} · deaths ${ow.tally.deaths} · last sign ${worldLayout().signs.find((x) => Math.hypot(x.rest.x - p.checkpoint.x, x.rest.z - p.checkpoint.z) < 2)?.name ?? 'none'}`);
    lines.push(`lead: ${currentLead(g)?.text ?? 'none'}`);
  }
  if (settings) lines.push(`settings: ${Object.entries(settings).map(([k, v]) => `${k} ${+v.toFixed(2)}`).join(', ')}`);
  return lines.join('\n');
}

/** The page: what to do with the report, the report itself, and Copy and the game's page. */
export function reportPage(g: Game, settings: Settings, back: () => void): Page {
  return {
    back,
    build(p) {
      const report = crashReport('asked from the pause menu', gameState(g, settings), 'problem report');
      title(p, t('report.title'));
      el(p, 'div', t('report.line'), 'margin:0 4px 6px;line-height:1.5');
      el(p, 'div', t('report.privacy'), 'margin:0 4px 12px;font-size:12px;opacity:.6');
      const shown = el(p, 'pre', report, `margin:0 0 14px;padding:8px 10px;max-height:9.5em;overflow:auto;white-space:pre-wrap;word-break:break-word;font:11px/1.45 monospace;opacity:.75;border:1px solid ${ACCENT}33`);
      shown.tabIndex = -1; // read, not chosen: the keys pass over it
      const list = el(p, 'div');
      list.className = 'pause';
      const copy = button(list, t('report.copy'), () => {
        const said = (key: 'report.copied' | 'crash.copyFail') => void (copy.firstChild!.textContent = t(key));
        void navigator.clipboard?.writeText(report).then(() => said('report.copied'), () => said('crash.copyFail'));
        if (!navigator.clipboard) said('crash.copyFail');
      });
      button(list, t('report.open'), openGamePage);
      footer(p, '', back);
    },
  };
}
