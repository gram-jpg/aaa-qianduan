import { z } from 'zod';

/**
 * Bank Account schema (nested in Supplier)
 */
const bankAccountSchema = z.object({
    bankName: z.string().min(1, 'Bank name is required').max(100),
    accountNo: z.string().min(1, 'Account number is required').max(50),
    currency: z.string().min(1, 'Currency is required').max(10),
    bankAddress: z.string().max(200).optional(),
    branchCode: z.string().max(20).optional()
});

/**
 * Supplier validation schema with discriminated union
 * Implements Layer 2 (Backend Validation) for SRM module
 */

const baseSupplierSchema = z.object({
    supplierTypeId: z.number().int().positive('Supplier type is required'),
    shortName: z.string().max(50, 'Short name too long').optional(),
    bankAccounts: z.array(bankAccountSchema).min(1, 'At least one bank account is required')
});

const individualSupplierSchema = baseSupplierSchema.extend({
    entityType: z.literal('individual'),
    fullName: z.string().min(1, 'Full name is required').max(200),
    taxIdIndividual: z.string().max(20).optional(),
    addressIndividual: z.string().max(500).optional()
});

const companySupplierSchema = baseSupplierSchema.extend({
    entityType: z.literal('company'),
    companyNameEn: z.string().min(1, 'English company name is required').max(200),
    companyNameTh: z.string().min(1, 'Thai company name is required').max(200),
    taxIdCompany: z.string().regex(/^\d{13}$/, 'Tax ID must be 13 digits'),
    addressEn: z.string().min(1, 'English address is required').max(500),
    addressTh: z.string().min(1, 'Thai address is required').max(500),
    branchCode: z.string().max(20).optional()
});

export const supplierSchema = z.discriminatedUnion('entityType', [
    individualSupplierSchema,
    companySupplierSchema
]);

export type SupplierInput = z.infer<typeof supplierSchema>;
export type BankAccountInput = z.infer<typeof bankAccountSchema>;
