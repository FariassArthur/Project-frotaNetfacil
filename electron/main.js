const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function startBackend() {
  const backendPath = path.join(__dirname, '..', 'backend', 'src', 'server.js');
  backendProcess = spawn(process.execPath, [backendPath], {
    env: {
      ...process.env,
      PORT: '3001'
    },
    stdio: 'inherit'
  });

  backendProcess.on('error', (error) => {
    console.error('Erro ao iniciar backend:', error);
  });

  backendProcess.on('exit', (code, signal) => {
    console.log(`Backend finalizado com código ${code} signal ${signal}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      devTools: true
    }
  });

  const indexPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
  mainWindow.loadFile(indexPath);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  startBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
  }
});

app.on('activate', () => {
  if (!mainWindow) {
    createWindow();
  }
});
