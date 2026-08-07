import { z } from 'zod';
import { dateSchema, attendanceStatusSchema } from './common.js';

export const attendanceCreateSchema = z.object({
  studentId: z.string().min(1, 'Student is required.'),
  date: dateSchema,
  status: attendanceStatusSchema.default('PRESENT'),
  remark: z.string().trim().max(500).optional().nullable(),
});

export const attendanceUpdateSchema = z
  .object({
    date: dateSchema.optional(),
    status: attendanceStatusSchema.optional(),
    remark: z.string().trim().max(500).optional().nullable(),
  })
  .strict();

export const attendanceQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  studentId: z.string().optional(),
  status: attendanceStatusSchema.optional(),
  date: dateSchema.optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const attendanceBulkSchema = z.object({
  classId: z.string().min(1, 'Class is required.'),
  date: dateSchema,
  records: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: attendanceStatusSchema,
        remark: z.string().trim().max(500).optional().nullable(),
      })
    )
    .min(1, 'At least one attendance record is required.'),
});
