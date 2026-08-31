import { z } from 'zod';
import { dayOfWeekSchema } from './common.js';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const timeSchema = z.string().regex(TIME_PATTERN, 'Time must be in HH:mm format.');

export const timetableCreateSchema = z
  .object({
    classId: z.string().min(1, 'Class is required.'),
    subjectId: z.string().min(1, 'Subject is required.'),
    teacherId: z.string().min(1).optional().nullable(),
    day: dayOfWeekSchema,
    startTime: timeSchema,
    endTime: timeSchema,
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'Start time must be before end time.',
    path: ['endTime'],
  });

export const timetableUpdateSchema = z
  .object({
    classId: z.string().min(1).optional(),
    subjectId: z.string().min(1).optional(),
    teacherId: z.string().min(1).optional().nullable(),
    day: dayOfWeekSchema.optional(),
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
  })
  .refine((data) => !data.startTime || !data.endTime || data.startTime < data.endTime, {
    message: 'Start time must be before end time.',
    path: ['endTime'],
  });

export const timetableQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  teacherId: z.string().optional(),
  day: dayOfWeekSchema.optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
