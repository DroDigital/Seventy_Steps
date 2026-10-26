export function newKeyPair(): { privatePem: string; publicKey: string };
export function signCode(privatePem: string, options?: { mounts?: readonly string[]; id?: string }): string;
