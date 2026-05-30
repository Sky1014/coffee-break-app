const { app, BrowserWindow, Menu, Tray, ipcMain, powerMonitor, nativeImage, screen } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

const WORK_INTERVAL_MS = 30 * 60 * 1000;
const BREAK_DURATION_SECONDS = 60;
const SNOOZE_MS = 5 * 60 * 1000;
const TEST_SNOOZE_MS = 10 * 1000;
const MENU_REFRESH_MS = 15 * 1000;

const rendererUrl = 'http://127.0.0.1:5173';

let tray = null;
let breakWindow = null;
let state = 'starting';
let timer = null;
let nextBreakAt = null;
let menuRefreshTimer = null;
let isQuitting = false;
let activeBreakId = 0;
let breakStartedAt = 0;

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  try {
    fs.appendFileSync(path.join(__dirname, '..', 'coffee-break.log'), `${line}\n`, 'utf8');
  } catch {
    // Logging should never block the reminder.
  }
}

function getAssetPath(name) {
  return path.join(__dirname, '..', 'assets', name);
}

function getAssetUrl(name) {
  return pathToFileURL(getAssetPath(name)).toString();
}

function getBreakPayload() {
  return {
    durationSeconds: BREAK_DURATION_SECONDS,
    startedAt: breakStartedAt,
    assets: {
      coffeePourUrl: getAssetUrl('coffee-pour-60s.wav')
    }
  };
}

function createTrayIcon() {
  const icon = nativeImage.createFromPath(getAssetPath('tray.png'));
  if (!icon.isEmpty()) return icon.resize({ width: 16, height: 16 });
  log('tray icon failed to load; falling back to empty native image');
  return nativeImage.createEmpty();
}

function getRendererTarget() {
  if (process.argv.includes('--dev')) {
    return { type: 'url', value: rendererUrl };
  }
  return { type: 'file', value: path.join(__dirname, '..', 'dist', 'index.html') };
}

function formatRemaining() {
  if (!nextBreakAt || state !== 'brewing') return '';
  const remainingMs = Math.max(0, nextBreakAt - Date.now());
  const minutes = Math.ceil(remainingMs / 60000);
  if (minutes <= 1) return 'Next break in less than 1 min';
  return `Next break in ${minutes} min`;
}

function getLoginItemOptions(openAtLogin = false) {
  if (app.isPackaged) {
    return {
      name: 'Coffee Break',
      path: process.execPath,
      openAtLogin
    };
  }

  return {
    name: 'Coffee Break',
    path: process.execPath,
    args: [app.getAppPath()],
    openAtLogin
  };
}

function isLaunchAtStartupEnabled() {
  return app.getLoginItemSettings(getLoginItemOptions()).openAtLogin;
}

