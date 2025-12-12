import { Router } from 'express';
import { prisma } from '../db';
import { validate } from '../middleware/validate';
import { supplierSchema } from '../schemas/supplier.schema';
import { generateUniqueCode } from '../utils/codeGenerator';

export const supplierRouter = Router();

// GET all suppliers
supplierRouter.get('/', async (req, res) => {
    try {
        const suppliers = await prisma.supplier.findMany({
            include: {
                supplierType: true,
                bankAccounts: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(suppliers);
    } catch (error) {
        console.error('GET /suppliers error:', error);
        res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
});

// GET one supplier
supplierRouter.get('/:id', async (req, res) => {
    try {
        const supplier = await prisma.supplier.findUnique({
            where: { id: req.params.id },
            include: {
                supplierType: true,
                bankAccounts: true
            }
        });
        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        res.json(supplier);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch supplier' });
    }
});

// CREATE supplier - WITH VALIDATION
supplierRouter.post('/batch', async (req, res) => {
    try {
        const suppliers = req.body;
        if (!Array.isArray(suppliers)) {
            return res.status(400).json({ error: 'Input must be an array' });
        }

        let successCount = 0;
        let failureCount = 0;
        const errors: any[] = [];

        // Pre-fetch supplier types for resolution
        const allTypes = await prisma.supplierType.findMany();

        for (let i = 0; i < suppliers.length; i++) {
            const data = suppliers[i];
            const rowNumber = i + 1;

            try {
                // 1. Basic Validation
                if (!data.entityType) throw new Error('Missing entityType');
                if (data.entityType === 'company' && !data.companyNameEn) throw new Error('Company requires companyNameEn');
                // if (data.entityType === 'individual' && !data.fullName) throw new Error('Individual requires fullName');

                // 2. Resolve Supplier Type
                let typeId = 1; // Default fallback
                if (data.supplierTypeName) {
                    const matchedType = allTypes.find(t =>
                        t.nameEn.toLowerCase() === data.supplierTypeName.toLowerCase() ||
                        t.nameZh === data.supplierTypeName
                    );
                    if (matchedType) typeId = matchedType.id;
                    else throw new Error(`Unknown Supplier Type: ${data.supplierTypeName}`);
                } else if (data.supplierTypeId) {
                    typeId = Number(data.supplierTypeId);
                }

                // 3. Check Duplicates
                if (data.entityType === 'company' && data.taxIdCompany) {
                    const existing = await prisma.supplier.findUnique({
                        where: { taxIdCompany: data.taxIdCompany }
                    });
                    if (existing) throw new Error(`Tax ID "${data.taxIdCompany}" already exists`);
                }

                // 4. Create
                const code = await generateUniqueCode('supplier');

                await prisma.supplier.create({
                    data: {
                        code,
                        entityType: data.entityType,
                        supplierTypeId: typeId,
                        shortName: data.shortName,
                        fullName: data.fullName,
                        taxIdIndividual: data.taxIdIndividual,
                        addressIndividual: data.addressIndividual,
                        companyNameEn: data.companyNameEn,
                        companyNameTh: data.companyNameTh,
                        taxIdCompany: data.taxIdCompany,
                        addressEn: data.addressEn,
                        addressTh: data.addressTh,
                        branchCode: data.branchCode,
                        bankAccounts: {
                            create: data.bankName && data.accountNo ? [{
                                bankName: data.bankName,
                                accountNo: data.accountNo,
                                currency: data.currency || 'THB',
                                bankAddress: data.bankAddress,
                                branchCode: data.branchCode
                            }] : []
                        }
                    }
                });

                successCount++;
            } catch (error) {
                failureCount++;
                errors.push({
                    row: rowNumber,
                    name: data.companyNameEn || data.fullName || 'Unknown',
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }

        res.json({
            successCount,
            failureCount,
            errors,
            message: `Successfully imported ${successCount} suppliers. Failed: ${failureCount}.`
        });

    } catch (error) {
        console.error('Supplier batch import error:', error);
        res.status(500).json({ error: 'Batch import failed' });
    }
});

// CREATE supplier - WITH VALIDATION
supplierRouter.post('/', validate(supplierSchema), async (req, res) => {
    try {
        const { bankAccounts, ...supplierData } = req.body;

        // Check for duplicate taxIdCompany if entity is company
        if (supplierData.entityType === 'company' && supplierData.taxIdCompany) {
            const existing = await prisma.supplier.findUnique({
                where: { taxIdCompany: supplierData.taxIdCompany }
            });
            if (existing) {
                return res.status(400).json({
                    error: `Tax ID "${supplierData.taxIdCompany}" already exists`
                });
            }
        }

        // Generate unique code
        const code = await generateUniqueCode('supplier');

        // Create supplier with bank accounts in a transaction
        const supplier = await prisma.supplier.create({
            data: {
                ...supplierData,
                code,
                bankAccounts: {
                    create: bankAccounts
                }
            },
            include: {
                supplierType: true,
                bankAccounts: true
            }
        });
        res.json(supplier);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create supplier' });
    }
});

// UPDATE supplier - WITH VALIDATION
supplierRouter.put('/:id', validate(supplierSchema), async (req, res) => {
    try {
        const { bankAccounts, ...supplierData } = req.body;

        // Check for duplicate taxIdCompany (excluding current record)
        if (supplierData.entityType === 'company' && supplierData.taxIdCompany) {
            const existing = await prisma.supplier.findFirst({
                where: {
                    taxIdCompany: supplierData.taxIdCompany,
                    id: { not: req.params.id }
                }
            });
            if (existing) {
                return res.status(400).json({
                    error: `Tax ID "${supplierData.taxIdCompany}" already exists`
                });
            }
        }

        // Update supplier and replace all bank accounts
        const supplier = await prisma.supplier.update({
            where: { id: req.params.id },
            data: {
                ...supplierData,
                bankAccounts: {
                    deleteMany: {},  // Delete all existing
                    create: bankAccounts  // Create new ones
                }
            },
            include: {
                supplierType: true,
                bankAccounts: true
            }
        });
        res.json(supplier);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update supplier' });
    }
});

// DELETE supplier
supplierRouter.delete('/:id', async (req, res) => {
    try {
        await prisma.supplier.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete supplier' });
    }
});
