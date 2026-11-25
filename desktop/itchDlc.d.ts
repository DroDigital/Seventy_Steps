export const ITCH_DLC_EXTENSION: 'seventysteps-dlc';
export type ItchDlcImportResult = 'imported' | 'invalid' | 'error';
export function ownsItchAutomobileDlc(userData: string): Promise<boolean>;
export function importItchAutomobileDlc(userData: string, selectedPath: string): Promise<ItchDlcImportResult>;
export function createItchAutomobileDlc(sha256: string): {
  ownsItchAutomobileDlc: typeof ownsItchAutomobileDlc;
  importItchAutomobileDlc: typeof importItchAutomobileDlc;
};
