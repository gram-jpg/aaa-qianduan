import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Trash2, Search, X, Upload } from 'lucide-react';
import { BatchImportModal } from './BatchImportModal';

interface BankAccount {
    id?: string;
    bankName: string;
    accountNo: string;
    currency: string;
    bankAddress?: string;
    branchCode?: string;
}

interface Supplier {
    id: string;
    code: string;
    entityType: 'company' | 'individual';
    supplierTypeId: number;
    shortName?: string;
    fullName?: string;
    taxIdIndividual?: string;
    addressIndividual?: string;
    companyNameEn?: string;
    companyNameTh?: string;
    taxIdCompany?: string;
    addressEn?: string;
    addressTh?: string;
    branchCode?: string;
    bankAccounts: BankAccount[];
    supplierType?: { nameZh: string; nameEn: string };
}

interface SupplierType {
    id: number;
    nameZh: string;
    nameEn: string;
}

import { ConfirmDialog } from './UI';

export const SupplierList: React.FC = () => {
    const { t, language } = useLanguage();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
    const [supplierTypes, setSupplierTypes] = useState<SupplierType[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);

    useEffect(() => {
        loadSuppliers();
        loadSupplierTypes();
    }, []);

    useEffect(() => {
        // Multi-dimensional fuzzy search
        if (!searchQuery.trim()) {
            setFilteredSuppliers(suppliers);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = suppliers.filter(s => {
            const code = s.code?.toLowerCase() || '';
            const nameEn = s.companyNameEn?.toLowerCase() || s.fullName?.toLowerCase() || '';
            const nameTh = s.companyNameTh?.toLowerCase() || '';
            const shortName = s.shortName?.toLowerCase() || '';
            const typeName = language === 'zh'
                ? s.supplierType?.nameZh?.toLowerCase() || ''
                : s.supplierType?.nameEn?.toLowerCase() || '';

            return code.includes(query) ||
                nameEn.includes(query) ||
                nameTh.includes(query) ||
                shortName.includes(query) ||
                typeName.includes(query);
        });
        setFilteredSuppliers(filtered);
    }, [searchQuery, suppliers, language]);

    const loadSuppliers = async () => {
        try {
            const res = await fetch('/api/suppliers');
            const data = await res.json();
            setSuppliers(data);
            setFilteredSuppliers(data);
        } catch (error) {
            console.error('Failed to load suppliers:', error);
        }
    };

    const loadSupplierTypes = async () => {
        try {
            const res = await fetch('/api/settings/supplier-types');
            const data = await res.json();
            setSupplierTypes(data);
        } catch (error) {
            console.error('Failed to load supplier types:', error);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        try {
            await fetch(`/api/suppliers/${deleteId}`, { method: 'DELETE' });
            loadSuppliers();
            setShowDeleteConfirm(false);
            setDeleteId(null);
        } catch (error) {
            alert(t('saveFailed'));
        }
    };

    const handleAdd = () => {
        setEditingSupplier(null);
        setViewingSupplier(null);
        setShowForm(true);
    };

    const handleView = (supplier: Supplier) => {
        setViewingSupplier(supplier);
        setShowForm(false);
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setViewingSupplier(null);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingSupplier(null);
        loadSuppliers();
    };

    const handleDetailClose = () => {
        setViewingSupplier(null);
    };

    if (showForm) {
        return <SupplierForm supplier={editingSupplier} supplierTypes={supplierTypes} onClose={handleFormClose} />;
    }

    if (viewingSupplier) {
        return <SupplierDetail supplier={viewingSupplier} onClose={handleDetailClose} onEdit={() => handleEdit(viewingSupplier)} />;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '16px' }}>{t('suppliers')}</h2>
                <div style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '600px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder={t('searchSuppliers')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '6px 28px 6px 28px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontSize: '12px'
                            }}
                        />
                        {searchQuery && (
                            <X
                                size={14}
                                onClick={() => setSearchQuery('')}
                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer' }}
                            />
                        )}
                    </div>
                    <button onClick={handleAdd} style={{
                        padding: '6px 12px',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap'
                    }}>
                        <Plus size={14} />
                        {t('addSupplier')}
                    </button>
                    <button onClick={() => setShowImportModal(true)} style={{
                        padding: '6px 12px',
                        backgroundColor: 'white',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap'
                    }}>
                        <Upload size={14} />
                        导入
                    </button>
                </div>
            </div>

            {filteredSuppliers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '12px' }}>
                    {searchQuery ? `${t('noSuppliers')} (${t('searchSuppliers')})` : t('noSuppliers')}
                </div>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', fontSize: '12px' }}>
                    <thead style={{ backgroundColor: '#f8fafc' }}>
                        <tr>
                            <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t('code')}</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t('entityType')}</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t('companyName')}/{t('fullName')}</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t('supplierType')}</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t('bankName')}</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSuppliers.map(supplier => (
                            <tr
                                key={supplier.id}
                                style={{ borderBottom: '1px solid #e2e8f0' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <td style={{ padding: '6px 8px', fontFamily: 'monospace', color: '#64748b' }}>{supplier.code}</td>
                                <td style={{ padding: '6px 8px' }}>{supplier.entityType === 'company' ? t('company') : t('individual')}</td>
                                <td
                                    onClick={() => handleView(supplier)}
                                    style={{ padding: '6px 8px', cursor: 'pointer' }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: '12px' }}>
                                            {supplier.entityType === 'company'
                                                ? supplier.companyNameEn  // Always show English name
                                                : supplier.fullName
                                            }
                                        </div>
                                        {supplier.shortName && (
                                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                                {supplier.shortName}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: '6px 8px' }}>
                                    {supplier.supplierType && (language === 'zh' ? supplier.supplierType.nameZh : supplier.supplierType.nameEn)}
                                </td>
                                <td style={{ padding: '6px 8px' }}>
                                    {supplier.bankAccounts[0]?.bankName || '-'}
                                    {supplier.bankAccounts.length > 1 && ` (+${supplier.bankAccounts.length - 1})`}
                                </td>
                                <td style={{ padding: '6px 8px' }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEdit(supplier); }}
                                        style={{ marginRight: '6px', padding: '3px 8px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                    >
                                        {t('edit')}
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteClick(e, supplier.id)}
                                        style={{ padding: '3px 8px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                    >
                                        {t('delete')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title={t('confirmDelete')}
                message={t('areYouSure')}
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            <BatchImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                type="supplier"
                onSuccess={() => {
                    loadSuppliers();
                    // Don't close so user can see result
                }}
            />
        </div>
    );
};

// Supplier Detail View (Read-only)
interface SupplierDetailProps {
    supplier: Supplier;
    onClose: () => void;
    onEdit: () => void;
}

const SupplierDetail: React.FC<SupplierDetailProps> = ({ supplier, onClose, onEdit }) => {
    const { t, language } = useLanguage();

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2>{t('suppliers')} - {supplier.code}</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={onEdit} style={{ padding: '6px 12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                        {t('edit')}
                    </button>
                    <button onClick={onClose} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                        {t('cancel')}
                    </button>
                </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '6px', marginBottom: '12px' }}>
                <h3 style={{ marginTop: 0 }}>{t('basicInfo')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('code')}</label>
                        <div style={{ fontFamily: 'monospace', fontWeight: 500 }}>{supplier.code}</div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('entityType')}</label>
                        <div>{supplier.entityType === 'company' ? t('company') : t('individual')}</div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('supplierType')}</label>
                        <div>{supplier.supplierType && (language === 'zh' ? supplier.supplierType.nameZh : supplier.supplierType.nameEn)}</div>
                    </div>
                    {supplier.shortName && (
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('shortName')}</label>
                            <div>{supplier.shortName}</div>
                        </div>
                    )}
                </div>

                {supplier.entityType === 'individual' ? (
                    <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('fullName')}</label>
                            <div>{supplier.fullName}</div>
                        </div>
                        {supplier.taxIdIndividual && (
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('taxIdIndividual')}</label>
                                <div>{supplier.taxIdIndividual}</div>
                            </div>
                        )}
                        {supplier.addressIndividual && (
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('address')}</label>
                                <div>{supplier.addressIndividual}</div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('companyNameEn')}</label>
                            <div>{supplier.companyNameEn}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('companyNameTh')}</label>
                            <div>{supplier.companyNameTh}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('taxId')}</label>
                            <div>{supplier.taxIdCompany}</div>
                        </div>
                        {supplier.branchCode && (
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('branchCode')}</label>
                                <div>{supplier.branchCode}</div>
                            </div>
                        )}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('addressEn')}</label>
                            <div>{supplier.addressEn}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('addressTh')}</label>
                            <div>{supplier.addressTh}</div>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '6px' }}>
                <h3 style={{ marginTop: 0 }}>{t('bankName')}</h3>
                {supplier.bankAccounts.map((account, index) => (
                    <div key={index} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('bankName')}</label>
                                <div>{account.bankName}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('currency')}</label>
                                <div>{account.currency}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('accountNo')}</label>
                                <div>{account.accountNo}</div>
                            </div>
                            {account.branchCode && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('branchCode')}</label>
                                    <div>{account.branchCode}</div>
                                </div>
                            )}
                            {account.bankAddress && (
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('bankAddress')}</label>
                                    <div>{account.bankAddress}</div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Supplier Form Component (same as before, just adding code display)
interface SupplierFormProps {
    supplier: Supplier | null;
    supplierTypes: SupplierType[];
    onClose: () => void;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ supplier, supplierTypes, onClose }) => {
    const { t } = useLanguage();
    const [entityType, setEntityType] = useState<'company' | 'individual'>(supplier?.entityType || 'company');
    const [formData, setFormData] = useState({
        supplierTypeId: supplier?.supplierTypeId || 0,
        shortName: supplier?.shortName || '',
        fullName: supplier?.fullName || '',
        taxIdIndividual: supplier?.taxIdIndividual || '',
        addressIndividual: supplier?.addressIndividual || '',
        companyNameEn: supplier?.companyNameEn || '',
        companyNameTh: supplier?.companyNameTh || '',
        taxIdCompany: supplier?.taxIdCompany || '',
        addressEn: supplier?.addressEn || '',
        addressTh: supplier?.addressTh || '',
        branchCode: supplier?.branchCode || ''
    });
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(
        supplier?.bankAccounts?.length ? supplier.bankAccounts : [{ bankName: '', accountNo: '', currency: 'THB' }]
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const data = {
            entityType,
            ...formData,
            bankAccounts
        };

        try {
            const url = supplier ? `/api/suppliers/${supplier.id}` : '/api/suppliers';
            const method = supplier ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.status === 400) {
                const error = await res.json();
                alert(error.error);
                return;
            }

            if (!res.ok) {
                alert(t('saveFailed'));
                return;
            }

            onClose();
        } catch (error) {
            alert(t('saveFailed'));
        }
    };

    const addBankAccount = () => {
        setBankAccounts([...bankAccounts, { bankName: '', accountNo: '', currency: 'THB' }]);
    };

    const removeBankAccount = (index: number) => {
        if (bankAccounts.length === 1) {
            alert('At least one bank account is required');
            return;
        }
        setBankAccounts(bankAccounts.filter((_, i) => i !== index));
    };

    const updateBankAccount = (index: number, field: keyof BankAccount, value: string) => {
        const updated = [...bankAccounts];
        updated[index] = { ...updated[index], [field]: value };
        setBankAccounts(updated);
    };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2>{supplier ? `${t('edit')} - ${supplier.code}` : t('addSupplier')}</h2>
                <button type="button" onClick={onClose} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>
                    {t('cancel')}
                </button>
            </div>

            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '6px', marginBottom: '12px' }}>
                {/* Entity Type */}
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '12px' }}>
                        {t('entityType')} <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <select
                        value={entityType}
                        onChange={(e) => setEntityType(e.target.value as 'company' | 'individual')}
                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                        required
                    >
                        <option value="company">{t('company')}</option>
                        <option value="individual">{t('individual')}</option>
                    </select>
                </div>

                {/* Supplier Type */}
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '12px' }}>
                        {t('supplierType')} <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <select
                        value={formData.supplierTypeId}
                        onChange={(e) => setFormData({ ...formData, supplierTypeId: Number(e.target.value) })}
                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                        required
                    >
                        <option value={0}>{t('selectSupplierType')}</option>
                        {supplierTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.nameZh} / {type.nameEn}</option>
                        ))}
                    </select>
                </div>

                {/* Conditional Fields */}
                {entityType === 'individual' ? (
                    <>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '12px' }}>
                                {t('fullName')} <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '12px' }}>{t('shortName')}</label>
                            <input
                                value={formData.shortName}
                                onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                                style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '12px' }}>{t('taxIdIndividual')}</label>
                            <input
                                value={formData.taxIdIndividual}
                                onChange={(e) => setFormData({ ...formData, taxIdIndividual: e.target.value })}
                                style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '12px' }}>{t('address')}</label>
                            <textarea
                                value={formData.addressIndividual}
                                onChange={(e) => setFormData({ ...formData, addressIndividual: e.target.value })}
                                style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', minHeight: '48px', fontSize: '12px' }}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '12px' }}>
                                {t('companyNameEn')} <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                                value={formData.companyNameEn}
                                onChange={(e) => setFormData({ ...formData, companyNameEn: e.target.value })}
                                style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '12px' }}>
                                {t('companyNameTh')} <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                                value={formData.companyNameTh}
                                onChange={(e) => setFormData({ ...formData, companyNameTh: e.target.value })}
                                style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '12px' }}>{t('shortName')}</label>
                            <input
                                value={formData.shortName}
                                onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                                style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '12px' }}>
                                {t('taxId')} <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                                value={formData.taxIdCompany}
                                onChange={(e) => setFormData({ ...formData, taxIdCompany: e.target.value })}
                                style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                                placeholder="13 digits"
                                maxLength={13}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '12px' }}>
                                {t('addressEn')} <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <textarea
                                value={formData.addressEn}
                                onChange={(e) => setFormData({ ...formData, addressEn: e.target.value })}
                                style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', minHeight: '48px', fontSize: '12px' }}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '12px' }}>
                                {t('addressTh')} <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <textarea
                                value={formData.addressTh}
                                onChange={(e) => setFormData({ ...formData, addressTh: e.target.value })}
                                style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', minHeight: '48px', fontSize: '12px' }}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '12px' }}>{t('branchCode')}</label>
                            <input
                                value={formData.branchCode}
                                onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                                style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Bank Accounts */}
            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '6px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0 }}>{t('bankName')}</h3>
                    <button type="button" onClick={addBankAccount} style={{
                        padding: '6px 12px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <Plus size={14} />
                        {t('addBankAccount')}
                    </button>
                </div>

                {bankAccounts.map((account, index) => (
                    <div key={index} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '10px', position: 'relative' }}>
                        {bankAccounts.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeBankAccount(index)}
                                style={{
                                    position: 'absolute',
                                    top: '6px',
                                    right: '6px',
                                    padding: '4px 8px',
                                    backgroundColor: '#fef2f2',
                                    color: '#dc2626',
                                    border: '1px solid #fee2e2',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                <Trash2 size={12} />
                                {t('removeBankAccount')}
                            </button>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                                    {t('bankName')} <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <input
                                    value={account.bankName}
                                    onChange={(e) => updateBankAccount(index, 'bankName', e.target.value)}
                                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                                    {t('currency')} <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <select
                                    value={account.currency}
                                    onChange={(e) => updateBankAccount(index, 'currency', e.target.value)}
                                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                                    required
                                >
                                    <option value="THB">THB</option>
                                    <option value="USD">USD</option>
                                    <option value="CNY">CNY</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                                    {t('accountNo')} <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <input
                                    value={account.accountNo}
                                    onChange={(e) => updateBankAccount(index, 'accountNo', e.target.value)}
                                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>{t('branchCode')}</label>
                                <input
                                    value={account.branchCode || ''}
                                    onChange={(e) => updateBankAccount(index, 'branchCode', e.target.value)}
                                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                                />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>{t('bankAddress')}</label>
                                <input
                                    value={account.bankAddress || ''}
                                    onChange={(e) => updateBankAccount(index, 'bankAddress', e.target.value)}
                                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={onClose} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                    {t('cancel')}
                </button>
                <button type="submit" style={{ padding: '6px 12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                    {t('save')}
                </button>
            </div>
        </form>
    );
};
