import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCustomers } from '../context/CustomerContext';
import type { CustomerInput, Customer } from '../types';
import { Button, Input, TextArea, Card } from './UI';
import { Save, X } from 'lucide-react';

interface CustomerFormProps {
    onCancel: () => void;
    onSuccess: () => void;
    initialData?: Customer;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ onCancel, onSuccess, initialData }) => {
    const { t } = useLanguage();
    const { addCustomer, updateCustomer } = useCustomers();

    // Get today's date in YYYY-MM-DD format
    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState<CustomerInput>({
        companyNameEn: '',
        companyNameTh: '',
        shortName: '',
        addressEn: '',
        addressTh: '',
        mailingAddress: '',
        taxId: '',
        bankName: '',
        bankBranch: '',
        bankAccount: '',
        bankBranchCode: '',
        isActive: true,
    });

    const [createdAtDate, setCreatedAtDate] = useState<string>(getTodayDate());

    useEffect(() => {
        if (initialData) {
            const { createdAt, ...rest } = initialData;
            setFormData(rest);

            // Convert timestamp to date string
            if (createdAt) {
                const date = new Date(Number(createdAt));
                setCreatedAtDate(date.toISOString().split('T')[0]);
            }
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Convert date string to timestamp (milliseconds)
        const createdAtTimestamp = new Date(createdAtDate).getTime();

        const dataToSubmit = {
            ...formData,
            createdAt: createdAtTimestamp
        };

        if (initialData) {
            updateCustomer(initialData.id, dataToSubmit);
        } else {
            addCustomer(dataToSubmit);
        }
        onSuccess();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                    {initialData ? t('edit') : t('addCustomer')}
                </h2>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Input id="companyNameEn" label={t('companyNameEn')} value={formData.companyNameEn} onChange={handleChange} required />
                    <Input id="companyNameTh" label={t('companyNameTh')} value={formData.companyNameTh} onChange={handleChange} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Input id="shortName" label={t('shortName')} value={formData.shortName} onChange={handleChange} />
                    <Input id="taxId" label={t('taxId')} value={formData.taxId} onChange={handleChange} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <TextArea id="addressEn" label={t('addressEn')} value={formData.addressEn} onChange={handleChange} required />
                    <TextArea id="addressTh" label={t('addressTh')} value={formData.addressTh} onChange={handleChange} required />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <TextArea id="mailingAddress" label={t('mailingAddress')} value={formData.mailingAddress} onChange={handleChange} />
                </div>

                {/* Created At Date Field */}
                <div style={{ marginBottom: '1rem' }}>
                    <label
                        htmlFor="createdAt"
                        style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: 'var(--color-text-primary)'
                        }}
                    >
                        创建时间
                    </label>
                    <input
                        type="date"
                        id="createdAt"
                        value={createdAtDate}
                        onChange={(e) => setCreatedAtDate(e.target.value)}
                        className="input-field"
                        style={{
                            width: '100%',
                            padding: '0.625rem',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            fontSize: '0.875rem'
                        }}
                        required
                    />
                    <p style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                        marginTop: '0.25rem'
                    }}>
                        默认为今天，可手动修改
                    </p>
                </div>

                <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>{t('bankInfo')}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input id="bankName" label={t('bankName')} value={formData.bankName} onChange={handleChange} />
                        <Input id="bankBranch" label={t('bankBranch')} value={formData.bankBranch} onChange={handleChange} />
                        <Input id="bankAccount" label={t('bankAccount')} value={formData.bankAccount} onChange={handleChange} />
                        <Input id="bankBranchCode" label={t('bankBranchCode')} value={formData.bankBranchCode} onChange={handleChange} />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                    <Button type="button" variant="secondary" onClick={onCancel} style={{ background: 'transparent', border: '1px solid var(--color-border)' }}>
                        <X size={16} /> {t('cancel')}
                    </Button>
                    <Button type="submit" icon={Save}>
                        {initialData ? t('saveChanges') : t('save')}
                    </Button>
                </div>
            </form>
        </Card>
    );
};