function setLaunchAtStartup(enabled) {
  app.setLoginItemSettings(getLoginItemOptions(enabled));
  log(`launch at startup ${enabled ? 'enabled' : 'disabled'}`);
  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) return;
  const remainingLabel = formatRemaining() || 'No active brewing cycle';
  const menu = Menu.buildFromTemplate([
    { label: `Status: ${state}`, enabled: false },
    { label: remainingLabel, enabled: false },
    { type: 'separator' },
    { label: 'Start Break Now', click: () => showBreakWindow() },
    {
      label: 'Pause 1 Hour',
      click: () => pauseFor(60 * 60 * 1000)
    },
    {
      label: 'Resume',
      enabled: state === 'paused',
      click: () => startBrewing('manual-resume')
    },
    {
      label: 'Launch at Startup',
      type: 'checkbox',
      checked: isLaunchAtStartupEnabled(),
      click: (menuItem) => setLaunchAtStartup(menuItem.checked)
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.setContextMenu(menu);
  tray.setToolTip(`Coffee Break - ${state}`);
}

function clearTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  nextBreakAt = null;
}

function closeBreakWindow() {
  const windowToClose = breakWindow;
  breakWindow = null;
  if (windowToClose && !windowToClose.isDestroyed()) {
    windowToClose.close();
  }
}

function startBrewing(reason = 'cycle') {
  clearTimer();
  state = 'brewing';
  closeBreakWindow();
  nextBreakAt = Date.now() + WORK_INTERVAL_MS;
  timer = setTimeout(() => showBreakWindow(), WORK_INTERVAL_MS);
  updateTrayMenu();
  log(`brewing started: ${reason}; nextBreakAt=${new Date(nextBreakAt).toISOString()}`);
}

function pause(reason = 'manual') {
  clearTimer();
  state = 'paused';
  closeBreakWindow();
  updateTrayMenu();
  log(`paused: ${reason}`);
}

function pauseFor(durationMs) {
  pause('pause-for-duration');
  timer = setTimeout(() => startBrewing('pause-ended'), durationMs);
  nextBreakAt = Date.now() + durationMs;
  updateTrayMenu();
}

function getSnoozeMs() {
  return process.argv.includes('--show-break') ? TEST_SNOOZE_MS : SNOOZE_MS;
}

function snooze() {
  clearTimer();
  state = 'snoozed';
  closeBreakWindow();
  const snoozeMs = getSnoozeMs();
  nextBreakAt = Date.now() + snoozeMs;
  timer = setTimeout(() => showBreakWindow(), snoozeMs);
  updateTrayMenu();
  log(`snoozed for ${Math.round(snoozeMs / 1000)} seconds`);
}

function skip() {
  log('skipped');
  startBrewing('skip');
}

function complete() {
  log('completed');
  startBrewing('completed');
}

function showBreakWindow() {
  clearTimer();
  state = 'break';
  activeBreakId += 1;
  breakStartedAt = Date.now();
  const breakId = activeBreakId;
  updateTrayMenu();
  log(`showBreakWindow requested; breakId=${breakId}; argv=${JSON.stringify(process.argv)}`);

  if (breakWindow && !breakWindow.isDestroyed()) {
    revealBreakWindow('existing-window', breakId);
    return;
  }

  const display = screen.getPrimaryDisplay();
  const { x, y, width, height } = display.workArea;
  const windowWidth = 430;
  const windowHeight = 520;

  breakWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: x + Math.round((width - windowWidth) / 2),
    y: y + Math.round((height - windowHeight) / 2),
    frame: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#00000000',
    transparent: true,
    icon: getAssetPath('coffee-break.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  breakWindow.setAlwaysOnTop(true, 'screen-saver');
  breakWindow.once('ready-to-show', () => revealBreakWindow('ready-to-show', breakId));
  breakWindow.webContents.once('did-finish-load', () => revealBreakWindow('did-finish-load', breakId));
  breakWindow.webContents.once('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    log(`renderer failed to load: ${errorCode} ${errorDescription}; url=${validatedURL}`);
    revealBreakWindow('did-fail-load-fallback', breakId);
  });
  setTimeout(() => revealBreakWindow('timeout-fallback', breakId), 1600);

  const owningWindow = breakWindow;

  owningWindow.on('closed', () => {
    if (breakWindow === owningWindow) {
      breakWindow = null;
    }
    if (!isQuitting && state === 'break' && activeBreakId === breakId) {
      startBrewing('window-closed');
    }
  });

  const target = getRendererTarget();
  if (target.type === 'url') {
    log(`loading renderer url: ${target.value}`);
    breakWindow.loadURL(target.value);
  } else {
    log(`loading renderer file: ${target.value}`);
    breakWindow.loadFile(target.value);
  }
}

function revealBreakWindow(source, breakId = activeBreakId) {
  if (breakId !== activeBreakId || state !== 'break') return;
  if (!breakWindow || breakWindow.isDestroyed()) return;
  if (!breakWindow.isVisible()) {
    breakWindow.show();
  }
  breakWindow.setAlwaysOnTop(true, 'screen-saver');
  breakWindow.moveTop();
  breakWindow.focus();
  breakWindow.webContents.send('break:started', getBreakPayload());
  log(`break window revealed: ${source}; breakId=${breakId}; visible=${breakWindow.isVisible()}`);
}

function createTray() {
  tray = new Tray(createTrayIcon());
  updateTrayMenu();
}

ipcMain.on('break:action', (_event, action) => {
  log(`break action received: ${action}; state=${state}; breakId=${activeBreakId}`);
  if (action === 'complete') complete();
  if (action === 'snooze') snooze();
  if (action === 'skip') skip();
});

ipcMain.on('preload:ready', () => {
  log('preload ready');
});

ipcMain.on('renderer:log', (_event, message) => {
  log(`renderer: ${message}`);
});

ipcMain.handle('break:get-state', () => ({
  active: state === 'break',
  ...getBreakPayload()
}));

ipcMain.handle('asset:url', (_event, name) => getAssetUrl(name));

app.whenReady().then(() => {
  log('app ready');
  createTray();
  startBrewing('app-ready');
  if (process.argv.includes('--show-break')) {
    setTimeout(() => showBreakWindow(), 800);
  }

  powerMonitor.on('lock-screen', () => pause('screen-locked'));
  powerMonitor.on('unlock-screen', () => startBrewing('screen-unlocked'));
  powerMonitor.on('suspend', () => pause('system-suspend'));
  powerMonitor.on('resume', () => startBrewing('system-resume'));

  menuRefreshTimer = setInterval(updateTrayMenu, MENU_REFRESH_MS);
});

app.on('window-all-closed', () => {});

app.on('before-quit', () => {
  isQuitting = true;
  clearTimer();
  if (menuRefreshTimer) clearInterval(menuRefreshTimer);
});
