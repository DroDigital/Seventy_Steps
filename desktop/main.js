/**
 * The desktop shell (playtest round 11; what ships on Steam): the built game in its own window. A
 * browser holds a page's sound until its first key press or click, so on the web the title waits
 * for one; the shell lets the game sound from the start, so the title's theme plays as the game
 * boots and it opens straight into the main menu (music.ts, main.ts). The game is served from
 * `dist/` on an `app://` scheme (serve.js), as from a web server. `npm run desktop` builds it and
 * opens the shell; `npm run desktop:dev` opens the running dev server (`npm run dev`) in it instead.
 * Round 12: the window keeps its size, place and fullscreen from one run to the next (window.json),
 * wears the Elder Sign drawn in code (icon.js), and the game's saves, settings and records are files
 * in the user's data folder (saves/, where Steam Cloud can find them), not the browser's storage.
 * Round 36: controllers are read natively too (padWorker.js, gamepad-node over SDL2), for Chromium on
 * macOS lists none to the page; the page reads them from the bridge when the browser's list is empty.
 * Round 50 (the release): one instance at a time, the Windows taskbar's own id, no menu bar with developer tools in
 * a release (macOS keeps its app menu, whose Quit and Hide it needs), and `--smoke-test`: the packed game starts,
 * reaches its title, reports what it found (the Steam binding, the controllers' worker) and quits (tools/smoke_packaged.mjs).
 */

import { app, BrowserWindow, dialog, ipcMain, Menu, nativeImage, protocol, screen, shell, utilityProcess } from 'electron';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { iconPng } from './icon.js';
import { rescanWait } from './padRescan.js';
import { serveFrom } from './serve.js';
import { channel, startSteam, steamAchieve, steamBinding, steamEarly, steamOwnsAutomobileDlc } from './steam.js';

const ORIGIN = 'app://seventy-steps';
const DEV = process.argv.includes('--dev');
const SMOKE = process.argv.includes('--smoke-test'); // starts, reaches the title, reports, quits: a packed build's own check
const URL_TO_OPEN = DEV ? 'http://localhost:5173/' : `${ORIGIN}/`;

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required'); // the theme sounds at once
if (SMOKE) {
  app.setPath('userData', mkdtempSync(join(tmpdir(), 'seventy-steps-smoke-'))); // a check never touches a player's saves, window or logs
  if (process.env.SMOKE_SOFTWARE_GL) for (const [k, v] of [['use-gl', 'angle'], ['use-angle', 'swiftshader'], ['enable-unsafe-swiftshader', ''], ['ignore-gpu-blocklist', '']]) app.commandLine.appendSwitch(k, v || undefined); // a machine with no GPU (CI on Linux)
}
if (steamEarly(app.isPackaged)) app.exit(0); // a release build started outside Steam is started again through it (round 47: steam.js)
if (process.platform === 'win32') app.setAppUserModelId('com.digitaldro.seventysteps'); // the taskbar groups and names the window as the game's own
if (!SMOKE && !DEV && !app.requestSingleInstanceLock()) app.exit(0); // a second start (Steam launching again) only brings the first forward
app.on('second-instance', () => {
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
});
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);

/** Writes `text` to `file` whole or not at all (a crash mid-write leaves the old one). */
function writeWhole(file, text) {
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(`${file}.tmp`, text);
  renameSync(`${file}.tmp`, file);
}

/** Round 46: a crash is kept as a file in the logs folder (the last ten), for the player to send; the shell's own faults too. */
const logsDir = () => join(app.getPath('userData'), 'logs');
function keepLog(text) {
  try {
    const dir = logsDir();
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `crash-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`);
    writeFileSync(file, text);
    for (const old of readdirSync(dir).filter((f) => f.startsWith('crash-')).sort().slice(0, -10)) rmSync(join(dir, old), { force: true });
    return file;
  } catch {
    return null;
  }
}
process.on('uncaughtException', (e) => {
  keepLog(`Seventy Steps shell fault (uncaught): ${e?.stack ?? e}\nelectron ${process.versions.electron} · ${process.platform} ${process.arch}`);
  if (SMOKE) { // a check has no one to click the box away: it says what broke, and ends
    console.error(`SMOKE FAIL: uncaught in the shell: ${e?.stack ?? e}`);
    app.exit(1);
    return;
  }
  if (!quitting) dialog.showErrorBox('The dream broke', `The game's window stopped.\n\n${e?.message ?? e}\n\nA report was kept in:\n${logsDir()}`);
});
ipcMain.handle('desktop:write-log', (_e, report) => keepLog(String(report).slice(0, 60_000)));
ipcMain.handle('desktop:open-logs', async () => {
  mkdirSync(logsDir(), { recursive: true });
  await shell.openPath(logsDir());
});

const windowFile = () => join(app.getPath('userData'), 'window.json');

