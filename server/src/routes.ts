import { Router } from 'express';
import { prisma, shipmentDb, financeDb } from './db';
import { validate } from './middleware/validate';
import { customerSchema, customerUpdateSchema } from './schemas/customer.schema';
import { companyInfoSchema, supplierTypeSchema } from './schemas/settings.schema';
import { generateUniqueCode } from './utils/codeGenerator';

export const router = Router();

// GET all customers
router.get('/customers', async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            orderBy: { createdAt: 'desc' }
        });
        // Convert BigInt to Number for JSON
        const sanitized = customers.map((c) => ({
            ...c,
            createdAt: Number(c.createdAt)
        }));
        res.json(sanitized);
    } catch (error) {
        console.error('GET /customers error:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// GET one customer
router.get('/customers/:id', async (req, res) => {
    try {
        const customer = await prisma.customer.findUnique({
            where: { id: req.params.id }
        });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json({ ...customer, createdAt: Number(customer.createdAt) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

// CREATE customer - WITH VALIDATION
router.post('/customers/batch', async (req, res) => {
    try {
        const customers = req.body;
        if (!Array.isArray(customers)) {
            return res.status(400).json({ error: 'Input must be an array' });
        }

        let successCount = 0;
        let failureCount = 0;
        const errors: any[] = [];

        for (let i = 0; i < customers.length; i++) {
            const data = customers[i];
            const rowNumber = i + 1;

            try {
                // Basic Validation - only companyNameEn is required
                if (!data.companyNameEn) {
                    throw new Error('Missing required field: companyNameEn');
                }

                // Check duplicate taxId only if provided
                if (data.taxId) {
                    const existing = await prisma.customer.findUnique({
                        where: { taxId: data.taxId }
                    });
                    if (existing) {
                        throw new Error(`Tax ID "${data.taxId}" already exists`);
                    }
                }

                const code = await generateUniqueCode('customer');

                await prisma.customer.create({
                    data: {
                        ...data,
                        code,
                        createdAt: Date.now()
                    }
                });

                successCount++;
            } catch (error) {
                failureCount++;
                errors.push({
                    row: rowNumber,
                    company: data.companyNameEn || 'Unknown',
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }

        res.json({
            successCount,
            failureCount,
            errors,
            message: `Successfully imported ${successCount} customers. Failed: ${failureCount}.`
        });

    } catch (error) {
        console.error('Batch import error:', error);
        res.status(500).json({ error: 'Batch import failed' });
    }
});

// CREATE customer - WITH VALIDATION
router.post('/customers', validate(customerSchema), async (req, res) => {
    try {
        const { id, createdAt, ...data } = req.body;

        // Check for duplicate taxId (Layer 2 validation)
        const existing = await prisma.customer.findUnique({
            where: { taxId: data.taxId }
        });
        if (existing) {
            return res.status(400).json({
                error: `Tax ID "${data.taxId}" already exists`
            });
        }

        // Generate unique code
        const code = await generateUniqueCode('customer');

        const customer = await prisma.customer.create({
            data: {
                ...data,
                code,
                createdAt: Date.now()
            }
        });
        res.json({ ...customer, createdAt: Number(customer.createdAt) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

// UPDATE customer - WITH VALIDATION
router.put('/customers/:id', validate(customerUpdateSchema), async (req, res) => {
    try {
        const { id, ...data } = req.body;

        console.log('PUT /customers/:id - Received data:', data);
        console.log('createdAt in data:', data.createdAt, typeof data.createdAt);

        // Check for duplicate taxId (excluding current record)
        if (data.taxId) {
            const existing = await prisma.customer.findFirst({
                where: {
                    taxId: data.taxId,
                    id: { not: req.params.id }
                }
            });
            if (existing) {
                return res.status(400).json({
                    error: `Tax ID "${data.taxId}" already exists`
                });
            }
        }

        // Convert createdAt from number to BigInt if present
        const updateData = { ...data };
        if (updateData.createdAt !== undefined) {
            updateData.createdAt = BigInt(updateData.createdAt);
            console.log('Converted createdAt to BigInt:', updateData.createdAt);
        }

        const customer = await prisma.customer.update({
            where: { id: req.params.id },
            data: updateData
        });

        console.log('Updated customer createdAt:', customer.createdAt);

        res.json({ ...customer, createdAt: Number(customer.createdAt) });
    } catch (error) {
        console.error('PUT /customers/:id error:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

// DELETE customer
router.delete('/customers/:id', async (req, res) => {
    try {
        // Prevent deleting customers referenced by shipments or finance costs
        const [shipmentsUsing, costsUsing] = await Promise.all([
            shipmentDb.shipment.count({ where: { customerId: req.params.id } }),
            financeDb.shipmentCost.count({ where: { settlementUnitType: 'customer', settlementUnitId: req.params.id } })
        ]);

        if (shipmentsUsing > 0 || costsUsing > 0) {
            return res.status(400).json({
                error: 'Customer is referenced by shipments or costs and cannot be deleted. Please disable instead.'
            });
        }

        await prisma.customer.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

// DISABLE/ENABLE customer (soft status toggle)
router.put('/customers/:id/status', async (req, res) => {
    try {
        const { isActive } = req.body as { isActive?: boolean };
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ error: 'isActive must be a boolean' });
        }

        const updated = await prisma.customer.update({
            where: { id: req.params.id },
            data: { isActive }
        });

        res.json({ ...updated, createdAt: Number(updated.createdAt) });
    } catch (error) {
        console.error('PUT /customers/:id/status error:', error);
        res.status(500).json({ error: 'Failed to update customer status' });
    }
});

// --- SETTINGS: COMPANY INFO ---
router.get('/settings/company', async (req, res) => {
    try {
        let info = await prisma.companyInfo.findUnique({ where: { id: 1 } });
        if (!info) {
            // Default empty initialization
            info = await prisma.companyInfo.create({
                data: {
                    nameEn: '', nameTh: '', addressEn: '', addressTh: '',
                    taxId: '', bankName: '', bankAccountThb: '', bankAccountUsd: '',
                    bankAddress: '', swiftCode: ''
                }
            });
        }
        res.json(info);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch company info' });
    }
});

router.put('/settings/company', validate(companyInfoSchema), async (req, res) => {
    try {
        const data = req.body;
        const info = await prisma.companyInfo.upsert({
            where: { id: 1 },
            update: data,
            create: { ...data, id: 1 }
        });
        res.json(info);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update company info' });
    }
});

// --- SETTINGS: SUPPLIER TYPES ---
router.get('/settings/supplier-types', async (req, res) => {
    try {
        const types = await prisma.supplierType.findMany();
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch supplier types' });
    }
});

router.post('/settings/supplier-types', validate(supplierTypeSchema), async (req, res) => {
    try {
        const { nameZh, nameEn } = req.body;

        // Check for duplicates
        const existingZh = await prisma.supplierType.findUnique({ where: { nameZh } });
        const existingEn = await prisma.supplierType.findUnique({ where: { nameEn } });

        if (existingZh) {
            return res.status(400).json({ error: `中文名称 "${nameZh}" 已存在` });
        }
        if (existingEn) {
            return res.status(400).json({ error: `英文名称 "${nameEn}" 已存在` });
        }

        const type = await prisma.supplierType.create({
            data: { nameZh, nameEn }
        });
        res.json(type);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create supplier type' });
    }
});

router.put('/settings/supplier-types/:id', validate(supplierTypeSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { nameZh, nameEn } = req.body;

        // Check for duplicates (excluding current record)
        const existingZh = await prisma.supplierType.findFirst({
            where: { nameZh, id: { not: Number(id) } }
        });
        const existingEn = await prisma.supplierType.findFirst({
            where: { nameEn, id: { not: Number(id) } }
        });

        if (existingZh) {
            return res.status(400).json({ error: `中文名称 "${nameZh}" 已存在` });
        }
        if (existingEn) {
            return res.status(400).json({ error: `英文名称 "${nameEn}" 已存在` });
        }

        const type = await prisma.supplierType.update({
            where: { id: Number(id) },
            data: { nameZh, nameEn }
        });
        res.json(type);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update supplier type' });
    }
});

router.delete('/settings/supplier-types/:id', async (req, res) => {
    try {
        await prisma.supplierType.delete({
            where: { id: Number(req.params.id) }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete supplier type' });
    }
});

// --- SETTINGS: TRANSPORT TYPES ---
router.get('/settings/transport-types', async (req, res) => {
    try {
        const types = await prisma.transportType.findMany();
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transport types' });
    }
});

router.post('/settings/transport-types', validate(supplierTypeSchema), async (req, res) => {
    try {
        const { nameZh, nameEn } = req.body;
        const existingZh = await prisma.transportType.findUnique({ where: { nameZh } });
        const existingEn = await prisma.transportType.findUnique({ where: { nameEn } });

        if (existingZh) return res.status(400).json({ error: `中文名称 "${nameZh}" 已存在` });
        if (existingEn) return res.status(400).json({ error: `英文名称 "${nameEn}" 已存在` });

        const type = await prisma.transportType.create({ data: { nameZh, nameEn } });
        res.json(type);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create transport type' });
    }
});

router.put('/settings/transport-types/:id', validate(supplierTypeSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { nameZh, nameEn } = req.body;
        const existingZh = await prisma.transportType.findFirst({ where: { nameZh, id: { not: Number(id) } } });
        const existingEn = await prisma.transportType.findFirst({ where: { nameEn, id: { not: Number(id) } } });

        if (existingZh) return res.status(400).json({ error: `中文名称 "${nameZh}" 已存在` });
        if (existingEn) return res.status(400).json({ error: `英文名称 "${nameEn}" 已存在` });

        const type = await prisma.transportType.update({ where: { id: Number(id) }, data: { nameZh, nameEn } });
        res.json(type);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update transport type' });
    }
});

router.delete('/settings/transport-types/:id', async (req, res) => {
    try {
        await prisma.transportType.delete({ where: { id: Number(req.params.id) } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete transport type' });
    }
});

// --- SETTINGS: BUSINESS TYPES ---
router.get('/settings/business-types', async (req, res) => {
    try {
        const types = await prisma.businessType.findMany();
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch business types' });
    }
});

router.post('/settings/business-types', validate(supplierTypeSchema), async (req, res) => {
    try {
        const { nameZh, nameEn } = req.body;
        const existingZh = await prisma.businessType.findUnique({ where: { nameZh } });
        const existingEn = await prisma.businessType.findUnique({ where: { nameEn } });

        if (existingZh) return res.status(400).json({ error: `中文名称 "${nameZh}" 已存在` });
        if (existingEn) return res.status(400).json({ error: `英文名称 "${nameEn}" 已存在` });

        const type = await prisma.businessType.create({ data: { nameZh, nameEn } });
        res.json(type);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create business type' });
    }
});

router.put('/settings/business-types/:id', validate(supplierTypeSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { nameZh, nameEn } = req.body;
        const existingZh = await prisma.businessType.findFirst({ where: { nameZh, id: { not: Number(id) } } });
        const existingEn = await prisma.businessType.findFirst({ where: { nameEn, id: { not: Number(id) } } });

        if (existingZh) return res.status(400).json({ error: `中文名称 "${nameZh}" 已存在` });
        if (existingEn) return res.status(400).json({ error: `英文名称 "${nameEn}" 已存在` });

        const type = await prisma.businessType.update({ where: { id: Number(id) }, data: { nameZh, nameEn } });
        res.json(type);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update business type' });
    }
});

router.delete('/settings/business-types/:id', async (req, res) => {
    try {
        await prisma.businessType.delete({ where: { id: Number(req.params.id) } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete business type' });
    }
});

// --- SETTINGS: TRADE TERMS ---
router.get('/settings/trade-terms', async (req, res) => {
    try {
        const types = await prisma.tradeTerms.findMany();
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch trade terms' });
    }
});

router.post('/settings/trade-terms', validate(supplierTypeSchema), async (req, res) => {
    try {
        const { nameZh, nameEn } = req.body;
        const existingZh = await prisma.tradeTerms.findUnique({ where: { nameZh } });
        const existingEn = await prisma.tradeTerms.findUnique({ where: { nameEn } });

        if (existingZh) return res.status(400).json({ error: `中文名称 "${nameZh}" 已存在` });
        if (existingEn) return res.status(400).json({ error: `英文名称 "${nameEn}" 已存在` });

        const type = await prisma.tradeTerms.create({ data: { nameZh, nameEn } });
        res.json(type);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create trade terms' });
    }
});

router.put('/settings/trade-terms/:id', validate(supplierTypeSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { nameZh, nameEn } = req.body;
        const existingZh = await prisma.tradeTerms.findFirst({ where: { nameZh, id: { not: Number(id) } } });
        const existingEn = await prisma.tradeTerms.findFirst({ where: { nameEn, id: { not: Number(id) } } });

        if (existingZh) return res.status(400).json({ error: `中文名称 "${nameZh}" 已存在` });
        if (existingEn) return res.status(400).json({ error: `英文名称 "${nameEn}" 已存在` });

        const type = await prisma.tradeTerms.update({ where: { id: Number(id) }, data: { nameZh, nameEn } });
        res.json(type);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update trade terms' });
    }
});

router.delete('/settings/trade-terms/:id', async (req, res) => {
    try {
        await prisma.tradeTerms.delete({ where: { id: Number(req.params.id) } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete trade terms' });
    }
});

// --- SETTINGS: LOADING METHODS ---
router.get('/settings/loading-methods', async (req, res) => {
    try {
        const types = await prisma.loadingMethod.findMany();
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch loading methods' });
    }
});

router.post('/settings/loading-methods', validate(supplierTypeSchema), async (req, res) => {
    try {
        const { nameZh, nameEn } = req.body;
        const existingZh = await prisma.loadingMethod.findUnique({ where: { nameZh } });
        const existingEn = await prisma.loadingMethod.findUnique({ where: { nameEn } });

        if (existingZh) return res.status(400).json({ error: `中文名称 "${nameZh}" 已存在` });
        if (existingEn) return res.status(400).json({ error: `英文名称 "${nameEn}" 已存在` });

        const type = await prisma.loadingMethod.create({ data: { nameZh, nameEn } });
        res.json(type);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create loading method' });
    }
});

router.put('/settings/loading-methods/:id', validate(supplierTypeSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { nameZh, nameEn } = req.body;
        const existingZh = await prisma.loadingMethod.findFirst({ where: { nameZh, id: { not: Number(id) } } });
        const existingEn = await prisma.loadingMethod.findFirst({ where: { nameEn, id: { not: Number(id) } } });

        if (existingZh) return res.status(400).json({ error: `中文名称 "${nameZh}" 已存在` });
        if (existingEn) return res.status(400).json({ error: `英文名称 "${nameEn}" 已存在` });

        const type = await prisma.loadingMethod.update({ where: { id: Number(id) }, data: { nameZh, nameEn } });
        res.json(type);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update loading method' });
    }
});

router.delete('/settings/loading-methods/:id', async (req, res) => {
    try {
        await prisma.loadingMethod.delete({ where: { id: Number(req.params.id) } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete loading method' });
    }
});

