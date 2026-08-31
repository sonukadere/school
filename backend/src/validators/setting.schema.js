import { z } from 'zod';

export const settingUpsertSchema = z.object({
  schoolName: z.string().trim().min(2, 'School name is required.').max(200),
  schoolLogo: z.string().trim().max(500).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address.')
    .max(255)
    .optional()
    .nullable()
    .or(z.literal('')),
  website: z
    .string()
    .trim()
    .url('Invalid URL.')
    .max(255)
    .optional()
    .nullable()
    .or(z.literal('')),
  academicYear: z.string().trim().max(30).optional().nullable(),
});
