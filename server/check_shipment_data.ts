
import { shipmentDb } from './src/db';

async function checkShipmentData() {
    try {
        console.log('Querying latest shipments...');
        const shipments = await shipmentDb.shipment.findMany({
            take: 5,
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                code: true,
                blNumber: true,
                consignee: true,
                updatedAt: true
            }
        });

        console.log('Latest 5 Shipments in DB:');
        console.log(JSON.stringify(shipments, null, 2));

    } catch (error) {
        console.error('Error querying database:', error);
    } finally {
        await shipmentDb.$disconnect();
    }
}

checkShipmentData();
