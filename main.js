const { app, BrowserWindow } = require('electron');
const path = require('path');
const axios = require('axios');
const { fork } = require('child_process');

let mainWindow;

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 950,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
        },
        icon: path.join(__dirname, 'assets/icon.ico'),

    });

    serverProcess = fork(path.join(__dirname, 'server.js'));

    const filePath = path.join(__dirname, 'Scoreboard_control.html');
    mainWindow.loadFile(filePath);

    try {
        await axios.get('http://localhost:8080');
        mainWindow.loadURL('http://localhost:8080/scoreboard_control.html');
    } catch (error) {
        console.error('Server not running, loading fallback local file.');
        mainWindow.loadFile('Scoreboard_control.html');
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});
