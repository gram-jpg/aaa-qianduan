import React, { useEffect, useState } from 'react';
import { ShipmentDetail } from './ShipmentDetail';
import { RotateCcw, Search, X, SlidersHorizontal, ChevronUp, ChevronDown } from 'lucide-react';

interface Shipment {
    id: string;
    code: string;
    customerId: string;
    transportTypeId: number;
    businessTypeId: number;
    status: string;
    createdAt: string;
    blNumber?: string;
    vesselVoyage?: string;
    etd?: number | null;
    eta?: number | null;
    polId?: string | null;
    podId?: string | null;
    customer: {
        companyNameEn: string;
        companyNameTh: string;
    };
    transportType: {
        nameZh: string;
        nameEn: string;
    };
    businessType: {
        nameZh: string;
        nameEn: string;
    };
}

export const TMSInProgress: React.FC = () => {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [viewingShipmentId, setViewingShipmentId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const compact = true;
    const [showColumnConfig, setShowColumnConfig] = useState(false);
    const [columns, setColumns] = useState<{ key: string; label: string; visible: boolean }[]>([
        { key: 'code', label: '业务编码', visible: true },
        { key: 'customer', label: '客户', visible: true },
        { key: 'transportType', label: '运输类型', visible: true },
        { key: 'businessType', label: '业务类型', visible: true },
        { key: 'blNumber', label: '提单号', visible: true },
        { key: 'vesselVoyage', label: '船名航次', visible: true },
        { key: 'etd', label: 'ETD', visible: true },
        { key: 'eta', label: 'ETA', visible: true },
        { key: 'createdAt', label: '创建时间', visible: true }
    ]);
    const [page, setPage] = useState<number>(1);
    const [limit] = useState<number>(50);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    const [filters, setFilters] = useState({
        code: '',
        customer: '',
        transportType: '',
        businessType: '',
        blNumber: '',
        startDate: '',
        endDate: ''
    });

    const loadShipments = async (targetPage = page) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('status', 'in-progress');
            params.set('page', String(targetPage));
            params.set('limit', String(limit));
            if (filters.code) params.set('code', filters.code);
            if (filters.customer) params.set('customer', filters.customer);
            if (filters.transportType) params.set('transportType', filters.transportType);
            if (filters.businessType) params.set('businessType', filters.businessType);
            if (filters.blNumber) params.set('blNumber', filters.blNumber);
            if (filters.startDate) params.set('startDate', filters.startDate);
            if (filters.endDate) params.set('endDate', filters.endDate);

            const res = await fetch(`/api/shipments?${params.toString()}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setShipments(data);
                setTotal(data.length);
            } else {
                setShipments(data.items || []);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error('Failed to load shipments:', error);
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadShipments(1);
        setPage(1);
        try {
            const saved = localStorage.getItem('tms-inprogress-columns');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) setColumns(parsed);
            }
        } catch { void 0 }
    }, []);

    // Debounced filter trigger
    useEffect(() => {
        const t = setTimeout(() => {
            setSelectedIds([]);
            setPage(1);
            loadShipments(1);
        }, 300);
        return () => clearTimeout(t);
    }, [filters.code, filters.customer, filters.transportType, filters.businessType, filters.blNumber, filters.startDate, filters.endDate]);

    const toggleSelectAll = () => {
        if (selectedIds.length === shipments.length && shipments.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(shipments.map(s => s.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const handleReturnToDraft = async () => {
        if (!confirm(`确定将 ${selectedIds.length} 个业务返回暂存吗？`)) {
            return;
        }

        try {
            await Promise.all(
                selectedIds.map(id =>
                    fetch(`/api/shipments/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'draft' })
                    })
                )
            );

            alert('已成功返回暂存');
            setSelectedIds([]);
            loadShipments();
        } catch (error) {
            console.error('Failed to return to draft:', error);
            alert('操作失败，请重试');
        }
    };

    const filteredShipments = shipments;

    // If viewing a shipment detail, show detail page
    if (viewingShipmentId) {
        return (
            <ShipmentDetail
                shipmentId={viewingShipmentId}
                onBack={() => {
                    setViewingShipmentId(null);
                    loadShipments(); // Reload list to reflect any changes
                }}
            />
        );
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px' }}>
                {selectedIds.length > 0 && (
                    <button
                        onClick={handleReturnToDraft}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: compact ? '8px 16px' : '10px 20px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: compact ? '12px' : '14px'
                        }}
                    >
                        <RotateCcw size={18} />
                        返回暂存 ({selectedIds.length})
                    </button>
                )}
            </div>

            {/* Filters */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: compact ? '8px' : '12px',
                alignItems: 'center',
                marginBottom: compact ? '12px' : '16px'
            }}>
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="业务编码"
                        value={filters.code}
                        onChange={e => setFilters({ ...filters, code: e.target.value })}
                        style={{ width: '100%', padding: compact ? '6px 8px 6px 28px' : '8px 10px 8px 32px', border: '1px solid #cbd5e1', borderRadius: compact ? '4px' : '6px', fontSize: compact ? '12px' : '14px' }}
                    />
                    {filters.code && <X size={14} onClick={() => setFilters({ ...filters, code: '' })} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer' }} />}
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="客户"
                        value={filters.customer}
                        onChange={e => setFilters({ ...filters, customer: e.target.value })}
                        style={{ width: '100%', padding: compact ? '6px 8px 6px 28px' : '8px 10px 8px 32px', border: '1px solid #cbd5e1', borderRadius: compact ? '4px' : '6px', fontSize: compact ? '12px' : '14px' }}
                    />
                    {filters.customer && <X size={14} onClick={() => setFilters({ ...filters, customer: '' })} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer' }} />}
                </div>
                <input
                    type="text"
                    placeholder="运输类型"
                    value={filters.transportType}
                    onChange={e => setFilters({ ...filters, transportType: e.target.value })}
                    style={{ width: '100%', padding: compact ? '6px 8px' : '8px 10px', border: '1px solid #cbd5e1', borderRadius: compact ? '4px' : '6px', fontSize: compact ? '12px' : '14px' }}
                />
                <input
                    type="text"
                    placeholder="业务类型"
                    value={filters.businessType}
                    onChange={e => setFilters({ ...filters, businessType: e.target.value })}
                    style={{ width: '100%', padding: compact ? '6px 8px' : '8px 10px', border: '1px solid #cbd5e1', borderRadius: compact ? '4px' : '6px', fontSize: compact ? '12px' : '14px' }}
                />
                <input
                    type="text"
                    placeholder="提单号 (BL)"
                    value={filters.blNumber}
                    onChange={e => setFilters({ ...filters, blNumber: e.target.value })}
                    style={{ width: '100%', padding: compact ? '6px 8px' : '8px 10px', border: '1px solid #cbd5e1', borderRadius: compact ? '4px' : '6px', fontSize: compact ? '12px' : '14px' }}
                />
                <div style={{ display: 'flex', gap: compact ? '6px' : '8px' }}>
                    <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} style={{ flex: 1, padding: compact ? '6px 8px' : '8px 10px', border: '1px solid #cbd5e1', borderRadius: compact ? '4px' : '6px', fontSize: compact ? '12px' : '14px' }} />
                    <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} style={{ flex: 1, padding: compact ? '6px 8px' : '8px 10px', border: '1px solid #cbd5e1', borderRadius: compact ? '4px' : '6px', fontSize: compact ? '12px' : '14px' }} />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compact ? '8px' : '12px' }}>
                <div style={{ color: '#64748b', fontSize: compact ? '12px' : '13px' }}>{loading ? '加载中...' : `共 ${total} 条`}</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                        onClick={() => setShowColumnConfig(s => !s)}
                        style={{ padding: compact ? '6px 10px' : '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#fff', cursor: 'pointer', fontSize: compact ? '12px' : '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <SlidersHorizontal size={16} /> 列设置
                    </button>
                    <button
                        onClick={() => {
                            if (page > 1) {
                                const next = page - 1;
                                setPage(next);
                                loadShipments(next);
                                setSelectedIds([]);
                            }
                        }}
                        disabled={page <= 1 || loading}
                        style={{ padding: compact ? '6px 10px' : '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#fff', cursor: page <= 1 || loading ? 'not-allowed' : 'pointer', fontSize: compact ? '12px' : '14px' }}
                    >上一页</button>
                    <div style={{ color: '#64748b', fontSize: compact ? '12px' : '14px', alignSelf: 'center' }}>第 {page} 页</div>
                    <button
                        onClick={() => {
                            const maxPage = Math.max(1, Math.ceil(total / limit));
                            if (page < maxPage) {
                                const next = page + 1;
                                setPage(next);
                                loadShipments(next);
                                setSelectedIds([]);
                            }
                        }}
                        disabled={page >= Math.max(1, Math.ceil(total / limit)) || loading}
                        style={{ padding: compact ? '6px 10px' : '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#fff', cursor: page >= Math.max(1, Math.ceil(total / limit)) || loading ? 'not-allowed' : 'pointer', fontSize: compact ? '12px' : '14px' }}
                    >下一页</button>
                </div>
            </div>

            {showColumnConfig && (
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <div style={{ position: 'absolute', right: 0, top: 0, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '12px', width: '320px' }}>
                        <div style={{ fontSize: compact ? '12px' : '14px', color: '#334155', fontWeight: 600, marginBottom: '8px' }}>列显示与顺序</div>
                        {columns.map((c, idx) => (
                            <div key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: compact ? '6px' : '8px', borderBottom: '1px dashed #e2e8f0' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input type="checkbox" checked={c.visible} onChange={e => {
                                        const next = [...columns];
                                        next[idx] = { ...next[idx], visible: e.target.checked };
                                        setColumns(next);
                                        try { localStorage.setItem('tms-inprogress-columns', JSON.stringify(next)); } catch { void 0 }
                                    }} />
                                    <span style={{ color: '#334155', fontSize: compact ? '12px' : '14px' }}>{c.label}</span>
                                </label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                        onClick={() => {
                                            if (idx === 0) return;
                                            const next = [...columns];
                                            const tmp = next[idx - 1];
                                            next[idx - 1] = next[idx];
                                            next[idx] = tmp;
                                            setColumns(next);
                                            try { localStorage.setItem('tms-inprogress-columns', JSON.stringify(next)); } catch { void 0 }
                                        }}
                                        style={{ border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '4px', padding: compact ? '4px' : '6px', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}
                                    >
                                        <ChevronUp size={14} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (idx === columns.length - 1) return;
                                            const next = [...columns];
                                            const tmp = next[idx + 1];
                                            next[idx + 1] = next[idx];
                                            next[idx] = tmp;
                                            setColumns(next);
                                            try { localStorage.setItem('tms-inprogress-columns', JSON.stringify(next)); } catch { void 0 }
                                        }}
                                        style={{ border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '4px', padding: compact ? '4px' : '6px', cursor: idx === columns.length - 1 ? 'not-allowed' : 'pointer' }}
                                    >
                                        <ChevronDown size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <button onClick={() => setShowColumnConfig(false)} style={{ padding: compact ? '6px 10px' : '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#fff', cursor: 'pointer', fontSize: compact ? '12px' : '14px' }}>完成</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Shipment List */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px', fontSize: compact ? '12px' : '14px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: compact ? '8px' : '12px', width: '50px' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === shipments.length && shipments.length > 0}
                                    onChange={toggleSelectAll}
                                    style={{ cursor: 'pointer' }}
                                />
                            </th>
                            {columns.filter(c => c.visible).map(c => (
                                <th key={c.key} style={{ padding: compact ? '8px' : '12px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>{c.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredShipments.map(shipment => (
                            <tr
                                key={shipment.id}
                                style={{
                                    borderBottom: '1px solid #f1f5f9',
                                    backgroundColor: selectedIds.includes(shipment.id) ? '#eff6ff' : 'transparent',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setViewingShipmentId(shipment.id)}
                            >
                                <td style={{ padding: compact ? '6px' : '12px' }} onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(shipment.id)}
                                        onChange={() => toggleSelect(shipment.id)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </td>
                                {columns.filter(c => c.visible).map(c => {
                                    if (c.key === 'code') {
                                        return <td key={c.key} style={{ padding: compact ? '6px' : '12px', fontWeight: 500, color: '#2563eb', whiteSpace: 'nowrap' }}>{shipment.code}</td>;
                                    }
                                    if (c.key === 'customer') {
                                        return <td key={c.key} style={{ padding: compact ? '6px' : '12px' }}>{shipment.customer?.companyNameEn || '-'}</td>;
                                    }
                                    if (c.key === 'transportType') {
                                        return <td key={c.key} style={{ padding: compact ? '6px' : '12px' }}>{shipment.transportType?.nameZh || '-'}</td>;
                                    }
                                    if (c.key === 'businessType') {
                                        return <td key={c.key} style={{ padding: compact ? '6px' : '12px' }}>{shipment.businessType?.nameZh || '-'}</td>;
                                    }
                                    if (c.key === 'blNumber') {
                                        return <td key={c.key} style={{ padding: compact ? '6px' : '12px', color: '#334155' }}>{shipment.blNumber || '-'}</td>;
                                    }
                                    if (c.key === 'vesselVoyage') {
                                        return <td key={c.key} style={{ padding: compact ? '6px' : '12px', color: '#334155' }}>{shipment.vesselVoyage || '-'}</td>;
                                    }
                                    if (c.key === 'etd') {
                                        return <td key={c.key} style={{ padding: compact ? '6px' : '12px', color: '#64748b' }}>{shipment.etd ? new Date(Number(shipment.etd)).toLocaleDateString('zh-CN') : '-'}</td>;
                                    }
                                    if (c.key === 'eta') {
                                        return <td key={c.key} style={{ padding: compact ? '6px' : '12px', color: '#64748b' }}>{shipment.eta ? new Date(Number(shipment.eta)).toLocaleDateString('zh-CN') : '-'}</td>;
                                    }
                                    if (c.key === 'createdAt') {
                                        return <td key={c.key} style={{ padding: compact ? '6px' : '12px', color: '#64748b' }}>{new Date(shipment.createdAt).toLocaleString('zh-CN')}</td>;
                                    }
                                    return <td key={c.key} style={{ padding: compact ? '6px' : '12px' }}>-</td>;
                                })}
                            </tr>
                        ))}
                        {filteredShipments.length === 0 && (
                            <tr>
                                <td colSpan={columns.filter(c => c.visible).length + 1} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                    暂无操作中业务
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
