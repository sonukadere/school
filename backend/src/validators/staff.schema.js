import { z } from 'zod';
import { emailSchema } from './common.js';

const baseStaffSchema = {
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  email: emailSchema.optional().nullable().or(z.literal('')),
  phone: z.string().trim().max(30).optional().nullable(),
  position: z.string().trim().min(2, 'Position is required.').max(100),
  department: z.string().trim().max(100).optional().nullable(),
  salary: z.coerce.number().nonnegative().optional().nullable(),
  joiningDate: z.string().date().optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
};

export const staffCreateSchema = z.object(baseStaffSchema);

export const staffUpdateSchema = z.object({
  ...baseStaffSchema,
  staffId: z.string().trim().min(1).optional(),
}).strict();

export const staffQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().max(200).optional(),
  department: z.string().trim().optional(),
  position: z.string().trim().optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
