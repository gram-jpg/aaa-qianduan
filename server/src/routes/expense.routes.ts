import { Router } from 'express';
import { financeDb, mainDb, shipmentDb } from '../db';
import { generateApplicationNumber } from '../utils/generateApplicationNumber';

const router = Router();

export async function performCleanup() {
    const allShipments = await shipmentDb.shipment.findMany({ select: { id: true } });
    const shipmentIdSet = new Set(allShipments.map(s => s.id));

    const allCosts = await financeDb.shipmentCost.findMany({
        select: {
            id: true,
            shipmentId: true,
            applicationNumber: true,
            amount: true,
            currency: true,
            financialSubjectId: true,
            settlementUnitId: true,
            description: true,
            status: true
        }
    });

    const orphanCostIds = allCosts
        .filter(c => c.shipmentId && !shipmentIdSet.has(c.shipmentId as string))
        .map(c => c.id);

    let deletedOrphanCosts = 0;
    if (orphanCostIds.length > 0) {
        const result = await financeDb.shipmentCost.deleteMany({ where: { id: { in: orphanCostIds } } });
        deletedOrphanCosts = result.count;
    }

    const invalidCostIds = allCosts
        .filter(c => !c.financialSubjectId || !c.settlementUnitId || !c.description || !c.currency || !c.amount || Number(c.amount) <= 0)
        .map(c => c.id);

    let deletedInvalidCosts = 0;
    if (invalidCostIds.length > 0) {
        const result = await financeDb.shipmentCost.deleteMany({ where: { id: { in: invalidCostIds } } });
        deletedInvalidCosts = result.count;
    }

    const remainingCosts = await financeDb.shipmentCost.findMany({
        select: { id: true, applicationNumber: true, amount: true, currency: true, status: true }
    });

    const applications = await financeDb.expenseApplication.findMany({ select: { applicationNumber: true } });
    const validAppSet = new Set(applications.map(a => a.applicationNumber));
    const costsToClear = remainingCosts
        .filter(c => c.applicationNumber && !validAppSet.has(c.applicationNumber as string))
        .map(c => c.id);

    let disassociatedCosts = 0;
    if (costsToClear.length > 0) {
        const result = await financeDb.shipmentCost.updateMany({
            where: { id: { in: costsToClear } },
            data: {
                status: 'unapplied',
                applicationNumber: null,
                applicationDate: null,
                dueDate: null
            }
        });
        disassociatedCosts = result.count;
    }

    const apps = await financeDb.expenseApplication.findMany();
    let updatedApplications = 0;
    let deletedApplications = 0;

    for (const app of apps) {
        const costs = await financeDb.shipmentCost.findMany({ where: { applicationNumber: app.applicationNumber } });
        if (!costs || costs.length === 0) {
            // Preserve canceled applications for audit history; only delete orphans that are not canceled
            if (app.status !== 'canceled') {
                await financeDb.expenseApplication.delete({ where: { applicationNumber: app.applicationNumber } }).catch(() => {});
                deletedApplications++;
            } else {
                // Ensure canceled applications reflect zero totals
                await financeDb.expenseApplication.update({
                    where: { applicationNumber: app.applicationNumber },
                    data: { totalAmount: 0, costCount: 0 }
                }).catch(() => {});
            }
            continue;
        }
        const totalAmount = costs.reduce((sum, c) => sum + Number(c.amount || 0), 0);
        const currency = costs[0]?.currency || app.currency;
        await financeDb.expenseApplication.update({
            where: { applicationNumber: app.applicationNumber },
            data: {
                totalAmount,
                currency,
                costCount: costs.length
            }
        }).catch(() => {});
        updatedApplications++;
    }

    const appliedWithoutApp = await financeDb.shipmentCost.updateMany({
        where: { status: 'applied', applicationNumber: null },
        data: { status: 'unapplied' }
    });

    const invalidSettled = await financeDb.shipmentCost.updateMany({
        where: { status: 'settled', applicationNumber: null },
        data: {
            status: 'applied',
            settlementDate: null,
            settlementRemarks: null
        }
    });

    return {
        success: true,
        deletedOrphanCosts,
        deletedInvalidCosts,
        disassociatedCosts,
        updatedApplications,
        deletedApplications,
        normalizedAppliedWithoutApp: appliedWithoutApp.count,
        normalizedInvalidSettledWithoutApp: invalidSettled.count
    };
}

