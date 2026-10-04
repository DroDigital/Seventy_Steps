/**
 * Signs over the heads of those who have something for the investigator (round 39): a small five-branched star,
 * as the Elder Signs are cut, faint and slowly breathing, pale violet for someone who will ask a quest of them and
 * bone-white, with a lit heart, for someone a quest under way waits on (systems/questMarks.ts). They show in plain
 * sight within sixty paces, fainter with distance, and give way as the investigator comes near enough to talk.
 */

import { Vector3, type Camera } from 'three';
import { questMarks, type Mark } from '../systems/questMarks';
import { npcEntity } from '../systems/npcs';
import type { Game } from '../systems/components';
import { hasLineOfSight } from '../world/colliders';
import { BONE, el, setStyle } from './hudKit';
import { uiScale } from './uiScale';

const RANGE = 60; // paces
const NEAR = 4; // closer than this, the talk's own prompt is enough
const LIFT = 0.55; // above the head

const SVG = 'http://www.w3.org/2000/svg';
const STAR = [0, 1, 2, 3, 4].map((i) => { const a = (i * 4 * Math.PI) / 5 - Math.PI / 2; return `${(8 + 7 * Math.cos(a)).toFixed(2)},${(8 + 7 * Math.sin(a)).toFixed(2)}`; }).join(' '); // the pentagram, drawn in one stroke

const COLOUR: Record<Mark, string> = { ask: '#c9b6e0', answer: BONE };

export interface QuestMarks {
  update(camera: Camera, canvas: HTMLCanvasElement): void;
}

export function createQuestMarks(g: Game, parent: HTMLElement): QuestMarks {
  const signs = new Map<string, { root: HTMLDivElement; mark: Mark; heart: SVGCircleElement; star: SVGPolygonElement }>();
  let marks = new Map<string, Mark>();
  let at = -1e9;
  const v = new Vector3();
  const eye = new Vector3();

  const make = (mark: Mark) => {
    const root = el('position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;display:none;pointer-events:none', '', parent);
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.style.cssText = 'width:100%;height:100%;overflow:visible;filter:drop-shadow(0 0 3px #6a0dad)';
    const star = document.createElementNS(SVG, 'polygon');
    star.setAttribute('points', STAR);
    star.setAttribute('fill', 'none');
    star.setAttribute('stroke', COLOUR[mark]);
    star.setAttribute('stroke-width', '1');
    star.setAttribute('stroke-linejoin', 'round');
    const heart = document.createElementNS(SVG, 'circle');
    heart.setAttribute('cx', '8');
    heart.setAttribute('cy', '8');
    heart.setAttribute('r', '1.6');
    heart.setAttribute('fill', COLOUR[mark]);
    heart.style.display = mark === 'answer' ? '' : 'none';
    svg.append(star, heart);
    root.append(svg);
    svg.animate([{ transform: 'translateY(0)', opacity: 0.8 }, { transform: 'translateY(-3px)', opacity: 1 }], { duration: 2600, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
    return { root, mark, heart, star };
  };

  return {
    update(camera, canvas) {
      if (g.frame - at >= 30) [marks, at] = [questMarks(g), g.frame]; // twice a second
      const c = g.ecs.c;
      const me = c.transform.get(g.player.id)!.pos;
      eye.copy(camera.position);
      const r = canvas.getBoundingClientRect();
      const k = uiScale();
      const seen = new Set<string>();
      for (const [id, mark] of marks) {
        const e = npcEntity(g, id);
        const p = e === undefined ? undefined : c.transform.get(e)?.pos;
        if (e === undefined || !p || c.health.get(e)?.hp === 0) continue;
        const d = Math.hypot(p.x - me.x, p.z - me.z);
        if (d > RANGE || d < NEAR) continue;
        const top = { x: p.x, y: p.y + (c.body.get(e)?.height ?? 1.8) + LIFT, z: p.z };
        v.set(top.x, top.y, top.z).project(camera);
        if (v.z >= 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) continue;
        if (!hasLineOfSight(g.world, { x: eye.x, y: eye.y, z: eye.z }, { x: top.x, y: top.y - 0.5, z: top.z })) continue;
        let s = signs.get(id);
        if (!s || s.mark !== mark) {
          s?.root.remove();
          signs.set(id, (s = make(mark)));
        }
        const fade = Math.min(1, (RANGE - d) / 25, (d - NEAR) / 3);
        setStyle(s.root, 'left', `${Math.round((((v.x + 1) / 2) * r.width) / k)}px`);
        setStyle(s.root, 'top', `${Math.round((((1 - v.y) / 2) * r.height) / k)}px`);
        setStyle(s.root, 'opacity', (0.75 * fade).toFixed(2));
        setStyle(s.root, 'display', 'block');
        seen.add(id);
      }
      for (const [id, s] of signs) if (!seen.has(id)) setStyle(s.root, 'display', 'none');
    },
  };
}
