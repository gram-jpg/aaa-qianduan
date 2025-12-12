import { PrismaClient as FinancePrismaClient } from '@prisma/finance-client';

/**
 * Generate a unique expense application number
 * Format: F + YYMMDD + 序号 (e.g., F250101001)
 * 
 * - F is fixed prefix
 * - YY is year (e.g., 25 for 2025)
 * - MM is month (01-12)
 * - DD is day (01-31)
 * - Sequence is 3-digit incrementing number (001-999) that resets daily
 */
export async function generateApplicationNumber(financeDb: FinancePrismaClient): Promise<string> {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2); // 25
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 01
    const day = String(now.getDate()).padStart(2, '0'); // 01

    const prefix = `F${year}${month}${day}`; // F250101

    // Get today's date range (start of day to end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find the last application number created today
    const lastApplication = await financeDb.expenseApplication.findFirst({
        where: {
            createdAt: {
                gte: today,
                lt: tomorrow
            }
        },
        orderBy: {
            applicationNumber: 'desc'
        }
    });

    let sequence = 1;

    if (lastApplication) {
        // Extract the last 3 digits as sequence number
        const lastSequence = parseInt(lastApplication.applicationNumber.slice(-3));
        if (!isNaN(lastSequence)) {
            sequence = lastSequence + 1;
        }
    }

    // Check if we've exceeded daily limit (999)
    if (sequence > 999) {
        throw new Error('申请号序号已达当日上限(999)，请联系管理员');
    }

    // Format sequence as 3-digit number with leading zeros
    const seqStr = String(sequence).padStart(3, '0');

    return `${prefix}${seqStr}`; // F250101001
}
