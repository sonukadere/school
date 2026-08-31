import { z } from 'zod';
import { dateSchema, attendanceStatusSchema } from './common.js';

export const teacherAttendanceCreateSchema = z.object({
  teacherId: z.string().min(1, 'Teacher is required.'),
  date: dateSchema,
  status: attendanceStatusSchema.default('PRESENT'),
  remark: z.string().trim().max(500).optional().nullable(),
});

export const teacherAttendanceUpdateSchema = z
  .object({
    date: dateSchema.optional(),
    status: attendanceStatusSchema.optional(),
    remark: z.string().trim().max(500).optional().nullable(),
  });

export const teacherAttendanceQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  teacherId: z.string().optional(),
  status: attendanceStatusSchema.optional(),
  date: dateSchema.optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const teacherAttendanceBulkSchema = z.object({
  date: dateSchema,
  records: z
    .array(
      z.object({
        teacherId: z.string().min(1),
        status: attendanceStatusSchema,
        remark: z.string().trim().max(500).optional().nullable(),
      })
    )
    .min(1, 'At least one attendance record is required.'),
});
