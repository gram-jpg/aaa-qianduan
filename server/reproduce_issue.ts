
import { generateShipmentCode } from './src/utils/codeGenerator';
import { shipmentDb } from './src/db';

async function test() {
    console.log("Testing Code Generation...");
    try {
        const code = await generateShipmentCode();
        console.log("Generated Code:", code);

        // Check format
        const regex = /^Rsl-\d{6}\d{3}$/;
        if (regex.test(code)) {
            console.log("✅ Format is correct (Rsl-YYMMDDNNN)");
        } else {
            console.error("❌ Format is INCORRECT:", code);
        }

        console.log("Testing DB Creation...");
        const shipment = await shipmentDb.shipment.create({
            data: {
                customerId: 'test-customer-id', // This might fail if foreign key constraints exist in prisma but this is a separate DB?
                // Shipment schema calls for customerId string, but doesn't relate it to mainDb in schema level (it's loose)
                transportTypeId: 1,
                businessTypeId: 1,
                status: 'draft',
                code: code
            }
        });
        console.log("✅ Shipment Created:", shipment.id, shipment.code);

        // Clean up
        await shipmentDb.shipment.delete({ where: { id: shipment.id } });
        console.log("Cleaned up.");

    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        // Disconnect
        await shipmentDb.$disconnect();
    }
}

test();
