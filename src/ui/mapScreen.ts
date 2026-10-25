/**
 * The full map (playtest round 1): M, the pad's Select, or Map in the pause menu opens it, and the
 * world stands still while it is open (main.ts). It shows the realm the investigator stands in — every
 * ground seen, the places marked there (mapMarks.ts, mapIcons.ts), region names, the Elder Signs lit — with
 * how much of the realm is charted, opening on what has been seen (mapFit.ts), a key of its figures and a hover
 * card for any mark (mapChrome.ts; round 60). The wheel or + and − (pad triggers) zoom; dragging, the arrows or
 * WASD (left stick) pan; C (pad A) finds the investigator; right-click or F (pad Y, at the middle) sets a marker the
 * minimap points to, or removes the one it is on, Delete clears them all (systems/marker.ts; round 68: up to twelve); L hides the key. A lit Elder Sign clicked, or picked
 * with Tab (the pad's shoulders), is chosen, and chosen again (Enter, pad A) is travelled to (playtest round 7,
 * mapTravel.ts). M or Esc (pad B) closes it.
 */

import { PAD_BUTTON } from '../core/padMap';
import { t } from '../core/i18n';
import { MARKER } from '../data/tuning';
import { signBeyondDemo, travel, travelBar } from '../systems/checkpoints';
import type { Game } from '../systems/components';
import { currentLead } from '../systems/lead';
import { addMarker, clearMarkers, markersHere, removeMarker } from '../systems/marker';
import { exploredShare } from '../systems/exploration';
import { nextGift, secretsFound } from '../systems/poiGifts';
import { poiTotals } from '../systems/pois';
import { realmOf, type MapPlace } from '../world/mapData';
import { placesOf } from '../world/namedPlaces';
import { regionAt } from '../world/worldMap';
import { BONE } from './hudKit';
import { drawBeacon } from './leadMark';
import { workArt } from './mapArt';
import { buildHints, buildKey, drawCompass, drawCrosshair, drawTip } from './mapChrome';
import { chartedRect, fitScale, openingView } from './mapFit';
import { markAt, type Mark } from './mapMarks';
import { UNIT, type MapPainter } from './mapPainter';
import { BAR_WORDS, drawRing, litSigns, signAt } from './mapTravel';
import { worldX, worldZ, type MapView } from './mapView';
import { uiScale } from './uiScale';
import { createScreen, el, menuOpen, onPadSelect, type Page } from './menuKit';
import { keyLayout, keyName } from '../core/bindings';
import { deviceInUse } from '../core/device';

const ZOOM = [1, 10] as const;
const PAN = 0.6; // screen widths a second, held
const ART_MS = 6; // milliseconds a frame for drawing the map's art while the map is open
const CLICK_PX = 5; // a press that moves less than this is a click, not a drag

export interface MapScreen {
  readonly open: boolean;
  show(): void;
}

