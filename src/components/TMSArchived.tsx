import React from 'react';

export const TMSArchived: React.FC = () => {
    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>归档 (Archived)</h2>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '48px',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <p style={{ fontSize: '16px', color: '#64748b' }}>
                    归档业务列表 - 开发中
                </p>
                <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>
                    Archived shipments list - Under development
                </p>
            </div>
        </div>
    );
};
