import React, { useEffect, useState } from 'react';
import { Trash2, Plus, Edit2, Save, X, Search } from 'lucide-react';

interface Port {
    id: string;
    code: string;
    nameEn: string;
    nameCn: string;
    country: string;
    countryName: string;
    isActive: boolean;
}

export const PortManagement: React.FC = () => {
    const [ports, setPorts] = useState<Port[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [newPort, setNewPort] = useState({
        code: '',
        nameEn: '',
        nameCn: '',
        country: '',
        countryName: ''
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingData, setEditingData] = useState({
        code: '',
        nameEn: '',
        nameCn: '',
        country: '',
        countryName: ''
    });

    useEffect(() => {
        loadPorts();
    }, []);

    const loadPorts = async () => {
        try {
            const res = await fetch('/api/settings/ports');
            const data = await res.json();
            setPorts(data);
        } catch (error) {
            console.error('Failed to load ports:', error);
        }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            loadPorts();
            return;
        }

        try {
            const res = await fetch(`/api/settings/ports/search?q=${encodeURIComponent(searchTerm)}`);
            const data = await res.json();
            setPorts(data);
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    const handleAdd = async () => {
        if (!newPort.code || !newPort.nameEn || !newPort.nameCn || !newPort.country || !newPort.countryName) {
            alert('请填写所有必填字段');
            return;
        }

        try {
            const res = await fetch('/api/settings/ports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPort)
            });

            if (res.status === 400) {
                const data = await res.json();
                alert(data.error || '港口代码已存在');
                return;
            }

            if (res.ok) {
                setNewPort({ code: '', nameEn: '', nameCn: '', country: '', countryName: '' });
                loadPorts();
            }
        } catch (error) {
            console.error(error);
            alert('保存失败，请重试');
        }
    };

    const startEdit = (port: Port) => {
        setEditingId(port.id);
        setEditingData({
            code: port.code,
            nameEn: port.nameEn,
            nameCn: port.nameCn,
            country: port.country,
            countryName: port.countryName
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingData({ code: '', nameEn: '', nameCn: '', country: '', countryName: '' });
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editingData.code || !editingData.nameEn || !editingData.nameCn) {
            alert('请填写所有必填字段');
            return;
        }

        try {
            const res = await fetch(`/api/settings/ports/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingData)
            });

            if (res.status === 400) {
                const data = await res.json();
                alert(data.error || '港口代码已存在');
                return;
            }

            if (res.ok) {
                setEditingId(null);
                loadPorts();
            }
        } catch (error) {
            console.error(error);
            alert('保存失败，请重试');
        }
    };

    const handleDelete = async (id: string, code: string) => {
        if (!confirm(`确定要删除港口 ${code} 吗？`)) return;

        try {
            const res = await fetch(`/api/settings/ports/${id}`, { method: 'DELETE' });

            if (res.status === 400) {
                const data = await res.json();
                alert(data.error || '无法删除该港口');
                return;
            }

            if (res.ok) {
                loadPorts();
            }
        } catch (error) {
            console.error(error);
            alert('删除失败，请重试');
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>港口管理 (Port Management)</h2>

            {/* Search Bar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
                <input
                    placeholder="搜索港口代码、中文名或英文名..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSearch()}
                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
                <button
                    onClick={handleSearch}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        backgroundColor: '#2563eb', color: 'white', border: 'none',
                        borderRadius: '4px', padding: '8px 16px', cursor: 'pointer'
                    }}
                >
                    <Search size={16} /> 搜索
                </button>
                <button
                    onClick={loadPorts}
                    style={{
                        backgroundColor: '#64748b', color: 'white', border: 'none',
                        borderRadius: '4px', padding: '8px 16px', cursor: 'pointer'
                    }}
                >
                    显示全部
                </button>
            </div>

            {/* Add New Port Form */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr 0.8fr 1.2fr 0.8fr', gap: '12px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
                <input
                    placeholder="港口代码 *"
                    value={newPort.code}
                    onChange={e => setNewPort(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    maxLength={10}
                />
                <input
                    placeholder="英文名称 *"
                    value={newPort.nameEn}
                    onChange={e => setNewPort(prev => ({ ...prev, nameEn: e.target.value }))}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
                <input
                    placeholder="中文名称 *"
                    value={newPort.nameCn}
                    onChange={e => setNewPort(prev => ({ ...prev, nameCn: e.target.value }))}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
                <input
                    placeholder="国家代码 *"
                    value={newPort.country}
                    onChange={e => setNewPort(prev => ({ ...prev, country: e.target.value.toUpperCase() }))}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    maxLength={2}
                />
                <input
                    placeholder="国家名称 *"
                    value={newPort.countryName}
                    onChange={e => setNewPort(prev => ({ ...prev, countryName: e.target.value }))}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
                <button
                    onClick={handleAdd}
                    disabled={!newPort.code || !newPort.nameEn || !newPort.nameCn || !newPort.country || !newPort.countryName}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        backgroundColor: (!newPort.code || !newPort.nameEn || !newPort.nameCn || !newPort.country || !newPort.countryName) ? '#cbd5e1' : '#2563eb',
                        color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px'
                    }}
                >
                    <Plus size={16} /> 添加
                </button>
            </div>

            {/* Port List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr 0.8fr 1.2fr 1fr', padding: '8px', backgroundColor: '#f8fafc', fontWeight: 600, fontSize: '13px', color: '#64748b' }}>
                    <div>代码</div>
                    <div>英文名称</div>
                    <div>中文名称</div>
                    <div>国家</div>
                    <div>国家名称</div>
                    <div style={{ textAlign: 'right' }}>操作</div>
                </div>
                {ports.map(port => (
                    <div key={port.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr 0.8fr 1.2fr 1fr', padding: '12px 8px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                        {editingId === port.id ? (
                            <>
                                <input
                                    value={editingData.code}
                                    onChange={e => setEditingData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid #3b82f6', fontSize: '13px' }}
                                    maxLength={10}
                                />
                                <input
                                    value={editingData.nameEn}
                                    onChange={e => setEditingData(prev => ({ ...prev, nameEn: e.target.value }))}
                                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid #3b82f6', fontSize: '13px' }}
                                />
                                <input
                                    value={editingData.nameCn}
                                    onChange={e => setEditingData(prev => ({ ...prev, nameCn: e.target.value }))}
                                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid #3b82f6', fontSize: '13px' }}
                                />
                                <input
                                    value={editingData.country}
                                    onChange={e => setEditingData(prev => ({ ...prev, country: e.target.value.toUpperCase() }))}
                                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid #3b82f6', fontSize: '13px' }}
                                    maxLength={2}
                                />
                                <input
                                    value={editingData.countryName}
                                    onChange={e => setEditingData(prev => ({ ...prev, countryName: e.target.value }))}
                                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid #3b82f6', fontSize: '13px' }}
                                />
                                <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button onClick={handleSaveEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e' }} title="保存">
                                        <Save size={16} />
                                    </button>
                                    <button onClick={cancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} title="取消">
                                        <X size={16} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ fontWeight: 600, color: '#1e40af', fontSize: '13px' }}>{port.code}</div>
                                <div style={{ fontSize: '13px' }}>{port.nameEn}</div>
                                <div style={{ fontSize: '13px' }}>{port.nameCn}</div>
                                <div style={{ fontSize: '13px' }}>{port.country}</div>
                                <div style={{ fontSize: '13px' }}>{port.countryName}</div>
                                <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button
                                        onClick={() => startEdit(port)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}
                                        title="编辑"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(port.id, port.code)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                        title="删除"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {ports.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>暂无港口数据</div>
                )}
            </div>
        </div>
    );
};
