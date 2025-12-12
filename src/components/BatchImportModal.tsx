import React, { useState, useRef } from 'react';
import { Upload, Download, X, Check, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BatchImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'customer' | 'supplier';
    onSuccess: () => void;
}

interface ImportError {
    row: number;
    name: string;
    error: string;
}

interface ImportResult {
    successCount: number;
    failureCount: number;
    errors: ImportError[];
    message: string;
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({ isOpen, onClose, type, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const templates = {
        customer: {
            filename: 'customer_import_template.xlsx',
            headers: [
                'companyNameEn【必填】',
                'companyNameTh【可选】',
                'taxId【可选】',
                'addressEn【可选】',
                'addressTh【可选】',
                'shortName【可选】',
                'mailingAddress【可选】',
                'bankName【可选】',
                'bankAccount【可选】'
            ],
            // Sample data with optional fields empty
            sampleData: [
                ['ABC Company Ltd', '', '1234567890123', '', '', 'ABC', '', '', ''],
                ['XYZ Corporation', 'XYZ บริษัท', '', '123 Main Street', '123 ถนนหลัก', 'XYZ', 'PO Box 456', 'Bangkok Bank', '123-4-56789']
            ]
        },
        supplier: {
            filename: 'supplier_import_template.xlsx',
            headers: [
                'entityType【必填:company/individual】',
                'supplierTypeName【可选】',
                'companyNameEn/fullName【必填】',
                'taxId【可选】',
                'address【可选】',
                'shortName【可选】',
                'bankName【可选】',
                'accountNo【可选】'
            ],
            sampleData: [
                ['company', '', 'Logistics Co Ltd', '', '', '', '', ''],
                ['company', 'Transport', 'Shipping Services Ltd', '5551234567890', '789 Harbor Road', 'Ship', 'KBank', '987-6-54321']
            ]
        }
    };

    const handleDownloadTemplate = () => {
        const t = templates[type];

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Remove Chinese annotations for actual Excel header
        const cleanHeaders = t.headers.map(h => h.split('【')[0].trim());

        // Combine headers and sample data
        const wsData = [cleanHeaders, ...t.sampleData];

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        const colWidths = cleanHeaders.map(() => ({ wch: 20 }));
        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, type === 'customer' ? 'Customers' : 'Suppliers');

        // Generate Excel file and download
        XLSX.writeFile(wb, t.filename);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null); // Reset previous results
        }
    };

    const parseExcel = async (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });

                    // Get first sheet
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];

                    // Convert to JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (jsonData.length < 2) {
                        return resolve([]); // Header only or empty
                    }

                    const headers = jsonData[0] as string[];
                    const rows = jsonData.slice(1) as any[][];

                    const parsedData = rows
                        .filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
                        .map(row => {
                            const obj: any = {};
                            headers.forEach((header, index) => {
                                let value = row[index];
                                // Convert to string and trim
                                if (value !== null && value !== undefined) {
                                    value = String(value).trim();
                                }
                                obj[header] = value || '';
                            });

                            // Special handling for supplier
                            if (type === 'supplier') {
                                if (!obj.entityType) obj.entityType = 'company';
                                if (obj.taxId) obj.taxIdCompany = obj.taxId;
                            }

                            return obj;
                        });

                    resolve(parsedData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsBinaryString(file);
        });
    };

    const handleUpload = async () => {
        if (!file) return;

        try {
            setUploading(true);
            const data = await parseExcel(file);
            console.log('Parsed Data:', data);

            if (data.length === 0) {
                alert('文件为空或格式无效');
                setUploading(false);
                return;
            }

            const endpoint = type === 'customer' ? '/api/customers/batch' : '/api/suppliers/batch';

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const resultData = await res.json();
            setResult(resultData);

            if (resultData.successCount > 0) {
                onSuccess(); // Refresh list in parent
            }

        } catch (error) {
            console.error('Upload failed:', error);
            alert('导入失败，请检查文件格式');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setResult(null);
        setUploading(false);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '8px', padding: '24px',
                width: '600px', maxHeight: '90vh', overflow: 'auto',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600 }}>批量导入 {type === 'customer' ? '客户' : '供应商'}</h3>
                    <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={20} color="#64748b" />
                    </button>
                </div>

                {!result ? (
                    <>
                        {/* Step 1: Download Template */}
                        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                            <div style={{ fontWeight: 500, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>1</div>
                                下载模版
                            </div>
                            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px', marginLeft: '32px' }}>
                                请先下载 Excel 模版，并按照格式填写数据。第一行为表头，必填项已标注【必填】。
                            </p>
                            <button
                                onClick={handleDownloadTemplate}
                                style={{
                                    marginLeft: '32px',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '8px 16px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '4px',
                                    cursor: 'pointer', fontSize: '14px', color: '#334155'
                                }}
                            >
                                <Download size={16} /> 下载 Excel 模版
                            </button>
                        </div>

                        {/* Step 2: Upload File */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ fontWeight: 500, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>2</div>
                                上传文件
                            </div>
                            <div style={{ marginLeft: '32px' }}>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        border: '2px dashed #cbd5e1', borderRadius: '6px', padding: '32px',
                                        textAlign: 'center', cursor: 'pointer', backgroundColor: '#fff',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Upload size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
                                    <div style={{ fontWeight: 500, color: '#334155' }}>
                                        {file ? file.name : '点击上传 Excel 文件'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                                        支持 .xlsx 和 .xls 格式
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={handleClose}
                                style={{ padding: '10px 20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                取消
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                style={{
                                    padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px',
                                    cursor: (!file || uploading) ? 'not-allowed' : 'pointer', opacity: (!file || uploading) ? 0.7 : 1,
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}
                            >
                                {uploading ? '导入中...' : '开始导入'}
                            </button>
                        </div>
                    </>
                ) : (
                    /* Result View */
                    <div>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ flex: 1, padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ backgroundColor: '#15803d', borderRadius: '50%', padding: '8px', display: 'flex' }}>
                                    <Check size={24} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#166534', marginBottom: '4px' }}>导入成功</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#15803d' }}>{result.successCount}</div>
                                </div>
                            </div>
                            <div style={{ flex: 1, padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ backgroundColor: '#b91c1c', borderRadius: '50%', padding: '8px', display: 'flex' }}>
                                    <AlertCircle size={24} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#991b1b', marginBottom: '4px' }}>导入失败</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#b91c1c' }}>{result.failureCount}</div>
                                </div>
                            </div>
                        </div>

                        {result.errors.length > 0 && (
                            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                                        <tr>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>行号</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>名称</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#ef4444' }}>失败原因</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.errors.map((err, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '8px 12px' }}>{err.row}</td>
                                                <td style={{ padding: '8px 12px' }}>{err.name}</td>
                                                <td style={{ padding: '8px 12px', color: '#ef4444' }}>{err.error}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleClose}
                                style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                完成
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


