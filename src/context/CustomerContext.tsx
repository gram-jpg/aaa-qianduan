import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Customer, CustomerInput } from '../types';

interface CustomerContextType {
    customers: Customer[];
    addCustomer: (customer: CustomerInput) => void;
    updateCustomer: (id: string, customer: CustomerInput) => void;
    deleteCustomer: (id: string) => void;
    updateCustomerStatus: (id: string, isActive: boolean) => void;
    getCustomer: (id: string) => Customer | undefined;
    error: string | null;
    clearError: () => void;
    refreshCustomers: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [error, setError] = useState<string | null>(null);

    const API_BASE = (window as any).__API_BASE__ || '/api';

    const clearError = () => setError(null);

    const fetchCustomers = async () => {
        try {
            clearError();
            const res = await fetch(`${API_BASE}/customers`);
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            setCustomers(data);
        } catch (error) {
            console.error('Failed to fetch customers', error);
            setError('Failed to connect to the database. Please ensure the backend is running.');
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const addCustomer = async (input: CustomerInput) => {
        try {
            clearError();
            const res = await fetch(`${API_BASE}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input)
            });
            if (!res.ok) throw new Error(`Failed to add: ${res.status}`);
            const newCustomer = await res.json();
            setCustomers(prev => [newCustomer, ...prev]);
        } catch (error) {
            console.error('Failed to add customer', error);
            setError('Failed to save customer. Please try again.');
        }
    };

    const updateCustomer = async (id: string, input: CustomerInput) => {
        try {
            clearError();
            const res = await fetch(`${API_BASE}/customers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input)
            });
            if (!res.ok) throw new Error(`Failed to update: ${res.status}`);
            const updated = await res.json();
            setCustomers(prev => prev.map(c => c.id === id ? updated : c));
        } catch (error) {
            console.error('Failed to update customer', error);
            setError('Failed to update customer. Please try again.');
        }
    };

    const deleteCustomer = async (id: string) => {
        try {
            clearError();
            const res = await fetch(`${API_BASE}/customers/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: false })
            });
            if (!res.ok) throw new Error(`Failed to disable: ${res.status}`);
            const updated = await res.json();
            setCustomers(prev => prev.map(c => c.id === id ? updated : c));
        } catch (error) {
            console.error('Failed to disable customer', error);
            setError('禁用客户失败，请稍后重试');
        }
    };

    const updateCustomerStatus = async (id: string, isActive: boolean) => {
        try {
            clearError();
            const res = await fetch(`${API_BASE}/customers/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive })
            });
            if (!res.ok) throw new Error(`Failed to update status: ${res.status}`);
            const updated = await res.json();
            setCustomers(prev => prev.map(c => c.id === id ? updated : c));
        } catch (error) {
            console.error('Failed to update customer status', error);
            setError('更新客户状态失败，请稍后重试');
        }
    };

    const getCustomer = (id: string) => {
        return customers.find(c => c.id === id);
    };

    return (
        <CustomerContext.Provider value={{
            customers,
            addCustomer,
            updateCustomer,
            deleteCustomer,
            updateCustomerStatus,
            getCustomer,
            error,
            clearError,
            refreshCustomers: fetchCustomers
        }}>
            {children}
        </CustomerContext.Provider>
    );
};

export const useCustomers = () => {
    const context = useContext(CustomerContext);
    if (!context) {
        throw new Error('useCustomers must be used within a CustomerProvider');
    }
    return context;
};
