const { app, BrowserWindow, Menu, Tray, ipcMain, powerMonitor, nativeImage, screen, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

// ── Default settings ──────────────────────────────────────────
const DEFAULT_SETTINGS = {
  workMinutes: 30,
  breakSeconds: 60,
  launchAtStartup: false,
  locale: 'en'
};

const SNOOZE_MS = 5 * 60 * 1000;
const TEST_SNOOZE_MS = 10 * 1000;
const MENU_REFRESH_MS = 15 * 1000;

const rendererUrl = 'http://127.0.0.1:5173';

let tray = null;
let breakWindow = null;
let settingsWindow = null;
let state = 'starting';
let timer = null;
let nextBreakAt = null;
let menuRefreshTimer = null;
let isQuitting = false;
let activeBreakId = 0;
let breakStartedAt = 0;

// ── Settings persistence ─────────────────────────────────────
let currentSettings = { ...DEFAULT_SETTINGS };

function getSettingsPath() {
  const userData = app.getPath('userData');
  return path.join(userData, 'coffee-break-settings.json');
}

function loadSettings() {
  try {
    const raw = fs.readFileSync(getSettingsPath(), 'utf8');
    const loaded = JSON.parse(raw);
    currentSettings = { ...DEFAULT_SETTINGS, ...loaded };
    log(`settings loaded: ${JSON.stringify(currentSettings)}`);
  } catch {
    log('no settings file found; using defaults');
    currentSettings = { ...DEFAULT_SETTINGS };
  }
}

function saveSettingsToDisk(settings) {
  try {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf8');
    log(`settings saved: ${JSON.stringify(settings)}`);
  } catch (err) {
    log(`failed to save settings: ${err.message}`);
  }
}

function getWorkIntervalMs() {
  return (currentSettings.workMinutes || DEFAULT_SETTINGS.workMinutes) * 60 * 1000;
}

function getBreakDurationSeconds() {
  return currentSettings.breakSeconds || DEFAULT_SETTINGS.breakSeconds;
}

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
    durationSeconds: getBreakDurationSeconds(),
    startedAt: breakStartedAt,
    assets: {
      coffeePourUrl: getAssetUrl('coffee-pour-60s.ogg')
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

function getSettingsRendererTarget() {
  if (process.argv.includes('--dev')) {
    return { type: 'url', value: rendererUrl + '#settings' };
  }
  return { type: 'file', value: path.join(__dirname, '..', 'dist', 'index.html'), hash: 'settings' };
}

function formatRemaining() {
  if (!nextBreakAt || state !== 'brewing') return '';
  const remainingMs = Math.max(0, nextBreakAt - Date.now());
  const minutes = Math.ceil(remainingMs / 60000);
  if (minutes <= 1) {
    return currentSettings.locale === 'zh' ? '下次休息不到 1 分钟' : 'Next break in less than 1 min';
  }
  if (currentSettings.locale === 'zh') {
    return `下次休息还有 ${minutes} 分钟`;
  }
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
  currentSettings.launchAtStartup = enabled;
  saveSettingsToDisk(currentSettings);
  log(`launch at startup ${enabled ? 'enabled' : 'disabled'}`);
  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) return;
  const loc = currentSettings.locale || 'en';
  const remainingLabel = formatRemaining() || (
    loc === 'zh' ? '暂无活跃的计时周期' : 'No active brewing cycle'
  );

  const menu = Menu.buildFromTemplate([
    { label: `${loc === 'zh' ? '状态' : 'Status'}: ${state}`, enabled: false },
    { label: remainingLabel, enabled: false },
    { type: 'separator' },
    { label: loc === 'zh' ? '立即开始休息' : 'Start Break Now', click: () => showBreakWindow() },
    {
      label: loc === 'zh' ? '暂停 1 小时' : 'Pause 1 Hour',
      click: () => pauseFor(60 * 60 * 1000)
    },
    {
      label: loc === 'zh' ? '恢复' : 'Resume',
      enabled: state === 'paused',
      click: () => startBrewing('manual-resume')
    },
    {
      label: loc === 'zh' ? '显示设置' : 'Show Settings',
      click: () => showSettingsWindow()
    },
    { type: 'separator' },
    { label: loc === 'zh' ? '退出' : 'Quit', click: () => app.quit() }
  ]);
  tray.setContextMenu(menu);
  tray.setToolTip('Coffee Break');
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
  const interval = getWorkIntervalMs();
  nextBreakAt = Date.now() + interval;
  timer = setTimeout(() => showBreakWindow(), interval);
  updateTrayMenu();
  log(`brewing started: ${reason}; interval=${interval / 60000}min; nextBreakAt=${new Date(nextBreakAt).toISOString()}`);
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

// ── Settings Window ─────────────────────────────────────────
function showSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  const display = screen.getPrimaryDisplay();
  const { x, y, width, height } = display.workArea;

  settingsWindow = new BrowserWindow({
    width: 500,
    height: 600,
    x: x + Math.round((width - 500) / 2),
    y: y + Math.round((height - 600) / 2),
    show: false,
    icon: getAssetPath('coffee-break.ico'),
    title: 'Coffee Break',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
  });

  settingsWindow.on('close', (event) => {
    // Minimize to tray instead of closing
    event.preventDefault();
    settingsWindow.hide();
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });

  // Load with hash so renderer can detect settings mode
  const target = getRendererTarget();
  if (target.type === 'url') {
    settingsWindow.loadURL(target.value + '#settings');
  } else {
    settingsWindow.loadFile(target.value, { hash: 'settings' });
  }

  log('settings window opened');
}

// ── Break Window ────────────────────────────────────────────
function showBreakWindow() {
  clearTimer();
  state = 'break';
  activeBreakId += 1;
  breakStartedAt = Date.now();
  const breakId = activeBreakId;
  updateTrayMenu();
  log(`showBreakWindow requested; breakId=${breakId}`);

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
  tray.on('double-click', () => showSettingsWindow());
  updateTrayMenu();
}

// ── IPC handlers ─────────────────────────────────────────────
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

// Settings IPC
ipcMain.handle('settings:get', () => ({ ...currentSettings }));

ipcMain.handle('settings:save', (_event, newSettings) => {
  const previousWorkMinutes = currentSettings.workMinutes;
  const previousBreakSeconds = currentSettings.breakSeconds;

  currentSettings = { ...currentSettings, ...newSettings };
  saveSettingsToDisk(currentSettings);

  // Apply launch at startup
  if (newSettings.launchAtStartup !== undefined) {
    setLaunchAtStartup(newSettings.launchAtStartup);
  }

  // If work/break duration changed, restart the brewing cycle
  if (
    (newSettings.workMinutes !== undefined && newSettings.workMinutes !== previousWorkMinutes) ||
    (newSettings.breakSeconds !== undefined && newSettings.breakSeconds !== previousBreakSeconds)
  ) {
    log(`duration changed, restarting brewing`);
    startBrewing('settings-updated');
  }

  // Broadcast settings change to all windows
  const payload = { ...currentSettings };
  if (breakWindow && !breakWindow.isDestroyed()) {
    breakWindow.webContents.send('settings:changed', payload);
  }
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('settings:changed', payload);
  }

  return { ...currentSettings };
});