/** The window as it was left: its bounds (if they still fall on a screen) and whether it filled it. */
function lastWindow() {
  try {
    const w = JSON.parse(readFileSync(windowFile(), 'utf8'));
    const ok = [w.x, w.y, w.width, w.height].every(Number.isFinite) && screen.getAllDisplays().some(({ workArea: a }) => w.x < a.x + a.width && w.x + w.width > a.x && w.y < a.y + a.height && w.y + w.height > a.y);
    return { bounds: ok ? { x: w.x, y: w.y, width: w.width, height: w.height } : null, fullscreen: !!w.fullscreen, maximized: !!w.maximized };
  } catch {
    return { bounds: null, fullscreen: true, maximized: true }; // the first run fills the screen (round 13)
  }
}

function open() {
  const last = lastWindow();
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    ...last.bounds,
    icon: nativeImage.createFromBuffer(iconPng(256)),
    minWidth: 640,
    minHeight: 360,
    title: 'Seventy Steps',
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      autoplayPolicy: 'no-user-gesture-required',
      backgroundThrottling: false, // round 31: a window tabbed away from kept loading and running (frames and timers are not slowed or stopped behind another window)
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      devTools: DEV || process.argv.includes('--devtools'), // a release has none to open (Ctrl+Shift+I, the View menu); `--devtools` is for a tester who is asked for one
      preload: fileURLToPath(new URL('./preload.cjs', import.meta.url)), // window.desktop: quit, fullscreen
      additionalArguments: process.env.SteamDeck === '1' ? ['--steam-deck'] : [], // Steam sets SteamDeck=1 on a Deck (round 47): its first launch takes larger text
    },
  });
  win.once('ready-to-show', () => {
    if (last.maximized) win.maximize();
    win.setFullScreen(last.fullscreen);
    win.show();
    win.focus();
    win.webContents.focus(); // the page must have the focus for Chromium to report a pad at all (round 31)
  });
  win.on('focus', () => win.webContents.focus()); // and again on returning to the window
  win.on('close', () => {
    try {
      writeWhole(windowFile(), JSON.stringify({ ...win.getNormalBounds(), fullscreen: win.isFullScreen(), maximized: win.isMaximized() }));
    } catch {
      // The next run opens at the default size.
    }
  });
  win.webContents.on('before-input-event', (event, input) => {
    const toggle = input.type === 'keyDown' && (input.key === 'F11' || (input.key === 'Enter' && input.alt));
    if (!toggle) return;
    event.preventDefault();
    win.setFullScreen(!win.isFullScreen());
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(DEV ? 'http://localhost:5173/' : ORIGIN)) event.preventDefault(); // it only ever reloads itself
  });
  win.webContents.on('render-process-gone', (_e, d) => { // the page's process died (out of memory, a driver crash): kept, and the window wakes again once
    keepLog(`Seventy Steps: the page's process went (${d.reason}, exit ${d.exitCode})\nelectron ${process.versions.electron} · ${process.platform} ${process.arch}`);
    if (!quitting && d.reason !== 'clean-exit' && reloads++ < 1) win.reload();
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  void win.loadURL(URL_TO_OPEN);
  return win;
}

ipcMain.handle('desktop:quit', () => app.quit());
// An achievement earned: the game keeps it itself, and Steam is told when it is there (round 47: steam.js).
ipcMain.handle('desktop:achieve', (_e, id) => steamAchieve(String(id)));
// The automobile is cosmetic DLC; only Steam ownership and installation can unlock it.
ipcMain.handle('desktop:automobile-dlc', () => steamOwnsAutomobileDlc());

// The game's storage as files, one a key (sync, as the Web Storage API it stands in for is).
const keyFile = (key) => join(app.getPath('userData'), 'saves', `${String(key).replace(/[^A-Za-z0-9_-]+/g, '_')}.json`);
ipcMain.on('desktop:store-get', (e, key) => {
  try {
    e.returnValue = readFileSync(keyFile(key), 'utf8');
  } catch {
    e.returnValue = null;
  }
});
ipcMain.on('desktop:store-set', (e, key, value) => {
  try {
    writeWhole(keyFile(key), String(value));
    e.returnValue = true;
  } catch {
    e.returnValue = false;
  }
});
ipcMain.on('desktop:store-remove', (e, key) => {
  rmSync(keyFile(key), { force: true });
  e.returnValue = true;
});
ipcMain.handle('desktop:fullscreen', (e, on) => BrowserWindow.fromWebContents(e.sender)?.setFullScreen(!!on));
ipcMain.handle('desktop:is-fullscreen', (e) => !!BrowserWindow.fromWebContents(e.sender)?.isFullScreen());

// The controllers, as the SDL worker reports them: kept here, and sent to every window as they change.
let pads = [];
let padState = 'starting'; // the SDL worker: 'ready', or why it is not
let padStarts = 0;
let quitting = false;
let reloads = 0;
let worker = null; // the SDL worker's utility process, now
let restarting = false; // a start over is in hand: its exit starts the worker again at once
let rescanTimer = null;
let rescanMs; // the last wait before a look (padRescan.js)
app.on('before-quit', () => void (quitting = true));
/** No controller heard: start the worker over after a wait, so SDL lists the ones connected now (round 54, padRescan.js). */
function scheduleRescan() {
  clearTimeout(rescanTimer);
  if (quitting || padState.startsWith('unavailable')) return; // (without SDL a start over finds nothing)
  rescanMs = rescanWait(rescanMs);
  rescanTimer = setTimeout(restartPads, rescanMs);
}
function restartPads() {
  rescanTimer = null;
  if (quitting || !worker) return;
  if (pads.length) return void (rescanMs = undefined); // one is heard now: no start over, and the next look starts from the first wait
  restarting = true;
  worker.kill();
}
function startPads() {
  const w = utilityProcess.fork(fileURLToPath(new URL('./padWorker.js', import.meta.url)), [], { serviceName: 'Seventy Steps controllers', stdio: 'inherit' });
  worker = w;
  scheduleRescan();
  w.on('message', (m) => {
    if (m?.type === 'ready') padState = 'ready';
    if (m?.type === 'unavailable') {
      padState = `unavailable: ${m.reason}`;
      console.warn(`controllers: SDL is not available (${m.reason}); the browser's own list is used`);
    }
    if (m?.type !== 'pads') return;
    pads = m.pads;
    if (pads.length) {
      clearTimeout(rescanTimer); // a pad heard: no look is needed, and the next one starts from the first wait
      rescanMs = undefined;
    } else scheduleRescan(); // none now (one let go): look again after a wait
    for (const win of BrowserWindow.getAllWindows()) win.webContents.send('desktop:pads', pads);
  });
  w.on('exit', (code) => {
    const again = restarting;
    restarting = false;
    clearTimeout(rescanTimer);
    pads = [];
    for (const win of BrowserWindow.getAllWindows()) win.webContents.send('desktop:pads', pads);
    if (quitting) return;
    if (again) return void startPads(); // a start over is the look for controllers, not a fault
    if (code !== 0 && padStarts++ < 3) setTimeout(startPads, 1000); // a fault in the native module stops the pads for a moment, not the game
  });
}
ipcMain.handle('desktop:pads-get', () => pads); // a page loaded (or reloaded) after the pads were found asks for them once

/** What `--smoke-test` checks: the page reached its title and found the shell's bridge, and (as SMOKE_REQUIRE names them) the Steam binding loaded and the controllers' worker started. Prints one line and quits with 0 or 1. */
function smoke(win) {
  const needs = (process.env.SMOKE_REQUIRE ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const began = Date.now();
  const timer = setInterval(async () => {
    let page = null;
    try {
      page = await win.webContents.executeJavaScript("({ title: /new game/i.test(document.body.innerText), bridge: typeof window.desktop?.quit === 'function' })");
    } catch {
      // the page is still loading
    }
    const report = { platform: process.platform, arch: process.arch, electron: process.versions.electron, packaged: app.isPackaged, channel: channel(), seconds: Math.round((Date.now() - began) / 1000), title: !!page?.title, bridge: !!page?.bridge, steamBinding: steamBinding(), controllers: padState };
    const settled = report.title && report.bridge && (padState === 'ready' || padState.startsWith('unavailable') || report.seconds > 45);
    const late = report.seconds > 150;
    if (!settled && !late) return;
    clearInterval(timer);
    const missing = [!report.title && 'the title never appeared', !report.bridge && "the shell's bridge is missing", needs.includes('steam') && !report.steamBinding && 'the Steam binding did not load', needs.includes('pads') && padState !== 'ready' && `the controllers' worker is ${padState}`].filter(Boolean);
    console.log(`${missing.length ? 'SMOKE FAIL' : 'SMOKE OK'} ${JSON.stringify(report)}${missing.length ? ` :: ${missing.join('; ')}` : ''}`);
    app.exit(missing.length ? 1 : 0);
  }, 1000);
}

/** The menu bar: none in a release on Windows and Linux (it held developer tools); on macOS the app menu a Mac needs (About, Hide, Quit) and full screen. */
function setMenu() {
  if (DEV) return;
  Menu.setApplicationMenu(process.platform === 'darwin' ? Menu.buildFromTemplate([{ role: 'appMenu' }, { label: 'View', submenu: [{ role: 'togglefullscreen' }] }, { role: 'windowMenu' }]) : null);
}

void app.whenReady().then(() => {
  setMenu();
  startSteam();
  startPads();
  protocol.handle('app', serveFrom(fileURLToPath(new URL('../dist/', import.meta.url))));
  const win = open();
  if (SMOKE) smoke(win);
});
app.on('window-all-closed', () => app.quit());
