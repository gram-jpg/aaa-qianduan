import React, { useState, useEffect } from 'react';
import { Search, RotateCcw } from 'lucide-react';

interface FilterPanelProps {
    filters: {
        type: string;
        status: string;
        dateFrom: string;
        dateTo: string;
        settlementUnit: string;
        blNumber: string;
        shipmentCode: string;
        applicationNumber: string;
        financialSubjectId: string;
        currency: string;
        settlementUnitName: string;
    };
    onFilterChange: (filters: any) => void;
    onSearch: () => void;
    onReset: () => void;
}

export const ExpenseFilterPanel: React.FC<FilterPanelProps> = ({
    filters,
    onFilterChange,
    onSearch,
    onReset
}) => {
    const [financialSubjects, setFinancialSubjects] = useState<any[]>([]);
    const [settlementUnits, setSettlementUnits] = useState<any[]>([]);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        loadFinancialSubjects();
        loadSettlementUnits();
    }, []);

    const loadFinancialSubjects = async () => {
        try {
            const res = await fetch('/api/settings/financial-subjects');
            const data = await res.json();
            setFinancialSubjects(data);
        } catch (error) {
            console.error('Failed to load financial subjects:', error);
        }
    };

    const loadSettlementUnits = async () => {
        try {
            const [customersRes, suppliersRes] = await Promise.all([
                fetch('/api/customers'),
                fetch('/api/suppliers')
            ]);
            const customers = await customersRes.json();
            const suppliers = await suppliersRes.json();
            const normalized = [
                ...customers.map((c: any) => ({ id: c.id, name: c.companyNameEn, type: 'customer' })),
                ...suppliers.map((s: any) => ({ id: s.id, name: s.companyNameEn || s.fullName, type: 'supplier' }))
            ].filter(u => !!u.name);
            setSettlementUnits(normalized);
        } catch (error) {
            console.error('Failed to load settlement units:', error);
        }
    };

    const handleChange = (key: string, value: string) => {
        onFilterChange({ ...filters, [key]: value });
    };

    return (
        <div style={{
            backgroundColor: 'white',
            borderBottom: '1px solid #e5e7eb',
            padding: '6px 8px'
        }}>
            <div style={{
                display: 'flex',
                gap: '6px',
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                {/* 类型 */}
                <select
                    value={filters.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    style={{
                        padding: '4px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px',
                        minWidth: '80px',
                        cursor: 'pointer'
                    }}
                >
                    <option value="">全部类型</option>
                    <option value="AR">应收(AR)</option>
                    <option value="AP">应付(AP)</option>
                </select>

                {/* 状态 */}
                <select
                    value={filters.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    style={{
                        padding: '4px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px',
                        minWidth: '80px',
                        cursor: 'pointer'
                    }}
                >
                    <option value="">全部状态</option>
                    <option value="unapplied">未申请</option>
                    <option value="applied">已申请</option>
                    <option value="settled">已结算</option>
                </select>

                {/* 业务编码 */}
                <input
                    type="text"
                    placeholder="业务编码"
                    value={filters.shipmentCode}
                    onChange={(e) => handleChange('shipmentCode', e.target.value)}
                    style={{
                        padding: '4px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px',
                        width: '100px'
                    }}
                />

                {/* 申请号 */}
                <input
                    type="text"
                    placeholder="申请号"
                    value={filters.applicationNumber}
                    onChange={(e) => handleChange('applicationNumber', e.target.value)}
                    style={{
                        padding: '4px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px',
                        width: '100px'
                    }}
                />

                {!expanded && (
                    <button
                        onClick={() => setExpanded(true)}
                        style={{
                            padding: '4px 8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            backgroundColor: '#fff',
                            color: '#374151',
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >更多筛选</button>
                )}

                {expanded && (
                    <>
                        <input
                            type="text"
                            placeholder="提单号"
                            value={filters.blNumber}
                            onChange={(e) => handleChange('blNumber', e.target.value)}
                            style={{
                                padding: '4px 8px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '12px',
                                width: '120px'
                            }}
                        />

                        <input
                            type="text"
                            placeholder="结算对象名称"
                            value={filters.settlementUnitName}
                            onChange={(e) => handleChange('settlementUnitName', e.target.value)}
                            style={{
                                padding: '4px 8px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '12px',
                                width: '150px'
                            }}
                        />

                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => handleChange('dateFrom', e.target.value)}
                            style={{
                                padding: '4px 8px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '12px',
                                width: '120px'
                            }}
                        />
                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>~</span>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => handleChange('dateTo', e.target.value)}
                            style={{
                                padding: '4px 8px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '12px',
                                width: '120px'
                            }}
                        />

                        <select
                            value={filters.financialSubjectId}
                            onChange={(e) => handleChange('financialSubjectId', e.target.value)}
                            style={{
                                padding: '4px 8px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '12px',
                                minWidth: '100px',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">财务科目</option>
                            {financialSubjects.map(subject => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.nameZh}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.settlementUnit}
                            onChange={(e) => handleChange('settlementUnit', e.target.value)}
                            style={{
                                padding: '4px 8px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '12px',
                                minWidth: '150px',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">结算对象ID</option>
                            {settlementUnits.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.type === 'customer' ? '客户' : '供应商'} - {u.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.currency}
                            onChange={(e) => handleChange('currency', e.target.value)}
                            style={{
                                padding: '4px 8px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '12px',
                                minWidth: '70px',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">币种</option>
                            <option value="THB">THB</option>
                            <option value="USD">USD</option>
                            <option value="CNY">CNY</option>
                            <option value="EUR">EUR</option>
                        </select>

                        <button
                            onClick={() => setExpanded(false)}
                            style={{
                                padding: '4px 8px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                backgroundColor: '#fff',
                                color: '#374151',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >收起</button>
                    </>
                )}

                {/* 弹性空间 */}
                <div style={{ flex: 1 }}></div>

                {/* 查询按钮 */}
                <button
                    onClick={onSearch}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                >
                    <Search size={14} />
                    查询
                </button>

                {/* 重置按钮 */}
                <button
                    onClick={onReset}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
                >
                    <RotateCcw size={14} />
                    重置
                </button>
            </div>
        </div>
    );
};
