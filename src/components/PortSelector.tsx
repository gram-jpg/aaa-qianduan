import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Port {
    id: string;
    code: string;
    nameEn: string;
    nameCn: string;
    country: string;
    countryName: string;
}

interface PortSelectorProps {
    label: string;
    value: string | null;
    onChange: (portId: string | null) => void;
    placeholder?: string;
    required?: boolean;
}

export const PortSelector: React.FC<PortSelectorProps> = ({
    label,
    value,
    onChange,
    placeholder = '搜索港口...',
    required = false
}) => {
    const [ports, setPorts] = useState<Port[]>([]);
    const [filteredPorts, setFilteredPorts] = useState<Port[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedPort, setSelectedPort] = useState<Port | null>(null);

    useEffect(() => {
        loadPorts();
    }, []);

    useEffect(() => {
        if (value && ports.length > 0) {
            const port = ports.find(p => p.id === value);
            setSelectedPort(port || null);
        } else {
            setSelectedPort(null);
        }
    }, [value, ports]);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredPorts(ports);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = ports.filter(port =>
            port.code.toLowerCase().includes(term) ||
            port.nameEn.toLowerCase().includes(term) ||
            port.nameCn.includes(searchTerm) ||
            port.country.toLowerCase().includes(term) ||
            port.countryName.toLowerCase().includes(term)
        );
        setFilteredPorts(filtered);
    }, [searchTerm, ports]);

    const loadPorts = async () => {
        try {
            const res = await fetch('/api/settings/ports?active=true');
            const data = await res.json();
            setPorts(data);
            setFilteredPorts(data);
        } catch (error) {
            console.error('Failed to load ports:', error);
        }
    };

    const handleSelect = (port: Port) => {
        setSelectedPort(port);
        onChange(port.id);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = () => {
        setSelectedPort(null);
        onChange(null);
        setSearchTerm('');
    };

    const formatPortDisplay = (port: Port) => {
        return `${port.code} - ${port.nameEn} (${port.nameCn})`;
    };

    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>

            <div style={{ position: 'relative' }}>
                {/* Selected Value Display */}
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        minHeight: '38px'
                    }}
                >
                    <span style={{ color: selectedPort ? '#1f2937' : '#9ca3af', fontSize: '14px' }}>
                        {selectedPort ? formatPortDisplay(selectedPort) : placeholder}
                    </span>
                    <ChevronDown size={16} style={{ color: '#6b7280', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>

                {/* Dropdown */}
                {isOpen && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        backgroundColor: 'white',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        maxHeight: '300px',
                        overflow: 'hidden',
                        zIndex: 1000
                    }}>
                        {/* Search Input */}
                        <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                            <input
                                type="text"
                                placeholder="搜索港口代码或名称..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onClick={e => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                    outline: 'none'
                                }}
                                autoFocus
                            />
                        </div>

                        {/* Port List */}
                        <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                            {selectedPort && (
                                <div
                                    onClick={handleClear}
                                    style={{
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        color: '#ef4444',
                                        borderBottom: '1px solid #e5e7eb',
                                        backgroundColor: '#fef2f2'
                                    }}
                                >
                                    ✕ 清除选择
                                </div>
                            )}
                            {filteredPorts.map(port => (
                                <div
                                    key={port.id}
                                    onClick={() => handleSelect(port)}
                                    style={{
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        backgroundColor: selectedPort?.id === port.id ? '#eff6ff' : 'white',
                                        borderBottom: '1px solid #f3f4f6'
                                    }}
                                    onMouseEnter={e => {
                                        if (selectedPort?.id !== port.id) {
                                            e.currentTarget.style.backgroundColor = '#f9fafb';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (selectedPort?.id !== port.id) {
                                            e.currentTarget.style.backgroundColor = 'white';
                                        }
                                    }}
                                >
                                    <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: '2px' }}>
                                        {port.code}
                                    </div>
                                    <div style={{ color: '#6b7280', fontSize: '12px' }}>
                                        {port.nameEn} ({port.nameCn}) - {port.countryName}
                                    </div>
                                </div>
                            ))}
                            {filteredPorts.length === 0 && (
                                <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                                    未找到匹配的港口
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Backdrop to close dropdown */}
                {isOpen && (
                    <div
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 999
                        }}
                    />
                )}
            </div>
        </div>
    );
};