/** `go` makes a long jump under the veil (journeys.ts). */
export function createMapScreen(g: Game, painter: MapPainter, resume: () => void, go: (words: string, jump: () => void, line?: string, region?: string) => void): MapScreen {
  const screen = createScreen(7, '#050506', 'inset:0', false); // its own canvas, the screen's size
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;cursor:grab';
  const ctx = canvas.getContext('2d')!;
  let view: MapView = { cx: 0, cz: 0, scale: 1, w: 1, h: 1 };
  let fit = 1;
  let zoom = 1;
  let title: HTMLDivElement | null = null;
  let stats: HTMLDivElement | null = null;
  let prompt: HTMLDivElement | null = null;
  let key: HTMLElement | null = null;
  let keyShown = true; // L hides the key, for the rest of the run
  let heading = ['', '']; // the realm, and how much of it is charted
  let pointer: { x: number; y: number } | null = null; // the mouse, in canvas pixels
  let drag: { x: number; y: number; moved: number } | null = null;
  let shown: readonly Mark[] = []; // the marks on show, as last painted
  const held = new Set<string>();
  const padWas = new Set<number>();
  let lit: MapPlace[] = []; // the realm's lit signs, nearest first (the world stands still while the map is open)
  let chosen: MapPlace | null = null;
  /** Why no journey may be made to `p` now, or null: the state of things (travelBar), or, in the demo, a sign beyond its realms. */
  const barOf = (p: MapPlace): keyof typeof BAR_WORDS | null => travelBar(g) ?? (signBeyondDemo(g, p.id) ? 'demo' : null);
  let hover: MapPlace | null = null; // the lit sign under the pointer

  const realm = () => {
    const p = g.ecs.c.transform.get(g.player.id)!.pos;
    return realmOf(g.overworld?.region ?? regionAt(p.x, p.z)?.id ?? '');
  };
  const centreOnPlayer = (): void => {
    const p = g.ecs.c.transform.get(g.player.id)!.pos;
    [view.cx, view.cz] = [p.x, p.z];
  };
  /** Adds a marker at a point of the screen, or removes the one that point is on (round 60; round 68: any number, each its own). */
  const markAtPoint = (px: number, py: number): void => {
    const on = markAt(shown, px, py, 4 * uiScale());
    if (on?.kind === 'marker') return void (on.at && removeMarker(g, on.at));
    const [x, z] = [worldX(view, px), worldZ(view, py)];
    if (!realm().some((r) => r.id === regionAt(x, z)?.id)) return; // on the realm's own ground
    if (addMarker(g, { x, z }) === 'full') g.events.emit('Notice', { text: t('n.markersFull', { n: MARKER.most }) });
  };
  const zoomBy = (k: number): void => {
    zoom = Math.min(ZOOM[1], Math.max(ZOOM[0], zoom * k));
    view.scale = fit * zoom;
  };

  let last = 0;
  const frame = (now: number): void => {
    if (!screen.open) return;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    const step = (PAN * view.w * dt) / view.scale;
    if (held.has('ArrowLeft') || held.has('KeyA')) view.cx += step; // +x is drawn on the left (mapPainter.ts)
    if (held.has('ArrowRight') || held.has('KeyD')) view.cx -= step;
    if (held.has('ArrowUp') || held.has('KeyW')) view.cz += step;
    if (held.has('ArrowDown') || held.has('KeyS')) view.cz -= step;
    workArt(ART_MS);
    const k = uiScale();
    const marks = (shown = painter.paint(ctx, view, realm(), true));
    drawBeacon(ctx, view, currentLead(g)?.at ?? null, realm(), 'screen', UNIT.full * k, 'lead');
    for (const m of markersHere(g)) drawBeacon(ctx, view, m, realm(), 'screen', UNIT.full * k, 'marker', 0, true); // the pins are among the marks; only their pointers, off screen
    hover = pointer && !drag ? signAt(lit, view, pointer.x, pointer.y, Math.max(14, 9 * k)) : null;
    canvas.style.cursor = drag ? 'grabbing' : hover ? 'pointer' : 'grab';
    if (hover && hover !== chosen) drawRing(ctx, view, hover, false, false, now, k);
    if (chosen) drawRing(ctx, view, chosen, true, !!barOf(chosen), now, k);
    drawCompass(ctx, view.w - 46 * k, 60 * k, 16 * k);
    if (deviceInUse() === 'pad') drawCrosshair(ctx, view.w / 2, view.h / 2, 9 * k); // where Y would set the marker
    const tip = pointer && !drag ? markAt(marks, pointer.x, pointer.y, 4 * k) : null;
    if (tip) drawTip(ctx, tip, view.w, view.h, k);
    requestAnimationFrame(frame);
  };

  const close = (): void => {
    screen.close();
    held.clear();
    resume();
  };
  const choose = (p: MapPlace | null): void => {
    chosen = p;
    const bar = p ? barOf(p) : null;
    if (!prompt) return;
    const again = deviceInUse() === 'pad' ? 'PRESS A' : 'CLICK AGAIN OR ENTER';
    prompt.style.display = p ? '' : 'none';
    prompt.textContent = !p ? '' : bar ? `${p.name.toUpperCase()}  ·  ${BAR_WORDS[bar]}` : `TRAVEL TO ${p.name.toUpperCase()}  ·  ${again}`;
    prompt.style.color = bar ? '#d80073' : BONE;
  };
  const journey = (): void => {
    const p = chosen;
    if (!p || barOf(p)) return; // (refused before the map closes and any veil falls)
    close();
    go(p.name.toUpperCase(), () => travel(g, p.id), undefined, p.region);
  };
  const cycle = (by: 1 | -1): void => {
    if (!lit.length) return;
    const i = chosen ? lit.indexOf(chosen) : -1;
    const p = lit[i < 0 ? (by > 0 ? 0 : lit.length - 1) : (i + by + lit.length) % lit.length];
    choose(p);
    [view.cx, view.cz] = [p.x, p.z];
  };
  const page: Page = {
    back: close,
    get backKeys() {
      return [keyLayout.map]; // as the player has bound it
    },
    build(panel) {
      panel.append(canvas);
      const head = el(panel, 'div', '', 'position:absolute;left:0;right:0;top:0;padding:12px 16px 22px;text-align:center;background:linear-gradient(#050506e6,#050506a0 60%,transparent);pointer-events:none;text-shadow:0 0 4px #000');
      title = el(head, 'div', heading[0], `letter-spacing:6px;font-size:calc(16px * var(--ui, 1));color:${BONE}`);
      stats = el(head, 'div', heading[1], 'letter-spacing:3px;font-size:calc(11px * var(--ui, 1));color:#8a8474;margin-top:2px');
      prompt = el(head, 'div', '', 'display:none;margin:8px auto 0;width:max-content;max-width:90%;padding:4px 16px;border:1px solid #d9d0b855;background:#050506cc;letter-spacing:4px;font-size:calc(12px * var(--ui, 1));text-shadow:0 0 6px #000,0 0 12px #6a0dad');
      key = buildKey(panel);
      key.style.display = keyShown ? '' : 'none';
      choose(chosen); // the prompt again, drawn anew (for the device in hand)
      buildHints(panel, deviceInUse() === 'pad', keyName(keyLayout.map));
    },
    keys(e) {
      if (e.type !== 'keydown') return;
      if (e.code === 'Equal' || e.code === 'NumpadAdd') zoomBy(1.25);
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') zoomBy(0.8);
      if (e.code === 'KeyC') centreOnPlayer();
      if (e.code === 'KeyF') markAtPoint(pointer?.x ?? view.w / 2, pointer?.y ?? view.h / 2);
      if (e.code === 'Delete' || e.code === 'Backspace') clearMarkers(g); // every marker at once (round 68)
      if (e.code === 'KeyL' && key) key.style.display = (keyShown = !keyShown) ? '' : 'none';
      if (e.code === 'Tab') cycle(e.shiftKey ? -1 : 1);
      if (e.code === 'Enter' || e.code === 'NumpadEnter') journey();
      if (/^(Arrow|Key[WASD])/.test(e.code)) held.add(e.code);
    },
    pad(p) {
      const [x, y] = [p.axes[0] ?? 0, p.axes[1] ?? 0];
      const step = (0.02 * view.w) / view.scale;
      if (Math.hypot(x, y) > 0.2) [view.cx, view.cz] = [view.cx - x * step, view.cz - y * step];
      if (p.buttons[PAD_BUTTON.rt]?.pressed) zoomBy(1.03);
      if (p.buttons[PAD_BUTTON.lt]?.pressed) zoomBy(0.97);
      const edge = (i: number): boolean => !!p.buttons[i]?.pressed && !padWas.has(i);
      if (edge(PAD_BUTTON.lb) || edge(PAD_BUTTON.rb)) cycle(edge(PAD_BUTTON.lb) ? -1 : 1);
      if (edge(PAD_BUTTON.a)) {
        if (chosen) journey();
        else centreOnPlayer();
      }
      if (edge(PAD_BUTTON.y)) markAtPoint(view.w / 2, view.h / 2); // the pad's mark is at the middle of the map
      padWas.clear();
      p.buttons.forEach((b, i) => b.pressed && padWas.add(i));
    },
  };
  addEventListener('keyup', (e) => held.delete(e.code));
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 1.15 : 0.87);
  });
  const at = (e: MouseEvent): { x: number; y: number } => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * canvas.width) / r.width, y: ((e.clientY - r.top) * canvas.height) / r.height };
  };
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const q = at(e);
    markAtPoint(q.x, q.y);
  });
  canvas.addEventListener('pointerdown', (e) => void (e.button === 0 && (drag = { x: e.clientX, y: e.clientY, moved: 0 }))); // the primary button chooses and drags: the secondary sets the marker (contextmenu), and its pointer events are not a choice of where to travel
  addEventListener('pointerup', (e) => {
    if (e.button !== 0) return;
    const click = !!drag && drag.moved < CLICK_PX && screen.open;
    drag = null;
    if (!click) return;
    const q = at(e);
    const p = signAt(lit, view, q.x, q.y, Math.max(14, 9 * uiScale()));
    if (p && p === chosen) journey();
    else choose(p);
  });
  addEventListener('pointermove', (e) => {
    if (!screen.open) return;
    pointer = at(e);
    if (!drag) return;
    const k = canvas.width / canvas.clientWidth / view.scale;
    view.cx += (e.clientX - drag.x) * k;
    view.cz += (e.clientY - drag.y) * k;
    drag = { x: e.clientX, y: e.clientY, moved: drag.moved + Math.hypot(e.clientX - drag.x, e.clientY - drag.y) };
  });

  const show = (): void => {
    if (!g.overworld || menuOpen()) return;
    const rs = realm();
    if (!rs.length) return;
    [canvas.width, canvas.height] = [innerWidth, innerHeight];
    const here = g.ecs.c.transform.get(g.player.id)!.pos;
    fit = fitScale(rs, canvas.width, canvas.height);
    const open = openingView(rs, chartedRect(g.overworld.explored, rs), here, canvas.width, canvas.height); // on what has been seen (round 60)
    zoom = open.scale / fit;
    view = { cx: open.cx, cz: open.cz, scale: open.scale, w: canvas.width, h: canvas.height };
    screen.show(page);
    lit = litSigns(g, rs, g.ecs.c.transform.get(g.player.id)!.pos);
    hover = null;
    choose(null);
    const charted = rs.reduce((s, x) => s + exploredShare(g.overworld!.explored, x) * (x.area[2] * x.area[3]), 0) / rs.reduce((s, x) => s + x.area[2] * x.area[3], 0);
    const where = rs.find((x) => x.id === g.overworld!.region)?.name ?? '';
    const places = rs.flatMap((x) => placesOf(x.id)); // round 18
    const found = places.filter((p) => g.overworld!.places.has(p.id)).length;
    const secrets = poiTotals(g, rs); // round 61
    const gift = nextGift(g); // round 68: the gifts for the secrets found, in all the realms
    heading = [where.toUpperCase(), `${Math.round(charted * 100)}% CHARTED   ·   ${found} OF ${places.length} PLACES FOUND${secrets.of ? `   ·   ${secrets.found} OF ${secrets.of} SECRETS` : ''}${secrets.of && gift ? `   ·   A GIFT AT ${gift.at} OF ALL (${secretsFound(g)} FOUND)` : ''}`];
    if (title) title.textContent = heading[0];
    if (stats) stats.textContent = heading[1];
    last = 0;
    requestAnimationFrame(frame);
  };
  addEventListener('keydown', (e) => e.code === keyLayout.map && !e.repeat && show());
  onPadSelect(show);
  return {
    get open() {
      return screen.open;
    },
    show,
  };
}
