export function steamAppId(env?: Record<string, string | undefined>, pkg?: { steam?: { appId?: number } } | null): number | undefined;
export function steamEarly(packaged: boolean): boolean;
export function startSteam(): unknown;
export function steamAchieve(id: string): boolean;
export function steamOn(): boolean;