// GET /api/expenses - Get expense list with filters
router.get('/', async (req, res) => {
    try {
        const {
            type,
            status,
            dateFrom,
            dateTo,
            settlementUnit,
            blNumber,
            shipmentCode,
            applicationNumber,
            financialSubjectId,
            currency,
            settlementUnitName
        } = req.query;

        const where: any = {};

        if (type) where.type = type;
        if (status) where.status = status;
        if (applicationNumber) where.applicationNumber = { contains: String(applicationNumber) };
        if (financialSubjectId) where.financialSubjectId = parseInt(String(financialSubjectId));
        if (currency) where.currency = currency;
        if (settlementUnit) where.settlementUnitId = settlementUnit;

        if (settlementUnitName) {
            const name = String(settlementUnitName);
            const matchedCustomers = await mainDb.customer.findMany({
                where: { companyNameEn: { contains: name } },
                select: { id: true }
            });
            const matchedSuppliers = await mainDb.supplier.findMany({
                where: {
                    OR: [
                        { companyNameEn: { contains: name } },
                        { fullName: { contains: name } }
                    ]
                },
                select: { id: true }
            });
            const customerIds = matchedCustomers.map(c => c.id);
            const supplierIds = matchedSuppliers.map(s => s.id);
            if (customerIds.length === 0 && supplierIds.length === 0) {
                return res.json({ costs: [], page: 1, pageSize: 0, total: 0 });
            }
            const orConds: any[] = [];
            if (customerIds.length > 0) {
                orConds.push({ settlementUnitType: 'customer', settlementUnitId: { in: customerIds } });
            }
            if (supplierIds.length > 0) {
                orConds.push({ settlementUnitType: 'supplier', settlementUnitId: { in: supplierIds } });
            }
            where.OR = orConds;
        }

        // Support filtering by shipment code and BL number via shipment lookup
        let shipmentIdFilter: string[] | null = null;
        if (shipmentCode) {
            const matchedByCode = await shipmentDb.shipment.findMany({
                where: { code: { contains: String(shipmentCode) } },
                select: { id: true }
            });
            shipmentIdFilter = matchedByCode.map(s => s.id);
        }
        if (blNumber) {
            const matchedByBl = await shipmentDb.shipment.findMany({
                where: { blNumber: { contains: String(blNumber) } },
                select: { id: true }
            });
            const blIds = matchedByBl.map(s => s.id);
            if (shipmentIdFilter === null) {
                shipmentIdFilter = blIds;
            } else {
                // Intersect existing filter with BL number results
                const set = new Set(blIds);
                shipmentIdFilter = shipmentIdFilter.filter(id => set.has(id));
            }
        }
        if (shipmentIdFilter !== null) {
            // If empty intersection, return no results quickly
            if (shipmentIdFilter.length === 0) {
                return res.json({ costs: [], page: 1, pageSize: 0, total: 0 });
            }
            where.shipmentId = { in: shipmentIdFilter };
        }

        if (dateFrom || dateTo) {
            const start = dateFrom ? new Date(String(dateFrom)) : null;
            const endRaw = dateTo ? new Date(String(dateTo)) : null;
            if ((start && isNaN(start.getTime())) || (endRaw && isNaN(endRaw.getTime()))) {
                return res.status(400).json({ error: '日期格式不正确' });
            }
            const end = endRaw ? new Date(endRaw) : null;
            if (end) end.setHours(23, 59, 59, 999);
            where.createdAt = {};
            if (start) where.createdAt.gte = start;
            if (end) where.createdAt.lte = end;
        }

        const page = req.query.page ? parseInt(String(req.query.page)) : 1;
        const pageSizeRaw = req.query.pageSize ? parseInt(String(req.query.pageSize)) : 50;
        const pageSize = Math.min(Math.max(pageSizeRaw, 1), 200);
        const skip = (Math.max(page, 1) - 1) * pageSize;

        const total = await financeDb.shipmentCost.count({ where });
        const costs = await financeDb.shipmentCost.findMany({
            where,
            orderBy: [
                { applicationNumber: 'asc' },
                { createdAt: 'desc' }
            ],
            skip,
            take: pageSize
        });

        // Fetch settlement unit names (客户/供应商名称)
        const costIds = costs.map(c => c.id);
        const customerIds = costs.filter(c => c.settlementUnitType === 'customer').map(c => c.settlementUnitId);
        const supplierIds = costs.filter(c => c.settlementUnitType === 'supplier').map(c => c.settlementUnitId);

        const customers = customerIds.length > 0 ? await mainDb.customer.findMany({
            where: { id: { in: customerIds } }
        }) : [];

        const suppliers = supplierIds.length > 0 ? await mainDb.supplier.findMany({
            where: { id: { in: supplierIds } }
        }) : [];

        // Fetch shipment data for blNumber and code
        const shipmentIds = [...new Set(costs.map(c => c.shipmentId).filter(Boolean))];
        const shipments = shipmentIds.length > 0 ? await shipmentDb.shipment.findMany({
            where: { id: { in: shipmentIds as string[] } }
        }) : [];

        // Enrich costs with settlement unit names and shipment info
        const enrichedCosts = costs.map(cost => {
            let settlementUnitName = '';
            if (cost.settlementUnitType === 'customer') {
                const customer = customers.find(c => c.id === cost.settlementUnitId);
                settlementUnitName = customer?.companyNameEn || '';
            } else {
                const supplier = suppliers.find(s => s.id === cost.settlementUnitId);
                settlementUnitName = supplier?.companyNameEn || supplier?.fullName || '';
            }

            // Find shipment info
            const shipment = shipments.find(s => s.id === cost.shipmentId);

            return {
                ...cost,
                vatRate: Number(cost.vatRate),
                whtRate: Number(cost.whtRate),
                settlementUnitName,
                shipmentCode: shipment?.code || '',
                blNumber: shipment?.blNumber || '',
                createdAt: cost.createdAt.toISOString(),
                updatedAt: cost.updatedAt.toISOString(),
                applicationDate: cost.applicationDate?.toISOString(),
                dueDate: cost.dueDate?.toISOString(),
                settlementDate: cost.settlementDate?.toISOString()
            };
        });

        res.json({ costs: enrichedCosts, page, pageSize, total });
    } catch (error) {
        console.error('GET /api/expenses error:', error);
        try {
            const fs = await import('fs');
            fs.appendFileSync('expenses_errors.log', `[${new Date().toISOString()}] GET /api/expenses error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n`);
        } catch (e) { void e }
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

// POST /api/expenses/apply - Create expense application
router.post('/apply', async (req, res) => {
    try {
        const { costIds, dueDate, remarks } = req.body;

        // Validation
        if (!Array.isArray(costIds) || costIds.length === 0) {
            return res.status(400).json({ error: '请选择至少一条费用' });
        }

        if (costIds.length > 50) {
            return res.status(400).json({ error: '批量申请最多支持50条费用' });
        }

        if (!dueDate) {
            return res.status(400).json({ error: '请选择最晚付款/收款日期' });
        }

        // Fetch costs
        const costs = await financeDb.shipmentCost.findMany({
            where: { id: { in: costIds } }
        });

        if (costs.length !== costIds.length) {
            return res.status(400).json({ error: '部分费用不存在' });
        }

        // Validate all costs are same type (AR or AP)
        const types = [...new Set(costs.map(c => c.type))];
        if (types.length !== 1) {
            return res.status(400).json({ error: '同一申请必须是相同类型(应收/应付)' });
        }

        const type = types[0];

        // Validate all costs are unapplied
        const invalidCosts = costs.filter(c => c.status !== 'unapplied');
        if (invalidCosts.length > 0) {
            return res.status(400).json({ error: '部分费用已申请或已结算，无法重复申请' });
        }

        // Validate same currency (recommended)
        const currencies = [...new Set(costs.map(c => c.currency))];
        if (currencies.length !== 1) {
            return res.status(400).json({ error: '同一申请必须是相同币种' });
        }

        const currency = currencies[0];

        // Calculate total amount
        const totalAmount = costs.reduce((sum, cost) => sum + cost.amount, 0);

        let applicationNumber = '';
        let created = false;
        for (let i = 0; i < 10 && !created; i++) {
            const candidate = await generateApplicationNumber(financeDb);
            try {
                await financeDb.expenseApplication.create({
                    data: {
                        applicationNumber: candidate,
                        type,
                        totalAmount,
                        currency,
                        costCount: costs.length,
                        dueDate: new Date(dueDate),
                        remarks: remarks || null,
                        status: 'active'
                    }
                });
                applicationNumber = candidate;
                created = true;
            } catch (e: any) {
                if (e?.code === 'P2002') {
                    continue;
                } else {
                    throw e;
                }
            }
        }
        await financeDb.shipmentCost.updateMany({
            where: { id: { in: costIds } },
            data: {
                applicationNumber,
                applicationDate: new Date(),
                dueDate: new Date(dueDate),
                applicationRemarks: remarks || null,
                status: 'applied'
            }
        });
        if (!created) {
            return res.status(429).json({ error: '申请并发过高，请重试' });
        }

        const response = {
            success: true,
            applicationNumber,
            appliedCosts: costs.length,
            totalAmount,
            currency
        };
        try { await performCleanup(); } catch (e) { void e }
        res.json(response);

    } catch (error) {
        console.error('POST /api/expenses/apply error:', error);
        const message = error instanceof Error ? error.message : 'Failed to apply expenses';
        try {
            const fs = await import('fs');
            fs.appendFileSync('expenses_errors.log', `[${new Date().toISOString()}] POST /api/expenses/apply error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n`);
        } catch (e) { void e }
        res.status(500).json({ error: message });
    }
});

// POST /api/expenses/cancel-application - Cancel expense application
router.post('/cancel-application', async (req, res) => {
    try {
        const { applicationNumber } = req.body;

        if (!applicationNumber) {
            return res.status(400).json({ error: '请提供申请号' });
        }

        // Check application exists and is active
        const application = await financeDb.expenseApplication.findUnique({
            where: { applicationNumber }
        });

        if (!application) {
            return res.status(404).json({ error: '申请号不存在' });
        }

        if (application.status === 'canceled') {
            return res.status(400).json({ error: '该申请已被撤销' });
        }

        // Check if any costs have been settled
        const settledCosts = await financeDb.shipmentCost.findFirst({
            where: {
                applicationNumber,
                status: 'settled'
            }
        });

        if (settledCosts) {
            return res.status(400).json({ error: '该申请包含已结算费用，无法撤销' });
        }

        await financeDb.expenseApplication.update({
            where: { applicationNumber },
            data: {
                status: 'canceled',
                canceledAt: new Date()
            }
        });

        // Update all costs to unapplied and clear application fields
        const result = await financeDb.shipmentCost.updateMany({
            where: { applicationNumber },
            data: {
                status: 'unapplied',
                applicationNumber: null,
                applicationDate: null,
                applicationRemarks: null,
                dueDate: null
            }
        });

        const response = {
            success: true,
            message: '申请已撤销，费用已恢复为未申请状态',
            affectedCosts: result.count
        };
        try { await performCleanup(); } catch (e) { void e }
        res.json(response);

    } catch (error) {
        console.error('POST /api/expenses/cancel-application error:', error);
        try {
            const fs = await import('fs');
            fs.appendFileSync('expenses_errors.log', `[${new Date().toISOString()}] POST /api/expenses/cancel-application error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n`);
        } catch (e) { void e }
        res.status(500).json({ error: 'Failed to cancel application' });
    }
});

// POST /api/expenses/settle - Settle expenses
router.post('/settle', async (req, res) => {
    try {
        const { costIds, settlementDate, remarks } = req.body;

        if (!Array.isArray(costIds) || costIds.length === 0) {
            return res.status(400).json({ error: '请选择至少一条费用' });
        }

        // Fetch costs
        const costs = await financeDb.shipmentCost.findMany({
            where: { id: { in: costIds } }
        });

        // Validate all costs are applied
        const invalidCosts = costs.filter(c => c.status !== 'applied');
        if (invalidCosts.length > 0) {
            return res.status(400).json({ error: '只能结算已申请的费用' });
        }

        // Update costs to settled
        await financeDb.shipmentCost.updateMany({
            where: { id: { in: costIds } },
            data: {
                status: 'settled',
                settlementDate: settlementDate ? new Date(settlementDate) : new Date(),
                settlementRemarks: remarks || null
            }
        });

        const response = {
            success: true,
            message: '结算成功',
            settledCount: costs.length
        };
        try { await performCleanup(); } catch (e) { void e }
        res.json(response);

    } catch (error) {
        console.error('POST /api/expenses/settle error:', error);
        try {
            const fs = await import('fs');
            fs.appendFileSync('expenses_errors.log', `[${new Date().toISOString()}] POST /api/expenses/settle error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n`);
        } catch (e) { void e }
        res.status(500).json({ error: 'Failed to settle expenses' });
    }
});

// POST /api/expenses/cancel-settlement - Cancel settlement
router.post('/cancel-settlement', async (req, res) => {
    try {
        const { costIds } = req.body;

        if (!Array.isArray(costIds) || costIds.length === 0) {
            return res.status(400).json({ error: '请选择至少一条费用' });
        }

        // Fetch costs
        const costs = await financeDb.shipmentCost.findMany({
            where: { id: { in: costIds } }
        });

        // Validate all costs are settled
        // const invalidCosts = costs.filter(c => c.status !== 'settled');
        // if (invalidCosts.length > 0) {
        //     return res.status(400).json({ error: '只能撤销已结算的费用' });
        // }
        // 简化逻辑：只处理settled状态的费用，忽略其他的

        // Update costs to applied (revert settlement)
        const result = await financeDb.shipmentCost.updateMany({
            where: {
                id: { in: costIds },
                status: 'settled'
            },
            data: {
                status: 'applied',
                settlementDate: null,
                settlementRemarks: null
            }
        });

        if (result.count === 0) {
            return res.status(400).json({ error: '没有找到可撤销结算的费用' });
        }

        const response = {
            success: true,
            message: '结算已撤销，费用已恢复为已申请状态',
            affectedCosts: result.count
        };
        try { await performCleanup(); } catch (e) { void e }
        res.json(response);

    } catch (error) {
        console.error('POST /api/expenses/cancel-settlement error:', error);
        try {
            const fs = await import('fs');
            fs.appendFileSync('expenses_errors.log', `[${new Date().toISOString()}] POST /api/expenses/cancel-settlement error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n`);
        } catch (e) { void e }
        res.status(500).json({ error: 'Failed to cancel settlement' });
    }
});

// POST /api/expenses/cleanup - Cleanup dirty data to enforce rules
router.post('/cleanup', async (req, res) => {
    try {
        const result = await performCleanup();
        res.json(result);
    } catch (error) {
        console.error('POST /api/expenses/cleanup error:', error);
        try {
            const fs = await import('fs');
            fs.appendFileSync('expenses_errors.log', `[${new Date().toISOString()}] POST /api/expenses/cleanup error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n`);
        } catch (e) { void e }
        res.status(500).json({ error: 'Failed to cleanup expenses' });
    }
});

// GET /api/expenses/applications - Get application records
router.get('/applications', async (req, res) => {
    try {
        const { type, status, dateFrom, dateTo } = req.query;

        const where: any = {};

        if (type) where.type = type;
        if (status) where.status = status;

        if (dateFrom || dateTo) {
            const start = dateFrom ? new Date(String(dateFrom)) : null;
            const endRaw = dateTo ? new Date(String(dateTo)) : null;
            if ((start && isNaN(start.getTime())) || (endRaw && isNaN(endRaw.getTime()))) {
                return res.status(400).json({ error: '日期格式不正确' });
            }
            const end = endRaw ? new Date(endRaw) : null;
            if (end) end.setHours(23, 59, 59, 999);
            where.createdAt = {};
            if (start) where.createdAt.gte = start;
            if (end) where.createdAt.lte = end;
        }

        const page = req.query.page ? parseInt(String(req.query.page)) : 1;
        const pageSizeRaw = req.query.pageSize ? parseInt(String(req.query.pageSize)) : 50;
        const pageSize = Math.min(Math.max(pageSizeRaw, 1), 200);
        const skip = (Math.max(page, 1) - 1) * pageSize;

        const total = await financeDb.expenseApplication.count({ where });
        const applications = await financeDb.expenseApplication.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize
        });

        const formattedApplications = applications.map(app => ({
            ...app,
            createdAt: app.createdAt.toISOString(),
            updatedAt: app.updatedAt.toISOString(),
            dueDate: app.dueDate?.toISOString(),
            canceledAt: app.canceledAt?.toISOString()
        }));

        res.json({ applications: formattedApplications, page, pageSize, total });

    } catch (error) {
        console.error('GET /api/expenses/applications error:', error);
        try {
            const fs = await import('fs');
            fs.appendFileSync('expenses_errors.log', `[${new Date().toISOString()}] GET /api/expenses/applications error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n`);
        } catch (e) { void e }
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

export { router as expenseRouter };
