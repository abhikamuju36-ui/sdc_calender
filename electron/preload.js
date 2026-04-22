// ── SDC Calendar — Electron preload (IPC bridge) ─────────────
// Runs in the renderer context before any page script.
// Exposes a minimal, typed surface via contextBridge — nothing
// else from Node/Electron leaks into the renderer.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // Smartsheet token — stored encrypted in OS keychain via safeStorage
  saveSSToken:  (token) => ipcRenderer.invoke('ss-token-save', token),
  getSSToken:   ()      => ipcRenderer.invoke('ss-token-get'),
  clearSSToken: ()      => ipcRenderer.invoke('ss-token-clear'),

  // App metadata
  getVersion: () => ipcRenderer.invoke('app-version'),
});
