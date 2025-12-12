import React from 'react';
import { Sidebar } from './Sidebar';
import { useTabs } from '../context/TabContext';
import { X, Languages, AlertCircle } from 'lucide-react';
import { useCustomers } from '../context/CustomerContext';
import { useLanguage } from '../context/LanguageContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { tabs, activeTabId, setActiveTabId, closeTab } = useTabs();
    const { error, clearError } = useCustomers();
    const { language, setLanguage } = useLanguage();

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
            <Sidebar />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Header / Tab Bar */}
                <div style={{
                    height: '40px',
                    backgroundColor: 'white',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    gap: '6px',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                        {tabs.map(tab => (
                            <div
                                key={tab.id}
                                onClick={() => setActiveTabId(tab.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    backgroundColor: activeTabId === tab.id ? '#eff6ff' : 'transparent',
                                    color: activeTabId === tab.id ? '#2563eb' : '#64748b',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    border: activeTabId === tab.id ? '1px solid #dbeafe' : '1px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <span>{tab.title}</span>
                                {tab.id !== 'dashboard' && (
                                    <div
                                        onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                                        style={{ marginLeft: '8px', display: 'flex', borderRadius: '50%', padding: '2px' }}
                                        className="hover:bg-gray-200"
                                    >
                                        <X size={14} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Language Toggle Button */}
                    <button
                        onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '20px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: '#64748b',
                            transition: 'all 0.2s'
                        }}
                        className="hover:bg-gray-50"
                    >
                        <Languages size={16} />
                        <span>{language === 'en' ? '中文' : 'English'}</span>
                    </button>
                </div>

                {/* Main Content Area */}
                <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
                    {/* Error Banner */}
                    {error && (
                        <div style={{
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fee2e2',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            color: '#b91c1c'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                            <button
                                onClick={clearError}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {children}
                </div>
            </div>
        </div>
    );
};
