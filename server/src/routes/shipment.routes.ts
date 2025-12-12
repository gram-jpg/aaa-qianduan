import { Router } from 'express';
import { mainDb, shipmentDb, financeDb } from '../db';
import { performCleanup } from './expense.routes';
import { generateUniqueCode, generateShipmentCode } from '../utils/codeGenerator';
import fs from 'fs';
import path from 'path';

const router = Router();

// GET all shipments (supports optional pagination)
router.get('/', async (req, res) => {
    try {
        const {
            status,
            page,
            limit,
            code,
            customer,
            transportType,
            businessType,
            blNumber,
            startDate,
            endDate,
            dateFrom,
            dateTo
        } = req.query as { [key: string]: string | undefined };

        const pageNum = page ? parseInt(page, 10) : undefined;
        const limitNum = limit ? parseInt(limit, 10) : undefined;

        // Build filter conditions
        const where: any = {};
        if (status) where.status = status;
        if (code) where.code = { contains: code };
        if (blNumber) where.blNumber = { contains: blNumber };

        // Date range: support startDate/endDate and dateFrom/dateTo
        const from = startDate || dateFrom;
        const to = endDate || dateTo;
        if (from || to) {
            const start = from ? new Date(from) : undefined;
            const end = to ? new Date(to) : undefined;
            if (start && isNaN(start.getTime())) {
                return res.status(400).json({ error: 'Invalid startDate' });
            }
            if (end && isNaN(end.getTime())) {
                return res.status(400).json({ error: 'Invalid endDate' });
            }
            where.createdAt = {
                ...(start ? { gte: start } : {}),
                ...(end ? { lte: new Date(new Date(end).setHours(23, 59, 59, 999)) } : {})
            };
        }

        // Cross-table filters
        if (customer) {
            const customers = await mainDb.customer.findMany({
                where: {
                    OR: [
                        { companyNameEn: { contains: customer } },
                        { companyNameTh: { contains: customer } }
                    ]
                },
                select: { id: true }
            });
            const ids = customers.map(c => c.id);
            if (ids.length === 0) {
                return res.json(pageNum && limitNum ? { items: [], total: 0, page: pageNum, limit: limitNum } : []);
            }
            where.customerId = { in: ids };
        }

        if (transportType) {
            const types = await mainDb.transportType.findMany({
                where: {
                    OR: [
                        { nameZh: { contains: transportType } },
                        { nameEn: { contains: (transportType || '').toLowerCase() } }
                    ]
                },
                select: { id: true }
            });
            const ids = types.map(t => t.id);
            if (ids.length === 0) {
                return res.json(pageNum && limitNum ? { items: [], total: 0, page: pageNum, limit: limitNum } : []);
            }
            where.transportTypeId = { in: ids };
        }

        if (businessType) {
            const types = await mainDb.businessType.findMany({
                where: {
                    OR: [
                        { nameZh: { contains: businessType } },
                        { nameEn: { contains: (businessType || '').toLowerCase() } }
                    ]
                },
                select: { id: true }
            });
            const ids = types.map(t => t.id);
            if (ids.length === 0) {
                return res.json(pageNum && limitNum ? { items: [], total: 0, page: pageNum, limit: limitNum } : []);
            }
            where.businessTypeId = { in: ids };
        }

        const fetchShipments = async (skip?: number, take?: number) => {
            const shipments = await shipmentDb.shipment.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take
            });
            const enriched = await Promise.all(
                shipments.map(async (shipment) => {
                    const [customerRow, transportTypeRow, businessTypeRow] = await Promise.all([
                        mainDb.customer.findUnique({ where: { id: shipment.customerId } }),
                        mainDb.transportType.findUnique({ where: { id: shipment.transportTypeId } }),
                        mainDb.businessType.findUnique({ where: { id: shipment.businessTypeId } })
                    ]);
                    return {
                        ...shipment,
                        customer: customerRow ? {
                            id: customerRow.id,
                            code: customerRow.code,
                            companyNameEn: customerRow.companyNameEn,
                            companyNameTh: customerRow.companyNameTh
                        } : null,
                        transportType: transportTypeRow || null,
                        businessType: businessTypeRow || null,
                        etd: shipment.etd ? Number(shipment.etd) : null,
                        eta: shipment.eta ? Number(shipment.eta) : null,
                        ata: shipment.ata ? Number(shipment.ata) : null
                    };
                })
            );
            return enriched;
        };

        if (pageNum && limitNum) {
            const skip = (pageNum - 1) * limitNum;
            const [total, items] = await Promise.all([
                shipmentDb.shipment.count({ where }),
                fetchShipments(skip, limitNum)
            ]);
            return res.json({ items, total, page: pageNum, limit: limitNum });
        }

        const items = await fetchShipments();
        res.json(items);
    } catch (error) {
        console.error('GET /shipments error:', error);
        try {
            fs.appendFileSync('shipment_errors.log', `[${new Date().toISOString()}] GET /shipments error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n`);
        } catch (e) { void e }
        res.status(500).json({ error: 'Failed to fetch shipments' });
    }
});

