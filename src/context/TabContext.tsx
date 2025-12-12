import { createContext, useContext, useState, type ReactNode } from 'react';

export interface Tab {
    id: string;
    title: string;
    type: 'dashboard' | 'customer-list' | 'customer-detail' | 'customer-form' | 'supplier-list' | 'settings' | 'company-info' | 'supplier-types' | 'financial-subjects' | 'transport-types' | 'business-types' | 'trade-terms' | 'loading-methods' | 'port-management' | 'tms-draft' | 'tms-in-progress' | 'tms-completed' | 'tms-archived' | 'expense-application' | 'operations' | 'fund-management' | 'aging-management' | 'tax-compliance' | 'reports-analysis';
    data?: any;
}

interface TabContextType {
    tabs: Tab[];
    activeTabId: string;
    openTab: (tab: Omit<Tab, 'id'> & { id?: string }) => void;
    closeTab: (id: string) => void;
    setActiveTabId: (id: string) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export const TabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tabs, setTabs] = useState<Tab[]>([
        { id: 'dashboard', title: 'Workplace', type: 'dashboard' }
    ]);
    const [activeTabId, setActiveTabId] = useState<string>('dashboard');

    const openTab = (newTab: Omit<Tab, 'id'> & { id?: string }) => {
        const id = newTab.id || `${newTab.type}-${Date.now()}`;
        const tabWithId = { ...newTab, id };

        setTabs(prev => {
            // If tab already exists (by ID), just switch to it
            if (prev.find(t => t.id === id)) {
                return prev;
            }
            return [...prev, tabWithId];
        });
        setActiveTabId(id);
    };

    const closeTab = (id: string) => {
        setTabs(prev => {
            const newTabs = prev.filter(t => t.id !== id);
            // If we closed the active tab, switch to the last one
            if (id === activeTabId && newTabs.length > 0) {
                setActiveTabId(newTabs[newTabs.length - 1].id);
            }
            return newTabs;
        });
    };

    return (
        <TabContext.Provider value={{ tabs, activeTabId, openTab, closeTab, setActiveTabId }}>
            {children}
        </TabContext.Provider>
    );
};

export const useTabs = () => {
    const context = useContext(TabContext);
    if (!context) {
        throw new Error('useTabs must be used within a TabProvider');
    }
    return context;
};
