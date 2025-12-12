import { z } from 'zod';

/**
 * Port validation schema
 * For managing international port master data
 */
export const portSchema = z.object({
    code: z.string()
        .min(5, 'Port code must be at least 5 characters')
        .max(10, 'Port code too long')
        .regex(/^[A-Z]{2}[A-Z0-9]+$/, 'Port code must start with 2-letter country code followed by alphanumeric characters')
        .transform(val => val.toUpperCase().trim()),

    nameEn: z.string()
        .min(1, 'English name is required')
        .max(100, 'English name too long'),

    nameCn: z.string()
        .min(1, 'Chinese name is required')
        .max(100, 'Chinese name too long'),

    country: z.string()
        .length(2, 'Country code must be 2 characters')
        .regex(/^[A-Z]{2}$/, 'Country code must be 2 uppercase letters')
        .transform(val => val.toUpperCase()),

    countryName: z.string()
        .min(1, 'Country name is required')
        .max(50, 'Country name too long'),

    isActive: z.boolean()
        .optional()
        .default(true)
});

export const portUpdateSchema = portSchema.partial();

export type PortInput = z.infer<typeof portSchema>;
