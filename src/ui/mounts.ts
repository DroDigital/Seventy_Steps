/** Mount selection and store ownership. A save remembers a preference, never an entitlement. */
import { FREE_MOUNT, MOUNT_IDS, MOUNTS, MOUNT_TRAVERSAL, type MountId } from '../data/mounts';
import type { Game } from '../systems/components';
import { mountAvailable, mountUnlocked, selectMount, setAutomobileEntitlement, setChariotEntitlement } from '../systems/mounts';
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

const NOTES: Record<MountId, string> = {
  grey: 'A plain grey mare from the university stables. Saddle, bridle, and a cool breath in the night. Nothing spectral about her.',
  chariot: 'A black funeral carriage drawn by two skeletal horses. Violet fire clings to each horse; no breath leaves their jaws.',
  automobile: 'A black touring motorcar with brass lamps, spoked wheels and a weathered folding canopy. Its engine turns in the dark.',
};

function owned(g: Game, id: MountId): boolean {
  if (!MOUNTS[id].dlc) return true;
  return id === 'automobile' ? g.player.mount.automobileOwned : g.player.mount.chariotOwned;
}

export function mountsTab(panel: HTMLElement, g: Game, redraw: () => void): void {
  const unlocked = mountUnlocked(g);
  heading(panel, 'THE BORROWED REINS').style.marginTop = '0';
  el(panel, 'div', unlocked ? fill('The grey answers {mount}. Hold {dodge} while moving to gallop; release to cruise. Acting or taking a hit dismisses it.') : 'Speak with Peaslee on the university grounds, then visit the Sleeper’s Sign. His errand unlocks the borrowed grey. The chariot and the motor car are optional.', 'opacity:.7;font-size:13px;line-height:1.5;padding:0 14px 10px');
  el(panel, 'div', 'All three share exactly the same speed, acceleration, handling and collision footprint. Optional appearances grant no gameplay advantage.', `font-size:12px;line-height:1.5;padding:0 14px 12px;color:${ACCENT}`);
  for (const id of MOUNT_IDS) {
    const selected = g.player.mount.selected === id;
    const has = owned(g, id);
    const status = !has ? 'Optional DLC · $0.99' : !unlocked ? 'Quest required' : selected ? 'Selected' : 'Available';
    const why = !unlocked ? 'Finish The Borrowed Reins to summon a mount.' : 'Requires ownership and installation of this optional DLC through Steam.';
    option(panel, `${MOUNTS[id].name}  ·  ${status}`, () => {
      if (selectMount(g, id)) { saveNow(); redraw(); }
    }, mountAvailable(g, id), why, NOTES[id], `${id === FREE_MOUNT ? 'Included in the base game' : 'Optional $0.99 appearance'}  ·  ${MOUNT_TRAVERSAL.cruise} m/s cruise  ·  ${MOUNT_TRAVERSAL.gallop} m/s gallop`);
  }
  if (desktop?.ownsAutomobileDlc || desktop?.ownsChariotDlc) {
    const refresh = button(panel, 'Refresh DLC ownership', () => {
      refresh.disabled = true;
      refresh.textContent = 'Checking Steam…';
      refresh.setAttribute('aria-live', 'polite');
      void refreshMountEntitlement(g).then(() => { if (refresh.isConnected) redraw(); });
    }, true, 'Checks Steam again after installing or removing an optional mount.');
  }
  else el(panel, 'div', 'The chariot and the motor car are available through the Steam edition. The borrowed grey is included here.', 'font-size:12px;opacity:.5;line-height:1.5;padding:12px 14px 0');
}
