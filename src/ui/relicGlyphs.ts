/**
 * Each relic's own symbol (round 48: the two worn were told apart by name alone): a line mark in the menus' accent,
 * named by what the relic is: the star-stone's star, the Black Pharaoh's ankh on a coin, the Pale Watcher's eye,
 * the Yellow Sign's spiral, the salt and the brine of the charm. Keyed by relic id, so a new relic needs one too.
 */

import type { RelicId } from '../data/relics';
import { ACCENT } from './menuParts';

const SVG = 'http://www.w3.org/2000/svg';

/** Each mark's shapes on a 24-unit square. */
const MARKS: Record<RelicId, string> = {
  starHook: '<polygon points="12,3 14.35,8.76 20.56,9.22 15.8,13.24 17.29,19.28 12,16 6.71,19.28 8.2,13.24 3.44,9.22 9.65,8.76"/>',
  blackCoin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="8.6" r="2.2"/><path d="M12 10.8V18.5M9 13.2h6"/>',
  paleLamp: '<path d="M2.5 12C6 6.5 18 6.5 21.5 12C18 17.5 6 17.5 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  yellowSeal: '<path d="M13.10 12.00L13.17 12.16L13.22 12.35L13.23 12.55L13.22 12.76L13.16 12.98L13.07 13.19L12.94 13.40L12.78 13.59L12.57 13.76L12.34 13.91L12.07 14.02L11.78 14.09L11.47 14.12L11.15 14.11L10.82 14.04L10.50 13.92L10.18 13.75L9.89 13.53L9.62 13.26L9.39 12.95L9.20 12.59L9.06 12.21L8.98 11.79L8.96 11.35L9.00 10.91L9.11 10.46L9.28 10.02L9.52 9.61L9.83 9.22L10.19 8.87L10.62 8.57L11.09 8.33L11.60 8.16L12.14 8.05L12.70 8.03L13.27 8.09L13.84 8.23L14.40 8.45L14.92 8.75L15.41 9.14L15.85 9.60L16.22 10.12L16.52 10.70L16.74 11.33L16.87 12.00L16.91 12.69L16.84 13.39L16.68 14.08L16.41 14.76L16.05 15.40L15.59 15.99L15.05 16.52L14.43 16.98L13.74 17.35L12.99 17.62L12.20 17.79L11.39 17.84L10.56 17.78L9.74 17.60L8.94 17.31L8.18 16.89L7.47 16.37L6.84 15.75L6.29 15.03L5.85 14.24L5.52 13.38L5.30 12.47L5.22 11.53L5.27 10.57L5.46 9.62L5.78 8.69L6.23 7.81L6.81 6.99L7.51 6.25L8.31 5.61L9.20 5.08L10.17 4.67L11.20 4.41L12.27 4.29L13.35 4.32L14.44 4.50L15.49 4.84L16.50 5.32L17.44 5.95L18.30 6.72L19.04 7.60L19.66 8.59L20.14 9.66L20.47 10.81L20.64 12.00"/>',
  saltCharm: '<circle cx="12" cy="8.5" r="3.5"/><path d="M6 14h12M5 19q2-2 3.5 0t3.5 0t3.5 0t3.5 0"/>',
};

/** A relic's symbol as an inline SVG in the accent colour, sized to sit at the start of a button's line. */
export function relicGlyph(id: RelicId): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = `width:18px;height:18px;flex:none;margin-right:9px;vertical-align:-4px;color:${ACCENT};fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round`;
  svg.innerHTML = MARKS[id];
  return svg;
}
