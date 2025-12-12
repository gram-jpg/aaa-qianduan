import React, { useEffect, useState } from 'react';
import { Trash2, Plus, Edit2, Save, X } from 'lucide-react';

interface TransportType {
    id: number;
    nameZh: string;
    nameEn: string;
}

export const TransportTypes: React.FC = () => {
    const [types, setTypes] = useState<TransportType[]>([]);
    const [newType, setNewType] = useState({ nameZh: '', nameEn: '' });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingData, setEditingData] = useState({ nameZh: '', nameEn: '' });

    const loadTypes = () => {
        fetch('/api/settings/transport-types')
            .then(res => res.json())
            .then(data => setTypes(data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        loadTypes();
    }, []);

    const startEdit = (type: TransportType) => {
        setEditingId(type.id);
        setEditingData({ nameZh: type.nameZh, nameEn: type.nameEn });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingData({ nameZh: '', nameEn: '' });
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editingData.nameZh || !editingData.nameEn) return;
        try {
            const res = await fetch(`/api/settings/transport-types/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingData)
            });

            if (res.status === 400) {
                const data = await res.json();
                alert(data.error || '数据重复，无法保存');
                return;
            }

            if (res.ok) {
                setEditingId(null);
                loadTypes();
            }
        } catch (error) {
            console.error(error);
            alert('保存失败，请重试');
        }
    };

    

    const handleAdd = async () => {
        if (!newType.nameZh || !newType.nameEn) return;
        try {
            const res = await fetch('/api/settings/transport-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newType)
            });

            if (res.status === 400) {
                const data = await res.json();
                alert(data.error || '数据重复，无法保存');
                return;
            }

            if (res.ok) {
                setNewType({ nameZh: '', nameEn: '' });
                loadTypes();
            }
        } catch (error) {
            console.error(error);
            alert('保存失败，请重试');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await fetch(`/api/settings/transport-types/${id}`, { method: 'DELETE' });
            loadTypes();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>运输类型 (Transport Types)</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '12px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
                <input
                    placeholder="Type Name (Chinese) e.g. 海运"
                    value={newType.nameZh}
                    onChange={e => setNewType(prev => ({ ...prev, nameZh: e.target.value }))}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
                <input
                    placeholder="Type Name (English) e.g. Sea Freight"
                    value={newType.nameEn}
                    onChange={e => setNewType(prev => ({ ...prev, nameEn: e.target.value }))}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
                <button
                    onClick={handleAdd}
                    disabled={!newType.nameZh || !newType.nameEn}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        backgroundColor: !newType.nameZh || !newType.nameEn ? '#cbd5e1' : '#2563eb',
                        color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
                    }}
                >
                    <Plus size={16} /> Add Type
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', padding: '8px', backgroundColor: '#f8fafc', fontWeight: 600, fontSize: '13px', color: '#64748b' }}>
                    <div>Name (Chinese)</div>
                    <div>Name (English)</div>
                    <div style={{ textAlign: 'right' }}>Actions</div>
                </div>
                {types.map(type => (
                    <div key={type.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', padding: '12px 8px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                        {editingId === type.id ? (
                            <>
                                <input
                                    value={editingData.nameZh}
                                    onChange={e => setEditingData(prev => ({ ...prev, nameZh: e.target.value }))}
                                    style={{ padding: '4px', marginRight: '8px', borderRadius: '4px', border: '1px solid #3b82f6' }}
                                />
                                <input
                                    value={editingData.nameEn}
                                    onChange={e => setEditingData(prev => ({ ...prev, nameEn: e.target.value }))}
                                    style={{ padding: '4px', marginRight: '8px', borderRadius: '4px', border: '1px solid #3b82f6' }}
                                />
                                <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button onClick={handleSaveEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e' }} title="Save">
                                        <Save size={16} />
                                    </button>
                                    <button onClick={cancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} title="Cancel">
                                        <X size={16} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>{type.nameZh}</div>
                                <div>{type.nameEn}</div>
                                <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button
                                        onClick={() => startEdit(type)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}
                                        title="Edit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(type.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {types.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No transport types defined.</div>
                )}
            </div>
        </div>
    );
};
