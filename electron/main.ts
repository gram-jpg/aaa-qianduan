import { app, BrowserWindow, screen } from 'electron';
import path from 'path';
import fs from 'fs';
import { fork } from 'child_process';

// Get the correct path for the database
const userDataPath = app.getPath('userData');
const dbPath = app.isPackaged
    ? path.join(userDataPath, 'crm.db')
    : path.join(app.getAppPath(), 'server/prisma/dev.db');
const shipmentDbPath = app.isPackaged
    ? path.join(userDataPath, 'shipment.db')
    : path.join(app.getAppPath(), 'server/prisma/shipment.db');
const financeDbPath = app.isPackaged
    ? path.join(userDataPath, 'finance.db')
    : path.join(app.getAppPath(), 'server/prisma/finance.db');
const logDbPath = app.isPackaged
    ? path.join(userDataPath, 'log.db')
    : path.join(app.getAppPath(), 'server/prisma/log.db');
const attachmentsDbPath = app.isPackaged
    ? path.join(userDataPath, 'attachments.db')
    : path.join(app.getAppPath(), 'server/prisma/attachments.db');

const internalDbPath = app.isPackaged
    ? path.join(process.resourcesPath, 'dev.db')
    : path.join(app.getAppPath(), 'server/prisma/dev.db');

const internalShipmentDbPath = app.isPackaged
    ? path.join(process.resourcesPath, 'shipment.db')
    : path.join(app.getAppPath(), 'server/prisma/shipment.db');

const internalFinanceDbPath = app.isPackaged
    ? path.join(process.resourcesPath, 'finance.db')
    : path.join(app.getAppPath(), 'server/prisma/finance.db');

const internalLogDbPath = app.isPackaged
    ? path.join(process.resourcesPath, 'log.db')
    : path.join(app.getAppPath(), 'server/prisma/log.db');

const internalAttachmentsDbPath = app.isPackaged
    ? path.join(process.resourcesPath, 'attachments.db')
    : path.join(app.getAppPath(), 'server/prisma/attachments.db');

// Copy DB if not exists
const copyDb = (dest: string, src: string, name: string) => {
    console.log(`Checking ${name}...`);
    console.log(`  Source: ${src}`);
    console.log(`  Destination: ${dest}`);
    console.log(`  Source exists: ${fs.existsSync(src)}`);
    console.log(`  Dest exists: ${fs.existsSync(dest)}`);

    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`✓ ${name} copied to ${dest}`);
    } else {
        console.error(`✗ Initial ${name} not found at ${src}`);
    }
};

if (app.isPackaged) {
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
let serverProcess: any;

const startServer = () => {
    // app.getAppPath() returns the app root (containing package.json)
    // In Dev: /Users/.../crm-app
    // In Prod: /Applications/.../Resources/app.asar
    const appPath = app.getAppPath();
    const serverEntry = path.join(appPath, 'server/dist/index.js');

    console.log('=== Server Startup ===');
    console.log('App Path:', appPath);
    console.log('Server Entry:', serverEntry);
    console.log('Server entry exists:', fs.existsSync(serverEntry));
    console.log('Database paths:');
    console.log('  Main DB:', dbPath);
    console.log('  Shipment DB:', shipmentDbPath);
    console.log('  Finance DB:', financeDbPath);
    console.log('  Log DB:', logDbPath);
    console.log('  Attachments DB:', attachmentsDbPath);

    if (fs.existsSync(serverEntry)) {
        serverProcess = fork(serverEntry, [], {
            env: {
                ...process.env,
                DATABASE_URL: `file:${dbPath}`,
                SHIPMENT_DATABASE_URL: `file:${shipmentDbPath}`,
                FINANCE_DATABASE_URL: `file:${financeDbPath}`,
                LOG_DATABASE_URL: `file:${logDbPath}`,
                ATTACHMENTS_DATABASE_URL: `file:${attachmentsDbPath}`
            }
        });

        serverProcess.on('error', (err: Error) => {
            console.error('Server process error:', err);
        });

        serverProcess.on('exit', (code: number, signal: string) => {
            console.log(`Server process exited with code ${code} and signal ${signal}`);
        });

        serverProcess.stdout?.on('data', (data: Buffer) => {
            console.log('[Server]', data.toString());
        });

        serverProcess.stderr?.on('data', (data: Buffer) => {
            console.error('[Server Error]', data.toString());
        });

        console.log('Server started from', serverEntry);
    } else {
        console.error('Server entry not found:', serverEntry);
        console.error('Available files in app path:');
        if (fs.existsSync(appPath)) {
            console.error(fs.readdirSync(appPath));
        }
    }
};

let mainWindow: BrowserWindow | null;

const createWindow = () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    mainWindow = new BrowserWindow({
        width: Math.min(1280, width),
        height: Math.min(800, height),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    if (app.isPackaged) {
        mainWindow.loadFile(path.join(app.getAppPath(), 'dist/index.html'));
    } else {
        mainWindow.loadURL('http://localhost:5173');
    }

    // Open DevTools for debugging (Temporary)
    mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
    startServer();
    // Wait a bit for server to start? Or just load. Frontend proxy will retry? 
    // Ideally frontend retries.
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
    // Setup for Mac: Quit anyway for this app type, usually desired for "tool" apps.
    // But standard Mac behavior is keep running. 
    // We'll stick to standard: quit if user hits Cmd+Q.
    // However, if we kill the window, we should probably kill the server? 
    // fork() child process usually dies with parent, but let's be safe.
    if (serverProcess) serverProcess.kill();
    app.quit();
});

app.on('before-quit', () => {
    if (serverProcess) serverProcess.kill();
});
