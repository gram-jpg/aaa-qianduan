import { useState, useMemo, useEffect } from 'react';
import { useCustomers } from '../context/CustomerContext';
import { useLanguage } from '../context/LanguageContext';
import { Search, Plus, User, Ban, Upload, CheckCircle, Download } from 'lucide-react';
import { Button, Card, ConfirmDialog } from './UI';
import { BatchImportModal } from './BatchImportModal';
import * as XLSX from 'xlsx';

interface CustomerListProps {
    onAdd: () => void;
    onSelect: (id: string) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ onAdd, onSelect }) => {
    const { customers, deleteCustomer, refreshCustomers, updateCustomerStatus } = useCustomers();
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showDisabled, setShowDisabled] = useState(false);
    const [onlyDisabled, setOnlyDisabled] = useState(false);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [showRowDisableConfirm, setShowRowDisableConfirm] = useState(false);
    const [rowDisableId, setRowDisableId] = useState<string | null>(null);
    const compact = true;

    useEffect(() => {
        const h = setTimeout(() => setDebouncedSearchTerm(searchTerm), 200);
        return () => clearTimeout(h);
    }, [searchTerm]);

    const filteredCustomers = useMemo(() => {
        const searchLower = debouncedSearchTerm.toLowerCase();
        return customers.filter(c => {
            const matchesSearch = (
                c.companyNameEn.toLowerCase().includes(searchLower) ||
                c.companyNameTh.toLowerCase().includes(searchLower) ||
                c.taxId.toLowerCase().includes(searchLower) ||
                (c.code && c.code.toLowerCase().includes(searchLower))
            );
            const matchesStatus = onlyDisabled ? (c.isActive === false) : (showDisabled ? true : (c.isActive !== false));
            return matchesSearch && matchesStatus;
        });
    }, [customers, debouncedSearchTerm, showDisabled, onlyDisabled]);

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredCustomers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredCustomers.map(c => c.id)));
        }
    };

    const handleBulkDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (selectedIds.size === 0) return;
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        selectedIds.forEach(id => {
            const c = customers.find(c => c.id === id);
            if (!c || c.isActive === false) return;
            deleteCustomer(id);
        });
        setSelectedIds(new Set());
        setShowDeleteConfirm(false);
    };

    const handleBulkEnable = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        selectedIds.forEach(id => {
            const c = customers.find(c => c.id === id);
            if (!c || c.isActive !== false) return;
            updateCustomerStatus(id, true);
        });
        setSelectedIds(new Set());
    };

    const formatDate = (timestamp: number) => {
        if (!timestamp) return '-';
        const date = new Date(Number(timestamp));
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const handleExport = () => {
        const headers = [
            t('code'),
            t('companyNameEn'),
            t('companyNameTh'),
            t('taxId'),
            t('status'),
            '创建时间'
        ];

        const rows = filteredCustomers.map(c => [
            c.code || '-',
            c.companyNameEn || '',
            c.companyNameTh || '',
            c.taxId || '',
            c.isActive === false ? t('disabled') : t('active'),
            formatDate(c.createdAt)
        ]);

        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Customers');
        XLSX.writeFile(wb, 'customers_export.xlsx');
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compact ? '12px' : '2rem' }}>
                <h2 style={{ fontSize: compact ? '1rem' : '1.5rem', fontWeight: 600, margin: 0 }}>{t('customers')}</h2>
                <div style={{ display: 'flex', gap: compact ? '8px' : '0.75rem' }}>
                    {(() => {
                        const selectedActiveCount = customers.filter(c => selectedIds.has(c.id) && c.isActive !== false).length;
                        const selectedDisabledCount = customers.filter(c => selectedIds.has(c.id) && c.isActive === false).length;
                        return (
                            <>
                                {selectedActiveCount > 0 && (
                                    <Button onClick={handleBulkDelete} variant="danger" icon={Ban}>
                                        {t('disable')} ({selectedActiveCount})
                                    </Button>
                                )}
                                {selectedDisabledCount > 0 && (
                                    <Button onClick={handleBulkEnable} variant="primary" icon={CheckCircle}>
                                        {t('enable')} ({selectedDisabledCount})
                                    </Button>
                                )}
                                {selectedIds.size > 0 && (
                                    <Button variant="secondary" onClick={() => setSelectedIds(new Set())}>
                                        {t('clearSelection')}
                                    </Button>
                                )}
                            </>
                        );
                    })()}
                    <Button onClick={() => setShowImportModal(true)} variant="secondary" icon={Upload}>
                        导入
                    </Button>
                    <Button onClick={handleExport} variant="secondary" icon={Download}>
                        导出
                    </Button>
                    <Button onClick={onAdd} icon={Plus}>
                        {t('addCustomer')}
                    </Button>
                </div>
            </div>

            <div style={{ position: 'relative', marginBottom: compact ? '12px' : '1.5rem', display: 'flex', alignItems: 'center', gap: compact ? '8px' : '1rem' }}>
                <Search size={compact ? 16 : 18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: compact ? '32px' : '40px', flex: 1, fontSize: compact ? '12px' : undefined, paddingTop: compact ? '6px' : undefined, paddingBottom: compact ? '6px' : undefined }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: compact ? '6px' : '0.5rem', fontSize: compact ? '12px' : '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <input
                        type="checkbox"
                        checked={showDisabled}
                        onChange={(e) => setShowDisabled(e.target.checked)}
                        style={{ width: compact ? '14px' : '16px', height: compact ? '14px' : '16px', accentColor: 'var(--color-primary)' }}
                    />
                    {t('showDisabled')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: compact ? '6px' : '0.5rem', fontSize: compact ? '12px' : '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <input
                        type="checkbox"
                        checked={onlyDisabled}
                        onChange={(e) => setOnlyDisabled(e.target.checked)}
                        style={{ width: compact ? '14px' : '16px', height: compact ? '14px' : '16px', accentColor: 'var(--color-primary)' }}
                    />
                    {t('onlyDisabled')}
                </label>
            </div>

            {filteredCustomers.length === 0 ? (
                <Card className="text-center py-12">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', color: 'var(--color-text-secondary)' }}>
                        <User size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>{t('noCustomers')}</p>
                    </div>
                </Card>
            ) : (
                <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: compact ? '12px' : undefined }}>
                        <thead>
                            <tr style={{
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                backgroundColor: 'rgba(255, 255, 255, 0.02)'
                            }}>
                                <th style={{
                                    padding: compact ? '8px' : '1rem',
                                    textAlign: 'center',
                                    width: '40px'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={filteredCustomers.length > 0 && selectedIds.size === filteredCustomers.length}
                                        onChange={toggleSelectAll}
                                        style={{
                                            width: compact ? '16px' : '18px',
                                            height: compact ? '16px' : '18px',
                                            cursor: 'pointer',
                                            accentColor: 'var(--color-primary)'
                                        }}
                                    />
                                </th>
                                <th style={{
                                    padding: compact ? '8px' : '1rem',
                                    textAlign: 'left',
                                    fontWeight: 600,
                                    fontSize: compact ? '12px' : '0.875rem',
                                    color: 'var(--color-text-secondary)',
                                    width: '120px'
                                }}>
                                    编码
                                </th>
                                <th style={{
                                    padding: compact ? '8px' : '1rem',
                                    textAlign: 'left',
                                    fontWeight: 600,
                                    fontSize: compact ? '12px' : '0.875rem',
                                    color: 'var(--color-text-secondary)'
                                }}>
                                    公司名称
                                </th>
                                <th style={{
                                    padding: compact ? '8px' : '1rem',
                                    textAlign: 'left',
                                    fontWeight: 600,
                                    fontSize: compact ? '12px' : '0.875rem',
                                    color: 'var(--color-text-secondary)',
                                    width: '180px'
                                }}>
                                    税号
                                </th>
                                <th style={{
                                    padding: compact ? '8px' : '1rem',
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    fontSize: compact ? '12px' : '0.875rem',
                                    color: 'var(--color-text-secondary)',
                                    width: '110px'
                                }}>
                                    {t('status')}
                                </th>
                                <th style={{
                                    padding: compact ? '8px' : '1rem',
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    fontSize: compact ? '12px' : '0.875rem',
                                    color: 'var(--color-text-secondary)',
                                    width: '120px'
                                }}>
                                    创建时间
                                </th>
                                <th style={{
                                    padding: compact ? '8px' : '1rem',
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    fontSize: compact ? '12px' : '0.875rem',
                                    color: 'var(--color-text-secondary)',
                                    width: '160px'
                                }}>
                                    {t('actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map(customer => {
                                const isSelected = selectedIds.has(customer.id);
                                return (
                                    <tr
                                        key={customer.id}
                                        onClick={() => onSelect(customer.id)}
                                        style={{
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s',
                                            backgroundColor: isSelected ? 'rgba(79, 70, 229, 0.1)' : 'transparent'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        <td
                                            style={{ padding: compact ? '6px' : '1rem', textAlign: 'center' }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelection(customer.id)}
                                                style={{
                                                    width: compact ? '16px' : '18px',
                                                    height: compact ? '16px' : '18px',
                                                    cursor: 'pointer',
                                                    accentColor: 'var(--color-primary)'
                                                }}
                                            />
                                        </td>
                                        <td style={{ padding: compact ? '6px' : '1rem' }}>
                                            <span style={{
                                                fontFamily: 'monospace',
                                                fontSize: compact ? '12px' : '0.875rem',
                                                color: 'var(--color-primary)',
                                                fontWeight: 500
                                            }}>
                                                {customer.code || '-'}
                                            </span>
                                        </td>
                                        <td style={{ padding: compact ? '6px' : '1rem' }}>
                                            <div>
                                                <div style={{
                                                    fontWeight: 500,
                                                    marginBottom: compact ? '2px' : '0.25rem'
                                                }}>
                                                    {customer.companyNameEn}
                                                    {customer.isActive === false && (
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: compact ? '2px 6px' : '2px 8px',
                                                            marginLeft: compact ? '6px' : '8px',
                                                            backgroundColor: '#ef4444',
                                                            color: 'white',
                                                            borderRadius: '4px',
                                                            fontSize: compact ? '11px' : '0.75rem',
                                                            fontWeight: 500
                                                        }}>
                                                            {t('disabled')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{
                                                    fontSize: compact ? '12px' : '0.875rem',
                                                    color: 'var(--color-text-secondary)'
                                                }}>
                                                    {customer.companyNameTh}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{
                                            padding: compact ? '6px' : '1rem',
                                            fontFamily: 'monospace',
                                            fontSize: compact ? '12px' : '0.875rem',
                                            color: 'var(--color-text-secondary)'
                                        }}>
                                            {customer.taxId}
                                        </td>
                                        <td style={{
                                            padding: compact ? '6px' : '1rem',
                                            textAlign: 'center',
                                            fontSize: compact ? '12px' : '0.875rem',
                                            color: customer.isActive === false ? '#ef4444' : 'var(--color-text-secondary)'
                                        }}>
                                            {customer.isActive === false ? t('disabled') : t('active')}
                                        </td>
                                        <td style={{
                                            padding: compact ? '6px' : '1rem',
                                            textAlign: 'center',
                                            fontSize: compact ? '12px' : '0.875rem',
                                            color: 'var(--color-text-secondary)'
                                        }}>
                                            {formatDate(customer.createdAt)}
                                        </td>
                                        <td style={{ padding: compact ? '6px' : '1rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant={customer.isActive === false ? 'primary' : 'danger'}
                                                onClick={() => {
                                                    if (customer.isActive === false) {
                                                        updateCustomerStatus(customer.id, true);
                                                    } else {
                                                        setRowDisableId(customer.id);
                                                        setShowRowDisableConfirm(true);
                                                    }
                                                }}
                                                style={{ marginRight: compact ? '6px' : '0.5rem' }}
                                            >
                                                {customer.isActive === false ? t('enable') : t('disable')}
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title={t('disableConfirm')}
                message={t('areYouSure')}
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            <ConfirmDialog
                isOpen={showRowDisableConfirm}
                title={t('disableConfirm')}
                message={t('areYouSure')}
                onConfirm={() => {
                    if (rowDisableId) {
                        updateCustomerStatus(rowDisableId, false);
                    }
                    setRowDisableId(null);
                    setShowRowDisableConfirm(false);
                }}
                onCancel={() => {
                    setRowDisableId(null);
                    setShowRowDisableConfirm(false);
                }}
            />

            <BatchImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                type="customer"
                onSuccess={() => {
                    refreshCustomers();
                    // Don't close immediately so user can see result
                }}
            />
        </div>
    );
};
