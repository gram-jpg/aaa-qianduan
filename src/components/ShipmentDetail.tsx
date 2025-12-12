import React, { useEffect, useState } from 'react';
import { ArrowLeft, FileText, DollarSign, Paperclip, Edit2, Save, X, Play, Trash2 } from 'lucide-react';
import { PortSelector } from './PortSelector';
import { CommodityList } from './CommodityList';
import { useLanguage } from '../context/LanguageContext';

interface Shipment {
    id: string;
    code: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    customer: {
        id: string;
        companyNameEn: string;
        companyNameTh: string;
        taxId: string;
        addressTh: string;
    };
    transportType: {
        id: number;
        nameZh: string;
        nameEn: string;
    };
    businessType: {
        id: number;
        nameZh: string;
        nameEn: string;
    };
    // Sea freight fields
    blNumber?: string;
    consignee?: string;
    notifyParty?: string;
    polId?: string;
    podId?: string;
    pol?: { id: string; code: string; nameEn: string; nameCn: string };
    pod?: { id: string; code: string; nameEn: string; nameCn: string };
    incotermId?: number;
    incoterm?: { id: number; nameZh: string; nameEn: string };
    vesselVoyage?: string;
    etd?: number;
    eta?: number;
    ata?: number;
    commodities?: Commodity[];
    costs: ShipmentCost[];
    attachments: ShipmentAttachment[];
}

interface Commodity {
    id?: string;
    commodity: string;
    hsCode?: string;
    sequence?: number;
}

interface ShipmentCost {
    id: string;
    description: string;
    amount: number;
    currency: string;
    createdAt: string;
    settlementUnitName?: string;

    // 费用申请相关字段
    status?: string;  // unapplied | applied | settled | canceled
    applicationNumber?: string | null;
    type?: string;  // AR or AP
}

interface ShipmentAttachment {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: string;
}

interface Props {
    shipmentId: string;
    onBack: () => void;
}

