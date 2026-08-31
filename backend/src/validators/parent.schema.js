import { z } from 'zod';
import { emailSchema } from './common.js';

const baseParentSchema = {
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters.').max(100),
  lastName: z.string().trim().min(1, 'Last name is required.').max(100),
  email: emailSchema.optional().nullable().or(z.literal('')),
  phone: z.string().trim().max(30).optional().nullable(),
  occupation: z.string().trim().max(100).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  relation: z.string().trim().max(50).optional().nullable(),
};

export const parentCreateSchema = z.object(baseParentSchema);

export const parentUpdateSchema = z.object({
  ...baseParentSchema,
  parentId: z.string().trim().min(1).optional(),
});

export const parentQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().max(200).optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
