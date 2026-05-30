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
  }
});

ipcRenderer.send('preload:ready');
