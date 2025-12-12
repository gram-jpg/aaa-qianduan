import React, { useState } from 'react';
import { useTabs } from '../context/TabContext';
import { useLanguage } from '../context/LanguageContext';
import {
    LayoutDashboard,
    Users,
    Truck,
    Building2,
    Wallet,
    Settings,
    Database,
    FileText,
    ChevronDown,
    ChevronRight,
    Building,
    Tags,
    Briefcase,
    CheckCircle,
    Archive,
    PanelLeftClose,
    PanelLeft,
    Package
} from 'lucide-react';

export const Sidebar: React.FC = () => {
    const { openTab } = useTabs();
    const { t } = useLanguage();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

    const toggleSubMenu = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedMenu(expandedMenu === id ? null : id);
    };

    const menuItems = [
        { icon: LayoutDashboard, label: t('workplace'), id: 'dashboard', type: 'dashboard' },
        { icon: Users, label: t('crm'), id: 'crm', type: 'customer-list' },
        { icon: Building2, label: t('srm'), id: 'srm', type: 'supplier-list' },
        {
            icon: Truck,
            label: t('tms'),
            id: 'tms',
            type: 'tms',
            subItems: [
                { label: t('tmsDraft'), id: 'tms-draft', type: 'tms-draft', icon: FileText },
                { label: t('tmsInProgress'), id: 'tms-in-progress', type: 'tms-in-progress', icon: Truck },
                { label: t('tmsCompleted'), id: 'tms-completed', type: 'tms-completed', icon: CheckCircle },
                { label: t('tmsArchived'), id: 'tms-archived', type: 'tms-archived', icon: Archive }
            ]
        },
        {
            icon: Wallet,
            label: t('fms'),
            id: 'fms',
            type: 'fms',
            subItems: [
                { label: '费用申请/核销', id: 'expense-application', type: 'expense-application', icon: FileText },
                { label: '运营', id: 'operations', type: 'operations', icon: Briefcase },
                { label: '资金管理', id: 'fund-management', type: 'fund-management', icon: Wallet },
                { label: '账龄管理', id: 'aging-management', type: 'aging-management', icon: Database },
                { label: '税务与合规', id: 'tax-compliance', type: 'tax-compliance', icon: CheckCircle },
                { label: '报表与分析', id: 'reports-analysis', type: 'reports-analysis', icon: FileText }
            ]
        },
        {
            icon: Settings,
            label: t('settings'),
            id: 'settings',
            type: 'settings',
            subItems: [
                { label: t('companyInfo'), id: 'company-info', type: 'company-info', icon: Building },
                { label: t('supplierTypes'), id: 'supplier-types', type: 'supplier-types', icon: Tags },
                { label: t('financialSubjects'), id: 'financial-subjects', type: 'financial-subjects', icon: Wallet },
                { label: t('transportTypes'), id: 'transport-types', type: 'transport-types', icon: Truck },
                { label: t('businessTypes'), id: 'business-types', type: 'business-types', icon: Briefcase },
                { label: t('tradeTerms'), id: 'trade-terms', type: 'trade-terms', icon: FileText },
                { label: t('loadingMethods'), id: 'loading-methods', type: 'loading-methods', icon: Package },
                { label: '港口管理', id: 'port-management', type: 'port-management', icon: Building2 }
            ]
        },
        { icon: Database, label: t('dataMaintenance'), id: 'data', type: 'data', disabled: true },
        { icon: FileText, label: t('billing'), id: 'billing', disabled: true }
    ];

    const handleMenuClick = (item: any) => {
        if (item.disabled) return;

        // If item has subItems, toggle expansion
        if (item.subItems) {
            setExpandedMenu(expandedMenu === item.id ? null : item.id);
            return;
        }

        // Standard actions - use translations for tab titles
        if (item.type === 'customer-list') {
            openTab({ id: 'customer-list', title: t('customers'), type: 'customer-list' });
        } else if (item.type === 'supplier-list') {
            openTab({ id: 'supplier-list', title: t('suppliers'), type: 'supplier-list' });
        } else if (item.type === 'dashboard') {
            openTab({ id: 'dashboard', title: t('workplace'), type: 'dashboard' });
        }
    };

    const handleSubItemClick = (subItem: any, e: React.MouseEvent) => {
        e.stopPropagation();
        openTab({ id: subItem.id, title: subItem.label, type: subItem.type });
    };

    return (
        <div style={{
            width: isCollapsed ? '56px' : '220px',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            flexShrink: 0,
            transition: 'width 0.3s ease'
        }}>
            {/* Logo Area */}
            <div style={{
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                padding: isCollapsed ? '0' : '0 14px',
                borderBottom: '1px solid #f1f5f9'
            }}>
                {!isCollapsed && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                            width: '28px',
                            height: '28px',
                            backgroundColor: '#2563eb',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            marginRight: '8px'
                        }}>R</div>
                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>Real Smart ERP</span>
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
                >
                    {isCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
                </button>
            </div>

            {/* Menu Items */}
            <div style={{ padding: '12px 6px', flex: 1, overflowY: 'auto' }}>
                {menuItems.map((item, index) => (
                    <React.Fragment key={index}>
                        <div
                            onClick={(e) => item.subItems ? toggleSubMenu(item.id, e) : handleMenuClick(item)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: isCollapsed ? 'center' : 'flex-start',
                                padding: isCollapsed ? '8px' : '8px 10px',
                                margin: '1px 0',
                                borderRadius: '4px',
                                cursor: item.disabled ? 'not-allowed' : 'pointer',
                                opacity: item.disabled ? 0.5 : 1,
                                backgroundColor: expandedMenu === item.id ? '#f8fafc' : 'transparent',
                                transition: 'background-color 0.15s',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => !item.disabled && (e.currentTarget.style.backgroundColor = '#f8fafc')}
                            onMouseLeave={(e) => expandedMenu !== item.id && (e.currentTarget.style.backgroundColor = 'transparent')}
                            title={isCollapsed ? item.label : ''}
                        >
                            <item.icon size={18} style={{ color: '#64748b', flexShrink: 0 }} />
                            {!isCollapsed && (
                                <>
                                    <span style={{
                                        marginLeft: '10px',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: '#334155',
                                        flex: 1
                                    }}>
                                        {item.label}
                                    </span>
                                    {item.subItems && (
                                        expandedMenu === item.id
                                            ? <ChevronDown size={16} style={{ color: '#94a3b8' }} />
                                            : <ChevronRight size={16} style={{ color: '#94a3b8' }} />
                                    )}
                                    {item.disabled && (
                                        <span style={{
                                            fontSize: '11px',
                                            color: '#94a3b8',
                                            backgroundColor: '#f1f5f9',
                                            padding: '2px 6px',
                                            borderRadius: '4px'
                                        }}>Soon</span>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Sub-menu Items */}
                        {
                            item.subItems && expandedMenu === item.id && !isCollapsed && (
                                <div style={{ marginLeft: '28px', marginTop: '2px' }}>
                                    {item.subItems.map((subItem: any, subIndex: number) => (
                                        <div
                                            key={subIndex}
                                            onClick={(e) => handleSubItemClick(subItem, e)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '6px 10px',
                                                margin: '1px 0',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.15s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <subItem.icon size={14} style={{ color: '#94a3b8', marginRight: '8px' }} />
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                                {subItem.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                    </React.Fragment>
                ))}
            </div>

            {/* User Profile / Bottom Area */}
            <div style={{
                padding: '12px',
                borderTop: '1px solid #f1f5f9'
            }}>
                <div style={{
                    backgroundColor: '#0f172a',
                    color: 'white',
                    borderRadius: '6px',
                    padding: '10px',
                    fontSize: '12px'
                }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>活跃客户</div>
                    <div style={{ fontSize: '18px', fontWeight: 700 }}>1</div>
                </div>
            </div>
        </div >
    );
};
