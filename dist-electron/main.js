"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
// Get the correct path for the database
const userDataPath = electron_1.app.getPath('userData');
const dbPath = electron_1.app.isPackaged
    ? path_1.default.join(userDataPath, 'crm.db')
    : path_1.default.join(electron_1.app.getAppPath(), 'server/prisma/dev.db');
const shipmentDbPath = electron_1.app.isPackaged
    ? path_1.default.join(userDataPath, 'shipment.db')
    : path_1.default.join(electron_1.app.getAppPath(), 'server/prisma/shipment.db');
const financeDbPath = electron_1.app.isPackaged
    ? path_1.default.join(userDataPath, 'finance.db')
    : path_1.default.join(electron_1.app.getAppPath(), 'server/prisma/finance.db');
const logDbPath = electron_1.app.isPackaged
    ? path_1.default.join(userDataPath, 'log.db')
    : path_1.default.join(electron_1.app.getAppPath(), 'server/prisma/log.db');
const attachmentsDbPath = electron_1.app.isPackaged
    ? path_1.default.join(userDataPath, 'attachments.db')
    : path_1.default.join(electron_1.app.getAppPath(), 'server/prisma/attachments.db');
const internalDbPath = electron_1.app.isPackaged
    ? path_1.default.join(process.resourcesPath, 'dev.db')
    : path_1.default.join(electron_1.app.getAppPath(), 'server/prisma/dev.db');
const internalShipmentDbPath = electron_1.app.isPackaged
    ? path_1.default.join(process.resourcesPath, 'shipment.db')
    : path_1.default.join(electron_1.app.getAppPath(), 'server/prisma/shipment.db');
const internalFinanceDbPath = electron_1.app.isPackaged
    ? path_1.default.join(process.resourcesPath, 'finance.db')
    : path_1.default.join(electron_1.app.getAppPath(), 'server/prisma/finance.db');
const internalLogDbPath = electron_1.app.isPackaged
    ? path_1.default.join(process.resourcesPath, 'log.db')
    : path_1.default.join(electron_1.app.getAppPath(), 'server/prisma/log.db');
const internalAttachmentsDbPath = electron_1.app.isPackaged
    ? path_1.default.join(process.resourcesPath, 'attachments.db')
    : path_1.default.join(electron_1.app.getAppPath(), 'server/prisma/attachments.db');
// Copy DB if not exists
const copyDb = (dest, src, name) => {
    console.log(`Checking ${name}...`);
    console.log(`  Source: ${src}`);
    console.log(`  Destination: ${dest}`);
    console.log(`  Source exists: ${fs_1.default.existsSync(src)}`);
    console.log(`  Dest exists: ${fs_1.default.existsSync(dest)}`);
    if (fs_1.default.existsSync(src)) {
        fs_1.default.copyFileSync(src, dest);
        console.log(`✓ ${name} copied to ${dest}`);
    }
    else {
        console.error(`✗ Initial ${name} not found at ${src}`);
    }
};
if (electron_1.app.isPackaged) {
    copyDb(dbPath, internalDbPath, 'Main DB');
    copyDb(shipmentDbPath, internalShipmentDbPath, 'Shipment DB');
    copyDb(financeDbPath, internalFinanceDbPath, 'Finance DB');
    copyDb(logDbPath, internalLogDbPath, 'Log DB');
    copyDb(attachmentsDbPath, internalAttachmentsDbPath, 'Attachments DB');
}
// Set env var for the server child process
process.env.DATABASE_URL = `file:${dbPath}`;
process.env.SHIPMENT_DATABASE_URL = `file:${shipmentDbPath}`;
process.env.FINANCE_DATABASE_URL = `file:${financeDbPath}`;
process.env.LOG_DATABASE_URL = `file:${logDbPath}`;
process.env.ATTACHMENTS_DATABASE_URL = `file:${attachmentsDbPath}`;
process.env.PORT = '3001';
// Start Server
let serverProcess;
const startServer = () => {
    // app.getAppPath() returns the app root (containing package.json)
    // In Dev: /Users/.../crm-app
    // In Prod: /Applications/.../Resources/app.asar
    const appPath = electron_1.app.getAppPath();
    const serverEntry = path_1.default.join(appPath, 'server/dist/index.js');
    console.log('=== Server Startup ===');
    console.log('App Path:', appPath);
    console.log('Server Entry:', serverEntry);
    console.log('Server entry exists:', fs_1.default.existsSync(serverEntry));
    console.log('Database paths:');
    console.log('  Main DB:', dbPath);
    console.log('  Shipment DB:', shipmentDbPath);
    console.log('  Finance DB:', financeDbPath);
    console.log('  Log DB:', logDbPath);
    console.log('  Attachments DB:', attachmentsDbPath);
    if (fs_1.default.existsSync(serverEntry)) {
        serverProcess = (0, child_process_1.fork)(serverEntry, [], {
            env: {
                ...process.env,
                DATABASE_URL: `file:${dbPath}`,
                SHIPMENT_DATABASE_URL: `file:${shipmentDbPath}`,
                FINANCE_DATABASE_URL: `file:${financeDbPath}`,
                LOG_DATABASE_URL: `file:${logDbPath}`,
                ATTACHMENTS_DATABASE_URL: `file:${attachmentsDbPath}`
            }
        });
        serverProcess.on('error', (err) => {
            console.error('Server process error:', err);
        });
        serverProcess.on('exit', (code, signal) => {
            console.log(`Server process exited with code ${code} and signal ${signal}`);
        });
        serverProcess.stdout?.on('data', (data) => {
            console.log('[Server]', data.toString());
        });
        serverProcess.stderr?.on('data', (data) => {
            console.error('[Server Error]', data.toString());
        });
        console.log('Server started from', serverEntry);
    }
    else {
        console.error('Server entry not found:', serverEntry);
        console.error('Available files in app path:');
        if (fs_1.default.existsSync(appPath)) {
            console.error(fs_1.default.readdirSync(appPath));
        }
    }
};
let mainWindow;
const createWindow = () => {
    const { width, height } = electron_1.screen.getPrimaryDisplay().workAreaSize;
    mainWindow = new electron_1.BrowserWindow({
        width: Math.min(1280, width),
        height: Math.min(800, height),
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    if (electron_1.app.isPackaged) {
        mainWindow.loadFile(path_1.default.join(electron_1.app.getAppPath(), 'dist/index.html'));
    }
    else {
        mainWindow.loadURL('http://localhost:5173');
    }
    // Open DevTools for debugging (Temporary)
    mainWindow.webContents.openDevTools();
};
electron_1.app.whenReady().then(() => {
    startServer();
    // Wait a bit for server to start? Or just load. Frontend proxy will retry? 
    // Ideally frontend retries.
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
    // Setup for Mac: Quit anyway for this app type, usually desired for "tool" apps.
    // But standard Mac behavior is keep running. 
    // We'll stick to standard: quit if user hits Cmd+Q.
    // However, if we kill the window, we should probably kill the server? 
    // fork() child process usually dies with parent, but let's be safe.
    if (serverProcess)
        serverProcess.kill();
    electron_1.app.quit();
});
electron_1.app.on('before-quit', () => {
    if (serverProcess)
        serverProcess.kill();
});
