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

/** How a rig comes round (round 52). The horse-drawn ones follow a circle: the tighter, the slower, and a horse can step round almost on the spot; the car keeps its old arcade steering. */
export interface MountTurning {
  arcade: boolean; // steers at a fixed rate, braking while it points the wrong way (never to a standstill)
  radius: readonly [walk: number, gallop: number]; // metres: the tightest circle it can follow, at a walk and at a full gallop
  pivot: number; // rad/s: how fast it steps round from a standstill (fades out by 4 m/s)
  accel: number; // rad/s²: how quickly a turn takes hold and lets go
  creep: number; // m/s: the pace kept while coming round to a heading far from its own, so it never stops to turn
  lead: number; // rad of horse turned ahead of the carriage per rad/s of turn
}
const HORSE: MountTurning = Object.freeze({ arcade: false, radius: Object.freeze([2.2, 16] as const), pivot: 1.3, accel: 4.5, creep: 2.4, lead: 0.3 });
const CAR: MountTurning = Object.freeze({ arcade: true, radius: Object.freeze([3, 12] as const), pivot: 0, accel: 6, creep: 2, lead: 0 });
export const MOUNT_TURNING: Readonly<Record<MountId, MountTurning>> = Object.freeze({ grey: HORSE, chariot: HORSE, automobile: CAR });

export const MOUNTS = Object.freeze({
  grey: Object.freeze({ id: 'grey', name: 'Chariot', description: 'A wooden chariot of the spectral coach\'s pattern, drawn by one horse. No fire, no funeral dress.', dlc: false, price: 0, traversal: MOUNT_TRAVERSAL }),
  chariot: Object.freeze({ id: 'chariot', name: 'The Spectral Chariot', description: 'A mourning carriage drawn by two spectral skeleton horses.', dlc: true, price: 0.99, traversal: MOUNT_TRAVERSAL }),
  automobile: Object.freeze({ id: 'automobile', name: 'The Brassbound Motor Car', description: 'An antique touring automobile in black enamel and tarnished brass.', dlc: true, price: 0.99, traversal: MOUNT_TRAVERSAL }),
});
