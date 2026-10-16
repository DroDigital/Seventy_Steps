/** Types for padRescan.js (the desktop shell runs it as plain JavaScript). */

export const RESCAN_FIRST_MS: number;

export const RESCAN_MAX_MS: number;

/** The wait after `prev` (undefined: the first look). */
export function rescanWait(prev: number | undefined): number;
