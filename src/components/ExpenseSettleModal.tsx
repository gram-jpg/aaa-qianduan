import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ExpenseSettleModalProps {
    isOpen: boolean;
    costIds: string[];
    type: 'AR' | 'AP';
    totalAmount: number;
    currency: string;
    onConfirm: (settlementDate: string, remarks: string) => void;
    onCancel: () => void;
}

export const ExpenseSettleModal: React.FC<ExpenseSettleModalProps> = ({
    isOpen,
    costIds,
    type,
    totalAmount,
    currency,
    onConfirm,
    onCancel
}) => {
    const [settlementDate, setSettlementDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [remarks, setRemarks] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!settlementDate) {
            alert('请选择结算日期');
            return;
        }
        onConfirm(settlementDate, remarks);
    };

    const typeLabel = type === 'AR' ? '应收' : '应付';
    const themeColor = type === 'AR' ? '#10b981' : '#f59e0b';

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '24px',
                width: '500px',
                maxWidth: '90vw',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #e5e7eb'
                }}>
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: 600,
                        color: '#111827',
                        margin: 0
                    }}>
                        费用结算 - {typeLabel}
                    </h3>
                    <button
                        onClick={onCancel}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: '#6b7280'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Summary */}
                <div style={{
                    backgroundColor: '#f9fafb',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    marginBottom: '20px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#6b7280', fontSize: '14px' }}>费用条数：</span>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{costIds.length} 条</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280', fontSize: '14px' }}>结算总额：</span>
                        <span style={{ fontWeight: 600, fontSize: '16px', color: themeColor }}>
                            {totalAmount.toLocaleString()} {currency}
                        </span>
                    </div>
                </div>

                {/* Settlement Date */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#374151'
                    }}>
                        结算日期 <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                        type="date"
                        value={settlementDate}
                        onChange={(e) => setSettlementDate(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Remarks */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#374151'
                    }}>
                        结算备注
                    </label>
                    <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="请输入结算备注（可选）"
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Actions */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: themeColor,
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                    >
                        确认结算
                    </button>
                </div>
            </div>
        </div>
    );
};
