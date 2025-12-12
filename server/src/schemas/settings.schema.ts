import { z } from 'zod';

/**
 * CompanyInfo validation schema
 */
export const companyInfoSchema = z.object({
    nameEn: z.string().min(1, 'English name required').max(200),
    nameTh: z.string().min(1, 'Thai name required').max(200),
    addressEn: z.string().min(1, 'English address required').max(500),
    addressTh: z.string().min(1, 'Thai address required').max(500),
    taxId: z.string().regex(/^\d{13}$/, 'Tax ID must be 13 digits'),
    bankName: z.string().min(1, 'Bank name required').max(100),
    bankAccountThb: z.string().min(1, 'THB account required').max(50),
    bankAccountUsd: z.string().max(50).optional().or(z.literal('')),
    bankAddress: z.string().min(1, 'Bank address required').max(200),
    swiftCode: z.string().regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Invalid SWIFT code format').optional().or(z.literal(''))
});

/**
 * SupplierType validation schema
 */
export const supplierTypeSchema = z.object({
    nameZh: z.string().min(1, 'Chinese name required').max(100),
    nameEn: z.string().min(1, 'English name required').max(100)
});

export type CompanyInfoInput = z.infer<typeof companyInfoSchema>;
export type SupplierTypeInput = z.infer<typeof supplierTypeSchema>;
