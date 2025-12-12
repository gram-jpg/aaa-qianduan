/**
 * Generate unique shipment code in format: RSL-YYMMDD-XXX
 * Example: RSL-250107-001
 */
export async function generateShipmentCode(prisma: any): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;

    // Find the last shipment code for today
    const lastShipment = await prisma.shipment.findFirst({
        where: {
            code: {
                startsWith: `RSL-${datePrefix}`
            }
        },
        orderBy: {
            code: 'desc'
        }
    });

    let sequence = 1;
    if (lastShipment) {
        const lastSequence = parseInt(lastShipment.code.split('-')[2]);
        sequence = lastSequence + 1;
    }

    return `RSL-${datePrefix}-${sequence.toString().padStart(3, '0')}`;
}
