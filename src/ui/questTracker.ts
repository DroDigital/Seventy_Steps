/**
 * The quest tracker (asked: "when a quest is active a concise summary of what you have to do should be visible on the right side of the
 * screen in the HUD, stylized and non cluttering"): under the minimap, right-aligned, the quest being followed (the side quest picked in the
 * journal, else the main line: systems/lead.ts) as its name in small gold capitals, a rule fading to the left, the one line its open stage
 * asks (ui/questBrief.ts) and the way to it: a pointer turned as the minimap's picture is, and the distance. It stands out for a few
 * seconds when it is new, or its stage has moved on, and rests dimmer after. It is not shown in a menu, a fight with a horror, the dying, or
 * when the setting is off (Settings › Play). The lead is read a few times a second; the pointer follows the camera every frame.
 */

import type { XZ } from '../core/geom';
import { t as tr } from '../core/i18n';
import type { Game } from '../systems/components';
import { engagedFights } from '../systems/bossFight';
import { currentLead } from '../systems/lead';
import { sealsBroken } from '../systems/sealCount';
import { BONE, el, GOLD, PAPER, setStyle, setText } from './hudKit';
import { briefLine, distanceWords } from './questBrief';

const READ_MS = 250; // how often the lead is asked for again
const NEW_MS = 9000; // how long a quest or a stage that is new stands out
const HERE = 9; // metres from the place within which the pointer gives way to a word
const RESTING = 0.72; // the opacity of a tracker at rest

export interface QuestTracker {
  update(): void;
}

/** The angle, radians clockwise from the right of the screen, of a place seen from `from` by a camera turned to `yaw` (as the minimap turns its picture: ui/leadMark.ts `beaconPlace`). 0 points right, −π/2 straight ahead. */
export function pointerAngle(from: XZ, to: XZ, yaw: number): number {
  const [dx, dz] = [from.x - to.x, from.z - to.z]; // (the world is drawn as the investigator sees it: +x lies on the left)
  return Math.atan2(dx * Math.sin(yaw) + dz * Math.cos(yaw), dx * Math.cos(yaw) - dz * Math.sin(yaw));
}

/** `shown`: whether the HUD has the screen for it (no menu, not dying, the setting on). */
export function createQuestTracker(g: Game, root: HTMLElement, shown: () => boolean): QuestTracker {
  const box = el('position:absolute;right:16px;top:216px;width:220px;text-align:right;opacity:0;transition:opacity .7s', '', root);
  const title = el(`font-size:11px;letter-spacing:3px;color:${GOLD};text-transform:uppercase;transition:color 1.2s`, '', box);
  const rule = el(`height:1px;margin:4px 0 5px;transform-origin:right;transition:transform 1.2s;background:linear-gradient(270deg,${GOLD}cc,${GOLD}00)`, '', box);
  const line = el('font-size:13px;line-height:1.35;letter-spacing:.3px', '', box);
  const where = el(`display:flex;justify-content:flex-end;align-items:center;gap:6px;margin-top:3px;font-size:10px;letter-spacing:2px;color:${BONE};opacity:.75`, '', box);
  const arrow = el(`width:8px;height:9px;background:${GOLD};clip-path:polygon(100% 50%,0 0,22% 50%,0 100%)`, '', where);
  const away = el('', '', where);
  let [key, since, readAt, at]: [string, number, number, XZ | null] = ['', 0, -Infinity, null];
  let on = false;

  return {
    update() {
      const now = performance.now();
      if (!g.overworld || !shown() || engagedFights(g).length > 0) on = false;
      else if (now - readAt >= READ_MS) {
        readAt = now;
        const lead = currentLead(g);
        on = !!lead;
        if (lead) {
          const words = briefLine(lead.goal, sealsBroken(g));
          if (`${lead.title}|${words}` !== key) {
            [key, since] = [`${lead.title}|${words}`, now]; // a first sight stands out, and so does a stage that moves on
            setText(title, lead.title);
            setText(line, words);
          }
          at = lead.at;
        }
      }
      const fresh = now - since < NEW_MS;
      setStyle(box, 'opacity', on ? (fresh ? '1' : String(RESTING)) : '0');
      if (!on) return;
      title.style.color = fresh ? PAPER : GOLD;
      rule.style.transform = `scaleX(${fresh ? 1 : 0.55})`;
      const p = g.ecs.c.transform.get(g.player.id)!.pos;
      const far = at ? Math.hypot(p.x - at.x, p.z - at.z) : 0;
      where.style.display = at ? 'flex' : 'none';
      arrow.style.display = at && far > HERE ? 'block' : 'none';
      if (at && far > HERE) arrow.style.transform = `rotate(${pointerAngle(p, at, g.camera.yaw).toFixed(3)}rad)`;
      setText(away, at ? (far > HERE ? distanceWords(far) : tr('hud.track.here')) : '');
    },
  };
}
