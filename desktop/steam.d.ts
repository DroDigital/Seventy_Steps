export function steamAppId(env?: Record<string, string | undefined>, pkg?: { steam?: { appId?: number } } | null): number | undefined;
export function steamEarly(packaged: boolean): boolean;
export function startSteam(): unknown;
export function steamAchieve(id: string): boolean;
export function steamOn(): boolean;
/** The store this build is for: "itch" when packed for itch.io (`channel` in its package.json), else "steam". */
export function channel(pkg?: { channel?: string; steam?: { appId?: number } } | null): 'itch' | 'steam';
