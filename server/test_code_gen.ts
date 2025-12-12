// Native fetch used

async function testCodeGen() {
    console.log('Testing Automatic Code Generation...');

    try {
        const res = await fetch('http://localhost:3002/api/shipments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId: "2ec7a2af-0c76-437c-b6d6-10a139b64dc1",
                transportTypeId: 1,
                businessTypeId: 1,
                status: 'draft',
                // NO CODE PROVIDED - Should be auto-generated
                commodities: []
            })
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed: ${res.status} ${text}`);
        }

        const data = await res.json() as any;
        console.log('Response Data:', data);

        if (data.code && data.code.startsWith('Rsl-')) {
            console.log('✅ SUCCESS: Code generated:', data.code);
        } else {
            console.log('❌ FAILED: Code format incorrect:', data.code);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testCodeGen();
