import { z } from 'zod';

const baseSubjectSchema = {
  name: z.string().trim().min(2, 'Subject name must be at least 2 characters.').max(100),
  code: z.string().trim().min(1, 'Subject code is required.').max(30),
  classId: z.string().min(1, 'Class is required.'),
  teacherId: z.string().min(1).optional().nullable(),
};

export const subjectCreateSchema = z.object(baseSubjectSchema);

export const subjectUpdateSchema = z.object(baseSubjectSchema).partial();

export const subjectQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().max(200).optional(),
  classId: z.string().optional(),
  teacherId: z.string().optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
