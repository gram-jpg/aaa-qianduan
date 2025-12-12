import { prisma, shipmentDb } from '../db';

/**
 * Generate a unique 7-digit code for suppliers or customers
 * Format: 1000000 - 9999999
 */
export async function generateUniqueCode(type: 'supplier' | 'customer'): Promise<string> {
    let code: string;
    let exists = true;

    while (exists) {
        // Generate random 7-digit number
        code = String(Math.floor(1000000 + Math.random() * 9000000));

        // Check if code already exists
        if (type === 'supplier') {
            const existing = await prisma.supplier.findUnique({ where: { code } });
            exists = !!existing;
        } else {
            const existing = await prisma.customer.findUnique({ where: { code } });
            exists = !!existing;
        }
    }

    return code!;
}

/**
 * Generate a unique shipment code
 * Format: Rsl-YYMMDDNNN (e.g., Rsl-250101001)
 */
export async function generateShipmentCode(): Promise<string> {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const dateKey = `${year}${month}${day}`;
    const prefix = `Rsl-${dateKey}`;

    const seq = await shipmentDb.$transaction(async (tx) => {
        const existing = await tx.shipmentCodeSequence.findUnique({ where: { dateKey } });
        if (!existing) {
            const last = await tx.shipment.findFirst({
                where: { code: { startsWith: prefix } },
                orderBy: { code: 'desc' }
            });
            let initial = 1;
            if (last) {
                const lastSeq = parseInt(last.code.slice(-3));
                if (!isNaN(lastSeq)) initial = lastSeq + 1;
            }
            const created = await tx.shipmentCodeSequence.create({ data: { dateKey, seq: initial } });
            return created.seq;
        }
        const updated = await tx.shipmentCodeSequence.update({ where: { dateKey }, data: { seq: { increment: 1 } } });
        return updated.seq;
    });

    const sequenceStr = String(seq).padStart(3, '0');
    return `${prefix}${sequenceStr}`;
}
