import { z } from 'zod';

/**
 * Customer validation schema
 * Implements Layer 2 (Backend Validation) of data integrity architecture
 */
export const customerSchema = z.object({
    companyNameEn: z.string()
        .min(1, 'English company name is required')
        .max(200, 'Company name too long'),

    companyNameTh: z.string()
        .min(1, 'Thai company name is required')
        .max(200, 'Company name too long'),

    shortName: z.string()
        .max(50, 'Short name too long')
        .optional(),

    addressEn: z.string()
        .min(1, 'English address is required')
        .max(500, 'Address too long'),

    addressTh: z.string()
        .min(1, 'Thai address is required')
        .max(500, 'Address too long'),

    mailingAddress: z.string()
        .max(500, 'Mailing address too long')
        .optional(),

    taxId: z.string()
        .max(50, 'Tax ID too long')
        .optional()
        .transform(val => val ? val.trim() : val),

    bankName: z.string()
        .max(100, 'Bank name too long')
        .optional(),

    bankBranch: z.string()
        .max(100, 'Bank branch too long')
        .optional(),

    bankAccount: z.string()
        .max(50, 'Bank account too long')
        .optional(),

    bankBranchCode: z.string()
        .max(20, 'Branch code too long')
        .optional(),

    // Active status for disabling customer instead of deletion
    isActive: z.boolean().optional(),

    // Allow createdAt to be set manually (for imports or corrections)
    createdAt: z.number()
        .int('Creation timestamp must be an integer')
        .positive('Creation timestamp must be positive')
        .optional()
});

export const customerUpdateSchema = customerSchema.partial();

export type CustomerInput = z.infer<typeof customerSchema>;
