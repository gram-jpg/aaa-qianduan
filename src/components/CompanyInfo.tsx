import React, { useEffect, useState } from 'react';
import { Save, Edit2 } from 'lucide-react';

interface CompanyData {
    nameEn: string;
    nameTh: string;
    addressEn: string;
    addressTh: string;
    taxId: string;
    bankName: string;
    bankAccountThb: string;
    bankAccountUsd: string;
    bankAddress: string;
    swiftCode: string;
}

export const CompanyInfo: React.FC = () => {
    const [data, setData] = useState<CompanyData>({
        nameEn: '', nameTh: '', addressEn: '', addressTh: '',
        taxId: '', bankName: '', bankAccountThb: '', bankAccountUsd: '',
        bankAddress: '', swiftCode: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/settings/company')
            .then(res => res.json())
            .then(data => {
                setData(data);
                setIsLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    const handleSave = async () => {
        try {
            const res = await fetch('/api/settings/company', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Failed to save company info', error);
        }
    };

    if (isLoading) return <div>Loading...</div>;

    const Field = ({ label, field, placeholder }: { label: string; field: keyof CompanyData; placeholder?: string }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>{label}</label>
            {isEditing ? (
                <input
                    type="text"
                    value={data[field]}
                    onChange={e => setData(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={placeholder}
                    style={{
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px'
                    }}
                />
            ) : (
                <div style={{ padding: '8px 0', fontSize: '14px', borderBottom: '1px solid #f1f5f9' }}>
                    {data[field] || <span style={{ color: '#cbd5e1' }}>-</span>}
                </div>
            )}
        </div>
    );

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600 }}>企业信息 (Company Info)</h2>
                <div>
                    {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setIsEditing(false)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', background: 'white' }}>
                                Cancel
                            </button>
                            <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                <Save size={16} /> Save Changes
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', background: 'white' }}>
                            <Edit2 size={16} /> Edit Info
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: '#0f172a', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>Basic Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Field label="Company Name (English)" field="nameEn" />
                        <Field label="Company Name (Thai)" field="nameTh" />
                        <Field label="Address (English)" field="addressEn" />
                        <Field label="Address (Thai)" field="addressTh" />
                        <Field label="Tax ID" field="taxId" />
                    </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: '#0f172a', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>Bank Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Field label="Bank Name" field="bankName" />
                        <Field label="Bank Address" field="bankAddress" />
                        <Field label="Account No. (THB)" field="bankAccountThb" />
                        <Field label="Account No. (USD)" field="bankAccountUsd" />
                        <Field label="SWIFT Code" field="swiftCode" />
                    </div>
                </div>
            </div>
        </div>
    );
};
