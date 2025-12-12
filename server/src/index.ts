import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { router } from './routes';
import { supplierRouter } from './routes/supplier.routes';
import { attachmentRouter } from './routes/attachment.routes';
import { portRouter } from './routes/port.routes';
import { shipmentRouter } from './routes/shipment.routes';
import { expenseRouter, performCleanup } from './routes/expense.routes';

import financialSubjectRouter from './routes/financialSubject.routes';
import { mainDb, shipmentDb, financeDb } from './db';

const isTest = process.env.NODE_ENV === 'test';
dotenv.config({ path: isTest ? '.env.test' : '.env', debug: true });

const app = express();
const PORT = process.env.PORT || 3001;

console.log('Starting server...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('SHIPMENT_DATABASE_URL:', process.env.SHIPMENT_DATABASE_URL);

app.use(cors());
app.use(express.json());

app.use('/api', router);
app.use('/api/suppliers', supplierRouter);
app.use('/api/attachments', attachmentRouter);
app.use('/api/settings/ports', portRouter);
app.use('/api/shipments', shipmentRouter);
app.use('/api/settings/financial-subjects', financialSubjectRouter);
app.use('/api/expenses', expenseRouter);

// Debug route: check DB connectivity (register before static fallback)
app.get('/api/debug/db', async (_req, res) => {
    try {
        const [custCount, shipCount, costCount] = await Promise.all([
            mainDb.customer.count().catch(() => -1),
            shipmentDb.shipment.count().catch(() => -1),
            financeDb.shipmentCost.count().catch(() => -1)
        ]);
        res.json({ main: custCount, shipment: shipCount, finance: costCount });
    } catch (e) {
        res.status(500).json({ error: 'debug failed', details: e instanceof Error ? e.message : String(e) });
    }
});

// Serve built frontend (dist) when available
const distPath = path.join(__dirname, '../../dist');
if (fs.existsSync(distPath)) {
    console.log('Serving static frontend from', distPath);
    app.use(express.static(distPath));
    const indexFile = fs.existsSync(path.join(distPath, 'index.prod.html'))
        ? 'index.prod.html'
        : 'index.html';
    app.get('/{*splat}', (_req, res) => {
        res.sendFile(path.join(distPath, indexFile));
    });
} else {
    console.log('Static dist not found at', distPath);
}

// Publicly serve local storage files, enabling static path access
const storageRoot = path.join(process.cwd(), 'storage');
if (fs.existsSync(storageRoot)) {
    console.log('Serving storage from', storageRoot);
    app.use('/storage', express.static(storageRoot));
}

// end debug

async function ensureMasterData() {
    try {
        const [ttCount, btCount] = await Promise.all([
            mainDb.transportType.count(),
            mainDb.businessType.count()
        ]);

        if (ttCount === 0) {
            await mainDb.transportType.createMany({
                data: [
                    { nameZh: '海运', nameEn: 'Sea Freight' },
                    { nameZh: '空运', nameEn: 'Air Freight' }
                ]
            });
            console.log('Seeded transport types');
        }

        if (btCount === 0) {
            await mainDb.businessType.createMany({
                data: [
                    { nameZh: '进口', nameEn: 'Import' },
                    { nameZh: '出口', nameEn: 'Export' }
                ]
            });
            console.log('Seeded business types');
        }
    } catch (e) {
        console.error('ensureMasterData error:', e);
    }
}

ensureMasterData().finally(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        performCleanup().catch(() => {});
        setInterval(() => {
            performCleanup().catch(() => {});
        }, 60 * 60 * 1000);
    });
});
