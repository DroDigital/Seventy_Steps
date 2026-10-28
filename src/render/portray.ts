/** Whether the portrayal pass runs. `?portray=0` leaves the picture as the world drew it. */

export function portrayOn(flag: string | null): number {
  return flag === '0' || flag === 'off' ? 0 : 1;
}
