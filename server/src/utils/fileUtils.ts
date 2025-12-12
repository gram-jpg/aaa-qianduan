import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

/**
 * Calculate MD5 hash of a file buffer
 */
export function calculateFileHash(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex');
}

/**
 * Generate storage path for attachment
 * Format: /storage/attachments/hot/{YEAR}/{MONTH}/{BUSINESS_CODE}/{filename}
 */
export function generateStoragePath(businessCode: string, fileName: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    return `/storage/attachments/hot/${year}/${month}/${businessCode}/${fileName}`;
}

/**
 * Generate unique filename with UUID
 */
export function generateUniqueFileName(originalName: string): string {
    const ext = path.extname(originalName);
    const uuid = crypto.randomUUID();
    return `${uuid}${ext}`;
}

/**
 * Ensure directory exists, create if not
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

/**
 * Save file to storage
 */
export async function saveFile(buffer: Buffer, storagePath: string): Promise<void> {
    const fullPath = path.join(process.cwd(), storagePath);
    const dir = path.dirname(fullPath);

    await ensureDirectory(dir);
    await fs.writeFile(fullPath, buffer);
}

/**
 * Delete file from storage
 */
export async function deleteFile(storagePath: string): Promise<void> {
    const fullPath = path.join(process.cwd(), storagePath);
    try {
        await fs.unlink(fullPath);
    } catch (error) {
        console.error(`Failed to delete file ${storagePath}:`, error);
    }
}

/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
