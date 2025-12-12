import React, { useState } from 'react';
import { X, AlertCircle, Calendar } from 'lucide-react';

interface ApplyModalProps {
    isOpen: boolean;
    costIds: string[];
    type: 'AR' | 'AP';
    totalAmount: number;
    currency: string;
    onConfirm: (dueDate: string, remarks: string) => void;
    onCancel: () => void;
}

export const ExpenseApplyModal: React.FC<ApplyModalProps> = ({
    isOpen,
    costIds,
    type,
    totalAmount,
    currency,
    onConfirm,
    onCancel
}) => {
    const [dueDate, setDueDate] = useState('');
    const [remarks, setRemarks] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!dueDate) {
            setError('请选择最晚付款/收款日期');
            return;
        }

        // Validate date is in the future
        const selectedDate = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            setError('日期不能早于今天');
            return;
        }

        onConfirm(dueDate, remarks);
        // Reset form
        setDueDate('');
        setRemarks('');
        setError('');
    };

    const handleCancel = () => {
        setDueDate('');
        setRemarks('');
        setError('');
        onCancel();
    };

    const typeLabel = type === 'AR' ? '应收' : '应付';
    const dueDateLabel = type === 'AR' ? '最晚收款日期' : '最晚付款日期';

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
                borderRadius: '12px',
                width: '500px',
                maxWidth: '90%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: 600,
                        color: '#111827',
                        margin: 0
                    }}>
                        费用申请
                    </h3>
                    <button
                        onClick={handleCancel}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px' }}>
                    {/* Info Summary */}
                    <div style={{
                        backgroundColor: type === 'AR' ? '#ecfdf5' : '#fff7ed',
                        border: `1px solid ${type === 'AR' ? '#10b981' : '#f59e0b'}`,
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '20px'
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '12px'
                        }}>
                            <div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                    费用类型
                                </div>
                                <div style={{
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    color: type === 'AR' ? '#047857' : '#c2410c'
                                }}>
                                    {typeLabel} ({type})
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                    费用条数
                                </div>
                                <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>
                                    {costIds.length} 条
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                    申请总额
                                </div>
                                <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>
                                    {totalAmount.toLocaleString()} {currency}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Due Date Input */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '14px',
                            fontWeight: 500,
                            marginBottom: '8px',
                            color: '#374151'
                        }}>
                            <Calendar size={16} />
                            {dueDateLabel} <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => {
                                setDueDate(e.target.value);
                                setError('');
                            }}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: error ? '1px solid #ef4444' : '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    {/* Remarks Input */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: 500,
                            marginBottom: '8px',
                            color: '#374151'
                        }}>
                            申请备注
                        </label>
                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="请输入申请备注（可选）"
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px',
                            backgroundColor: '#fee2e2',
                            border: '1px solid #fca5a5',
                            borderRadius: '6px',
                            marginBottom: '16px'
                        }}>
                            <AlertCircle size={16} color="#dc2626" />
                            <span style={{ fontSize: '13px', color: '#dc2626' }}>
                                {error}
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={handleCancel}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500
                        }}
                    >
                        取消
                    </button>
                    <button
                        onClick={handleConfirm}
                        style={{
                            padding: '8px 20px',
                            backgroundColor: type === 'AR' ? '#10b981' : '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 600
                        }}
                    >
                        确认申请
                    </button>
                </div>
            </div>
        </div>
    );
};
