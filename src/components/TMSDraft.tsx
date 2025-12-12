import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Search, X, SlidersHorizontal, ChevronUp, ChevronDown } from 'lucide-react';
import { ShipmentDetail } from './ShipmentDetail';
import { ConfirmDialog } from './UI';

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

interface Customer {
    id: string;
    companyNameEn: string;
    companyNameTh: string;
    isActive?: boolean;
}

interface Type {
    id: number;
    nameZh: string;
    nameEn: string;
}

export const TMSDraft: React.FC = () => {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [transportTypes, setTransportTypes] = useState<Type[]>([]);
    const [businessTypes, setBusinessTypes] = useState<Type[]>([]);
    const [viewingShipmentId, setViewingShipmentId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [showBlockedModal, setShowBlockedModal] = useState(false);
    const [blockedMessage, setBlockedMessage] = useState('');
    const [selectedShipmentIds, setSelectedShipmentIds] = useState<Set<string>>(new Set());
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;
    const [total, setTotal] = useState(0);
    const compact = true;
    const [loading, setLoading] = useState(false);
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
    const [filters, setFilters] = useState({
        code: '',
        customer: '',
        transportType: '',
        businessType: '',
        blNumber: '',
        startDate: '',
        endDate: ''
    });

    // Form state
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedTransport, setSelectedTransport] = useState('');
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    useEffect(() => {
        loadShipments();
        loadCustomers();
        loadTransportTypes();
        loadBusinessTypes();
        try {
            const saved = localStorage.getItem('tms-draft-columns');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) setColumns(parsed);
            }
        } catch { void 0 }
    }, []);

    useEffect(() => {
        loadShipments();
    }, [currentPage]);

    useEffect(() => {
        const t = setTimeout(() => {
            setSelectedShipmentIds(new Set());
            setCurrentPage(1);
            loadShipments();
        }, 300);
        return () => clearTimeout(t);
    }, [filters.code, filters.customer, filters.transportType, filters.businessType, filters.blNumber, filters.startDate, filters.endDate]);

    const loadShipments = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('status', 'draft');
            params.set('page', String(currentPage));
            params.set('limit', String(pageSize));
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
                setTotal(data.length);
                const start = (currentPage - 1) * pageSize;
                const end = start + pageSize;
                setShipments(data.slice(start, end));
            } else {
                setShipments(data.items || []);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error('Failed to load shipments:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCustomers = async () => {
        try {
            const res = await fetch('/api/customers');
            const data = await res.json();
            setCustomers(data);
        } catch (error) {
            console.error('Failed to load customers:', error);
        }
    };

    const loadTransportTypes = async () => {
        try {
            const res = await fetch('/api/settings/transport-types');
            const data = await res.json();
            setTransportTypes(data);
        } catch (error) {
            console.error('Failed to load transport types:', error);
        }
    };

    const loadBusinessTypes = async () => {
        try {
            const res = await fetch('/api/settings/business-types');
            const data = await res.json();
            setBusinessTypes(data);
        } catch (error) {
            console.error('Failed to load business types:', error);
        }
    };

    const handleCreate = async () => {
        if (!selectedCustomer || !selectedTransport || !selectedBusiness) {
            alert('请填写所有必填项');
            return;
        }

        try {
            const res = await fetch('/api/shipments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: selectedCustomer,
                    transportTypeId: Number(selectedTransport),
                    businessTypeId: Number(selectedBusiness),
                    status: 'draft'
                })
            });

            if (res.ok) {
                setShowForm(false);
                setSelectedCustomer('');
                setSelectedTransport('');
                setSelectedBusiness('');
                setCustomerSearch('');
                loadShipments();
            } else {
                alert('创建失败');
            }
        } catch (error) {
            console.error('Failed to create shipment:', error);
            alert('创建失败');
        }
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        try {
            const res = await fetch(`/api/shipments/${deleteId}`, { method: 'DELETE' });
            if (res.ok) {
                loadShipments();
                setShowDeleteConfirm(false);
                setDeleteId(null);
            } else {
                let msg = '删除失败';
                try {
                    const data = await res.json();
                    if (data && data.error) msg = data.error;
                } catch (e) { void e }
                setShowDeleteConfirm(false);
                setBlockedMessage(msg.includes('已结算') ? '该业务存在已结算的费用，禁止删除' : msg);
                setShowBlockedModal(true);
            }
        } catch (error) {
            console.error('Failed to delete shipment:', error);
            alert('删除失败');
        }
    };

    const filteredCustomers = customers
        .filter(c => c.isActive !== false)
        .filter(c =>
            c.companyNameEn.toLowerCase().includes(customerSearch.toLowerCase()) ||
            c.companyNameTh.includes(customerSearch)
        );

    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer.id);
        setCustomerSearch(customer.companyNameEn);
        setShowCustomerDropdown(false);
    };

    // If viewing a shipment detail, show detail page
    if (viewingShipmentId) {
        return (
            <ShipmentDetail
                shipmentId={viewingShipmentId}
                onBack={() => {
                    setViewingShipmentId(null);
                    loadShipments();
                }}
            />
        );
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: compact ? '16px' : '24px' }}>
                <div style={{ display: 'flex', gap: compact ? '8px' : '12px' }}>
                    <button
                        onClick={() => setShowForm(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: compact ? '8px 16px' : '10px 20px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: compact ? '12px' : '14px'
                        }}
                    >
                        <Plus size={18} /> 新建
                    </button>
                    <button
                        onClick={() => setShowBulkDeleteConfirm(true)}
                        disabled={selectedShipmentIds.size === 0}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: compact ? '8px 16px' : '10px 20px',
                            backgroundColor: selectedShipmentIds.size === 0 ? '#cbd5e1' : '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: selectedShipmentIds.size === 0 ? 'not-allowed' : 'pointer',
                            fontWeight: 500,
                            fontSize: compact ? '12px' : '14px'
                        }}
                    >
                        <Trash2 size={18} /> 批量删除
                    </button>
                </div>
            </div>

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
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage <= 1 || loading}
                        style={{ padding: compact ? '6px 10px' : '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#fff', cursor: currentPage <= 1 || loading ? 'not-allowed' : 'pointer', fontSize: compact ? '12px' : '14px' }}
                    >上一页</button>
                    <div style={{ color: '#64748b', fontSize: compact ? '12px' : '14px', alignSelf: 'center' }}>第 {currentPage} 页</div>
                    <button
                        onClick={() => {
                            const totalPages = Math.max(1, Math.ceil(total / pageSize));
                            if (currentPage < totalPages) {
                                setCurrentPage(p => Math.min(totalPages, p + 1));
                            }
                        }}
                        disabled={currentPage >= Math.max(1, Math.ceil(total / pageSize)) || loading}
                        style={{ padding: compact ? '6px 10px' : '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#fff', cursor: currentPage >= Math.max(1, Math.ceil(total / pageSize)) || loading ? 'not-allowed' : 'pointer', fontSize: compact ? '12px' : '14px' }}
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
                                        try { localStorage.setItem('tms-draft-columns', JSON.stringify(next)); } catch { void 0 }
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
                                            try { localStorage.setItem('tms-draft-columns', JSON.stringify(next)); } catch { void 0 }
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
                                            try { localStorage.setItem('tms-draft-columns', JSON.stringify(next)); } catch { void 0 }
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
                                    checked={shipments.length > 0 && shipments.every(s => selectedShipmentIds.has(s.id))}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            const allIds = new Set<string>(shipments.map(s => s.id));
                                            setSelectedShipmentIds(allIds);
                                        } else {
                                            setSelectedShipmentIds(new Set());
                                        }
                                    }}
                                />
                            </th>
                            {columns.filter(c => c.visible).map(c => (
                                <th key={c.key} style={{ padding: compact ? '8px' : '12px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>{c.label}</th>
                            ))}
                            <th style={{ padding: compact ? '8px' : '12px', textAlign: 'right', fontWeight: 600, color: '#64748b' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shipments.map(shipment => (
                            <tr key={shipment.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '12px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedShipmentIds.has(shipment.id)}
                                        onChange={(e) => {
                                            const next = new Set(selectedShipmentIds);
                                            if (e.target.checked) {
                                                next.add(shipment.id);
                                            } else {
                                                next.delete(shipment.id);
                                            }
                                            setSelectedShipmentIds(next);
                                        }}
                                    />
                                </td>
                                {columns.filter(c => c.visible).map(c => {
                                    if (c.key === 'code') {
                                        return (
                                            <td key={c.key} style={{ padding: compact ? '6px' : '12px', fontWeight: 500, color: '#2563eb', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                onClick={() => setViewingShipmentId(shipment.id)}
                                            >
                                                {shipment.code}
                                            </td>
                                        );
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
                                <td style={{ padding: compact ? '6px' : '12px', textAlign: 'right' }}>
                                    <button
                                        onClick={(e) => handleDeleteClick(shipment.id, e)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#ef4444',
                                            padding: compact ? '2px' : '4px'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {shipments.length === 0 && (
                            <tr>
                                <td colSpan={columns.filter(c => c.visible).length + 2} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                    暂无业务数据
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>


            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="确认删除"
                message="确定删除此业务吗？此操作无法撤销。"
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            {showBlockedModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '420px', boxShadow: '0 10px 20px rgba(0,0,0,0.15)' }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>无法删除</div>
                            <button onClick={() => setShowBlockedModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '14px' }}>关闭</button>
                        </div>
                        <div style={{ padding: '16px', fontSize: '13px', color: '#374151' }}>{blockedMessage}</div>
                        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowBlockedModal(false)} style={{ padding: '8px 14px', border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>我知道了</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={showBulkDeleteConfirm}
                title="确认批量删除"
                message={`确定删除选中的 ${selectedShipmentIds.size} 条业务吗？此操作无法撤销。`}
                onConfirm={async () => {
                    try {
                        const ids = Array.from(selectedShipmentIds);
                        const res = await fetch('/api/shipments/bulk-delete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ids })
                        });
                        if (res.ok) {
                            const data = await res.json();
                            setSelectedShipmentIds(new Set());
                            loadShipments();
                            if (data && typeof data.blocked === 'number' && data.blocked > 0) {
                                const blockedIds: string[] = Array.isArray(data.blockedIds) ? data.blockedIds : [];
                                const codes = shipments.filter(s => blockedIds.includes(s.id)).map(s => s.code);
                                const detail = codes.length > 0 ? `（${codes.join(', ')}）` : '';
                                setBlockedMessage(`共有 ${data.blocked} 条业务存在已结算费用，禁止删除${detail}`);
                                setShowBlockedModal(true);
                                setShowBulkDeleteConfirm(false);
                            } else {
                                setShowBulkDeleteConfirm(false);
                            }
                        } else {
                            alert('批量删除失败');
                        }
                    } catch (error) {
                        console.error('Failed to bulk delete shipments:', error);
                        alert('批量删除失败');
                    }
                }}
                onCancel={() => setShowBulkDeleteConfirm(false)}
            />

            {/* Create Form Modal */}
            {showForm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
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
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>新建业务</h3>


                        {/* Auto-generated Code Display */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#334155' }}>
                                业务编码 <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 400 }}>(系统自动生成)</span>
                            </label>
                            <input
                                type="text"
                                value="Rsl-YYMMDDNNN"
                                disabled
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    backgroundColor: '#f1f5f9',
                                    color: '#64748b',
                                    cursor: 'not-allowed'
                                }}
                            />
                        </div>

                        {/* Customer Select with Autocomplete */}
                        <div style={{ marginBottom: '16px', position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#334155' }}>
                                客户 <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="输入客户名称搜索..."
                                value={customerSearch}
                                onChange={(e) => {
                                    setCustomerSearch(e.target.value);
                                    setShowCustomerDropdown(true);
                                    if (!e.target.value) {
                                        setSelectedCustomer('');
                                    }
                                }}
                                onFocus={() => setShowCustomerDropdown(true)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px'
                                }}
                            />
                            {showCustomerDropdown && customerSearch && filteredCustomers.length > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    backgroundColor: 'white',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    marginTop: '4px',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    zIndex: 1000,
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }}>
                                    {filteredCustomers.map(customer => (
                                        <div
                                            key={customer.id}
                                            onClick={() => handleCustomerSelect(customer)}
                                            style={{
                                                padding: '8px 12px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #f1f5f9',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                        >
                                            {customer.companyNameEn}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Transport Type Select */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#334155' }}>
                                运输类型 <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select
                                value={selectedTransport}
                                onChange={(e) => setSelectedTransport(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px'
                                }}
                            >
                                <option value="">请选择运输类型</option>
                                {transportTypes.map(type => (
                                    <option key={type.id} value={type.id}>
                                        {type.nameZh} ({type.nameEn})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Business Type Select */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#334155' }}>
                                业务类型 <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select
                                value={selectedBusiness}
                                onChange={(e) => setSelectedBusiness(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px'
                                }}
                            >
                                <option value="">请选择业务类型</option>
                                {businessTypes.map(type => (
                                    <option key={type.id} value={type.id}>
                                        {type.nameZh} ({type.nameEn})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    setSelectedCustomer('');
                                    setSelectedTransport('');
                                    setSelectedBusiness('');
                                    setCustomerSearch('');
                                }}
                                style={{
                                    padding: '8px 16px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    backgroundColor: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                取消
                            </button>
                            <button
                                onClick={handleCreate}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
