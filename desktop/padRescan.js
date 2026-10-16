/**
 * When the shell starts its controllers' worker over (round 54: a controller connected after the game launched was not
 * heard until a restart). SDL lists the devices as it starts, and gamepad-node's hot-plug events did not bring a new one
 * in, so while no pad is heard the worker is started again, a little less often each time (a keyboard player is not
 * made to pay for it), and a pad heard resets the wait. Pure: the timing only (main.js keeps the worker).
 */

export const RESCAN_FIRST_MS = 5000; // the first look: after launch, or once no pad is heard
export const RESCAN_MAX_MS = 30000; // the longest wait between two starts over

/** The wait after `prev` (undefined: the first look); it grows by half each time, to the most. */
export const rescanWait = (prev) => (prev === undefined ? RESCAN_FIRST_MS : Math.min(RESCAN_MAX_MS, Math.round(prev * 1.5)));