ipcMain.handle('shortcut:create', async () => {
  try {
    const shortcutPath = path.join(app.getPath('desktop'), 'Coffee Break.lnk');
    const exePath = process.execPath;
    const iconPath = getAssetPath('coffee-break.ico');

    // Create .lnk using shell.writeShortcutLink (available in Electron)
    const shortcutCreated = shell.writeShortcutLink(shortcutPath, {
      target: exePath,
      icon: iconPath,
      iconIndex: 0,
      description: 'Coffee Break - Work focused. Reset regularly.'
    });

    if (shortcutCreated) {
      log(`desktop shortcut created at ${shortcutPath}`);
      return { success: true };
    }

    // Fallback: try PowerShell
    const { execSync } = require('node:child_process');
    const psScript = `
      $ws = New-Object -ComObject WScript.Shell
      $shortcut = $ws.CreateShortcut("${shortcutPath.replace(/\\/g, '\\\\')}")
      $shortcut.TargetPath = "${exePath.replace(/\\/g, '\\\\')}"
      $shortcut.IconLocation = "${iconPath.replace(/\\/g, '\\\\')},0"
      $shortcut.Description = "Coffee Break"
      $shortcut.Save()
    `;
    execSync(`powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '\\"')}"`, { timeout: 10000 });
    log(`desktop shortcut created (fallback) at ${shortcutPath}`);
    return { success: true };
  } catch (err) {
    log(`failed to create desktop shortcut: ${err.message}`);
    return { success: false, error: err.message };
  }
});

// ── App lifecycle ────────────────────────────────────────────
app.whenReady().then(() => {
  log('app ready');
  loadSettings();

  // Apply startup setting
  if (currentSettings.launchAtStartup) {
    setLaunchAtStartup(true);
  }

  createTray();
  startBrewing('app-ready');

  // Show settings window on first launch
  showSettingsWindow();

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
