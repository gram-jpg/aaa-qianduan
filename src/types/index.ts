export type Language = 'en' | 'zh';

export interface Customer {
    id: string;
    code: string;  // Auto-generated 7-digit unique code
    companyNameEn: string;
    companyNameTh: string;
    addressEn: string;
    addressTh: string;
    taxId: string;
    // New Fields
    shortName: string;
    bankName: string;
    bankBranch: string;
    bankAccount: string;
    bankBranchCode: string;
    mailingAddress: string;
    isActive: boolean;

    createdAt: number;
}

export type CustomerInput = Omit<Customer, 'id' | 'code' | 'createdAt'> & { createdAt?: number; code?: string; isActive?: boolean };
