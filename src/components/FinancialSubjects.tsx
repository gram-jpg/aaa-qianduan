import React, { useEffect, useState } from 'react';
import { Trash2, Plus, Edit2, Save, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FinancialSubject {
    id: number;
    nameZh: string;
    nameEn: string;
}

export const FinancialSubjects: React.FC = () => {
    const { t } = useLanguage();
    const [subjects, setSubjects] = useState<FinancialSubject[]>([]);
    const [newSubject, setNewSubject] = useState({ nameZh: '', nameEn: '' });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingData, setEditingData] = useState({ nameZh: '', nameEn: '' });

    useEffect(() => {
        loadSubjects();
    }, []);

    const startEdit = (subject: FinancialSubject) => {
        setEditingId(subject.id);
        setEditingData({ nameZh: subject.nameZh, nameEn: subject.nameEn });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingData({ nameZh: '', nameEn: '' });
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editingData.nameZh || !editingData.nameEn) return;
        try {
            const res = await fetch(`/api/settings/financial-subjects/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingData)
            });

            if (res.status === 400) {
                const data = await res.json();
                alert(data.error || t('duplicateData'));
                return;
            }

            if (res.ok) {
                setEditingId(null);
                loadSubjects();
            }
        } catch (error) {
            console.error(error);
            alert(t('saveFailed'));
        }
    };

    const loadSubjects = () => {
        fetch('/api/settings/financial-subjects')
            .then(res => res.json())
            .then(data => setSubjects(data))
            .catch(err => console.error(err));
    };

    const handleAdd = async () => {
        if (!newSubject.nameZh || !newSubject.nameEn) return;
        try {
            const res = await fetch('/api/settings/financial-subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSubject)
            });

            if (res.status === 400) {
                const data = await res.json();
                alert(data.error || t('duplicateData'));
                return;
            }

            if (res.ok) {
                setNewSubject({ nameZh: '', nameEn: '' });
                loadSubjects();
            }
        } catch (error) {
            console.error(error);
            alert(t('saveFailed'));
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('areYouSure'))) return;
        try {
            await fetch(`/api/settings/financial-subjects/${id}`, { method: 'DELETE' });
            loadSubjects();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>{t('financialSubjects')}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '12px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
                <input
                    placeholder={t('subjectNameChinesePlaceholder')}
                    value={newSubject.nameZh}
                    onChange={e => setNewSubject(prev => ({ ...prev, nameZh: e.target.value }))}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
                <input
                    placeholder={t('subjectNameEnglishPlaceholder')}
                    value={newSubject.nameEn}
                    onChange={e => setNewSubject(prev => ({ ...prev, nameEn: e.target.value }))}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
                <button
                    onClick={handleAdd}
                    disabled={!newSubject.nameZh || !newSubject.nameEn}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        backgroundColor: !newSubject.nameZh || !newSubject.nameEn ? '#cbd5e1' : '#2563eb',
                        color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
                    }}
                >
                    <Plus size={16} /> {t('addSubject')}
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', padding: '8px', backgroundColor: '#f8fafc', fontWeight: 600, fontSize: '13px', color: '#64748b' }}>
                    <div>{t('nameChinese')}</div>
                    <div>{t('nameEnglish')}</div>
                    <div style={{ textAlign: 'right' }}>{t('actions')}</div>
                </div>
                {subjects.map(subject => (
                    <div key={subject.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', padding: '12px 8px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                        {editingId === subject.id ? (
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
                                    <button onClick={handleSaveEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e' }} title={t('save')}>
                                        <Save size={16} />
                                    </button>
                                    <button onClick={cancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} title={t('cancel')}>
                                        <X size={16} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>{subject.nameZh}</div>
                                <div>{subject.nameEn}</div>
                                <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button
                                        onClick={() => startEdit(subject)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}
                                        title={t('edit')}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(subject.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                        title={t('delete')}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {subjects.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>{t('noFinancialSubjects')}</div>
                )}
            </div>
        </div>
    );
};
