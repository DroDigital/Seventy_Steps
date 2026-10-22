/**
 * Each weapon's own mark (round 60: the Arms page listed them by name alone, and a weapon not yet found was a line of grey words),
 * in the manner of the relics' (relicGlyphs.ts): a line drawing on a 24-unit square in the menus' accent, keyed by weapon id, so a
 * new weapon needs one too. A weapon not yet found is a sealed mark, a question in a ring.
 */

import type { WeaponId } from '../data/weapons';
import { ACCENT } from './menuParts';

const SVG = 'http://www.w3.org/2000/svg';

const MARKS: Record<WeaponId, string> = {
  cane: '<path d="M4 20L14.5 9.5"/><path d="M12 6.5L17.5 12"/><path d="M17 7C17.8 4.2 21.5 4.2 21 7.2C20.7 8.8 19 9.4 18 9"/>', // a thin blade, a guard and the crook of the stick
  axe: '<path d="M5 20L15.5 6.5"/><path d="M12.5 5.5C15.5 3 20 4 21 8.5C18.5 9 15.5 8.2 14 6.8"/>', // a long haft and a broad bit
  razor: '<path d="M3 20.5L9.5 14"/><path d="M9.5 14L19.5 5.5L21 7.5L12 16.2Z"/><path d="M13 14.8L10.8 12.6"/>', // a handle and a folded blade
  cutlass: '<path d="M3.5 20.5L7 17M5.5 14.5L9.5 18.5"/><path d="M8.5 16.5C12 9 16.5 6 21 5C20 8.5 15.5 13 10 17.5"/>', // a hilt, a guard and a curve of steel
  rapier: '<path d="M4 20.5L19.5 5"/><path d="M9.5 11.5A4 4 0 0 0 12.5 14.5"/><path d="M8 13.5L11 16.5"/><path d="M19.5 5L21.5 3"/>', // a long line, its cup and its grip
};

function glyph(inner: string, size: number): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = `width:${size}px;height:${size}px;flex:none;margin-right:${Math.round(size / 2)}px;vertical-align:-${Math.round(size / 4.5)}px;color:${ACCENT};fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round`;
  svg.innerHTML = inner;
  return svg;
}

/** A weapon's mark as an inline SVG in the accent colour, sized (pixels) to sit at the start of a line. */
export const weaponGlyph = (id: WeaponId, size = 18): SVGSVGElement => glyph(MARKS[id], size);

/** The mark of one not yet found: a question in a ring, dimmed. */
export function unfoundGlyph(size = 18): SVGSVGElement {
  const g = glyph('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5C9.5 7 14.5 7 14.5 9.8C14.5 11.8 12 11.8 12 14M12 17v.4"/>', size);
  g.style.opacity = '.45';
  return g;
}
