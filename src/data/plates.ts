/** Which last plate is laid over the picture (`?plate=`). 0 leaves the game's own look. */

export function plateFrom(name: string | null): number {
  if (name === 'silver' || name === '1') return 1;
  if (name === 'etch' || name === '2') return 2;
  if (name === 'sheen' || name === '3') return 3;
  return 0;
}
