/**
 * When the shell asks its controllers' worker to look again (round 54: a controller connected after the game launched was not
 * heard). SDL lists the devices when a manager is made, and gamepad-node's hot-plug events did not bring a new one
 * in, so while no pad is heard the same worker reads the list again, a little less often each time (a keyboard player is not
 * made to pay for it), and a pad heard resets the wait. The process is not replaced: that woke the macOS dock. Pure: the timing only.
 */

export const RESCAN_FIRST_MS = 5000; // the first look: after launch, or once no pad is heard
export const RESCAN_MAX_MS = 30000; // the longest wait between two starts over

/** The wait after `prev` (undefined: the first look); it grows by half each time, to the most. */
export const rescanWait = (prev) => (prev === undefined ? RESCAN_FIRST_MS : Math.min(RESCAN_MAX_MS, Math.round(prev * 1.5)));
