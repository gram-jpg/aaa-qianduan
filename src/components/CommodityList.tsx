import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

interface Commodity {
    id?: string;
    commodity: string;
    hsCode?: string;
}

interface CommodityListProps {
    value: Commodity[];
    onChange: (commodities: Commodity[]) => void;
}

export const CommodityList: React.FC<CommodityListProps> = ({ value, onChange }) => {
    const [items, setItems] = useState<Commodity[]>(
        value.length > 0 ? value : [{ commodity: '', hsCode: '' }]
    );

    useEffect(() => {
        if (value.length > 0) {
            setItems(value);
        }
    }, [value]);

    const handleAdd = () => {
        const newItems = [...items, { commodity: '', hsCode: '' }];
        setItems(newItems);
        onChange(newItems);
    };

    const handleRemove = (index: number) => {
        // Allow removing all rows
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        onChange(newItems);
    };

    const handleChange = (index: number, field: 'commodity' | 'hsCode', value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
        onChange(newItems);
    };

    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                货物信息 (Commodity)
            </label>

            <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 2fr 60px',
                    gap: '12px',
                    padding: '8px 12px',
                    backgroundColor: '#f9fafb',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6b7280'
                }}>
                    <div>品名 (Commodity Name)</div>
                    <div>HS CODE</div>
                    <div></div>
                </div>

                {/* Rows */}
                {items.map((item, index) => (
                    <div
                        key={index}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 2fr 60px',
                            gap: '12px',
                            padding: '8px 12px',
                            borderBottom: index < items.length - 1 ? '1px solid #f3f4f6' : 'none',
                            backgroundColor: 'white'
                        }}
                    >
                        <input
                            type="text"
                            value={item.commodity}
                            onChange={(e) => handleChange(index, 'commodity', e.target.value)}
                            placeholder="例如：Cotton Fabric"
                            style={{
                                padding: '6px 8px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '13px',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        />
                        <input
                            type="text"
                            value={item.hsCode || ''}
                            onChange={(e) => handleChange(index, 'hsCode', e.target.value)}
                            placeholder="例如：5208310000"
                            style={{
                                padding: '6px 8px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '13px',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        />
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                style={{
                                    padding: '4px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title="删除"
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                {items.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                        暂无货物明细
                    </div>
                )}

                {/* Add Button */}
                <div style={{ padding: '8px 12px', backgroundColor: '#f9fafb' }}>
                    <button
                        type="button"
                        onClick={handleAdd}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            border: '1px dashed #d1d5db',
                            backgroundColor: 'white',
                            color: '#3b82f6',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500,
                            width: '100%',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.backgroundColor = '#eff6ff';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.backgroundColor = 'white';
                        }}
                    >
                        <Plus size={16} />
                        添加品名
                    </button>
                </div>
            </div>

            <div style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                * 保存时会自动过滤无效行。暂存时可留空。
            </div>
        </div>
    );
};
