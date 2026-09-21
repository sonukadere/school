import { z } from 'zod';
import { dateSchema, paginationQuerySchema } from './common.js';

// Homework
export const createHomeworkSchema = z.object({
  classId: z.string().min(1, 'Class is required.'),
  subjectId: z.string().min(1, 'Subject is required.'),
  title: z.string().trim().min(2, 'Title must be at least 2 characters.').max(200),
  description: z.string().trim().max(2000).optional().nullable().or(z.literal('')),
  attachment: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
  dueDate: dateSchema,
});

export const updateHomeworkSchema = createHomeworkSchema.partial();

export const homeworkQuerySchema = paginationQuerySchema.extend({
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  teacherId: z.string().optional(),
});

// Assignment
export const createAssignmentSchema = z.object({
  classId: z.string().min(1, 'Class is required.'),
  subjectId: z.string().min(1, 'Subject is required.'),
  title: z.string().trim().min(2, 'Title must be at least 2 characters.').max(200),
  description: z.string().trim().max(2000).optional().nullable().or(z.literal('')),
  attachment: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
  dueDate: dateSchema,
  maxMarks: z.coerce.number().min(1).max(1000).optional().default(100),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

export const assignmentQuerySchema = paginationQuerySchema.extend({
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  teacherId: z.string().optional(),
});

export const submitAssignmentSchema = z.object({
  fileUrl: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
  remarks: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
});

export const gradeSubmissionSchema = z.object({
  marks: z.coerce.number().min(0),
  feedback: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
  status: z.enum(['SUBMITTED', 'GRADED', 'LATE']).optional().default('GRADED'),
});

// Study Material
export const createStudyMaterialSchema = z.object({
  classId: z.string().min(1, 'Class is required.'),
  subjectId: z.string().min(1, 'Subject is required.'),
  title: z.string().trim().min(2, 'Title must be at least 2 characters.').max(200),
  description: z.string().trim().max(2000).optional().nullable().or(z.literal('')),
  fileType: z.enum(['PDF', 'DOC', 'IMAGE', 'VIDEO', 'LINK', 'OTHER']).optional().default('PDF'),
  fileUrl: z.string().trim().min(1, 'File URL or document link is required.').max(1000),
});

export const updateStudyMaterialSchema = createStudyMaterialSchema.partial();

export const studyMaterialQuerySchema = paginationQuerySchema.extend({
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  teacherId: z.string().optional(),
  fileType: z.string().optional(),
});

// Leave Request
export const createLeaveRequestSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  reason: z.string().trim().min(5, 'Reason must be at least 5 characters.').max(1000),
  attachment: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
});

export const reviewLeaveRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewRemarks: z.string().trim().max(500).optional().nullable().or(z.literal('')),
});

export const leaveRequestQuerySchema = paginationQuerySchema.extend({
  role: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  userId: z.string().optional(),
});
