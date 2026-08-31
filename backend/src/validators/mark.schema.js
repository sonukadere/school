import { z } from 'zod';

const GRADE_PATTERN = /^(?:[A-F][+-]?|O|Pass|Fail|[0-9]{1,3}%?)$/i;
export const gradeSchema = z
  .string()
  .trim()
  .max(10)
  .refine((g) => !g || GRADE_PATTERN.test(g), 'Invalid grade format (e.g. A+, A, B, C, Pass, Fail).');

export const markCreateSchema = z.object({
  studentId: z.string().min(1, 'Student is required.'),
  subjectId: z.string().min(1, 'Subject is required.'),
  examId: z.string().min(1, 'Exam is required.'),
  marks: z.coerce.number().min(0, 'Marks cannot be negative.').max(100, 'Marks cannot exceed 100.'),
  grade: gradeSchema.optional().nullable(),
  remarks: z.string().trim().max(500).optional().nullable(),
});

export const markUpdateSchema = z
  .object({
    marks: z.coerce.number().min(0).max(100).optional(),
    grade: gradeSchema.optional().nullable(),
    remarks: z.string().trim().max(500).optional().nullable(),
  });

export const markQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  studentId: z.string().optional(),
  subjectId: z.string().optional(),
  examId: z.string().optional(),
  classId: z.string().optional(),
  minMarks: z.coerce.number().min(0).optional(),
  maxMarks: z.coerce.number().min(0).optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const markBulkSchema = z.object({
  examId: z.string().min(1, 'Exam is required.'),
  records: z
    .array(
      z.object({
        studentId: z.string().min(1),
        subjectId: z.string().min(1),
        marks: z.coerce.number().min(0).max(100),
        grade: gradeSchema.optional().nullable(),
        remarks: z.string().trim().max(500).optional().nullable(),
      })
    )
    .min(1, 'At least one mark record is required.'),
});
