/** Which edges of a scrolling body have more beyond them (ui/menuParts.ts: its words fade toward those, so no line is cut half-seen and what lies further on is known to be there). Pure. */

export type More = '' | 'above' | 'below' | 'both';

const SLACK = 2; // pixels of rounding that are not "more"

/** From how far the body is scrolled, how tall it shows, and how tall its contents are. */
export function moreAt(top: number, shown: number, whole: number): More {
  const [above, below] = [top > SLACK, top + shown < whole - SLACK];
  return above && below ? 'both' : above ? 'above' : below ? 'below' : '';
}
