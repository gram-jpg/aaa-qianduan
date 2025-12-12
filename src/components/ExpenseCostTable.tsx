import React, { useState } from 'react';
import { CheckSquare, Square, FileText, XCircle, CheckCircle, DollarSign, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface CostItem {
    id: string;
    applicationNumber: string | null;
    status: string;
    shipmentId: string;
    description: string;
    amount: number;
    currency: string;
    vatRate: number;
    whtRate: number;
    settlementUnitName: string;
    applicationDate: string | null;
    dueDate: string | null;
    createdAt: string;
}

interface ExpenseCostTableProps {
    costs: CostItem[];
    type: 'AR' | 'AP';
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    onApplySingle: (costId: string) => void;
    onCancelApplication: (applicationNumber: string) => void;
    onSettleSingle: (costId: string) => void;
    onCancelSettlement: (costIds: string[]) => void;
}

const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
    unapplied: { bg: '#f3f4f6', color: '#6b7280', label: '未申请' },
    applied: { bg: '#dbeafe', color: '#1e40af', label: '已申请' },
    settled: { bg: '#d1fae5', color: '#047857', label: '已结算' }
};

const PAGE_SIZE = 35;

export const ExpenseCostTable: React.FC<ExpenseCostTableProps> = ({
    costs,
    type,
    selectedIds,
    onSelectionChange,
    onApplySingle,
    onCancelApplication,
    onSettleSingle,
    onCancelSettlement
}) => {
    const [currentPage, setCurrentPage] = useState(1);

    const themeColor = type === 'AR' ? '#10b981' : '#f59e0b';
    const themeBg = type === 'AR' ? '#ecfdf5' : '#fff7ed';
    const typeLabel = type === 'AR' ? '应收' : '应付';

    // 分页计算
    const totalPages = Math.ceil(costs.length / PAGE_SIZE);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const paginatedCosts = costs.slice(startIndex, endIndex);

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter(sid => sid !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    const toggleSelectAll = () => {
        // 只选择当前页的可选费用
        const selectableCosts = paginatedCosts.filter(c => c.status === 'unapplied');
        const selectableIds = selectableCosts.map(c => c.id);
        const allCurrentPageSelected = selectableIds.every(id => selectedIds.includes(id)) && selectableIds.length > 0;

        if (allCurrentPageSelected) {
            // 取消当前页的选择
            onSelectionChange(selectedIds.filter(id => !selectableIds.includes(id)));
        } else {
            // 选择当前页所有可选项
            const newSelected = [...new Set([...selectedIds, ...selectableIds])];
            onSelectionChange(newSelected);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('zh-CN');
        } catch {
            return '-';
        }
    };

    const formatAmount = (amount: number, currency: string) => {
        return `${amount.toLocaleString()} ${currency}`;
    };

    const calculateVAT = (amount: number, rate: number) => {
        return amount * rate / 100;
    };

    const calculateWHT = (amount: number, rate: number) => {
        return amount * rate / 100;
    };

    const canSelect = (cost: CostItem) => cost.status === 'unapplied';
    const selectableCostsOnPage = paginatedCosts.filter(c => canSelect(c));
    const allPageSelected = selectableCostsOnPage.length > 0 &&
        selectableCostsOnPage.every(c => selectedIds.includes(c.id));

    return (
        <div style={{
            border: `2px solid ${themeColor}`,
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Table Header */}
            <div style={{
                backgroundColor: themeBg,
                padding: '8px 12px',
                borderBottom: `2px solid ${themeColor}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
            }}>
                <h3 style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: type === 'AR' ? '#047857' : '#c2410c',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <DollarSign size={18} />
                    {typeLabel} ({type})
                </h3>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    共 {costs.length} 条 | 第 {currentPage}/{totalPages} 页
                </div>
            </div>

            {/* Table */}
            <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                        <tr>
                            <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, width: '40px' }}>
                                <button
                                    onClick={toggleSelectAll}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0,
                                        color: '#374151',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                    title={allPageSelected ? '取消全选' : '全选当前页'}
                                >
                                    {allPageSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                </button>
                            </th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>状态</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>申请号</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>业务编码</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>提单号 (BL)</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>结算对象</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>费用摘要</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>金额</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>VAT</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>WHT</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>创建日期</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>申请日期</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>到期日期</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, width: '140px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedCosts.length === 0 ? (
                            <tr>
                                <td colSpan={14} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                                    暂无{typeLabel}费用数据
                                </td>
                            </tr>
                        ) : (
                            paginatedCosts.map((cost) => {
                                const isSelected = selectedIds.includes(cost.id);
                                const statusStyle = statusStyles[cost.status] || statusStyles.unapplied;
                                const vat = calculateVAT(cost.amount, cost.vatRate);
                                const wht = calculateWHT(cost.amount, cost.whtRate);

                                return (
                                    <tr
                                        key={cost.id}
                                        style={{
                                            borderBottom: '1px solid #f3f4f6',
                                            backgroundColor: isSelected ? '#f0f9ff' : 'white'
                                        }}
                                    >
                                        {/* Checkbox */}
                                        <td style={{ padding: '8px' }}>
                                            {canSelect(cost) ? (
                                                <button
                                                    onClick={() => toggleSelect(cost.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: 0,
                                                        color: isSelected ? '#2563eb' : '#9ca3af',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                                </button>
                                            ) : (
                                                <span style={{ color: '#d1d5db', display: 'flex', alignItems: 'center' }}>
                                                    <Square size={16} />
                                                </span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td style={{ padding: '8px' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                backgroundColor: statusStyle.bg,
                                                color: statusStyle.color,
                                                fontWeight: 500
                                            }}>
                                                {statusStyle.label}
                                            </span>
                                        </td>

                                        {/* Application Number */}
                                        <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#3b82f6' }}>
                                            {cost.applicationNumber || '-'}
                                        </td>

                                        {/* Shipment Code */}
                                        <td style={{ padding: '8px', fontSize: '11px', fontFamily: 'monospace' }}>
                                            {(cost as any).shipmentCode || '-'}
                                        </td>

                                        {/* BL Number */}
                                        <td style={{ padding: '8px', fontSize: '11px', fontFamily: 'monospace', color: '#059669' }}>
                                            {(cost as any).blNumber || '-'}
                                        </td>

                                        {/* Settlement Unit */}
                                        <td style={{ padding: '8px', fontSize: '11px' }}>
                                            {cost.settlementUnitName || '-'}
                                        </td>

                                        {/* Description */}
                                        <td style={{ padding: '8px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px' }}>
                                            {cost.description}
                                        </td>

                                        {/* Amount */}
                                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: '#111827', fontSize: '11px' }}>
                                            {formatAmount(cost.amount, cost.currency)}
                                        </td>

                                        {/* VAT */}
                                        <td style={{ padding: '8px', textAlign: 'right', fontSize: '11px', color: '#6b7280' }}>
                                            {cost.vatRate > 0 ? formatAmount(vat, cost.currency) : '-'}
                                        </td>

                                        {/* WHT */}
                                        <td style={{ padding: '8px', textAlign: 'right', fontSize: '11px', color: '#6b7280' }}>
                                            {cost.whtRate > 0 ? formatAmount(wht, cost.currency) : '-'}
                                        </td>

                                        {/* Created Date */}
                                        <td style={{ padding: '8px', fontSize: '11px' }}>
                                            {formatDate(cost.createdAt)}
                                        </td>

                                        {/* Application Date */}
                                        <td style={{ padding: '8px', fontSize: '11px' }}>
                                            {formatDate(cost.applicationDate)}
                                        </td>

                                        {/* Due Date */}
                                        <td style={{ padding: '8px', fontSize: '11px' }}>
                                            {formatDate(cost.dueDate)}
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding: '8px' }}>
                                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                {cost.status === 'unapplied' && (
                                                    <button
                                                        onClick={() => onApplySingle(cost.id)}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '3px',
                                                            padding: '3px 6px',
                                                            fontSize: '11px',
                                                            backgroundColor: themeColor,
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '3px',
                                                            cursor: 'pointer',
                                                            fontWeight: 500
                                                        }}
                                                        title="申请"
                                                    >
                                                        <FileText size={12} />
                                                        申请
                                                    </button>
                                                )}
                                                {cost.status === 'applied' && (
                                                    <>
                                                        <button
                                                            onClick={() => cost.applicationNumber && onCancelApplication(cost.applicationNumber)}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '3px',
                                                                padding: '3px 6px',
                                                                fontSize: '11px',
                                                                backgroundColor: '#ef4444',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '3px',
                                                                cursor: 'pointer',
                                                                fontWeight: 500
                                                            }}
                                                            title="撤销"
                                                        >
                                                            <XCircle size={12} />
                                                            撤销
                                                        </button>
                                                        <button
                                                            onClick={() => onSettleSingle(cost.id)}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '3px',
                                                                padding: '3px 6px',
                                                                fontSize: '11px',
                                                                backgroundColor: '#059669',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '3px',
                                                                cursor: 'pointer',
                                                                fontWeight: 500
                                                            }}
                                                            title="结算"
                                                        >
                                                            <CheckCircle size={12} />
                                                            结算
                                                        </button>
                                                    </>
                                                )}
                                                {cost.status === 'settled' && (
                                                    <button
                                                        onClick={() => onCancelSettlement([cost.id])}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '3px',
                                                            padding: '3px 6px',
                                                            fontSize: '11px',
                                                            backgroundColor: '#ef4444',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '3px',
                                                            cursor: 'pointer',
                                                            fontWeight: 500
                                                        }}
                                                        title="撤销结算"
                                                    >
                                                        <RotateCcw size={12} />
                                                        撤销结算
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{
                    padding: '8px 12px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#f9fafb',
                    flexShrink: 0
                }}>
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{
                            padding: '4px 8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '12px'
                        }}
                    >
                        <ChevronLeft size={14} />
                        上一页
                    </button>

                    <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                        {currentPage} / {totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        style={{
                            padding: '4px 8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            backgroundColor: currentPage === totalPages ? '#f3f4f6' : 'white',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '12px'
                        }}
                    >
                        下一页
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};
