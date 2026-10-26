/** Mount selection and store ownership. A save remembers a preference, never an entitlement. */
import { FREE_MOUNT, MOUNT_IDS, MOUNTS, type MountId } from '../data/mounts';
import type { Game } from '../systems/components';
import { mountAvailable, mountUnlocked, selectMount, setAutomobileEntitlement, setChariotEntitlement } from '../systems/mounts';
import { desktop } from './desktop';
import { EDITION } from '../data/edition';
import { t } from '../core/i18n';
import { fill } from './glyphs';
import { button, el, heading, option } from './menuKit';
import { chips, price } from './menuChips';
import { saveNow } from './autosave';

const pending = new WeakMap<Game, Promise<void>>();

/** Deduplicate overlapping focus/menu checks; a bridge failure always removes paid access. */
export function refreshMountEntitlement(g: Game): Promise<void> {
  const checking = pending.get(g);
  if (checking) return checking;
  const request = (async () => {
    try {
      const [car, chariot] = await Promise.all([
        Promise.resolve(desktop?.ownsAutomobileDlc?.() ?? false),
        Promise.resolve(desktop?.ownsChariotDlc?.() ?? false),
      ]);
      setAutomobileEntitlement(g, car === true);
      setChariotEntitlement(g, chariot === true);
    } catch {
      setAutomobileEntitlement(g, false);
      setChariotEntitlement(g, false);
    }
  })().finally(() => pending.delete(g));
  pending.set(g, request);
  return request;
}

const NOTES: Record<MountId, () => string> = { grey: () => t('mounts.note.grey'), chariot: () => t('mounts.note.chariot'), automobile: () => t('mounts.note.automobile') };

function owned(g: Game, id: MountId): boolean {
  if (!MOUNTS[id].dlc) return true;
  return id === 'automobile' ? g.player.mount.automobileOwned : g.player.mount.chariotOwned;
}

const WHY: Record<string, () => string> = { none: () => t('mounts.unlockNone'), invalid: () => t('mounts.unlockBad'), keep: () => t('mounts.unlockKeep'), store: () => t('mounts.unlockStore') };
const NOTE = 'font-size:12px;opacity:.5;line-height:1.5;padding:12px 14px 0';

/** Says `text` in the page's foot, where an option says why it cannot be taken. */
const sayInFoot = (from: HTMLElement, text: string): void => void (from.closest('[data-menu]')?.querySelector('.hint') as HTMLElement | null)?.replaceChildren(text);

/** An itch.io pack (round 84): the buyer copies the code from the Mounts pack's unlock file and the shell reads, checks and keeps it (desktop/mountUnlock.js). */
function unlockSection(panel: HTMLElement, g: Game, redraw: () => void): void {
  if (owned(g, 'chariot') && owned(g, 'automobile')) {
    el(panel, 'div', t('mounts.unlocked'), NOTE);
    return;
  }
  el(panel, 'div', t('mounts.itchHow'), NOTE);
  const paste = button(panel, t('mounts.unlock'), () => {
    paste.disabled = true;
    void (desktop?.unlockMounts?.() ?? Promise.resolve({ ok: false, reason: 'store' as const })).then((got) => {
      if (got.ok) {
        if (got.mounts?.includes('chariot')) setChariotEntitlement(g, true); // (what the shell has just kept: the next check reads the same file)
        if (got.mounts?.includes('automobile')) setAutomobileEntitlement(g, true);
        g.events.emit('Notice', { text: t('n.mountsUnlocked') });
        saveNow();
        redraw();
      } else {
        paste.disabled = false;
        sayInFoot(paste, (WHY[got.reason ?? 'invalid'] ?? WHY.invalid)());
      }
    }, () => { paste.disabled = false; sayInFoot(paste, t('mounts.unlockKeep')); });
  }, true, t('mounts.unlockHint'));
}

export function mountsTab(panel: HTMLElement, g: Game, redraw: () => void): void {
  const unlocked = mountUnlocked(g);
  const demo = EDITION === 'demo'; // the demo has the plain chariot only: no optional row, no way to buy one
  heading(panel, t('mounts.title')).style.marginTop = '0';
  el(panel, 'div', unlocked ? fill(t('mounts.intro')) : t('mounts.locked'), 'opacity:.6;font-size:12px;line-height:1.5;padding:0 14px 8px');
  for (const id of MOUNT_IDS) {
    if (demo && MOUNTS[id].dlc) continue;
    const selected = g.player.mount.selected === id;
    const has = owned(g, id);
    const why = !unlocked ? t('mounts.whyQuest') : t('mounts.whyDlc');
    const b = option(panel, MOUNTS[id].name, () => {
      if (selectMount(g, id)) { saveNow(); redraw(); }
    }, mountAvailable(g, id), why, NOTES[id]());
    if (id === FREE_MOUNT || has) chips(b, [{ text: id === FREE_MOUNT ? t('mounts.included') : t('mounts.optional'), tone: 'dim' }]); // (a mount not owned says it is optional at the right, once)
    price(b, !has ? t('mounts.dlc') : !unlocked ? t('mounts.needQuest') : selected ? t('mounts.selected') : t('mounts.available'), selected ? 'ok' : 'max'); // the one chosen is boxed and lit; the rest are a quiet word
  }
  if (demo) return;
  if (desktop?.channel === 'itch' && desktop.unlockMounts) unlockSection(panel, g, redraw);
  else if (desktop?.ownsAutomobileDlc || desktop?.ownsChariotDlc) {
    const refresh = button(panel, t('mounts.refresh'), () => {
      refresh.disabled = true;
      refresh.textContent = t('mounts.checking');
      refresh.setAttribute('aria-live', 'polite');
      void refreshMountEntitlement(g).then(() => { if (refresh.isConnected) redraw(); });
    }, true, t('mounts.refreshHint'));
  }
  else el(panel, 'div', t('mounts.steamOnly'), NOTE);
}
