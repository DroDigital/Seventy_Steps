export type PaidMount = 'chariot' | 'automobile';
export type DlcPackage = {
  channel?: string;
  steam?: { appId?: number };
  itchDlc?: {
    publicKey?: string;
    purchaseUrl?: string;
    redemptionUrl?: string;
    products?: Partial<Record<PaidMount, { externalId?: string; subProductId?: string | number }>>;
  };
};
export const DLC_GAME: string;
export const DLC_LIMIT: number;
export function paidMount(id: unknown): id is PaidMount;
export function unlockPayload(id: PaidMount): string;
export function purchaseUnlockPayload(id: PaidMount, purchaseId: number): string;
export function readDlcPackage(): DlcPackage;
export function dlcChannel(pkg: DlcPackage): 'itch' | 'steam';
export function mountCheckoutUrl(id: unknown, pkg?: DlcPackage): string | null;
export function mountDlcStore(pkg?: DlcPackage): { channel: 'itch' | 'steam'; chariot: boolean; automobile: boolean };
export function verifyMountUnlock(text: string, pkg?: DlcPackage): PaidMount | null;
export function ownsItchMount(id: unknown, dir: string, pkg?: DlcPackage): boolean;
export function installMountUnlock(text: string, dir: string, pkg?: DlcPackage): { status: 'imported' | 'invalid' | 'unavailable'; mount?: PaidMount };
