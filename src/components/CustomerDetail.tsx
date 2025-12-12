import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCustomers } from '../context/CustomerContext';
import { Button, Card } from './UI';
import { ArrowLeft, Building, MapPin, CreditCard, Wallet, Edit, Mail } from 'lucide-react';
import { CustomerForm } from './CustomerForm';

interface CustomerDetailProps {
    id: string;
    onBack: () => void;
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({ id, onBack }) => {
    const { t } = useLanguage();
    const { getCustomer, updateCustomerStatus } = useCustomers();
    const [isEditing, setIsEditing] = useState(false);

    const customer = getCustomer(id);

    if (!customer) return <div>Customer not found</div>;

    if (isEditing) {
        return (
            <div className="animate-fade-in">
                <Button variant="ghost" onClick={() => setIsEditing(false)} style={{ marginBottom: '1.5rem', paddingLeft: 0, background: 'transparent' }}>
                    <ArrowLeft size={18} /> {t('cancel')}
                </Button>
                <CustomerForm
                    onCancel={() => setIsEditing(false)}
                    onSuccess={() => setIsEditing(false)}
                    initialData={customer}
                />
            </div>
        );
    }

    const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value: string; secondaryValue?: string }> = ({ icon, label, value, secondaryValue }) => (
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '1.5rem' }}>
            <div style={{ color: 'var(--color-primary)', marginTop: '4px' }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                    {label}
                </h4>
                <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{value || '-'}</div>
                {secondaryValue && (
                    <div style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                        {secondaryValue}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in">
            <Button variant="ghost" onClick={onBack} style={{ marginBottom: '1.5rem', paddingLeft: 0, background: 'transparent' }}>
                <ArrowLeft size={18} /> {t('backToList')}
            </Button>

            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                    <div>
                        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>
                            {customer.companyNameEn}
                            {customer.isActive === false && (
                                <span style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    marginLeft: '8px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 500
                                }}>
                                    {t('disabled')}
                                </span>
                            )}
                        </h1>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>{customer.companyNameTh}</h2>
                        {customer.shortName && (
                            <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                                {t('shortName')}: {customer.shortName}
                            </h3>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button onClick={() => setIsEditing(true)} icon={Edit}>
                            {t('edit')}
                        </Button>
                        <Button
                            variant={customer.isActive === false ? 'primary' : 'danger'}
                            onClick={() => updateCustomerStatus(customer.id, customer.isActive === false ? true : false)}
                        >
                            {customer.isActive === false ? t('enable') : t('disable')}
                        </Button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0' }}>
                    <DetailRow
                        icon={<Building />}
                        label={t('companyNameEn') + ' / ' + t('companyNameTh')}
                        value={customer.companyNameEn}
                        secondaryValue={customer.companyNameTh}
                    />
                    <DetailRow
                        icon={<MapPin />}
                        label={t('addressEn') + ' / ' + t('addressTh')}
                        value={customer.addressEn}
                        secondaryValue={customer.addressTh}
                    />
                    {customer.mailingAddress && (
                        <DetailRow
                            icon={<Mail />}
                            label={t('mailingAddress')}
                            value={customer.mailingAddress}
                        />
                    )}
                    <DetailRow
                        icon={<CreditCard />}
                        label={t('taxId')}
                        value={customer.taxId}
                    />
                    <div style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem' }}>
                        <div style={{ color: 'var(--color-primary)', marginTop: '4px' }}>
                            <Wallet />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                                {t('bankInfo')}
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{t('bankName')}</span>
                                    <div style={{ fontWeight: 500 }}>{customer.bankName || '-'}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{t('bankBranch')}</span>
                                    <div style={{ fontWeight: 500 }}>{customer.bankBranch || '-'}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{t('bankAccount')}</span>
                                    <div style={{ fontWeight: 500 }}>{customer.bankAccount || '-'}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{t('bankBranchCode')}</span>
                                    <div style={{ fontWeight: 500 }}>{customer.bankBranchCode || '-'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