export const ShipmentDetail: React.FC<Props> = ({ shipmentId, onBack }) => {
    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'costs' | 'attachments'>('details');
    const [loading, setLoading] = useState(true);
    const compact = true;

    useEffect(() => {
        loadShipment();
    }, [shipmentId]);

    useEffect(() => {
        if (activeTab === 'costs' && shipment && !['in-progress', 'completed', 'archived'].includes(shipment.status)) {
            setActiveTab('details');
        }
    }, [activeTab, shipment?.status]);

    const loadShipment = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/shipments/${shipmentId}`);
            const data = await res.json();
            setShipment(data);
        } catch (error) {
            console.error('Failed to load shipment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        if (newStatus === 'in-progress') {
            // Both draft->in-progress and archived->in-progress use same flow
            if (!confirm('确定转入操作阶段吗？转入后将进入操作列表。')) return;
        }

        try {
            setLoading(true);
            const res = await fetch(`/api/shipments/${shipmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                alert('操作成功');
                onBack(); // Go back to list as it might move to a different list
            } else {
                alert('操作失败');
                loadShipment(); // Reload
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('操作失败');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: compact ? '16px' : '24px', textAlign: 'center' }}>
                <p style={{ color: '#64748b' }}>加载中...</p>
            </div>
        );
    }

    if (!shipment) {
        return (
            <div style={{ padding: compact ? '16px' : '24px', textAlign: 'center' }}>
                <p style={{ color: '#ef4444' }}>业务不存在</p>
            </div>
        );
    }

    const canShowCosts = ['in-progress', 'completed', 'archived'].includes(shipment.status);

    const tabs = [
        { id: 'details', label: '业务详情', icon: FileText },
        ...(canShowCosts ? [{ id: 'costs', label: '费用录入', icon: DollarSign }] : []),
        { id: 'attachments', label: '附件管理', icon: Paperclip }
    ];

    return (
        <div style={{ padding: compact ? '16px' : '24px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={onBack}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: compact ? '6px 10px' : '6px 12px',
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: compact ? '4px' : '6px',
                            cursor: 'pointer',
                            fontSize: compact ? '12px' : '14px',
                            color: '#475569'
                        }}
                    >
                        <ArrowLeft size={16} /> 返回
                    </button>
                    <span style={{ fontSize: compact ? '14px' : '16px', fontWeight: 600, color: '#1e293b' }}>
                        业务详情 - {shipment.code}
                    </span>
                </div>

                {/* Status Actions */}
                {shipment.status === 'draft' && (
                    <button
                        onClick={() => handleStatusUpdate('in-progress')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: compact ? '6px 12px' : '6px 16px',
                            backgroundColor: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: compact ? '4px' : '6px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: compact ? '12px' : '14px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}
                    >
                        <Play size={16} /> 转操作
                    </button>
                )}
                {shipment.status === 'archived' && (
                    <button
                        onClick={() => handleStatusUpdate('in-progress')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: compact ? '6px 12px' : '6px 16px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: compact ? '4px' : '6px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: compact ? '12px' : '14px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}
                    >
                        返回操作中
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                marginTop: '0'
            }}>
                {/* Tab Headers */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                    padding: '0 12px' // Add slight horizontal padding
                }}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: compact ? '8px 12px' : '12px 16px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                                    color: isActive ? '#2563eb' : '#64748b',
                                    fontWeight: isActive ? 600 : 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    marginBottom: '-1px',
                                    fontSize: compact ? '12px' : '14px'
                                }}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div style={{ padding: compact ? '16px' : '24px' }}>
                    {activeTab === 'details' && (
                        <BusinessDetailsTab shipment={shipment} onUpdate={loadShipment} />
                    )}
                    {activeTab === 'costs' && (
                        <CostEntryTab
                            shipmentId={shipment.id}
                            costs={shipment.costs}
                            onUpdate={loadShipment}
                            readonly={shipment.status === 'archived'}
                        />
                    )}
                    {activeTab === 'attachments' && (
                        <AttachmentsTab
                            shipment={shipment}
                            shipmentId={shipment.id}
                            attachments={shipment.attachments}
                            onUpdate={loadShipment}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// Business Details Tab Component with Edit Mode
const BusinessDetailsTab: React.FC<{ shipment: Shipment; onUpdate?: () => void }> = ({ shipment: initialShipment, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [shipment, setShipment] = useState(initialShipment);
    const [tradeTerms, setTradeTerms] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const compact = true;

    useEffect(() => {
        loadTradeTerms();
    }, []);

    useEffect(() => {
        // Only update local state from props if NOT editing, or if the ID changed (completely different shipment)
        if (!isEditing || initialShipment.id !== shipment.id) {
            setShipment(initialShipment);
        }
    }, [initialShipment, isEditing, shipment.id]);

    useEffect(() => {
        if (shipment.status === 'archived' && isEditing) {
            setIsEditing(false);
        }
    }, [shipment.status, isEditing]);

    const loadTradeTerms = async () => {
        try {
            const res = await fetch('/api/settings/trade-terms');
            const data = await res.json();
            setTradeTerms(data);
        } catch (error) {
            console.error('Failed to load trade terms:', error);
        }
    };

    const handleSave = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        try {
            setSaving(true);

            // Helper to ensure date is number or null, never NaN or invalid
            const safeDate = (date: any) => {
                if (!date) return null;
                const ts = Number(date);
                return isNaN(ts) ? null : ts;
            };

            const payload = {
                blNumber: shipment.blNumber || null,
                consignee: shipment.consignee || null,
                notifyParty: shipment.notifyParty || null,
                polId: shipment.polId || null,
                podId: shipment.podId || null,
                incotermId: shipment.incotermId || null,
                vesselVoyage: shipment.vesselVoyage || null,
                etd: safeDate(shipment.etd),
                eta: safeDate(shipment.eta),
                ata: safeDate(shipment.ata),
                commodities: shipment.commodities || []
            };

            console.log('Final Payload being sent:', JSON.stringify(payload, null, 2));

            // console.log('Saving shipment:', payload);

            const res = await fetch(`/api/shipments/${shipment.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const updated = await res.json();
                setShipment(updated);
                setIsEditing(false); // Return to view mode with updated data
                alert('保存成功');
                if (onUpdate) onUpdate();
            } else {
                const errData = await res.json().catch(() => ({}));
                console.error('Save failed:', errData);
                alert(`保存失败:${errData.error || '未知错误'}`);
            }
        } catch (error) {
            console.error('Failed to save:', error);
            alert(`保存失败:${error instanceof Error ? error.message : '网络错误'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setShipment(initialShipment);
        setIsEditing(false);
    };

    const isSeaFreight = shipment.transportType.nameEn.toLowerCase().includes('sea');
    const isImport = shipment.businessType.nameEn.toLowerCase().includes('import');

    return (
        <div>
            {/* Edit/Save Buttons */}
            <div style={{ marginBottom: compact ? '12px' : '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                {!isEditing && shipment.status !== 'archived' ? (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: compact ? '6px 12px' : '8px 16px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: compact ? '4px' : '6px',
                            cursor: 'pointer',
                            fontSize: compact ? '12px' : '14px',
                            fontWeight: 500
                        }}
                    >
                        <Edit2 size={16} />
                        编辑
                    </button>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={handleCancel}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: compact ? '6px 12px' : '8px 16px',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: compact ? '4px' : '6px',
                                cursor: 'pointer',
                                fontSize: compact ? '12px' : '14px'
                            }}
                        >
                            <X size={16} />
                            取消
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: compact ? '6px 12px' : '8px 16px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: compact ? '4px' : '6px',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                fontSize: compact ? '12px' : '14px',
                                fontWeight: 500,
                                opacity: saving ? 0.6 : 1
                            }}
                        >
                            <Save size={16} />
                            {saving ? '保存中...' : '保存'}
                        </button>
                    </>
                )}
            </div>

            {/* Basic Info */}
            <div style={{ marginBottom: compact ? '16px' : '20px' }}>
                <h3 style={{ fontSize: compact ? '14px' : '16px', fontWeight: 600, marginBottom: compact ? '8px' : '12px', color: '#0f172a' }}>基本信息</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: compact ? '8px 10px' : '12px 16px' }}>
                    <DetailItem label="业务编码" value={shipment.code} />
                    <DetailItem label="状态" value={getStatusLabel(shipment.status)} />
                    <DetailItem label="客户名称" value={shipment.customer?.companyNameEn || '-'} />
                    <DetailItem label="运输类型" value={`${shipment.transportType.nameZh} (${shipment.transportType.nameEn})`} />
                    <DetailItem label="业务类型" value={`${shipment.businessType.nameZh} (${shipment.businessType.nameEn})`} />
                </div>
            </div>

            {/* Sea Freight Fields - Only show for sea freight */}
            {isSeaFreight && (
                <div style={{ marginBottom: compact ? '16px' : '24px', padding: compact ? '16px' : '20px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: compact ? '14px' : '16px', fontWeight: 600, marginBottom: compact ? '10px' : '16px', color: '#0f172a' }}>海运信息</h3>

                    {isEditing ? (
                        <div style={{ display: 'grid', gap: compact ? '10px' : '16px' }}>
                            {/* BL Number */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: compact ? '12px' : '14px', fontWeight: 500 }}>
                                    提单号 (BL No.)
                                </label>
                                <input
                                    type="text"
                                    value={shipment.blNumber || ''}
                                    onChange={(e) => setShipment({ ...shipment, blNumber: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: compact ? '6px 10px' : '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: compact ? '4px' : '6px',
                                        fontSize: compact ? '12px' : '14px'
                                    }}
                                    placeholder="例如：BL123456"
                                />
                            </div>

                            {/* Business Code (Read Only) */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: compact ? '12px' : '14px', fontWeight: 500, color: '#64748b' }}>
                                    业务编码 (不可修改)
                                </label>
                                <input
                                    type="text"
                                    value={shipment.code}
                                    disabled
                                    style={{
                                        width: '100%',
                                        padding: compact ? '6px 10px' : '8px 12px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: compact ? '4px' : '6px',
                                        fontSize: compact ? '12px' : '14px',
                                        backgroundColor: '#f1f5f9',
                                        color: '#64748b',
                                        cursor: 'not-allowed'
                                    }}
                                />
                            </div>

                            {/* Consignee */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: compact ? '12px' : '14px', fontWeight: 500 }}>
                                    收发货人 (Consignee)
                                </label>
                                <input
                                    type="text"
                                    value={shipment.consignee || ''}
                                    onChange={(e) => setShipment({ ...shipment, consignee: e.target.value || undefined })}
                                    style={{
                                        width: '100%',
                                        padding: compact ? '6px 10px' : '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: compact ? '4px' : '6px',
                                        fontSize: compact ? '12px' : '14px'
                                    }}
                                    placeholder="例如：ABC Company Ltd"
                                />
                            </div>

                            {/* Notify Party */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: compact ? '12px' : '14px', fontWeight: 500 }}>
                                    通知人 (Notify Party)
                                </label>
                                <input
                                    type="text"
                                    value={shipment.notifyParty || ''}
                                    onChange={(e) => setShipment({ ...shipment, notifyParty: e.target.value || undefined })}
                                    style={{
                                        width: '100%',
                                        padding: compact ? '6px 10px' : '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: compact ? '4px' : '6px',
                                        fontSize: compact ? '12px' : '14px'
                                    }}
                                    placeholder="例如：XYZ Logistics"
                                />
                            </div>

                            {/* Ports */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: compact ? '10px' : '16px' }}>
                                <PortSelector
                                    label="起运港 (POL)"
                                    value={shipment.polId || ''}
                                    onChange={(polId) => setShipment({ ...shipment, polId: polId || undefined })}
                                    placeholder="选择起运港"
                                />
                                <PortSelector
                                    label="目的港 (POD)"
                                    value={shipment.podId || ''}
                                    onChange={(podId) => setShipment({ ...shipment, podId: podId || undefined })}
                                    placeholder="选择目的港"
                                />
                            </div>

                            {/* Commodities */}
                            <CommodityList
                                value={shipment.commodities || [{ commodity: '', hsCode: '' }]}
                                onChange={(commodities) => setShipment({ ...shipment, commodities })}
                            />

                            {/* Trade Terms */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: compact ? '12px' : '14px', fontWeight: 500 }}>
                                    贸易条款 (Incoterms)
                                </label>
                                <select
                                    value={shipment.incotermId || ''}
                                    onChange={(e) => setShipment({ ...shipment, incotermId: e.target.value ? parseInt(e.target.value) : undefined })}
                                    style={{
                                        width: '100%',
                                        padding: compact ? '6px 10px' : '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: compact ? '4px' : '6px',
                                        fontSize: compact ? '12px' : '14px'
                                    }}
                                >
                                    <option value="">选择贸易条款</option>
                                    {tradeTerms.map(term => (
                                        <option key={term.id} value={term.id}>
                                            {term.nameEn} ({term.nameZh})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Vessel/Voyage */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: compact ? '12px' : '14px', fontWeight: 500 }}>
                                    船名航次 (Vessel/Voyage)
                                </label>
                                <input
                                    type="text"
                                    value={shipment.vesselVoyage || ''}
                                    onChange={(e) => setShipment({ ...shipment, vesselVoyage: e.target.value || undefined })}
                                    style={{
                                        width: '100%',
                                        padding: compact ? '6px 10px' : '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: compact ? '4px' : '6px',
                                        fontSize: compact ? '12px' : '14px'
                                    }}
                                    placeholder="例如：MAERSK ESSEX V.123"
                                />
                            </div>

                            {/* Dates */}
                            <div style={{ display: 'grid', gridTemplateColumns: isImport ? '1fr 1fr 1fr' : '1fr 1fr', gap: compact ? '10px' : '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: compact ? '12px' : '14px', fontWeight: 500 }}>
                                        ETD
                                    </label>
                                    <input
                                        type="date"
                                        value={shipment.etd ? new Date(shipment.etd).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setShipment({ ...shipment, etd: e.target.value ? new Date(e.target.value).getTime() : undefined })}
                                        style={{
                                            width: '100%',
                                            padding: compact ? '6px 10px' : '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: compact ? '4px' : '6px',
                                            fontSize: compact ? '12px' : '14px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: compact ? '12px' : '14px', fontWeight: 500 }}>
                                        ETA
                                    </label>
                                    <input
                                        type="date"
                                        value={shipment.eta ? new Date(shipment.eta).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setShipment({ ...shipment, eta: e.target.value ? new Date(e.target.value).getTime() : undefined })}
                                        style={{
                                            width: '100%',
                                            padding: compact ? '6px 10px' : '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: compact ? '4px' : '6px',
                                            fontSize: compact ? '12px' : '14px'
                                        }}
                                    />
                                </div>
                                {isImport && (
                                    <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: compact ? '12px' : '14px', fontWeight: 500 }}>
                                            ATA
                                        </label>
                                        <input
                                            type="date"
                                            value={shipment.ata ? new Date(shipment.ata).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setShipment({ ...shipment, ata: e.target.value ? new Date(e.target.value).getTime() : undefined })}
                                            style={{
                                                width: '100%',
                                                padding: compact ? '6px 10px' : '8px 12px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: compact ? '4px' : '6px',
                                                fontSize: compact ? '12px' : '14px'
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: compact ? '10px' : '16px' }}>
                            <DetailItem label="提单号" value={shipment.blNumber || '-'} />
                            <DetailItem label="收发货人" value={shipment.consignee || '-'} />
                            <DetailItem label="通知人" value={shipment.notifyParty || '-'} />
                            <DetailItem label="起运港" value={shipment.pol ? `${shipment.pol.code} -${shipment.pol.nameEn} (${shipment.pol.nameCn})` : '-'} />
                            <DetailItem label="目的港" value={shipment.pod ? `${shipment.pod.code} -${shipment.pod.nameEn} (${shipment.pod.nameCn})` : '-'} />
                            <DetailItem label="贸易条款" value={shipment.incoterm ? `${shipment.incoterm.nameEn} (${shipment.incoterm.nameZh})` : '-'} />
                            <DetailItem label="船名航次" value={shipment.vesselVoyage || '-'} />
                            <DetailItem label="ETD" value={shipment.etd ? new Date(shipment.etd).toLocaleDateString('zh-CN') : '-'} />
                            <DetailItem label="ETA" value={shipment.eta ? new Date(shipment.eta).toLocaleDateString('zh-CN') : '-'} />
                            {isImport && <DetailItem label="ATA" value={shipment.ata ? new Date(shipment.ata).toLocaleDateString('zh-CN') : '-'} />}

                            {/* Commodities Display */}
                            {shipment.commodities && shipment.commodities.length > 0 && (
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <div style={{ fontSize: compact ? '12px' : '13px', color: '#64748b', marginBottom: compact ? '6px' : '8px', fontWeight: 500 }}>货物信息</div>
                                    <div style={{ border: '1px solid #e5e7eb', borderRadius: compact ? '4px' : '6px', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead style={{ backgroundColor: '#f9fafb' }}>
                                                <tr>
                                                    <th style={{ padding: compact ? '6px 8px' : '8px 12px', textAlign: 'left', fontSize: compact ? '12px' : '13px', fontWeight: 600, color: '#6b7280' }}>品名</th>
                                                    <th style={{ padding: compact ? '6px 8px' : '8px 12px', textAlign: 'left', fontSize: compact ? '12px' : '13px', fontWeight: 600, color: '#6b7280' }}>HS CODE</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {shipment.commodities.map((item, index) => (
                                                    <tr key={index} style={{ borderTop: '1px solid #f3f4f6' }}>
                                                        <td style={{ padding: compact ? '6px 8px' : '8px 12px', fontSize: compact ? '12px' : '14px' }}>{item.commodity}</td>
                                                        <td style={{ padding: compact ? '6px 8px' : '8px 12px', fontSize: compact ? '12px' : '14px', color: '#6b7280' }}>{item.hsCode || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Timestamps */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: compact ? '10px' : '16px', paddingTop: compact ? '10px' : '16px', borderTop: '1px solid #e5e7eb' }}>
                <DetailItem label="创建时间" value={new Date(shipment.createdAt).toLocaleString('zh-CN')} />
                <DetailItem label="更新时间" value={new Date(shipment.updatedAt).toLocaleString('zh-CN')} />
            </div>
        </div>
    );
};

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>{value}</div>
    </div>
);

const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
        'draft': '暂存',
        'in-progress': '操作中',
        'completed': '已完成',
        'archived': '归档'
    };
    return labels[status] || status;
};



// Cost Entry Tab Component
const CostEntryTab: React.FC<{
    shipmentId: string;
    costs: ShipmentCost[];
    onUpdate: () => void;
    readonly?: boolean;
}> = ({ shipmentId, costs, onUpdate, readonly }) => {
    const { language } = useLanguage();
    const [addingType, setAddingType] = useState<'AR' | 'AP' | null>(null);
    const [financialSubjects, setFinancialSubjects] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        financialSubjectId: '',
        settlementUnitType: '' as 'customer' | 'supplier' | '',
        settlementUnitId: '',
        description: '',
        currency: 'THB',
        amount: '',
        vatRate: '7',
        whtRate: '3',
        useVat: false,
        useWht: false,
        remarks: ''
    });
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [validationMessages, setValidationMessages] = useState<string[]>([]);
    const compact = true;

    // 费用状态样式定义
    const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
        unapplied: { bg: '#f3f4f6', color: '#6b7280', label: '未申请' },
        applied: { bg: '#dbeafe', color: '#1e40af', label: '已申请' },
        settled: { bg: '#d1fae5', color: '#047857', label: '已结算' }
    };

    // 判断费用是否可编辑
    const canEditCost = (cost: ShipmentCost) => {
        if (readonly) return false;
        return !cost.status || cost.status === 'unapplied';
    };

    useEffect(() => {
        loadFinancialSubjects();
    }, []);

    // Search for Settlement Units (Customers/Suppliers) - English Only
    useEffect(() => {
        if (!searchQuery) {
            setSearchResults([]);
            return;
        }
        if (!addingType) return;

        const delay = setTimeout(() => {
            const endpoint = addingType === 'AR' ? '/api/customers' : '/api/suppliers';
            fetch(endpoint)
                .then(res => res.json())
                .then(data => {
                    const filtered = data.filter((item: any) => {
                        // STRICTLY English Name mapping
                        const name = addingType === 'AR'
                            ? item.companyNameEn
                            : (item.companyNameEn || item.fullName); // Supplier might not have strict En field separation in some schemas, but prefer En
                        return name && name.toLowerCase().includes(searchQuery.toLowerCase());
                    }).slice(0, 10); // Limit results
                    setSearchResults(filtered);
                });
        }, 500);
        return () => clearTimeout(delay);
    }, [searchQuery, addingType]);

    const loadFinancialSubjects = async () => {
        try {
            const res = await fetch('/api/settings/financial-subjects');
            const data = await res.json();
            setFinancialSubjects(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCalculate = () => {
        const amt = parseFloat(formData.amount) || 0;
        const vat = formData.useVat ? (amt * parseFloat(formData.vatRate) / 100) : 0;
        const wht = formData.useWht ? (amt * parseFloat(formData.whtRate) / 100) : 0;
        const total = amt + vat - wht; // Total = Amount + VAT - WHT (Net Payment)
        // Standard: Amt + VAT = Grand Total. WHT is tax withheld.
        // Let's stick to Amt + VAT for "Total" display.
        return { vat, wht, total };
    };

    const { total } = handleCalculate();

    const handleSubmit = async () => {
        setAttemptedSubmit(true);
        const missing: string[] = [];
        if (!formData.financialSubjectId) missing.push('财务科目');
        if (!formData.settlementUnitId) missing.push('结算对象');
        if (!formData.description) missing.push('费用摘要');
        if (!formData.currency) missing.push('币种');
        const amt = parseFloat(formData.amount);
        if (isNaN(amt) || amt <= 0) missing.push('金额');
        if (formData.useVat) {
            const v = parseFloat(formData.vatRate);
            if (isNaN(v) || v < 0) missing.push('VAT税率');
        }
        if (formData.useWht) {
            const w = parseFloat(formData.whtRate);
            if (isNaN(w) || w < 0) missing.push('WHT税率');
        }
        if (missing.length > 0) {
            setValidationMessages(missing);
            setShowValidationModal(true);
            return;
        }

        try {
            const payload = {
                type: addingType,
                ...formData,
                amount: parseFloat(formData.amount),
                vatRate: formData.useVat ? parseFloat(formData.vatRate) : 0,
                whtRate: formData.useWht ? parseFloat(formData.whtRate) : 0,
                financialSubjectId: parseInt(formData.financialSubjectId)
            };

            // Debug: 输出完整payload
            console.log('=== 保存成本 DEBUG ===');
            console.log('addingType:', addingType);
            console.log('editingId:', editingId);
            console.log('formData:', formData);
            console.log('payload:', payload);

            const url = editingId
                ? `/api/shipments/${shipmentId}/costs/${editingId}`
                : `/api/shipments/${shipmentId}/costs`;

            const method = editingId ? 'PUT' : 'POST';
            console.log('URL:', url);
            console.log('Method:', method);

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setAddingType(null); // Close form
                setEditingId(null);
                resetForm();
                onUpdate();
            } else {
                alert('保存失败');
            }
        } catch (error) {
            console.error(error);
            alert('保存失败');
        }
    };

    const resetForm = () => {
        setFormData({
            financialSubjectId: '',
            settlementUnitType: '',
            settlementUnitId: '',
            description: '',
            currency: 'THB',
            amount: '',
            vatRate: '7',
            whtRate: '3',
            useVat: false,
            useWht: false,
            remarks: ''
        });
        setSearchQuery('');
        setSearchResults([]);
        setEditingId(null);
    };

    const handleEdit = (item: any) => {
        setAddingType(null); // Close add form if open
        setEditingId(item.id);
        const vRate = Number(item.vatRate || 0);
        const wRate = Number(item.whtRate || 0);

        setFormData({
            financialSubjectId: String(item.financialSubjectId),
            settlementUnitType: item.settlementUnitType,
            settlementUnitId: item.settlementUnitId,
            description: item.description,
            currency: item.currency,
            amount: String(item.amount),
            vatRate: vRate > 0 ? String(vRate) : '7',
            whtRate: wRate > 0 ? String(wRate) : '3',
            useVat: vRate > 0,
            useWht: wRate > 0,
            remarks: item.remarks || ''
        });
        setSearchQuery(item.settlementUnitName || '');
    };

    const arCosts = costs.filter((c: any) => c.type === 'AR');
    const apCosts = costs.filter((c: any) => c.type === 'AP');

    const renderInputRow = () => (
        <tr style={{ backgroundColor: '#f0fdf4' }}>
            {/* Subject */}
            <td style={{ padding: compact ? '6px' : '8px' }}>
                <select
                    value={formData.financialSubjectId}
                    onChange={e => setFormData(prev => ({ ...prev, financialSubjectId: e.target.value }))}
                    style={{ width: '100%', padding: compact ? '6px 10px' : '8px 12px', borderRadius: '4px', border: attemptedSubmit && !formData.financialSubjectId ? '1px solid #ef4444' : '1px solid #cbd5e1', fontSize: compact ? '12px' : '13px' }}
                >
                    <option value="">Select *</option>
                    {financialSubjects.map(s => (
                        <option key={s.id} value={s.id}>{language === 'zh' ? s.nameZh : s.nameEn}</option>
                    ))}
                </select>
            </td>
            {/* Settlement Unit */}
            <td style={{ padding: compact ? '6px' : '8px', position: 'relative' }}>
                <input
                    placeholder="Search Name... *"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: compact ? '6px 10px' : '8px 12px', borderRadius: '4px', border: attemptedSubmit && (!formData.settlementUnitId) ? '1px solid #ef4444' : '1px solid #cbd5e1', fontSize: compact ? '12px' : '13px' }}
                />
                {searchResults.length > 0 && (
                    <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '4px',
                        maxHeight: '150px', overflowY: 'auto', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        {searchResults.map(result => (
                            <div
                                key={result.id}
                                onClick={() => {
                                    setFormData(prev => ({
                                        ...prev,
                                        settlementUnitId: result.id,
                                        settlementUnitType: addingType === 'AR' ? 'customer' : 'supplier'
                                    }));
                                    setSearchQuery(addingType === 'AR' ? result.companyNameEn : (result.companyNameEn || result.fullName));
                                    setSearchResults([]);
                                }}
                                style={{ padding: compact ? '4px 6px' : '4px 8px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '12px' }}
                            >
                                {addingType === 'AR' ? result.companyNameEn : (result.companyNameEn || result.fullName)}
                            </div>
                        ))}
                    </div>
                )}
            </td>
            {/* Description - Optional/Compact */}
            <td style={{ padding: compact ? '6px' : '8px' }}>
                <input
                    placeholder="Desc... *"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    style={{ width: '100%', padding: compact ? '6px 10px' : '8px 12px', borderRadius: '4px', border: attemptedSubmit && !formData.description ? '1px solid #ef4444' : '1px solid #cbd5e1', fontSize: compact ? '12px' : '13px' }}
                />
            </td>
            {/* Currency */}
            <td style={{ padding: compact ? '6px' : '8px' }}>
                <select
                    value={formData.currency}
                    onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    style={{ width: '100%', padding: compact ? '6px 10px' : '8px 12px', borderRadius: '4px', border: attemptedSubmit && !formData.currency ? '1px solid #ef4444' : '1px solid #cbd5e1', fontSize: compact ? '12px' : '13px' }}
                >
                    <option value="THB">THB</option>
                    <option value="USD">USD</option>
                    <option value="CNY">CNY</option>
                </select>
            </td>
            {/* Amount */}
            <td style={{ padding: compact ? '6px' : '8px' }}>
                <input
                    type="number"
                    value={formData.amount}
                    onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00 *"
                    style={{ width: '100%', padding: compact ? '6px 10px' : '8px 12px', borderRadius: '4px', border: attemptedSubmit && (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) ? '1px solid #ef4444' : '1px solid #cbd5e1', textAlign: 'right', fontSize: compact ? '12px' : '13px' }}
                />
            </td>
            {/* VAT */}
            <td style={{ padding: compact ? '6px' : '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <input
                        type="checkbox"
                        checked={formData.useVat}
                        onChange={e => setFormData(prev => ({ ...prev, useVat: e.target.checked }))}
                        style={{ cursor: 'pointer' }}
                    />
                    {formData.useVat && (
                        <input
                            type="number"
                            value={formData.vatRate}
                            onChange={e => setFormData(prev => ({ ...prev, vatRate: e.target.value }))}
                            style={{ width: '36px', padding: '2px 4px', borderRadius: '4px', border: attemptedSubmit && (isNaN(parseFloat(formData.vatRate)) || parseFloat(formData.vatRate) < 0) ? '1px solid #ef4444' : '1px solid #cbd5e1', fontSize: '12px', textAlign: 'right' }}
                        />
                    )}
                </div>
            </td>
            {/* WHT */}
            <td style={{ padding: compact ? '6px' : '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <input
                        type="checkbox"
                        checked={formData.useWht}
                        onChange={e => setFormData(prev => ({ ...prev, useWht: e.target.checked }))}
                        style={{ cursor: 'pointer' }}
                    />
                    {formData.useWht && (
                        <input
                            type="number"
                            value={formData.whtRate}
                            onChange={e => setFormData(prev => ({ ...prev, whtRate: e.target.value }))}
                            style={{ width: '36px', padding: '2px 4px', borderRadius: '4px', border: attemptedSubmit && (isNaN(parseFloat(formData.whtRate)) || parseFloat(formData.whtRate) < 0) ? '1px solid #ef4444' : '1px solid #cbd5e1', fontSize: '12px', textAlign: 'right' }}
                        />
                    )}
                </div>
            </td>
            {/* Total */}
            <td style={{ padding: compact ? '6px' : '8px', textAlign: 'right', fontWeight: 600, fontSize: compact ? '12px' : '13px' }}>
                {total.toFixed(2)}
            </td>
            {/* Actions */}
            <td style={{ padding: compact ? '6px' : '8px', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: compact ? '6px' : '8px', justifyContent: 'center' }}>
                    <button onClick={handleSubmit} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#059669', padding: '4px' }}>
                        <Save size={16} />
                    </button>
                    <button onClick={() => { setAddingType(null); resetForm(); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );

    const renderCostSection = (items: any[], color: string, isAr: boolean) => (
        <div style={{ marginBottom: compact ? '16px' : '24px', border: `1px solid${color}`, borderRadius: compact ? '6px' : '8px' }}>
            <div style={{
                padding: compact ? '6px 10px' : '8px 12px',
                backgroundColor: isAr ? '#ecfdf5' : '#fff7ed',
                borderBottom: `1px solid ${color}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h3 style={{ fontSize: compact ? '12px' : '14px', fontWeight: 600, color: isAr ? '#047857' : '#c2410c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isAr ? '↗ 应收账款 (AR)' : '↘ 应付账款 (AP)'}
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {!readonly && (
                        <button
                            onClick={() => {
                                if (editingId) {
                                    resetForm();
                                }
                                setAddingType(isAr ? 'AR' : 'AP');
                                setSelectedId(null);
                                resetForm();
                            }}
                            style={{
                                padding: compact ? '4px 8px' : '4px 10px',
                                backgroundColor: isAr ? '#059669' : '#ea580c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: compact ? '11px' : '12px',
                                cursor: 'pointer',
                                opacity: (addingType || editingId) ? 0.5 : 1
                            }}
                            disabled={!!addingType || !!editingId}
                        >
                            + 新增
                        </button>
                    )}
                    {selectedId && !editingId && !addingType && (
                        <>
                            <button
                                onClick={() => {
                                    const item = items.find(i => i.id === selectedId);
                                    if (item && canEditCost(item)) {
                                        handleEdit(item);
                                    } else if (item && !canEditCost(item)) {
                                        alert('已申请的费用无法编辑');
                                    }
                                }}
                                disabled={(() => {
                                    const item = items.find(i => i.id === selectedId);
                                    return item ? !canEditCost(item) : false;
                                })()}
                                style={{
                                    padding: compact ? '4px 8px' : '4px 10px',
                                    backgroundColor: (() => {
                                        const item = items.find(i => i.id === selectedId);
                                        return item && canEditCost(item) ? '#3b82f6' : '#d1d5db';
                                    })(),
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: compact ? '11px' : '12px',
                                    cursor: (() => {
                                        const item = items.find(i => i.id === selectedId);
                                        return item && canEditCost(item) ? 'pointer' : 'not-allowed';
                                    })(),
                                    opacity: (() => {
                                        const item = items.find(i => i.id === selectedId);
                                        return item && canEditCost(item) ? 1 : 0.6;
                                    })()
                                }}
                                title={(() => {
                                    const item = items.find(i => i.id === selectedId);
                                    return item && !canEditCost(item) ? '已申请的费用无法编辑' : '编辑';
                                })()}
                            >
                                编辑
                            </button>
                            <button
                                onClick={async () => {
                                    const item = items.find(i => i.id === selectedId);
                                    if (item && !canEditCost(item)) {
                                        alert('已申请的费用无法删除');
                                        return;
                                    }
                                    if (confirm('确定删除这条费用吗？')) {
                                        await fetch(`/api/shipments/${shipmentId}/costs/${selectedId}`, { method: 'DELETE' });
                                        setSelectedId(null);
                                        onUpdate();
                                    }
                                }}
                                disabled={(() => {
                                    const item = items.find(i => i.id === selectedId);
                                    return item ? !canEditCost(item) : false;
                                })()}
                                style={{
                                    padding: compact ? '4px 8px' : '4px 10px',
                                    backgroundColor: (() => {
                                        const item = items.find(i => i.id === selectedId);
                                        return item && canEditCost(item) ? '#ef4444' : '#d1d5db';
                                    })(),
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: compact ? '11px' : '12px',
                                    cursor: (() => {
                                        const item = items.find(i => i.id === selectedId);
                                        return item && canEditCost(item) ? 'pointer' : 'not-allowed';
                                    })(),
                                    opacity: (() => {
                                        const item = items.find(i => i.id === selectedId);
                                        return item && canEditCost(item) ? 1 : 0.6;
                                    })()
                                }}
                                title={(() => {
                                    const item = items.find(i => i.id === selectedId);
                                    return item && !canEditCost(item) ? '已申请的费用无法删除' : '删除';
                                })()}
                            >
                                删除
                            </button>
                        </>
                    )}
                    {editingId && (
                        <button
                            onClick={() => {
                                setEditingId(null);
                                setSelectedId(null);
                                resetForm();
                            }}
                            style={{
                                padding: '4px 10px',
                                backgroundColor: '#94a3b8',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            取消编辑
                        </button>
                    )}
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: compact ? '12px' : '13px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f8fafc', color: '#64748b' }}>
                        <th style={{ padding: compact ? '6px' : '8px', textAlign: 'left', fontWeight: 500, width: '15%' }}>财务科目 *</th>
                        <th style={{ padding: compact ? '6px' : '8px', textAlign: 'left', fontWeight: 500, width: '20%' }}>结算对象 *</th>
                        <th style={{ padding: compact ? '6px' : '8px', textAlign: 'left', fontWeight: 500 }}>费用摘要 *</th>
                        <th style={{ padding: compact ? '6px' : '8px', textAlign: 'right', fontWeight: 500, width: '60px' }}>币种 *</th>
                        <th style={{ padding: compact ? '6px' : '8px', textAlign: 'right', fontWeight: 500, width: '100px' }}>金额 *</th>
                        <th style={{ padding: compact ? '6px' : '8px', textAlign: 'center', fontWeight: 500, width: '80px' }}>VAT</th>
                        <th style={{ padding: compact ? '6px' : '8px', textAlign: 'center', fontWeight: 500, width: '80px' }}>WHT</th>
                        <th style={{ padding: compact ? '6px' : '8px', textAlign: 'right', fontWeight: 600, width: '100px' }}>总计</th>
                        <th style={{ padding: compact ? '6px' : '8px', textAlign: 'center', fontWeight: 500, width: '80px' }}>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => {
                        const vRate = Number(item.vatRate || 0);
                        const wRate = Number(item.whtRate || 0);
                        const iAmount = Number(item.amount);
                        const iVat = iAmount * vRate / 100;
                        const iWht = iAmount * wRate / 100;
                        const iTotal = iAmount + iVat - iWht; // Display Total = Amount + VAT - WHT

                        const subject = financialSubjects.find(s => s.id === item.financialSubjectId);
                        const subjectName = subject ? (language === 'zh' ? subject.nameZh : subject.nameEn) : item.financialSubjectId;


                        if (editingId === item.id) {
                            // Render Edit Row (Reusing renderInputRow logic but inline here for simplicity or mapped)
                            // Ideally, renderInputRow should be reusable. Let's reuse the input cells logic.
                            return (
                                <tr key={item.id} style={{ backgroundColor: '#f0fdf4' }}>
                                    {/* Subject */}
                                    <td style={{ padding: '8px' }}>
                                        <select
                                            value={formData.financialSubjectId}
                                            onChange={e => setFormData(prev => ({ ...prev, financialSubjectId: e.target.value }))}
                                            style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        >
                                            <option value="">Select</option>
                                            {financialSubjects.map(s => (
                                                <option key={s.id} value={s.id}>{language === 'zh' ? s.nameZh : s.nameEn}</option>
                                            ))}
                                        </select>
                                    </td>
                                    {/* Settlement Unit */}
                                    <td style={{ padding: '8px', position: 'relative' }}>
                                        <input
                                            placeholder="Search Name..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        />
                                        {searchResults.length > 0 && (
                                            <div style={{
                                                position: 'absolute', top: '100%', left: 0, right: 0,
                                                backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '4px',
                                                maxHeight: '150px', overflowY: 'auto', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}>
                                                {searchResults.map(result => (
                                                    <div
                                                        key={result.id}
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                settlementUnitId: result.id,
                                                                settlementUnitType: item.type === 'AR' ? 'customer' : 'supplier'
                                                            }));
                                                            // Correct type detection for search click:
                                                            // If editing, we use the row's type to know what we are searching (AR->Customer, AP->Supplier)
                                                            // We stored 'type' in cost item.
                                                            setSearchQuery(isAr ? result.companyNameEn : (result.companyNameEn || result.fullName));
                                                            setSearchResults([]);
                                                        }}
                                                        style={{ padding: '4px 8px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '12px' }}
                                                    >
                                                        {isAr ? result.companyNameEn : (result.companyNameEn || result.fullName)}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    {/* Description */}
                                    <td style={{ padding: '8px' }}>
                                        <input
                                            placeholder="Desc..."
                                            value={formData.description}
                                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        />
                                    </td>
                                    {/* Currency */}
                                    <td style={{ padding: '8px' }}>
                                        <select
                                            value={formData.currency}
                                            onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                                            style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                        >
                                            <option value="THB">THB</option>
                                            <option value="USD">USD</option>
                                            <option value="CNY">CNY</option>
                                        </select>
                                    </td>
                                    {/* Amount */}
                                    <td style={{ padding: '8px' }}>
                                        <input
                                            type="number"
                                            value={formData.amount}
                                            onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                            placeholder="0.00"
                                            style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right', fontSize: '13px' }}
                                        />
                                    </td>
                                    {/* VAT */}
                                    <td style={{ padding: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.useVat}
                                                onChange={e => setFormData(prev => ({ ...prev, useVat: e.target.checked }))}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            {formData.useVat && (
                                                <input
                                                    type="number"
                                                    value={formData.vatRate}
                                                    onChange={e => setFormData(prev => ({ ...prev, vatRate: e.target.value }))}
                                                    style={{ width: '36px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', textAlign: 'right' }}
                                                />
                                            )}
                                        </div>
                                    </td>
                                    {/* WHT */}
                                    <td style={{ padding: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.useWht}
                                                onChange={e => setFormData(prev => ({ ...prev, useWht: e.target.checked }))}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            {formData.useWht && (
                                                <input
                                                    type="number"
                                                    value={formData.whtRate}
                                                    onChange={e => setFormData(prev => ({ ...prev, whtRate: e.target.value }))}
                                                    style={{ width: '36px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', textAlign: 'right' }}
                                                />
                                            )}
                                        </div>
                                    </td>
                                    {/* Total */}
                                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, fontSize: '13px' }}>
                                        {total.toFixed(2)}
                                    </td>
                                    {/* Actions */}
                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button onClick={handleSubmit} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#059669', padding: '4px' }}>
                                                <Save size={16} />
                                            </button>
                                            <button onClick={resetForm} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }

                        return (
                            <tr
                                key={item.id}
                                onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
                                style={{
                                    borderTop: '1px solid #f1f5f9',
                                    backgroundColor: selectedId === item.id ? '#dbeafe' : 'transparent',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedId !== item.id) {
                                        e.currentTarget.style.backgroundColor = '#f8fafc';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedId !== item.id) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                <td style={{ padding: compact ? '6px' : '8px' }}>
                                    {subjectName}
                                </td>
                                <td style={{ padding: compact ? '6px' : '8px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.settlementUnitName || item.settlementUnitId}>
                                    {item.settlementUnitName || item.settlementUnitId}
                                </td>
                                <td style={{ padding: compact ? '6px' : '8px' }}>
                                    <div>
                                        {item.description}
                                        {/* 状态标签 */}
                                        {item.status && item.status !== 'unapplied' && (
                                            <span style={{
                                                display: 'inline-block',
                                                marginLeft: '8px',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                fontWeight: 500,
                                                backgroundColor: statusStyles[item.status]?.bg || '#f3f4f6',
                                                color: statusStyles[item.status]?.color || '#6b7280'
                                            }}>
                                                {statusStyles[item.status]?.label || item.status}
                                                {item.applicationNumber && ` (${item.applicationNumber})`}
                                            </span>
                                        )}
                                    </div>
                                    {/* 锁定提示 */}
                                    {item.status === 'applied' && (
                                        <div style={{
                                            marginTop: '4px',
                                            padding: '4px 8px',
                                            backgroundColor: '#fef3c7',
                                            border: '1px solid #fbbf24',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            color: '#92400e',
                                            display: 'inline-block'
                                        }}>
                                            🔒 已锁定，无法编辑或删除
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: compact ? '6px' : '8px' }}>{item.currency}</td>
                                <td style={{ padding: compact ? '6px' : '8px', textAlign: 'right' }}>{iAmount.toFixed(2)}</td>
                                <td style={{ padding: compact ? '6px' : '8px', textAlign: 'center' }}>{vRate > 0 ? `${vRate}%` : '-'}</td>
                                <td style={{ padding: compact ? '6px' : '8px', textAlign: 'center' }}>{wRate > 0 ? `${wRate}%` : '-'}</td>
                                <td style={{ padding: compact ? '6px' : '8px', textAlign: 'right', fontWeight: 600 }}>{iTotal.toFixed(2)}</td>
                                <td style={{ padding: compact ? '6px' : '8px', textAlign: 'center' }}>
                                    {selectedId === item.id && <span style={{ color: '#3b82f6', fontSize: '12px' }}>✓ 已选</span>}
                                </td>
                            </tr>
                        );
                    })}
                    {/* Render Input Row if adding to this section */}
                    {!readonly && addingType === (isAr ? 'AR' : 'AP') && renderInputRow()}
                </tbody>
            </table>

            {
                items.length === 0 && !addingType && (
                    <div style={{ padding: compact ? '16px' : '24px', textAlign: 'center', color: '#94a3b8', fontSize: compact ? '12px' : '13px' }}>无分录</div>
                )
            }
        </div >
    );

    return (
        <div>
            {renderCostSection(arCosts, '#6ee7b7', true)}
            {renderCostSection(apCosts, '#fdba74', false)}
            {showValidationModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '420px', boxShadow: '0 10px 20px rgba(0,0,0,0.15)' }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>请完善必填项</div>
                            <button onClick={() => setShowValidationModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '14px' }}>关闭</button>
                        </div>
                        <div style={{ padding: '16px' }}>
                            <div style={{ color: '#374151', fontSize: '13px', marginBottom: '8px' }}>以下项为必填：</div>
                            <ul style={{ margin: 0, paddingLeft: '18px', color: '#ef4444', fontSize: '13px' }}>
                                {validationMessages.map((m, idx) => (
                                    <li key={idx}>{m}</li>
                                ))}
                            </ul>
                            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button onClick={() => setShowValidationModal(false)} style={{ padding: '8px 14px', border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>我知道了</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};



// Attachments Tab Component
const AttachmentsTab: React.FC<{
    shipment: Shipment;
    shipmentId: string;
    attachments: ShipmentAttachment[];
    onUpdate: () => void;
}> = ({ shipment, shipmentId, onUpdate }) => {
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [category, setCategory] = useState('other');
    const [billOfLading, setBillOfLading] = useState('');
    const [description, setDescription] = useState('');
    const [realAttachments, setRealAttachments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const compact = true;

    useEffect(() => {
        loadAttachments();
    }, [shipmentId]);

    const loadAttachments = async () => {
        try {
            setLoading(true);
            // Use business code directly from shipment prop
            const res = await fetch(`/api/attachments?businessCode=${shipment.code}`);
            const data = await res.json();
            setRealAttachments(data);
        } catch (error) {
            console.error('Failed to load attachments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            setSelectedFile(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            alert('请选择文件');
            return;
        }

        try {
            setUploading(true);

            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('businessCode', shipment.code);
            formData.append('customerId', shipment.customer?.id || '');
            formData.append('customerName', shipment.customer?.companyNameTh || shipment.customer?.companyNameEn || '');
            formData.append('category', category);
            formData.append('billOfLading', billOfLading);
            formData.append('description', description);

            const res = await fetch('/api/attachments/upload', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                setSelectedFile(null);
                setCategory('other');
                setBillOfLading('');
                setDescription('');
                loadAttachments();
                onUpdate();
            } else {
                alert('上传失败');
            }
        } catch (error) {
            console.error('Failed to upload:', error);
            alert('上传失败');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (attachmentId: string) => {
        try {
            window.open(`/api/attachments/${attachmentId}/download`, '_blank');
        } catch (error) {
            console.error('Failed to download:', error);
        }
    };

    const handleBatchDelete = async () => {
        if (selectedIds.length === 0) {
            alert('请选择要删除的附件');
            return;
        }

        try {
            const res = await fetch('/api/attachments/batch-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });

            if (res.ok) {
                setSelectedIds([]);
                setShowDeleteConfirm(false);
                loadAttachments();
                onUpdate();
            } else {
                alert('删除失败');
            }
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('删除失败');
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === realAttachments.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(realAttachments.map(att => att.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const getCategoryLabel = (cat: string) => {
        const labels: Record<string, string> = {
            'contract': '合同',
            'invoice': '发票',
            'bill_of_lading': '提单',
            'packing_list': '装箱单',
            'other': '其他'
        };
        return labels[cat] || cat;
    };

    return (
        <div>
            {/* Drag and Drop Upload Area */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    border: isDragging ? '2px dashed #2563eb' : '2px dashed #cbd5e1',
                    borderRadius: compact ? '4px' : '8px',
                    padding: compact ? '20px' : '32px',
                    marginBottom: compact ? '16px' : '24px',
                    backgroundColor: isDragging ? '#eff6ff' : '#f8fafc',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                <Paperclip size={compact ? 36 : 48} style={{ margin: compact ? '0 auto 12px' : '0 auto 16px', color: isDragging ? '#2563eb' : '#94a3b8' }} />

                {!selectedFile ? (
                    <>
                        <p style={{ fontSize: compact ? '14px' : '16px', fontWeight: 500, color: '#0f172a', marginBottom: compact ? '6px' : '8px' }}>
                            拖拽文件到此处上传
                        </p>
                        <p style={{ fontSize: compact ? '12px' : '14px', color: '#64748b', marginBottom: compact ? '12px' : '16px' }}>
                            或者点击选择文件
                        </p>
                        <input
                            type="file"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                            id="file-input"
                        />
                        <label
                            htmlFor="file-input"
                            style={{
                                display: 'inline-block',
                                padding: compact ? '6px 12px' : '8px 16px',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                borderRadius: compact ? '4px' : '6px',
                                cursor: 'pointer',
                                fontSize: compact ? '12px' : '14px'
                            }}
                        >
                            选择文件
                        </label>
                    </>
                ) : (
                    <div style={{ backgroundColor: 'white', padding: compact ? '16px' : '20px', borderRadius: compact ? '4px' : '6px', marginTop: compact ? '12px' : '16px' }}>
                        <div style={{ marginBottom: compact ? '12px' : '16px', textAlign: 'left' }}>
                            <div style={{ fontSize: compact ? '12px' : '14px', color: '#64748b', marginBottom: '4px' }}>已选择文件：</div>
                            <div style={{ fontSize: compact ? '14px' : '16px', fontWeight: 500, color: '#0f172a' }}>
                                {selectedFile.name} ({formatFileSize(selectedFile.size)})
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: compact ? '8px' : '12px', marginBottom: compact ? '12px' : '16px', textAlign: 'left' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: compact ? '4px' : '6px', fontSize: compact ? '12px' : '13px', fontWeight: 500 }}>
                                    文件类型 <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: compact ? '6px 10px' : '8px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '4px',
                                        fontSize: compact ? '12px' : '14px'
                                    }}
                                >
                                    <option value="other">其他</option>
                                    <option value="contract">合同</option>
                                    <option value="invoice">发票</option>
                                    <option value="bill_of_lading">提单</option>
                                    <option value="packing_list">装箱单</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: compact ? '4px' : '6px', fontSize: compact ? '12px' : '13px', fontWeight: 500 }}>
                                    提单号（可选）
                                </label>
                                <input
                                    value={billOfLading}
                                    onChange={(e) => setBillOfLading(e.target.value)}
                                    placeholder="例如：BL123456"
                                    style={{
                                        width: '100%',
                                        padding: compact ? '6px 10px' : '8px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '4px',
                                        fontSize: compact ? '12px' : '14px'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: compact ? '12px' : '16px', textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: compact ? '4px' : '6px', fontSize: compact ? '12px' : '13px', fontWeight: 500 }}>
                                描述（可选）
                            </label>
                            <input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="文件说明"
                                style={{
                                    width: '100%',
                                    padding: compact ? '6px 10px' : '8px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    fontSize: compact ? '12px' : '14px'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: compact ? '8px' : '12px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setSelectedFile(null)}
                                style={{
                                    padding: compact ? '8px 14px' : '10px 20px',
                                    backgroundColor: 'white',
                                    color: '#64748b',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: compact ? '4px' : '6px',
                                    cursor: 'pointer',
                                    fontSize: compact ? '12px' : '14px',
                                    fontWeight: 500
                                }}
                            >
                                取消
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                style={{
                                    padding: compact ? '8px 14px' : '10px 20px',
                                    backgroundColor: uploading ? '#94a3b8' : '#22c55e',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: compact ? '4px' : '6px',
                                    cursor: uploading ? 'not-allowed' : 'pointer',
                                    fontSize: compact ? '12px' : '14px',
                                    fontWeight: 500
                                }}
                            >
                                {uploading ? '上传中...' : '确认上传'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Attachments List */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compact ? '12px' : '16px' }}>
                <h3 style={{ fontSize: compact ? '14px' : '16px', fontWeight: 600 }}>已上传附件 ({realAttachments.length})</h3>
                {selectedIds.length > 0 && (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        style={{
                            padding: compact ? '6px 12px' : '8px 16px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: compact ? '4px' : '6px',
                            cursor: 'pointer',
                            fontSize: compact ? '12px' : '14px',
                            fontWeight: 500
                        }}
                    >
                        删除选中 ({selectedIds.length})
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: compact ? '24px' : '40px', color: '#64748b', fontSize: compact ? '12px' : '13px' }}>
                    加载中...
                </div>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: compact ? '8px' : '12px', textAlign: 'center', width: '40px' }}>
                                <input
                                    type="checkbox"
                                    checked={realAttachments.length > 0 && selectedIds.length === realAttachments.length}
                                    onChange={toggleSelectAll}
                                    style={{ cursor: 'pointer' }}
                                />
                            </th>
                            <th style={{ padding: compact ? '8px' : '12px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: compact ? '12px' : '13px' }}>文件名</th>
                            <th style={{ padding: compact ? '8px' : '12px', textAlign: 'center', fontWeight: 600, color: '#64748b', fontSize: compact ? '12px' : '13px' }}>类型</th>
                            <th style={{ padding: compact ? '8px' : '12px', textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: compact ? '12px' : '13px' }}>大小</th>
                            <th style={{ padding: compact ? '8px' : '12px', textAlign: 'center', fontWeight: 600, color: '#64748b', fontSize: compact ? '12px' : '13px' }}>存储</th>
                            <th style={{ padding: compact ? '8px' : '12px', textAlign: 'center', fontWeight: 600, color: '#64748b', fontSize: compact ? '12px' : '13px' }}>上传时间</th>
                            <th style={{ padding: compact ? '8px' : '12px', textAlign: 'center', fontWeight: 600, color: '#64748b', fontSize: compact ? '12px' : '13px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {realAttachments.map(att => (
                            <tr key={att.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: compact ? '8px' : '12px', textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(att.id)}
                                        onChange={() => toggleSelect(att.id)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </td>
                                <td style={{ padding: compact ? '8px' : '12px', fontSize: compact ? '12px' : '13px' }}>{att.originalName}</td>
                                <td style={{ padding: compact ? '8px' : '12px', textAlign: 'center', fontSize: compact ? '12px' : '13px' }}>{getCategoryLabel(att.category)}</td>
                                <td style={{ padding: compact ? '8px' : '12px', textAlign: 'right', fontSize: compact ? '12px' : '13px' }}>{formatFileSize(att.fileSize)}</td>
                                <td style={{ padding: compact ? '8px' : '12px', textAlign: 'center' }}>
                                    {att.storageType === 'hot' ? (
                                        <span style={{ color: '#ef4444' }}>🔥 热存储</span>
                                    ) : (
                                        <span style={{ color: '#3b82f6' }}>❄️ 冷存储</span>
                                    )}
                                </td>
                                <td style={{ padding: compact ? '8px' : '12px', textAlign: 'center', color: '#64748b', fontSize: compact ? '12px' : '13px' }}>
                                    {new Date(att.uploadedAt).toLocaleString('zh-CN')}
                                </td>
                                <td style={{ padding: compact ? '8px' : '12px', textAlign: 'center' }}>
                                    <button
                                        onClick={() => handleDownload(att.id)}
                                        style={{
                                            padding: compact ? '4px 10px' : '4px 12px',
                                            backgroundColor: '#dbeafe',
                                            color: '#2563eb',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: compact ? '12px' : '13px'
                                        }}
                                    >
                                        下载
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {realAttachments.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ padding: compact ? '24px' : '40px', textAlign: 'center', color: '#94a3b8', fontSize: compact ? '12px' : '13px' }}>
                                    暂无附件
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
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
                }}
                    onClick={() => setShowDeleteConfirm(false)}
                >
                    <div style={{
                        backgroundColor: 'white',
                        padding: compact ? '20px' : '24px',
                        borderRadius: compact ? '6px' : '8px',
                        maxWidth: '400px',
                        width: '90%'
                    }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: compact ? '16px' : '18px', fontWeight: 600, marginBottom: compact ? '10px' : '12px' }}>确认删除</h3>
                        <p style={{ color: '#64748b', marginBottom: compact ? '16px' : '20px', fontSize: compact ? '12px' : '13px' }}>
                            确定要删除选中的 {selectedIds.length} 个附件吗？此操作无法撤销。
                        </p>
                        <div style={{ display: 'flex', gap: compact ? '8px' : '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                style={{
                                    padding: compact ? '6px 12px' : '8px 16px',
                                    backgroundColor: 'white',
                                    color: '#64748b',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: compact ? '4px' : '6px',
                                    cursor: 'pointer',
                                    fontSize: compact ? '12px' : '14px'
                                }}
                            >
                                取消
                            </button>
                            <button
                                onClick={handleBatchDelete}
                                style={{
                                    padding: compact ? '6px 12px' : '8px 16px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: compact ? '4px' : '6px',
                                    cursor: 'pointer',
                                    fontSize: compact ? '12px' : '14px',
                                    fontWeight: 500
                                }}
                            >
                                确认删除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
