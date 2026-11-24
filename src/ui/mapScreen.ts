/**
 * The full map (playtest round 1): M, the pad's Select, or Map in the pause menu opens it, and the
 * world stands still while it is open (main.ts). It shows the realm the investigator stands in — every
 * ground seen, the places marked there (mapMarks.ts, mapIcons.ts), region names, the Elder Signs lit — with
 * how much of the realm is charted, opening on what has been seen (mapFit.ts), a key of its figures and a hover
 * card for any mark (mapChrome.ts; round 60). The wheel or + and − (pad triggers) zoom. Dragging,
 * the arrows, WASD or the right stick pan. The left stick moves the cursor, and A travels to a lit
 * Elder Sign under it or finds the investigator on empty ground. The shoulders, D-pad and R3 can
 * jump to signs. Click a sign twice or choose with Tab and press Enter to travel. Right-click,
 * F or pad Y toggles a marker, and Delete clears all. L (pad X) toggles the key. M or Esc (pad B) closes.
 */

import { PAD_BUTTON } from '../core/padMap';
import { activePad } from '../core/pads';
import { t } from '../core/i18n';
import type { XZ } from '../core/geom';
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
import { buildHints, buildKey, drawCompass, drawCrosshair, drawTip, keyOpenPref, rememberKeyOpen, type KeyPanel } from './mapChrome';
import { chartedRect, fitScale, openingView } from './mapFit';
import { markAt, type Mark } from './mapMarks';
import { UNIT, type MapPainter } from './mapPainter';
import { barWord, drawRing, litSigns, signAt, steerPad, triggerHeld, type BarWord, type PadMapView } from './mapTravel';
import { worldX, worldZ } from './mapView';
import { uiScale } from './uiScale';
import { createScreen, el, menuOpen, onPadSelect, type Page } from './menuKit';
import { keyLayout, keyName } from '../core/bindings';
import { deviceInUse, useDevice } from '../core/device';
import { fill } from './glyphs';
const ZOOM = [1, 10] as const;
const PAN = 0.6; // screen widths a second, held
const ART_MS = 6; // milliseconds a frame for drawing the map's art while the map is open
const CLICK_PX = 5; // a press that moves less than this is a click, not a drag
const pickRadius = (): number => Math.max(14, 9 * uiScale());
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
  let view: PadMapView = { cx: 0, cz: 0, scale: 1, w: 1, h: 1, aim: { x: 0, y: 0 }, locked: false, armed: true };
  let fit = 1;
  let zoom = 1;
  let prompt: HTMLDivElement | null = null;
  let key: KeyPanel | null = null;
  let keyOpen = keyOpenPref(); // the key is a tab, shut until asked for (L, the pad's X or a click) and left as it was last (2026-10-25)
  let heading = ['', '']; // the realm, and how much of it is charted
  let pointer: { x: number; y: number } | null = null; // the mouse, in canvas pixels
  let onKey = false; // the mouse is on the key, not on the map beneath it
  let drag: { x: number; y: number; moved: number } | null = null;
  let shown: readonly Mark[] = []; // the marks on show, as last painted
  const held = new Set<string>();
  const padWas = new Set<number>();
  let padAt = 0; // when the pad was last read, so a zoom and a pan take the time and not the frame rate
  let lit: MapPlace[] = []; // the realm's lit signs, nearest first (the world stands still while the map is open)
  let chosen: MapPlace | null = null;
  let padHover: MapPlace | null = null; // the sign highlighted in the last frame
  let prompted: MapPlace | null = null;
  /** Why no journey may be made to `p` now, or null: the state of things (travelBar), or, in the demo, a sign beyond its realms. */
  const barOf = (p: MapPlace): BarWord | null => travelBar(g) ?? (signBeyondDemo(g, p.id) ? 'demo' : null);
  const signAtPoint = (p: { x: number; y: number }): MapPlace | null => signAt(lit, view, p.x, p.y, pickRadius());

  const realm = () => {
    const p = g.ecs.c.transform.get(g.player.id)!.pos;
    return realmOf(g.overworld?.region ?? regionAt(p.x, p.z)?.id ?? '');
  };
  const centreOn = (p: XZ): void => {
    [view.cx, view.cz] = [p.x, p.z];
    view.aim = { x: view.w / 2, y: view.h / 2 };
  };
  const centreOnPlayer = (): void => {
    view.locked = false;
    centreOn(g.ecs.c.transform.get(g.player.id)!.pos);
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
    const pad = deviceInUse() === 'pad';
    const aim = pad ? view.aim : pointer;
    const hover = aim && (pad || !drag) ? signAtPoint(aim) : null;
    padHover = pad ? hover : null;
    const target = pad ? hover : chosen;
    if (target !== prompted) showPrompt(target);
    canvas.style.cursor = drag ? 'grabbing' : hover ? 'pointer' : 'grab';
    if (hover && hover !== target) drawRing(ctx, view, hover, false, false, now, k);
    if (target) drawRing(ctx, view, target, true, !!barOf(target), now, k);
    drawCompass(ctx, view.w - 46 * k, 60 * k, 16 * k);
    if (pad) drawCrosshair(ctx, view.aim.x, view.aim.y, 9 * k);
    const tip = !pad && pointer && !drag ? markAt(marks, pointer.x, pointer.y, 4 * k) : null;
    if (tip) drawTip(ctx, tip, view.w, view.h, k);
    requestAnimationFrame(frame);
  };

  const close = (): void => {
    screen.close();
    held.clear();
    resume();
  };
  const showPrompt = (p: MapPlace | null): void => {
    prompted = p;
    const bar = p ? barOf(p) : null;
    if (!prompt) return;
    const again = deviceInUse() === 'pad' ? fill(t('map.press'), true) : t('map.clickAgain'); // the south face button as the pad in hand prints it (A, ✕ or B)
    prompt.style.display = p ? '' : 'none';
    prompt.textContent = !p ? '' : bar ? `${p.name.toUpperCase()}  ·  ${barWord(bar)}` : t('map.travelTo', { name: p.name.toUpperCase(), again });
    prompt.style.color = bar ? '#d80073' : BONE;
  };
  const journey = (p: MapPlace | null): void => {
    if (!p || barOf(p)) return; // (refused before the map closes and any veil falls)
    close();
    go(p.name.toUpperCase(), () => travel(g, p.id), undefined, p.region);
  };
  const cycle = (by: 1 | -1, from = chosen): void => {
    if (!lit.length) return;
    const i = from ? lit.indexOf(from) : -1;
    chosen = lit[i < 0 ? (by > 0 ? 0 : lit.length - 1) : (i + by + lit.length) % lit.length];
    centreOn(chosen);
  };
  const page: Page = {
    back: close,
    get backKeys() {
      return [keyLayout.map]; // as the player has bound it
    },
    build(panel) {
      panel.append(canvas);
      const head = el(panel, 'div', '', 'position:absolute;left:0;right:0;top:0;padding:12px 16px 22px;text-align:center;background:linear-gradient(#050506e6,#050506a0 60%,transparent);pointer-events:none;text-shadow:0 0 4px #000');
      el(head, 'div', heading[0], `letter-spacing:6px;font-size:calc(16px * var(--ui, 1));color:${BONE}`);
      el(head, 'div', heading[1], 'letter-spacing:3px;font-size:calc(11px * var(--ui, 1));color:#8a8474;margin-top:2px');
      prompt = el(head, 'div', '', 'display:none;margin:8px auto 0;width:max-content;max-width:90%;padding:4px 16px;border:1px solid #d9d0b855;background:#050506cc;letter-spacing:4px;font-size:calc(12px * var(--ui, 1));text-shadow:0 0 6px #000,0 0 12px #6a0dad');
      key = buildKey(panel, keyOpen, (open) => rememberKeyOpen((keyOpen = open)), deviceInUse() === 'pad');
      showPrompt(deviceInUse() === 'pad' ? signAtPoint(view.aim) : chosen);
      buildHints(panel, deviceInUse() === 'pad', keyName(keyLayout.map));
    },
    keys(e) {
      if (e.type !== 'keydown') return;
      if (e.code === 'Equal' || e.code === 'NumpadAdd') zoomBy(1.25);
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') zoomBy(0.8);
      if (e.code === 'KeyC') centreOnPlayer();
      if (e.code === 'KeyF' && !onKey) markAtPoint(pointer?.x ?? view.w / 2, pointer?.y ?? view.h / 2);
      if (e.code === 'Delete' || e.code === 'Backspace') clearMarkers(g); // every marker at once (round 68)
      if (e.code === 'KeyL' && !e.repeat) key?.toggle();
      if (e.code === 'Tab') cycle(e.shiftKey ? -1 : 1);
      if (e.code === 'Enter' || e.code === 'NumpadEnter') journey(chosen);
      if (/^(Arrow|Key[WASD])/.test(e.code)) held.add(e.code);
    },
    pad(p) {
      if (!screen.open) return;
      const now = performance.now();
      const dt = padAt ? Math.min(0.05, (now - padAt) / 1000) : 1 / 60;
      padAt = now;
      const edge = (i: number): boolean => !!p.buttons[i]?.pressed && !padWas.has(i);
      const dir = edge(PAD_BUTTON.left) ? { x: -1, y: 0 } : edge(PAD_BUTTON.right) ? { x: 1, y: 0 } : edge(PAD_BUTTON.up) ? { x: 0, y: -1 } : edge(PAD_BUTTON.down) ? { x: 0, y: 1 } : null;
      const steered = steerPad(view, {
        stick: { x: p.axes[0] ?? 0, y: p.axes[1] ?? 0 },
        pan: { x: p.axes[2] ?? 0, y: p.axes[3] ?? 0 },
        lock: edge(PAD_BUTTON.r3), dpad: dir,
        zoomIn: triggerHeld(p.buttons[PAD_BUTTON.rt]), zoomOut: triggerHeld(p.buttons[PAD_BUTTON.lt]),
      }, dt, lit, pickRadius());
      const moved = steered.view.aim !== view.aim || steered.view.cx !== view.cx || steered.view.cz !== view.cz;
      view = steered.view;
      if (steered.zoom !== 1) zoomBy(steered.zoom);
      if (steered.focus) chosen = steered.focus;
      if (moved) useDevice('pad');
      const shoulder = edge(PAD_BUTTON.lb) ? -1 : edge(PAD_BUTTON.rb) ? 1 : 0;
      if (shoulder) cycle(shoulder, padHover ?? chosen);
      const confirm = edge(PAD_BUTTON.a);
      if (edge(PAD_BUTTON.y)) markAtPoint(view.aim.x, view.aim.y);
      if (edge(PAD_BUTTON.x)) key?.toggle();
      padWas.clear();
      p.buttons.forEach((b, i) => b.pressed && padWas.add(i));
      if (confirm) {
        // Confirm the highlighted sign even when the stick moves again in this poll.
        const under = shoulder ? signAtPoint(view.aim) : steered.focus ?? padHover;
        if (under) journey(under);
        else centreOnPlayer();
      }
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
    const p = signAtPoint(q);
    if (p && p === chosen) journey(p);
    else chosen = p;
  });
  addEventListener('pointermove', (e) => {
    if (!screen.open) return;
    if (e.movementX || e.movementY) useDevice('keys');
    onKey = !!key?.holds(e.target);
    pointer = onKey ? null : at(e);
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
    view = { ...open, w: canvas.width, h: canvas.height, aim: { x: canvas.width / 2, y: canvas.height / 2 }, locked: false, armed: true };
    lit = litSigns(g, rs, here);
    padAt = 0;
    padWas.clear();
    activePad()?.buttons.forEach((b, i) => b.pressed && padWas.add(i));
    onKey = false;
    chosen = null;
    padHover = null;
    const charted = rs.reduce((s, x) => s + exploredShare(g.overworld!.explored, x) * (x.area[2] * x.area[3]), 0) / rs.reduce((s, x) => s + x.area[2] * x.area[3], 0);
    const where = rs.find((x) => x.id === g.overworld!.region)?.name ?? '';
    const places = rs.flatMap((x) => placesOf(x.id)); // round 18
    const found = places.filter((p) => g.overworld!.places.has(p.id)).length;
    const secrets = poiTotals(g, rs); // round 61
    const gift = nextGift(g); // round 68: the gifts for the secrets found, in all the realms
    const totalSecrets = secretsFound(g);
    const parts: string[] = [charted >= 0.005 ? `${Math.round(charted * 100)}% CHARTED` : 'SURVEY BEGUN'];
    if (found > 0) parts.push(`${found} ${found === 1 ? 'PLACE' : 'PLACES'} CHARTED`);
    if (secrets.found > 0) parts.push(`${secrets.found} ${secrets.found === 1 ? 'SECRET' : 'SECRETS'} UNCOVERED`);
    if (totalSecrets > 0 && secrets.of && gift) parts.push(`GIFT AT ${gift.at} SECRETS (${totalSecrets} FOUND)`);
    heading = [where.toUpperCase(), parts.join('   ·   ')];
    screen.show(page);
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
