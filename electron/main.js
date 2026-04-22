// ── SDC Calendar — Electron main process ─────────────────────
const { app, BrowserWindow, ipcMain, safeStorage, shell } = require('electron');
const { spawn } = require('child_process');
const path  = require('path');
const fs    = require('fs');
const http  = require('http');

const API_PORT   = process.env.PORT || 3001;
const API_URL    = `http://localhost:${API_PORT}`;
const TOKEN_FILE = () => path.join(app.getPath('userData'), 'ss_token.enc');

let serverProcess = null;
let mainWindow    = null;

// ── Spawn the Express backend ─────────────────────────────────
function startServer() {
  return new Promise((resolve) => {
    const serverScript = path.join(__dirname, '..', 'server', 'server.js');
    const serverDir    = path.join(__dirname, '..', 'server');

    serverProcess = spawn('node', [serverScript], {
      cwd:   serverDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env:   { ...process.env },
    });

    serverProcess.stdout.on('data', d => process.stdout.write('[server] ' + d));
    serverProcess.stderr.on('data', d => process.stderr.write('[server] ' + d));
    serverProcess.on('exit', code => {
      if (code !== 0 && code !== null) {
        console.error(`[main] Server exited with code ${code}`);
      }
    });

    // Poll /api/health until the Express server is ready
    let attempts = 0;
    const poll = () => {
      attempts++;
      if (attempts > 40) {
        console.warn('[main] Server slow to start — opening window anyway');
        return resolve();
      }
      http.get(`${API_URL}/api/health`, (res) => {
        if (res.statusCode === 200) {
          console.log('[main] Server ready ✓');
          resolve();
        } else {
          setTimeout(poll, 400);
        }
      }).on('error', () => setTimeout(poll, 400));
    };
    setTimeout(poll, 800); // give node a moment to start
  });
}

// ── Create the browser window ─────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:     1440,
    height:    920,
    minWidth:  1024,
    minHeight: 640,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      webSecurity:      true,
    },
    title:           'SDC Centralized Calendar',
    icon:            path.join(__dirname, '..', 'assets', 'sdc-logo.png'),
    backgroundColor: '#ffffff',
    show:            false, // reveal only when ready — avoids white flash
  });

  // Server serves the calendar HTML at the root
  mainWindow.loadURL(API_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Open external links in the system browser, not inside Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Hide the native menu bar (calendar has its own nav)
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── IPC: Smartsheet token via OS-level safeStorage ───────────
ipcMain.handle('ss-token-save', (_e, token) => {
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('OS encryption not available on this machine');
    }
    fs.writeFileSync(TOKEN_FILE(), safeStorage.encryptString(token));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('ss-token-get', () => {
  try {
    const f = TOKEN_FILE();
    if (!fs.existsSync(f)) return null;
    if (!safeStorage.isEncryptionAvailable()) return null;
    return safeStorage.decryptString(fs.readFileSync(f));
  } catch {
    return null;
  }
});

ipcMain.handle('ss-token-clear', () => {
  try {
    const f = TOKEN_FILE();
    if (fs.existsSync(f)) fs.unlinkSync(f);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('app-version', () => app.getVersion());

// ── App lifecycle ─────────────────────────────────────────────
app.whenReady().then(async () => {
  await startServer();
  createWindow();

  // macOS: re-open window when dock icon is clicked and no windows exist
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  killServer();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', killServer);

function killServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}
