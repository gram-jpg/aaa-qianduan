import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { attachmentsDb } from '../db/attachments';
import {
    calculateFileHash,
    generateStoragePath,
    generateUniqueFileName,
    saveFile,
    deleteFile
} from '../utils/fileUtils';

export const attachmentRouter = Router();

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// GET /api/attachments - Get attachments by business code
attachmentRouter.get('/', async (req, res) => {
    try {
        const { businessCode, customerId, storageType } = req.query;

        const where: any = {};
        if (businessCode) where.businessCode = businessCode as string;
        if (customerId) where.customerId = customerId as string;
        if (storageType) where.storageType = storageType as string;

        const attachments = await attachmentsDb.attachment.findMany({
            where,
            orderBy: { uploadedAt: 'desc' }
        });

        res.json(attachments);
    } catch (error) {
        console.error('GET /attachments error:', error);
        res.status(500).json({ error: 'Failed to fetch attachments' });
    }
});

// POST /api/attachments/upload - Upload attachment
attachmentRouter.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const {
            businessCode,
            customerId,
            customerName,
            category,
            billOfLading,
            description
        } = req.body;

        // Validate required fields
        if (!businessCode || !customerId || !customerName) {
            return res.status(400).json({
                error: 'businessCode, customerId, and customerName are required'
            });
        }

        // Fix filename encoding: multer uses Latin1 by default, convert to UTF-8
        const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

        // Calculate file hash
        const fileHash = calculateFileHash(req.file.buffer);

        // Check if file already exists (deduplication)
        const existing = await attachmentsDb.attachment.findFirst({
            where: { fileHash, businessCode }
        });

        if (existing) {
            return res.json({
                message: 'File already exists',
                attachment: existing
            });
        }

        // Generate unique filename (preserve extension from original name)
        const fileName = generateUniqueFileName(originalName);

        // Generate storage path
        const storagePath = generateStoragePath(businessCode, fileName);

        // Save file to disk
        await saveFile(req.file.buffer, storagePath);

        // Create database record
        const attachment = await attachmentsDb.attachment.create({
            data: {
                businessCode,
                customerId,
                customerName,
                fileName,
                originalName,  // Now properly encoded in UTF-8
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                fileHash,
                storageType: 'hot',
                storagePath,
                category: category || 'other',
                billOfLading: billOfLading || null,
                description: description || null
            }
        });

        res.json(attachment);
    } catch (error) {
        console.error('POST /attachments/upload error:', error);
        res.status(500).json({ error: 'Failed to upload attachment' });
    }
});

// POST /api/attachments/batch-delete - Batch delete attachments
attachmentRouter.post('/batch-delete', async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Invalid attachment IDs' });
        }

        // Get all attachments to delete
        const attachments = await attachmentsDb.attachment.findMany({
            where: { id: { in: ids } }
        });

        // Delete files from storage
        for (const attachment of attachments) {
            if (attachment.storageType === 'hot') {
                await deleteFile(attachment.storagePath);
            }
        }

        // Delete database records
        await attachmentsDb.attachment.deleteMany({
            where: { id: { in: ids } }
        });

        res.json({ success: true, deletedCount: attachments.length });
    } catch (error) {
        console.error('POST /attachments/batch-delete error:', error);
        res.status(500).json({ error: 'Failed to batch delete attachments' });
    }
});

// GET /api/attachments/stats/summary - Get attachment statistics
attachmentRouter.get('/stats/summary', async (req, res) => {
    try {
        const { businessCode } = req.query;

        const where = businessCode ? { businessCode: businessCode as string } : {};

        const [total, hotCount, coldCount, totalSize] = await Promise.all([
            attachmentsDb.attachment.count({ where }),
            attachmentsDb.attachment.count({ where: { ...where, storageType: 'hot' } }),
            attachmentsDb.attachment.count({ where: { ...where, storageType: 'cold' } }),
            attachmentsDb.attachment.aggregate({
                where,
                _sum: { fileSize: true }
            })
        ]);

        res.json({
            total,
            hot: hotCount,
            cold: coldCount,
            totalSize: totalSize._sum.fileSize || 0
        });
    } catch (error) {
        console.error('GET /attachments/stats/summary error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// GET /api/attachments/:id - Get single attachment
attachmentRouter.get('/:id', async (req, res) => {
    try {
        const attachment = await attachmentsDb.attachment.findUnique({
            where: { id: req.params.id }
        });

        if (!attachment) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        res.json(attachment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch attachment' });
    }
});

// GET /api/attachments/:id/download - Download attachment
attachmentRouter.get('/:id/download', async (req, res) => {
    try {
        const attachment = await attachmentsDb.attachment.findUnique({
            where: { id: req.params.id }
        });

        if (!attachment) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        // Log access
        await attachmentsDb.attachmentAccessLog.create({
            data: {
                attachmentId: attachment.id,
                accessType: 'download',
                ipAddress: req.ip || 'unknown'
            }
        });

        // Update last accessed time
        await attachmentsDb.attachment.update({
            where: { id: attachment.id },
            data: { lastAccessedAt: new Date() }
        });

        const publicBase = process.env.ATTACHMENTS_PUBLIC_BASE_URL;
        if (publicBase) {
            const normalized = attachment.storagePath.startsWith('/')
                ? attachment.storagePath
                : `/${attachment.storagePath}`;
            const url = `${publicBase}${normalized}`;
            return res.redirect(url);
        }

        if (attachment.storageType === 'hot') {
            const fullPath = path.join(process.cwd(), attachment.storagePath);
            res.download(fullPath, attachment.originalName);
        } else {
            res.status(501).json({
                error: 'Cold storage download not implemented yet',
                message: 'This file is in cold storage. Please contact administrator.'
            });
        }
    } catch (error) {
        console.error('GET /attachments/:id/download error:', error);
        res.status(500).json({ error: 'Failed to download attachment' });
    }
});

// DELETE /api/attachments/:id - Delete attachment
attachmentRouter.delete('/:id', async (req, res) => {
    try {
        const attachment = await attachmentsDb.attachment.findUnique({
            where: { id: req.params.id }
        });

        if (!attachment) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        // Delete file from storage (only if hot storage)
        if (attachment.storageType === 'hot') {
            await deleteFile(attachment.storagePath);
        }

        // Delete database record
        await attachmentsDb.attachment.delete({
            where: { id: req.params.id }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('DELETE /attachments/:id error:', error);
        res.status(500).json({ error: 'Failed to delete attachment' });
    }
});
