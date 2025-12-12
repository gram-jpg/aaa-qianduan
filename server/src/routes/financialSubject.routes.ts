import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// GET all
router.get('/', async (req, res) => {
    try {
        const subjects = await prisma.financialSubject.findMany({
            orderBy: { id: 'asc' }
        });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch financial subjects' });
    }
});

// CREATE
router.post('/', async (req, res) => {
    try {
        const { nameZh, nameEn } = req.body;

        // Basic Validation
        if (!nameZh || !nameEn) {
            return res.status(400).json({ error: 'Name (Chinese) and Name (English) are required' });
        }

        // Check for duplicates
        const existing = await prisma.financialSubject.findFirst({
            where: {
                OR: [
                    { nameZh },
                    { nameEn }
                ]
            }
        });

        if (existing) {
            return res.status(400).json({ error: 'Financial Subject with this name already exists' });
        }

        const subject = await prisma.financialSubject.create({
            data: { nameZh, nameEn }
        });
        res.json(subject);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create financial subject' });
    }
});

// UPDATE
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nameZh, nameEn } = req.body;

    try {
        // Check if exists
        const existing = await prisma.financialSubject.findUnique({
            where: { id: Number(id) }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Financial Subject not found' });
        }

        // Check for duplicates (excluding self)
        const duplicate = await prisma.financialSubject.findFirst({
            where: {
                AND: [
                    { id: { not: Number(id) } },
                    {
                        OR: [
                            { nameZh },
                            { nameEn }
                        ]
                    }
                ]
            }
        });

        if (duplicate) {
            return res.status(400).json({ error: 'Another Financial Subject with this name already exists' });
        }

        const updated = await prisma.financialSubject.update({
            where: { id: Number(id) },
            data: { nameZh, nameEn }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update financial subject' });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.financialSubject.delete({
            where: { id: Number(id) }
        });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete financial subject' });
    }
});

export default router;
