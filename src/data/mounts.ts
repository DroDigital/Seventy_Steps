/** Three appearances, one traversal model. Ownership is verified by the desktop store, never a save. */
export const MOUNT_IDS = ['grey', 'chariot', 'automobile'] as const;
export type MountId = (typeof MOUNT_IDS)[number];
export const isMount = (id: unknown): id is MountId => MOUNT_IDS.includes(id as MountId);
export const MOUNT_QUEST = 'borrowed_reins';
/** The plain chariot the quest gives. The spectral chariot and the motor car are optional appearances. The id stays `grey` so older saves still load. */
export const FREE_MOUNT: MountId = 'grey';

/** Metres and seconds; every mount shares this exact frozen object. */
export const MOUNT_TRAVERSAL = Object.freeze({
  cruise: 11,
  gallop: 18,
  acceleration: 14,
  braking: 26,
  turnRate: 1.8,
  gallopTurnRate: 1.15,
  radius: 1,
  height: 2.6,
  offsets: Object.freeze([-1.2, 0, 1.2, 2.4, 3.6]),
  substep: 0.18,
  maxSlope: 0.65,
  maxStep: 0.22,
  stride: 4.2,
  damageCooldown: 120,
});

export const MOUNTS = Object.freeze({
  grey: Object.freeze({ id: 'grey', name: 'The Plain Chariot', description: 'A wooden chariot of the spectral coach\'s pattern, drawn by one horse. No fire, no funeral dress.', dlc: false, price: 0, traversal: MOUNT_TRAVERSAL }),
  chariot: Object.freeze({ id: 'chariot', name: 'The Spectral Chariot', description: 'A mourning carriage drawn by two spectral skeleton horses.', dlc: true, price: 0.99, traversal: MOUNT_TRAVERSAL }),
  automobile: Object.freeze({ id: 'automobile', name: 'The Brassbound Motor Car', description: 'An antique touring automobile in black enamel and tarnished brass.', dlc: true, price: 0.99, traversal: MOUNT_TRAVERSAL }),
});
