/**
 * The desktop shell's bridge (desktop/preload.cjs), present only when the game runs in it: quitting
 * to the desktop, the window's fullscreen, and (round 12) saves kept as files. On the web it is absent,
 * and what needs it is not offered.
 */

export type MountDlcId = 'chariot' | 'automobile';
export interface MountDlcStore {
  channel: 'itch' | 'steam';
  chariot: boolean;
  automobile: boolean;
}
export interface MountDlcImport {
  status: 'imported' | 'cancelled' | 'invalid' | 'unavailable';
  mount?: MountDlcId;
}

export interface Desktop {
  deck?: boolean; // on a Steam Deck (round 47): a first launch takes larger text
  quit(): Promise<void>;
  setFullscreen(on: boolean): Promise<void>;
  isFullscreen(): Promise<boolean>;
  store?: { get(key: string): string | null; set(key: string, value: string): boolean; remove(key: string): boolean }; // files (round 12)
  writeLog?(report: string): Promise<string | null>; // a crash report kept in the logs folder (round 46); its path
  openLogs?(): Promise<void>; // the logs folder, shown
  achieve?(id: string): Promise<boolean>; // an achievement earned, for Steam's (round 12)
  ownsAutomobileDlc?(): Promise<boolean>; // current verified store ownership of the cosmetic automobile; absent on web
  ownsChariotDlc?(): Promise<boolean>; // the spectral chariot, read the same way
  mountDlcStore?(): Promise<MountDlcStore>; // configured purchase links, never ownership
  buyMountDlc?(id: MountDlcId): Promise<boolean>; // opens a configured purchase page; does not grant ownership
  importMountDlc?(): Promise<MountDlcImport>; // verifies an unlock file selected through the desktop shell
}

export const desktop: Desktop | undefined = (globalThis as { desktop?: Desktop }).desktop;
