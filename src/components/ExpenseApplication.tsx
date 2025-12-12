import React, { useState, useEffect } from 'react';
import { ExpenseFilterPanel } from './ExpenseFilterPanel';
import { ExpenseApplyModal } from './ExpenseApplyModal';
import { ExpenseSettleModal } from './ExpenseSettleModal';
import { Loader } from 'lucide-react';

interface FilterState {
    type: 'AR' | 'AP' | '';
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
}

export const ExpenseApplication: React.FC = () => {
    const API_BASE = import.meta.env.PROD ? 'http://localhost:3001/api' : '/api';
    const [costs, setCosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        type: '',
        status: '',
        dateFrom: '',
        dateTo: '',
        settlementUnit: '',
        blNumber: '',
        shipmentCode: '',
        applicationNumber: '',
        financialSubjectId: '',
        currency: '',
        settlementUnitName: ''
    });

    
    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const [settleModalOpen, setSettleModalOpen] = useState(false);
    const [applyingType, setApplyingType] = useState<'AR' | 'AP' | null>(null);
    const [settlingType, setSettlingType] = useState<'AR' | 'AP' | null>(null);
    const [applyingCostIds, setApplyingCostIds] = useState<string[]>([]);
    const [settlingCostIds, setSettlingCostIds] = useState<string[]>([]);

    

    const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
        unapplied: { bg: '#f3f4f6', color: '#6b7280', label: '未申请' },
        applied: { bg: '#dbeafe', color: '#1e40af', label: '已申请' },
        settled: { bg: '#d1fae5', color: '#047857', label: '已结算' }
    };

    useEffect(() => {
        loadCosts();
    }, []);

    const loadCosts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const res = await fetch(`${API_BASE}/expenses?${params.toString()}`);
            const data = await res.json();
            setCosts(data.costs || []);
        } catch (error) {
            console.error('Failed to load costs:', error);
            alert('加载费用失败');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        loadCosts();
    };

    const handleReset = () => {
        setFilters({
            type: '',
            status: '',
            dateFrom: '',
            dateTo: '',
            settlementUnit: '',
            blNumber: '',
            shipmentCode: '',
            applicationNumber: '',
            financialSubjectId: '',
            currency: '',
            settlementUnitName: ''
        });
        setTimeout(() => loadCosts(), 100);
    };

    

    const getSelectedCosts = (ids: string[]) => {
        return costs.filter(c => ids.includes(c.id));
    };

    

    const handleSingleApply = (costId: string) => {
        const cost = costs.find(c => c.id === costId);
        if (!cost) return;
        setApplyingType(cost.type);
        setApplyingCostIds([costId]);
        setApplyModalOpen(true);
    };

    

    const handleSingleSettle = (costId: string) => {
        const cost = costs.find(c => c.id === costId);
        if (!cost) return;

        if (cost.status !== 'applied') {
            alert('只能结算已申请的费用');
            return;
        }

        setSettlingType(cost.type);
        setSettlingCostIds([costId]);
        setSettleModalOpen(true);
    };

    const handleConfirmApply = async (dueDate: string, remarks: string) => {
        try {
            const res = await fetch(`${API_BASE}/expenses/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    costIds: applyingCostIds,
                    dueDate,
                    remarks
                })
            });

            const data = await res.json();

            if (res.ok) {
                alert(`申请成功！申请号：${data.applicationNumber}`);
                setApplyModalOpen(false);
                loadCosts();
            } else {
                alert(`申请失败：${data.error}`);
            }
        } catch (error) {
            console.error('Apply error:', error);
            alert('申请失败，请稍后重试');
        }
    };

    const handleConfirmSettle = async (settlementDate: string, remarks: string) => {
        try {
            const res = await fetch(`${API_BASE}/expenses/settle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    costIds: settlingCostIds,
                    settlementDate,
                    remarks
                })
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.message);
                setSettleModalOpen(false);
                loadCosts();
            } else {
                alert(`结算失败：${data.error}`);
            }
        } catch (error) {
            console.error('Settle error:', error);
            alert('结算失败，请稍后重试');
        }
    };

    const handleCancelApplication = async (applicationNumber: string) => {
        if (!confirm(`确认撤销申请号 ${applicationNumber}？撤销后费用将恢复为未申请状态。`)) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/expenses/cancel-application`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationNumber })
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.message);
                loadCosts();
            } else {
                alert(`撤销失败：${data.error}`);
            }
        } catch (error) {
            console.error('Cancel error:', error);
            alert('撤销失败，请稍后重试');
        }
    };

    const calculateTotal = (costList: any[]) => {
        return costList.reduce((sum, cost) => sum + cost.amount, 0);
    };

    

    const applyingCosts = getSelectedCosts(applyingCostIds);
    const applyingTotal = calculateTotal(applyingCosts);
    const applyingCurrency = applyingCosts[0]?.currency || 'THB';

    const settlingCosts = getSelectedCosts(settlingCostIds);
    const settlingTotal = calculateTotal(settlingCosts);
    const settlingCurrency = settlingCosts[0]?.currency || 'THB';

    const handleCancelSettlement = async (costIds: string[]) => {
        if (!confirm(`确认撤销这 ${costIds.length} 条费用的结算状态？撤销后费用将恢复为已申请状态。`)) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/expenses/cancel-settlement`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ costIds })
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.message);
                loadCosts();
            } else {
                alert(`撤销结算失败：${data.error}`);
            }
        } catch (error) {
            console.error('Cancel settlement error:', error);
            alert('撤销结算失败，请稍后重试');
        }
    };

    return (
        <div style={{
            padding: '16px',
            height: 'calc(100vh - 60px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            

            {/* Loading */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <Loader size={24} className="animate-spin" style={{ display: 'inline-block' }} />
                    <p style={{ marginTop: '12px' }}>加载中...</p>
                </div>
            )}

            {!loading && (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: 'white'
                }}>
                    <div style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
                        <ExpenseFilterPanel
                            filters={filters}
                            onFilterChange={setFilters}
                            onSearch={handleSearch}
                            onReset={handleReset}
                        />
                    </div>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>费用列表（紧凑）</span>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>优先显示应收(AR)，然后应付(AP)</span>
                    </div>

                    <div style={{ overflow: 'auto' }}>
                        {(() => {
                            const sorted = [...costs].sort((a, b) => {
                                if (a.type === b.type) return 0;
                                return a.type === 'AR' ? -1 : 1;
                            });
                            if (sorted.length === 0) {
                                return (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>暂无费用数据</div>
                                );
                            }
                            return (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                                        <tr>
                                            <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 600, width: '100px' }}>类型</th>
                                            <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 600 }}>状态</th>
                                            <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 600 }}>申请号</th>
                                            <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 600 }}>业务编码</th>
                                            <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 600 }}>提单号 (BL)</th>
                                            <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 600 }}>结算对象</th>
                                            <th style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 600, maxWidth: '200px' }}>费用摘要</th>
                                            <th style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 600, width: '140px' }}>金额</th>
                                            <th style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 600, width: '140px' }}>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sorted.map((cost: any) => {
                                            const badgeBg = cost.type === 'AR' ? '#ecfdf5' : '#fff7ed';
                                            const badgeColor = cost.type === 'AR' ? '#047857' : '#c2410c';
                                            const badgeBorder = cost.type === 'AR' ? '#6ee7b7' : '#fdba74';
                                            const statusStyle = statusStyles[cost.status] || statusStyles.unapplied;
                                            return (
                                                <tr key={cost.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '4px 6px' }}>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 8px', borderRadius: '999px', backgroundColor: badgeBg, border: `1px solid ${badgeBorder}`, color: badgeColor, fontWeight: 600 }}>
                                                            {cost.type === 'AR' ? '应收' : '应付'}
                                                            <span style={{ fontSize: '11px', color: '#6b7280' }}>({cost.type})</span>
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '4px 6px' }}>
                                                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', backgroundColor: statusStyle.bg, color: statusStyle.color, fontWeight: 500 }}>
                                                            {statusStyle.label}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '4px 6px', fontFamily: 'monospace', fontSize: '11px', color: '#3b82f6' }}>{cost.applicationNumber || '-'}</td>
                                                    <td style={{ padding: '4px 6px', fontFamily: 'monospace', fontSize: '11px' }}>{cost.shipmentCode || '-'}</td>
                                                    <td style={{ padding: '4px 6px', fontFamily: 'monospace', fontSize: '11px', color: '#059669' }}>{cost.blNumber || '-'}</td>
                                                    <td style={{ padding: '4px 6px', fontSize: '11px' }}>{cost.settlementUnitName || '-'}</td>
                                                    <td style={{ padding: '4px 6px', fontSize: '11px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cost.description}</td>
                                                    <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 600, color: '#111827', fontSize: '11px' }}>{`${Number(cost.amount).toLocaleString()} ${cost.currency}`}</td>
                                                    <td style={{ padding: '4px 6px' }}>
                                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                            {cost.status === 'unapplied' && (
                                                                <button onClick={() => handleSingleApply(cost.id)} style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 6px', fontSize: '11px', backgroundColor: cost.type === 'AR' ? '#10b981' : '#f59e0b', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 500 }}>申请</button>
                                                            )}
                                                            {cost.status === 'applied' && (
                                                                <>
                                                                    <button onClick={() => cost.applicationNumber && handleCancelApplication(cost.applicationNumber)} style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 6px', fontSize: '11px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 500 }}>撤销</button>
                                                                    <button onClick={() => handleSingleSettle(cost.id)} style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 6px', fontSize: '11px', backgroundColor: cost.type === 'AR' ? '#059669' : '#ea580c', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 500 }}>结算</button>
                                                                </>
                                                            )}
                                                            {cost.status === 'settled' && (
                                                                <button onClick={() => handleCancelSettlement([cost.id])} style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 6px', fontSize: '11px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 500 }}>撤销结算</button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Apply Modal */}
            {applyingType && (
                <ExpenseApplyModal
                    isOpen={applyModalOpen}
                    costIds={applyingCostIds}
                    type={applyingType}
                    totalAmount={applyingTotal}
                    currency={applyingCurrency}
                    onConfirm={handleConfirmApply}
                    onCancel={() => setApplyModalOpen(false)}
                />
            )}

            {/* Settle Modal */}
            {settlingType && (
                <ExpenseSettleModal
                    isOpen={settleModalOpen}
                    costIds={settlingCostIds}
                    type={settlingType}
                    totalAmount={settlingTotal}
                    currency={settlingCurrency}
                    onConfirm={handleConfirmSettle}
                    onCancel={() => setSettleModalOpen(false)}
                />
            )}
        </div>
    );
};
