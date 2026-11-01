/** Lore-specific visual presences. These are presentation only; they do not change sanity or combat. */
export type BossAuraStyle = 'tide' | 'veil' | 'geometry' | 'bloom' | 'prism' | 'chaos' | 'ash';
export interface BossAuraProfile {
  style: BossAuraStyle;
  color: readonly [number, number, number];
  accent: readonly [number, number, number];
  opacity: number;
  speed: number;
  width: number;
}

/** Colours are muted to sit alongside the painted sprites; different beings share a motif only where their lore does. */
export const BOSS_AURAS: Readonly<Record<string, BossAuraProfile>> = {
  cthulhu: { style: 'tide', color: [0.28, 0.48, 0.43], accent: [0.57, 0.73, 0.64], opacity: 0.58, speed: 0.72, width: 1.25 },
  father_dagon: { style: 'tide', color: [0.22, 0.43, 0.43], accent: [0.51, 0.70, 0.66], opacity: 0.48, speed: 0.85, width: 1.12 },
  mother_hydra: { style: 'tide', color: [0.25, 0.44, 0.38], accent: [0.60, 0.70, 0.59], opacity: 0.48, speed: 0.67, width: 1.12 },
  bokrug: { style: 'tide', color: [0.30, 0.48, 0.42], accent: [0.65, 0.72, 0.56], opacity: 0.42, speed: 0.62, width: 1.05 },
  hastur: { style: 'veil', color: [0.56, 0.45, 0.23], accent: [0.85, 0.72, 0.41], opacity: 0.62, speed: 0.7, width: 1.28 },
  haunter_of_the_dark: { style: 'veil', color: [0.22, 0.20, 0.30], accent: [0.50, 0.35, 0.53], opacity: 0.46, speed: 0.56, width: 1.12 },
  yog_sothoth: { style: 'geometry', color: [0.32, 0.70, 0.65], accent: [0.79, 0.69, 0.91], opacity: 0.62, speed: 0.7, width: 1.22 },
  umr_at_tawil: { style: 'geometry', color: [0.48, 0.36, 0.61], accent: [0.72, 0.75, 0.77], opacity: 0.52, speed: 0.48, width: 1.15 },
  ancient_ones: { style: 'geometry', color: [0.40, 0.43, 0.52], accent: [0.72, 0.72, 0.74], opacity: 0.43, speed: 0.39, width: 1.08 },
  keziah_mason: { style: 'geometry', color: [0.41, 0.29, 0.52], accent: [0.65, 0.57, 0.69], opacity: 0.46, speed: 0.8, width: 1.12 },
  shub_niggurath: { style: 'bloom', color: [0.25, 0.31, 0.20], accent: [0.62, 0.64, 0.35], opacity: 0.61, speed: 0.56, width: 1.32 },
  tsathoggua: { style: 'bloom', color: [0.24, 0.29, 0.19], accent: [0.48, 0.51, 0.31], opacity: 0.48, speed: 0.42, width: 1.1 },
  colour_out_of_space: { style: 'prism', color: [0.68, 0.12, 0.46], accent: [0.40, 0.86, 0.68], opacity: 0.65, speed: 0.78, width: 1.3 },
  azathoth: { style: 'chaos', color: [0.38, 0.19, 0.44], accent: [0.75, 0.38, 0.48], opacity: 0.62, speed: 0.52, width: 1.3 },
  nyarlathotep: { style: 'chaos', color: [0.32, 0.22, 0.40], accent: [0.66, 0.38, 0.58], opacity: 0.49, speed: 0.8, width: 1.12 },
  black_man: { style: 'chaos', color: [0.25, 0.19, 0.31], accent: [0.52, 0.37, 0.48], opacity: 0.42, speed: 0.6, width: 1.08 },
  other_gods: { style: 'veil', color: [0.39, 0.38, 0.44], accent: [0.68, 0.65, 0.69], opacity: 0.44, speed: 0.55, width: 1.2 },
  ghatanothoa: { style: 'ash', color: [0.43, 0.37, 0.31], accent: [0.76, 0.64, 0.46], opacity: 0.52, speed: 0.6, width: 1.18 },
};
