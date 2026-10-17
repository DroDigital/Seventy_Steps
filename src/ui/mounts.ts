/** Mount selection and store ownership. A save remembers a preference, never an entitlement. */
import { FREE_MOUNT, MOUNT_IDS, MOUNTS, MOUNT_TRAVERSAL, type MountId } from '../data/mounts';
import type { Game } from '../systems/components';
import { mountAvailable, mountUnlocked, selectMount, setAutomobileEntitlement, setChariotEntitlement } from '../systems/mounts';
import { desktop } from './desktop';
import { t } from '../core/i18n';
import { fill } from './glyphs';
import { ACCENT, button, el, heading, option } from './menuKit';
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

export function mountsTab(panel: HTMLElement, g: Game, redraw: () => void): void {
  const unlocked = mountUnlocked(g);
  heading(panel, t('mounts.title')).style.marginTop = '0';
  el(panel, 'div', unlocked ? fill(t('mounts.intro')) : t('mounts.locked'), 'opacity:.7;font-size:13px;line-height:1.5;padding:0 14px 10px');
  el(panel, 'div', t('mounts.same'), `font-size:12px;line-height:1.5;padding:0 14px 12px;color:${ACCENT}`);
  for (const id of MOUNT_IDS) {
    const selected = g.player.mount.selected === id;
    const has = owned(g, id);
    const status = !has ? t('mounts.dlc') : !unlocked ? t('mounts.needQuest') : selected ? t('mounts.selected') : t('mounts.available');
    const why = !unlocked ? t('mounts.whyQuest') : t('mounts.whyDlc');
    option(panel, `${MOUNTS[id].name}  ·  ${status}`, () => {
      if (selectMount(g, id)) { saveNow(); redraw(); }
    }, mountAvailable(g, id), why, NOTES[id](), `${id === FREE_MOUNT ? t('mounts.included') : t('mounts.optional')}  ·  ${t('mounts.speeds', { cruise: MOUNT_TRAVERSAL.cruise, gallop: MOUNT_TRAVERSAL.gallop })}`);
  }
  if (desktop?.ownsAutomobileDlc || desktop?.ownsChariotDlc) {
    const refresh = button(panel, t('mounts.refresh'), () => {
      refresh.disabled = true;
      refresh.textContent = t('mounts.checking');
      refresh.setAttribute('aria-live', 'polite');
      void refreshMountEntitlement(g).then(() => { if (refresh.isConnected) redraw(); });
    }, true, t('mounts.refreshHint'));
  }
  else el(panel, 'div', t('mounts.steamOnly'), 'font-size:12px;opacity:.5;line-height:1.5;padding:12px 14px 0');
}