// GET single shipment with full details
router.get('/:id', async (req, res) => {
    try {
        const shipment = await shipmentDb.shipment.findUnique({
            where: { id: req.params.id },
            include: {
                commodities: {
                    orderBy: { sequence: 'asc' }
                },
                attachments: true
            }
        });

        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        // Fetch related data from main database
        const [customer, transportType, businessType, pol, pod, incoterm, costs] = await Promise.all([
            mainDb.customer.findUnique({ where: { id: shipment.customerId } }),
            mainDb.transportType.findUnique({ where: { id: shipment.transportTypeId } }),
            mainDb.businessType.findUnique({ where: { id: shipment.businessTypeId } }),
            shipment.polId ? mainDb.port.findUnique({ where: { id: shipment.polId } }) : null,
            shipment.podId ? mainDb.port.findUnique({ where: { id: shipment.podId } }) : null,
            shipment.incotermId ? mainDb.tradeTerms.findUnique({ where: { id: shipment.incotermId } }) : null,
            // Fetch costs from finance database
            financeDb.shipmentCost.findMany({ where: { shipmentId: req.params.id } })
        ]);

        // Enrich costs with settlement unit names
        const enrichedCosts = await Promise.all(costs.map(async (cost) => {
            let settlementUnitName = cost.settlementUnitId;
            try {
                if (cost.settlementUnitType === 'customer') {
                    const c = await mainDb.customer.findUnique({ where: { id: cost.settlementUnitId } });
                    if (c) settlementUnitName = c.companyNameEn;
                } else if (cost.settlementUnitType === 'supplier') {
                    const s = await mainDb.supplier.findUnique({ where: { id: cost.settlementUnitId } });
                    if (s) settlementUnitName = s.companyNameEn || s.fullName || '';
                }
            } catch (e) {
                // Ignore lookup errors, fallback to ID
            }
            return { ...cost, settlementUnitName };
        }));

        res.json({
            ...shipment,
            customer: customer ? { ...customer, createdAt: Number(customer.createdAt) } : null,
            transportType,
            businessType,
            pol,
            pod,
            incoterm,
            costs: enrichedCosts, // Enriched from finance DB
            // Convert BigInt to Number
            etd: shipment.etd ? Number(shipment.etd) : null,
            eta: shipment.eta ? Number(shipment.eta) : null,
            ata: shipment.ata ? Number(shipment.ata) : null
        });
    } catch (error) {
        console.error('GET /shipments/:id error:', error);
        try {
            fs.appendFileSync('shipment_errors.log', `[${new Date().toISOString()}] GET /shipments/:id error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n`);
        } catch (e) { void e }
        res.status(500).json({ error: 'Failed to fetch shipment' });
    }
});

