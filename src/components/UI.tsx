import React from 'react';
import type { LucideIcon } from 'lucide-react';

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    icon?: LucideIcon;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    icon: Icon,
    className = '',
    ...props
}) => {
    const baseClass = 'btn';
    const variantClass = variant === 'primary' ? 'btn-primary' :
        variant === 'danger' ? 'btn-danger' :
            '';

    return (
        <button className={`${baseClass} ${variantClass} ${className}`} {...props}>
            {Icon && <Icon size={18} />}
            {children}
        </button>
    );
};

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

export const Input: React.FC<InputProps> = ({ label, id, className = '', ...props }) => {
    return (
        <div className="input-group">
            <label htmlFor={id} className="input-label">{label}</label>
            <input
                id={id}
                className={`input-field ${className}`}
                {...props}
            />
        </div>
    );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, id, className = '', ...props }) => {
    return (
        <div className="input-group">
            <label htmlFor={id} className="input-label">{label}</label>
            <textarea
                id={id}
                className={`input-field ${className}`}
                rows={3}
                {...props}
            />
        </div>
    );
};

// Card Component
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
    return (
        <div className={`glass-panel p-6 ${className}`} style={{ padding: 'var(--spacing-md)' }}>
            {children}
        </div>
    );
};
// ConfirmDialog Component
interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
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
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '6px',
                padding: '16px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
                    {title}
                </h3>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.4' }}>
                    {message}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#374151'
                        }}
                    >
                        取消
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: '#ef4444',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: 'white'
                        }}
                    >
                        确定删除
                    </button>
                </div>
            </div>
        </div>
    );
};
