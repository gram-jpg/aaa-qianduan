// @ts-nocheck
// import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3002/api';

async function testCustomerBatch() {
    console.log('--- Testing Customer Batch Import ---');
    const customers = [
        {
            companyNameEn: 'Batch Test Co 1',
            companyNameTh: 'Batch TH 1',
            taxId: 'BATCH00000001',
            addressEn: '123 Test St',
            addressTh: '123 Test Rd'
        },
        {
            companyNameEn: 'Batch Test Co 2',
            companyNameTh: 'Batch TH 2',
            taxId: 'BATCH00000002',
            addressEn: '456 Test St',
            addressTh: '456 Test Rd'
        },
        {
            companyNameEn: 'Invalid Co',
            taxId: 'BATCH00000001', // Duplicate taxId (should fail)
            addressEn: 'Fail'
        }
    ];

    try {
        const res = await fetch(`${BASE_URL}/customers/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customers)
        });
        const result = await res.json();
        console.log('Status:', res.status);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Customer Batch Failed:', error);
    }
}

async function testSupplierBatch() {
    console.log('\n--- Testing Supplier Batch Import ---');

    // Fetch valid types first
    let validTypeName = 'Transport';
    try {
        const typeRes = await fetch(`${BASE_URL}/settings/supplier-types`);
        const types = await typeRes.json();
        if (Array.isArray(types) && types.length > 0) {
            validTypeName = types[0].nameEn;
            console.log('Using Supplier Type:', validTypeName);
        } else {
            console.log('No supplier types found. Creating one...');
            // Optional: Create a type if none exist
            const newTypeRes = await fetch(`${BASE_URL}/settings/supplier-types`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nameZh: '测试类型', nameEn: 'Test Type' })
            });
            const newType = await newTypeRes.json();
            validTypeName = newType.nameEn;
        }
    } catch (e) {
        console.error('Failed to fetch types:', e);
    }

    const suppliers = [
        {
            entityType: 'company',
            companyNameEn: 'Batch Supplier 1',
            taxIdCompany: 'SUPP00000001',
            supplierTypeName: validTypeName,
            addressEn: '789 Supp St'
        },
        {
            entityType: 'company',
            companyNameEn: 'Batch Supplier 2',
            taxIdCompany: 'SUPP00000001', // Duplicate (should fail)
            supplierTypeName: validTypeName
        }
    ];

    try {
        const res = await fetch(`${BASE_URL}/suppliers/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(suppliers)
        });
        const result = await res.json();
        console.log('Status:', res.status);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Supplier Batch Failed:', error);
    }
}

async function run() {
    await testCustomerBatch();
    await testSupplierBatch();
}

run();
