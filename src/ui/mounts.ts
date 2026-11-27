/** Mount selection and store ownership. A save remembers a preference, never an entitlement. */
import { FREE_MOUNT, MOUNTS, OFFERED_MOUNT_IDS, type MountId } from '../data/mounts';
import type { Game } from '../systems/components';
import { mountAvailable, mountUnlocked, selectMount, setAutomobileEntitlement, setChariotEntitlement } from '../systems/mounts';
import { desktop } from './desktop';
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
      const car = await Promise.resolve(desktop?.ownsAutomobileDlc?.() ?? false);
      setAutomobileEntitlement(g, car === true);
      setChariotEntitlement(g, false);
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

export function mountsTab(panel: HTMLElement, g: Game, redraw: () => void): void {
  const unlocked = mountUnlocked(g);
  const importDlc = desktop?.importAutomobileDlc;
  const offersDlc = !desktop || !!(desktop.ownsAutomobileDlc || importDlc);
  const intro = unlocked ? fill(t('mounts.intro')) : t(offersDlc ? 'mounts.locked' : 'n.mountQuest');
  heading(panel, t('mounts.title')).style.marginTop = '0';
  el(panel, 'div', intro, 'opacity:.6;font-size:12px;line-height:1.5;padding:0 14px 8px');
  for (const id of offersDlc ? OFFERED_MOUNT_IDS : [FREE_MOUNT]) {
    const selected = g.player.mount.selected === id;
    const has = owned(g, id);
    const why = !unlocked ? t('mounts.whyQuest') : t(importDlc ? 'mounts.whyItchDlc' : 'mounts.whyDlc');
    const b = option(panel, MOUNTS[id].name, () => {
      if (selectMount(g, id)) { saveNow(); redraw(); }
    }, mountAvailable(g, id), why, NOTES[id]());
    if (id === FREE_MOUNT || has) chips(b, [{ text: id === FREE_MOUNT ? t('mounts.included') : t('mounts.optional'), tone: 'dim' }]);
    price(b, !has ? t('mounts.dlc') : !unlocked ? t('mounts.needQuest') : selected ? t('mounts.selected') : t('mounts.available'), selected ? 'ok' : 'max');
  }
  if (!offersDlc) return;
  if (importDlc) {
    const importButton = button(panel, t('mounts.importDlc'), async () => {
      importButton.disabled = true;
      status.textContent = '';
      const result = await importDlc().catch(() => 'error' as const);
      if (result === 'imported') {
        await pending.get(g);
        await refreshMountEntitlement(g);
        importButton.disabled = false;
        redraw();
        return;
      } else if (result !== 'canceled') {
        status.textContent = t(result === 'invalid' ? 'mounts.invalidDlc' : 'mounts.importDlcError');
      } else if (g.player.mount.automobileOwned) {
        status.textContent = t('mounts.dlcInstalled');
      }
      importButton.disabled = false;
    }, true, t('mounts.whyItchDlc'));
    const status = el(panel, 'div', g.player.mount.automobileOwned ? t('mounts.dlcInstalled') : '', 'font-size:12px;line-height:1.5;padding:0 14px');
    status.setAttribute('role', 'status');
  } else if (desktop?.ownsAutomobileDlc) {
    const refresh = button(panel, t('mounts.refresh'), () => {
      refresh.disabled = true;
      refresh.textContent = t('mounts.checking');
      refresh.setAttribute('aria-live', 'polite');
      void refreshMountEntitlement(g).then(() => { if (refresh.isConnected) redraw(); });
    }, true, t('mounts.refreshHint'));
  }
  else el(panel, 'div', t('mounts.steamOnly'), 'font-size:12px;opacity:.5;line-height:1.5;padding:12px 14px 0');
}
