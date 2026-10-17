/** Mount selection and store ownership. A save remembers a preference, never an entitlement. */
import { MOUNTS, MOUNT_TRAVERSAL, type MountId } from '../data/mounts';
import type { Game } from '../systems/components';
import { mountAvailable, mountUnlocked, selectMount, setAutomobileEntitlement } from '../systems/mounts';
import { desktop } from './desktop';
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
      setAutomobileEntitlement(g, (await desktop?.ownsAutomobileDlc?.()) === true);
    } catch {
      setAutomobileEntitlement(g, false);
    }
  })().finally(() => pending.delete(g));
  pending.set(g, request);
  return request;
}

const NOTES: Record<MountId, string> = {
  chariot: 'A black funeral carriage drawn by two skeletal horses. Violet fire clings to the harness; no breath leaves their jaws.',
  automobile: 'A black touring motorcar with brass lamps, spoked wheels and a weathered folding canopy. Its engine turns in the dark.',
};

export function mountsTab(panel: HTMLElement, g: Game, redraw: () => void): void {
  const unlocked = mountUnlocked(g);
  heading(panel, 'THE BORROWED REINS').style.marginTop = '0';
  el(panel, 'div', unlocked ? fill('Your carriage answers {mount}. Hold {dodge} while moving to gallop; release to cruise. Acting or taking a hit dismisses it.') : 'Speak with Peaslee on the university grounds, then visit the Sleeper’s Sign. His errand unlocks the included chariot and any automobile DLC you own.', 'opacity:.7;font-size:13px;line-height:1.5;padding:0 14px 10px');
  el(panel, 'div', 'Both mounts share exactly the same speed, acceleration, handling and collision footprint. The optional appearance grants no gameplay advantage.', `font-size:12px;line-height:1.5;padding:0 14px 12px;color:${ACCENT}`);
  for (const id of ['chariot', 'automobile'] as const) {
    const selected = g.player.mount.selected === id;
    const owned = id === 'chariot' || g.player.mount.automobileOwned;
    const status = !owned ? 'Optional DLC · $0.99' : !unlocked ? 'Quest required' : selected ? 'Selected' : 'Available';
    const why = !unlocked ? 'Finish The Borrowed Reins to summon either mount.' : 'Requires ownership and installation of the optional automobile DLC through Steam.';
    option(panel, `${MOUNTS[id].name}  ·  ${status}`, () => {
      if (selectMount(g, id)) { saveNow(); redraw(); }
    }, mountAvailable(g, id), why, NOTES[id], `${id === 'chariot' ? 'Included in the base game' : 'Optional $0.99 appearance'}  ·  ${MOUNT_TRAVERSAL.cruise} m/s cruise  ·  ${MOUNT_TRAVERSAL.gallop} m/s gallop`);
  }
  if (desktop?.ownsAutomobileDlc) {
    const refresh = button(panel, 'Refresh DLC ownership', () => {
      refresh.disabled = true;
      refresh.textContent = 'Checking Steam…';
      refresh.setAttribute('aria-live', 'polite');
      void refreshMountEntitlement(g).then(() => { if (refresh.isConnected) redraw(); });
    }, true, 'Checks Steam again after installing or removing the automobile DLC.');
  }
  else el(panel, 'div', 'The automobile is available through the Steam edition. The spectral chariot is included here.', 'font-size:12px;opacity:.5;line-height:1.5;padding:12px 14px 0');
}
