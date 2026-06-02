const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('coffeeBreak', {
  onBreakStarted(callback) {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('break:started', handler);
    return () => ipcRenderer.removeListener('break:started', handler);
  },
  sendBreakAction(action) {
    ipcRenderer.send('break:action', action);
  },
  getBreakState() {
    return ipcRenderer.invoke('break:get-state');
  },
  log(message) {
    ipcRenderer.send('renderer:log', String(message));
  },
  assetUrl(name) {
    return ipcRenderer.invoke('asset:url', name);
  },
  getSettings() {
    return ipcRenderer.invoke('settings:get');
  },
  saveSettings(settings) {
    return ipcRenderer.invoke('settings:save', settings);
  },
  onSettingsChanged(callback) {
    const handler = (_event, settings) => callback(settings);
    ipcRenderer.on('settings:changed', handler);
    return () => ipcRenderer.removeListener('settings:changed', handler);
  },
  createDesktopShortcut() {
    return ipcRenderer.invoke('shortcut:create');
  }
});

ipcRenderer.send('preload:ready');