// CREATE shipment
router.post('/', async (req, res) => {
    try {
        const { commodities, ...shipmentData } = req.body;

        if (!shipmentData.customerId || shipmentData.transportTypeId === undefined || shipmentData.businessTypeId === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate foreign references exist in main database
        const [customerExists, transportTypeExists, businessTypeExists] = await Promise.all([
            mainDb.customer.findUnique({ where: { id: shipmentData.customerId } }),
            mainDb.transportType.findUnique({ where: { id: shipmentData.transportTypeId } }),
            mainDb.businessType.findUnique({ where: { id: shipmentData.businessTypeId } })
        ]);

        if (!customerExists) {
            return res.status(400).json({ error: 'Invalid customerId' });
        }
        if (!transportTypeExists) {
            return res.status(400).json({ error: 'Invalid transportTypeId' });
        }
        if (!businessTypeExists) {
            return res.status(400).json({ error: 'Invalid businessTypeId' });
        }

        // Convert date numbers to BigInt
        const dataBase = {
            ...shipmentData,
            etd: shipmentData.etd ? BigInt(shipmentData.etd) : null,
            eta: shipmentData.eta ? BigInt(shipmentData.eta) : null,
            ata: shipmentData.ata ? BigInt(shipmentData.ata) : null
        };

        let shipment;
        let attempt = 0;
        const maxRetries = 5;
        while (!shipment && attempt < maxRetries) {
            attempt++;
            try {
                shipment = await shipmentDb.$transaction(async (tx) => {
                    const now = new Date();
                    const year = String(now.getFullYear()).slice(-2);
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');
                    const dateKey = `${year}${month}${day}`;
                    const prefix = `Rsl-${dateKey}`;

                    let codeStr: string;
                    const existing = await tx.shipmentCodeSequence.findUnique({ where: { dateKey } });
                    if (!existing) {
                        const last = await tx.shipment.findFirst({ where: { code: { startsWith: prefix } }, orderBy: { code: 'desc' } });
                        let initial = 1;
                        if (last) {
                            const lastSeq = parseInt(last.code.slice(-3));
                            if (!isNaN(lastSeq)) initial = lastSeq + 1;
                        }
                        const createdSeq = await tx.shipmentCodeSequence.create({ data: { dateKey, seq: initial } });
                        codeStr = `${prefix}${String(createdSeq.seq).padStart(3, '0')}`;
                    } else {
                        const updated = await tx.shipmentCodeSequence.update({ where: { dateKey }, data: { seq: { increment: 1 } } });
                        codeStr = `${prefix}${String(updated.seq).padStart(3, '0')}`;
                    }

                    const dataToSave = {
                        ...dataBase,
                        code: shipmentData.code || codeStr
                    };

                    return tx.shipment.create({
                        data: {
                            ...dataToSave,
                            commodities: commodities ? {
                                create: commodities
                                    .filter((c: any) => c.commodity?.trim())
                                    .map((c: any, index: number) => ({
                                        commodity: c.commodity,
                                        hsCode: c.hsCode || null,
                                        sequence: index
                                    }))
                            } : undefined
                        },
                        include: { commodities: true }
                    });
                });
            } catch (e) {
                console.error('POST /shipments transaction error:', e);
                try {
                    fs.appendFileSync('shipment_errors.log', `[${new Date().toISOString()}] POST /shipments transaction error: ${JSON.stringify(e, Object.getOwnPropertyNames(e))}\n`);
                } catch (e) { void e }
            }
        }

        if (!shipment) {
            return res.status(500).json({ error: 'Failed to create shipment' });
        }

        res.status(201).json({
            ...shipment,
            etd: shipment.etd ? Number(shipment.etd) : null,
            eta: shipment.eta ? Number(shipment.eta) : null,
            ata: shipment.ata ? Number(shipment.ata) : null
        });

    } catch (error) {
        console.error('POST /shipments error:', error);
        // Log the full error object for debugging
        if (error instanceof Error) {
            console.error(error.stack);
        }
        try {
            fs.appendFileSync('shipment_errors.log', `[${new Date().toISOString()}] POST /shipments error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n`);
        } catch (e) { void e }
        res.status(500).json({
            error: 'Failed to create shipment',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

// UPDATE shipment
router.put('/:id', async (req, res) => {
    try {
        const { commodities, ...shipmentData } = req.body;

        try {
            fs.writeFileSync(
                path.join(process.cwd(), 'debug_payload.json'),
                JSON.stringify(req.body, null, 2)
            );
        } catch (e) {
            console.error('Failed to write debug payload', e);
        }

        // Convert date numbers to BigInt
        const dataToUpdate = {
            ...shipmentData,
            etd: shipmentData.etd !== undefined ? (shipmentData.etd ? BigInt(shipmentData.etd) : null) : undefined,
            eta: shipmentData.eta !== undefined ? (shipmentData.eta ? BigInt(shipmentData.eta) : null) : undefined,
            ata: shipmentData.ata !== undefined ? (shipmentData.ata ? BigInt(shipmentData.ata) : null) : undefined
        };

        // Update shipment
        const shipment = await shipmentDb.shipment.update({
            where: { id: req.params.id },
            data: dataToUpdate
        });

        // Update commodities if provided
        if (commodities !== undefined) {
            // Delete existing commodities
            await shipmentDb.shipmentCommodity.deleteMany({
                where: { shipmentId: req.params.id }
            });

            // Create new commodities (filter out empty ones)
            const validCommodities = commodities.filter((c: any) => c.commodity?.trim());
            if (validCommodities.length > 0) {
                await shipmentDb.shipmentCommodity.createMany({
                    data: validCommodities.map((c: any, index: number) => ({
                        shipmentId: req.params.id,
                        commodity: c.commodity,
                        hsCode: c.hsCode || null,
                        sequence: index
                    }))
                });
            }
        }

        // Fetch updated shipment with commodities
        const updated = await shipmentDb.shipment.findUnique({
            where: { id: req.params.id },
            include: { commodities: { orderBy: { sequence: 'asc' } } }
        });

        if (!updated) {
            throw new Error('Failed to fetch updated shipment');
        }

        // Fetch related data from main database
        const [customer, transportType, businessType, pol, pod, incoterm] = await Promise.all([
            mainDb.customer.findUnique({ where: { id: updated!.customerId } }),
            mainDb.transportType.findUnique({ where: { id: updated!.transportTypeId } }),
            mainDb.businessType.findUnique({ where: { id: updated!.businessTypeId } }),
            updated!.polId ? mainDb.port.findUnique({ where: { id: updated!.polId } }) : null,
            updated!.podId ? mainDb.port.findUnique({ where: { id: updated!.podId } }) : null,
            updated!.incotermId ? mainDb.tradeTerms.findUnique({ where: { id: updated!.incotermId } }) : null
        ]);

        res.json({
            ...updated,
            customer: customer ? { ...customer, createdAt: Number(customer.createdAt) } : null,
            transportType,
            businessType,
            pol,
            pod,
            incoterm,
            etd: updated?.etd ? Number(updated.etd) : null,
            eta: updated?.eta ? Number(updated.eta) : null,
            ata: updated?.ata ? Number(updated.ata) : null
        });
    } catch (error) {
        console.error('PUT /shipments/:id error:', error);
        res.status(500).json({ error: 'Failed to update shipment' });
    }
});

// DELETE shipment
router.delete('/:id', async (req, res) => {
    try {
        const shipmentId = req.params.id;

        // Check if any costs are settled; block deletion if so
        const settledCount = await financeDb.shipmentCost.count({
            where: { shipmentId, status: 'settled' }
        });
        if (settledCount > 0) {
            return res.status(400).json({ error: '该业务存在已结算费用，不可删除' });
        }

        // Collect related application numbers before deleting costs
        const relatedCosts = await financeDb.shipmentCost.findMany({
            where: { shipmentId },
            select: { applicationNumber: true }
        });
        const appNumbers = Array.from(new Set((relatedCosts || []).map(c => c.applicationNumber).filter(Boolean))) as string[];

        // Cascade delete: remove all costs linked to this shipment
        await financeDb.shipmentCost.deleteMany({ where: { shipmentId } });

        // Delete shipment itself
        await shipmentDb.shipment.delete({ where: { id: shipmentId } });

        // Cleanup affected applications: recalc totals or cancel when empty
        for (const appNo of appNumbers) {
            const remaining = await financeDb.shipmentCost.findMany({ where: { applicationNumber: appNo } });
            if (!remaining || remaining.length === 0) {
                await financeDb.expenseApplication.delete({ where: { applicationNumber: appNo } }).catch(() => {});
            } else {
                const totalAmount = remaining.reduce((sum, c) => sum + Number(c.amount || 0), 0);
                await financeDb.expenseApplication.update({
                    where: { applicationNumber: appNo },
                    data: { totalAmount, costCount: remaining.length }
                }).catch(() => {});
            }
        }

        await performCleanup().catch(() => {});
        res.json({ success: true });
    } catch (error) {
        console.error('DELETE /shipments/:id error:', error);
        res.status(500).json({ error: 'Failed to delete shipment' });
    }
});

// --- COSTS (Finance DB) ---

// ADD Cost
router.post('/:id/costs', async (req, res) => {
    try {
        const { id } = req.params;
        const { description, amount, currency = 'THB', type, financialSubjectId, settlementUnitType, settlementUnitId, vatRate, whtRate, remarks, useVat, useWht } = req.body;

        // Debug: 输出接收到的数据
        console.log('=== POST /costs DEBUG ===');
        console.log('shipmentId:', id);
        console.log('useVat:', useVat, 'vatRate:', vatRate);
        console.log('useWht:', useWht, 'whtRate:', whtRate);
        console.log('Full body:', req.body);

        const cost = await financeDb.shipmentCost.create({
            data: {
                shipmentId: id,
                description,
                amount: Number(amount),
                currency,
                type,
                financialSubjectId,
                settlementUnitType,
                settlementUnitId,
                vatRate: useVat ? (vatRate || 7.0) : 0,
                whtRate: useWht ? (whtRate || 3.0) : 0,
                remarks,
                status: 'unapplied' // 默认为未申请状态
            }
        });

        console.log('Cost created:', cost);
        await performCleanup().catch(() => {});
        res.json(cost);
    } catch (error) {
        console.error('POST /costs error:', error);
        try {
            fs.writeFileSync('debug_cost_error.log', `Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\nBody: ${JSON.stringify(req.body)}`);
        } catch (e) { console.error(e); }
        res.status(500).json({ error: 'Failed to add cost' });
    }
});

// UPDATE Cost
router.put('/:shipmentId/costs/:costId', async (req, res) => {
    try {
        const { costId } = req.params;
        const { description, amount, currency, financialSubjectId, settlementUnitType, settlementUnitId, vatRate, whtRate, remarks, useVat, useWht } = req.body;

        const cost = await financeDb.shipmentCost.update({
            where: { id: costId },
            data: {
                description,
                amount: Number(amount),
                currency,
                financialSubjectId,
                settlementUnitType,
                settlementUnitId,
                vatRate: useVat ? (vatRate || 7.0) : 0,
                whtRate: useWht ? (whtRate || 3.0) : 0,
                remarks
            }
        });

        await performCleanup().catch(() => {});
        res.json(cost);
    } catch (error) {
        console.error('PUT /costs error:', error);
        res.status(500).json({ error: 'Failed to update cost' });
    }
});

// DELETE Cost
router.delete('/:shipmentId/costs/:costId', async (req, res) => {
    try {
        const cost = await financeDb.shipmentCost.findUnique({ where: { id: req.params.costId } });
        await financeDb.shipmentCost.delete({ where: { id: req.params.costId } });

        if (cost && cost.applicationNumber) {
            const appNo = cost.applicationNumber;
            const remaining = await financeDb.shipmentCost.findMany({ where: { applicationNumber: appNo } });
            if (!remaining || remaining.length === 0) {
                await financeDb.expenseApplication.delete({ where: { applicationNumber: appNo } }).catch(() => {});
            } else {
                const totalAmount = remaining.reduce((sum, c) => sum + Number(c.amount || 0), 0);
                await financeDb.expenseApplication.update({
                    where: { applicationNumber: appNo },
                    data: { totalAmount, costCount: remaining.length }
                }).catch(() => {});
            }
        }
        await performCleanup().catch(() => {});
        res.json({ success: true });
    } catch (error) {
        console.error('DELETE /costs error:', error);
        res.status(500).json({ error: 'Failed to delete cost' });
    }
});

// BULK DELETE shipments
router.post('/bulk-delete', async (req, res) => {
    try {
        const { ids } = req.body as { ids?: string[] };
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'ids must be a non-empty array' });
        }

        const settled = await financeDb.shipmentCost.findMany({
            where: { shipmentId: { in: ids }, status: 'settled' },
            select: { shipmentId: true }
        });
        const blockedIds = Array.from(new Set(settled.map(s => s.shipmentId).filter(Boolean))) as string[];
        const allowedIds = ids.filter(id => !blockedIds.includes(id));

        if (allowedIds.length > 0) {
            // Collect affected application numbers before deletion
            const relatedCosts = await financeDb.shipmentCost.findMany({
                where: { shipmentId: { in: allowedIds } },
                select: { applicationNumber: true }
            });
            const appNumbers = Array.from(new Set((relatedCosts || []).map(c => c.applicationNumber).filter(Boolean))) as string[];

            await financeDb.shipmentCost.deleteMany({ where: { shipmentId: { in: allowedIds } } });
            const del = await shipmentDb.shipment.deleteMany({ where: { id: { in: allowedIds } } });

            // Cleanup affected applications
            for (const appNo of appNumbers) {
                const remaining = await financeDb.shipmentCost.findMany({ where: { applicationNumber: appNo } });
                if (!remaining || remaining.length === 0) {
                    await financeDb.expenseApplication.delete({ where: { applicationNumber: appNo } }).catch(() => {});
                } else {
                    const totalAmount = remaining.reduce((sum, c) => sum + Number(c.amount || 0), 0);
                    await financeDb.expenseApplication.update({
                        where: { applicationNumber: appNo },
                        data: { totalAmount, costCount: remaining.length }
                    }).catch(() => {});
                }
            }
            await performCleanup().catch(() => {});
            return res.json({ deleted: del.count, blocked: blockedIds.length, blockedIds });
        }

        res.json({ deleted: 0, blocked: blockedIds.length, blockedIds });
    } catch (error) {
        console.error('POST /shipments/bulk-delete error:', error);
        res.status(500).json({ error: 'Failed to bulk delete shipments' });
    }
});

export { router as shipmentRouter };
