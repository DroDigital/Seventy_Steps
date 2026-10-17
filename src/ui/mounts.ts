/** Mount selection and store ownership. A save remembers a preference, never an entitlement. */
import { FREE_MOUNT, MOUNT_IDS, MOUNTS, MOUNT_TRAVERSAL, type MountId } from '../data/mounts';
import type { Game } from '../systems/components';
import { mountAvailable, mountUnlocked, selectMount, setAutomobileEntitlement, setChariotEntitlement } from '../systems/mounts';
import { desktop, type MountDlcId, type MountDlcStore } from './desktop';
import { t } from '../core/i18n';
import { fill } from './glyphs';
import { ACCENT, button, el, heading, option } from './menuKit';
import { saveNow } from './autosave';

const pending = new WeakMap<Game, Promise<void>>();
interface PurchaseState {
  store?: MountDlcStore | null;
  loading?: Promise<void>;
  busy?: boolean;
  message: string;
}
const purchases = new WeakMap<Game, PurchaseState>();
const ownershipErrors = new WeakSet<Game>();
function purchaseState(g: Game): PurchaseState {
  let state = purchases.get(g);
  if (!state) { state = { message: '' }; purchases.set(g, state); }
  return state;
}

/** Resolve only configured store capabilities; the page never receives a purchase URL or grants access. */
function readStore(g: Game): Promise<void> {
  const state = purchaseState(g);
  if (state.loading) return state.loading;
  if (!desktop?.mountDlcStore) { state.store = null; return Promise.resolve(); }
  state.loading = Promise.resolve().then(() => desktop!.mountDlcStore!()).then((store) => { state.store = store; }).catch(() => {
    state.store = null;
    state.message = t('mounts.optionsError');
  }).finally(() => { state.loading = undefined; });
  return state.loading;
}

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
      ownershipErrors.delete(g);
    } catch {
      setAutomobileEntitlement(g, false);
      setChariotEntitlement(g, false);
      ownershipErrors.add(g);
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
  const state = purchaseState(g);
  if (state.store === undefined && !state.loading) void readStore(g).then(() => { if (panel.isConnected) redraw(); });
  const store = state.store;
  const statusLine = el(panel, 'div', state.message, 'font-size:12px;line-height:1.5;padding:0 14px 10px');
  statusLine.setAttribute('role', 'status');
  statusLine.setAttribute('aria-live', 'polite');
  const say = (text: string): void => { state.message = text; statusLine.textContent = text; };
  const controls: HTMLButtonElement[] = [];
  const begin = (): boolean => {
    if (state.busy) return false;
    state.busy = true;
    for (const control of controls) control.disabled = true;
    return true;
  };
  const finish = (): void => { state.busy = false; if (panel.isConnected) redraw(); };
  const unlocked = mountUnlocked(g);
  heading(panel, t('mounts.title')).style.marginTop = '0';
  el(panel, 'div', unlocked ? fill(t('mounts.intro')) : t('mounts.locked'), 'opacity:.7;font-size:13px;line-height:1.5;padding:0 14px 10px');
  el(panel, 'div', t('mounts.same'), `font-size:12px;line-height:1.5;padding:0 14px 12px;color:${ACCENT}`);
  for (const id of MOUNT_IDS) {
    const selected = g.player.mount.selected === id;
    const has = owned(g, id);
    const status = !has ? t('mounts.dlc') : !unlocked ? t('mounts.needQuest') : selected ? t('mounts.selected') : t('mounts.available');
    const purchaseHelp = store?.channel === 'steam'
      ? t('mounts.whyDlc')
      : store?.channel === 'itch'
        ? t('mounts.whyItch')
        : desktop ? t('mounts.pendingHint') : t('mounts.desktopHint');
    const why = !unlocked ? t('mounts.whyQuest') : purchaseHelp;
    option(panel, `${MOUNTS[id].name}  ·  ${status}`, () => {
      if (selectMount(g, id)) { saveNow(); redraw(); }
    }, mountAvailable(g, id), why, NOTES[id](), `${id === FREE_MOUNT ? t('mounts.included') : t('mounts.optional')}  ·  ${t('mounts.speeds', { cruise: MOUNT_TRAVERSAL.cruise, gallop: MOUNT_TRAVERSAL.gallop })}`);
    if (MOUNTS[id].dlc && !has && store?.channel !== 'steam') {
      const dlc = id as MountDlcId;
      const configured = store?.channel === 'itch' && store[dlc] && !!desktop?.buyMountDlc;
      const label = configured ? t('mounts.buy') : state.loading ? t('mounts.optionsChecking') : desktop ? t('mounts.pending') : t('mounts.desktopRequired');
      controls.push(button(panel, label, () => {
        if (!configured || !begin()) return;
        say(t('mounts.opening'));
        void Promise.resolve().then(() => desktop!.buyMountDlc!(dlc)).then((opened) => {
          say(opened ? t('mounts.buyNext') : t('mounts.openError'));
        }).catch(() => say(t('mounts.openError'))).finally(finish);
      }, configured && !state.busy, `${MOUNTS[id].name}: ${configured ? t('mounts.buyHint') : t('mounts.unconfiguredHint')}`));
    }
  }
  if (store?.channel === 'itch' || (store?.channel !== 'steam' && desktop?.importMountDlc)) {
    el(panel, 'div', t('mounts.importInfo'), 'font-size:12px;opacity:.7;line-height:1.5;padding:12px 14px 0');
    controls.push(button(panel, t('mounts.import'), () => {
      if (!desktop?.importMountDlc || !begin()) return;
      say(t('mounts.chooseFile'));
      void Promise.resolve().then(() => desktop!.importMountDlc!()).then(async (result) => {
        if (result.status === 'cancelled') { say(t('mounts.importCancelled')); return; }
        if (result.status === 'invalid') { say(t('mounts.importInvalid')); return; }
        if (result.status === 'unavailable') { say(t('mounts.importUnavailable')); return; }
        // A menu/focus check already in flight may have started before the import; finish it before reading the new entitlement.
        await pending.get(g);
        await refreshMountEntitlement(g);
        if (ownershipErrors.has(g) || (result.mount && !owned(g, result.mount))) say(t('mounts.importUnverified'));
        else say(t(mountUnlocked(g) ? 'mounts.unlockedSelect' : 'mounts.unlockedQuest', { mount: result.mount ? MOUNTS[result.mount].name : t('mounts.appearance') }));
      }).catch(() => say(t('mounts.importError'))).finally(finish);
    }, !!desktop?.importMountDlc && !state.busy, t('mounts.importHint')));
  }
  if (desktop?.ownsAutomobileDlc || desktop?.ownsChariotDlc) {
    controls.push(button(panel, t('mounts.refresh'), () => {
      if (!begin()) return;
      say(store?.channel === 'steam' ? t('mounts.checking') : t('mounts.checkingOwnership'));
      state.message = '';
      void Promise.all([refreshMountEntitlement(g), readStore(g)]).then(() => {
        if (ownershipErrors.has(g)) say(t('mounts.ownershipError'));
        else if (!state.message) say(t('mounts.ownershipRefreshed'));
      }).finally(finish);
    }, !state.busy, store?.channel === 'steam' ? t('mounts.refreshHint') : t('mounts.refreshItchHint')));
  }
  if (store?.channel === 'steam') el(panel, 'div', t('mounts.steamInfo'), 'font-size:12px;opacity:.5;line-height:1.5;padding:12px 14px 0');
  else if (!desktop) el(panel, 'div', t('mounts.desktopInfo'), 'font-size:12px;opacity:.5;line-height:1.5;padding:12px 14px 0');
}
