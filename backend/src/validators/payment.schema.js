import { z } from 'zod';
import {
  dateSchema,
  dateOnlySchema,
  paymentMethodSchema,
  paymentStatusSchema,
} from './common.js';

export const recordPaymentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required.'),
  amount: z.coerce.number().positive('Payment amount must be greater than zero.'),
  academicYear: z.string().trim().optional(),
  feeType: z.string().trim().default('Tuition Fee'),
  invoiceId: z.string().trim().optional().nullable(),
  feeStructureId: z.string().trim().optional().nullable(),
  paymentDate: dateSchema.optional(),
  paymentMethod: paymentMethodSchema.default('CASH'),
  transactionId: z.string().trim().optional().nullable(),
  referenceNumber: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  gateway: z.string().trim().optional().nullable(),
  gatewayOrderId: z.string().trim().optional().nullable(),
  gatewayPaymentId: z.string().trim().optional().nullable(),
  schoolId: z.string().trim().optional(),
});

export const updatePaymentSchema = z.object({
  notes: z.string().trim().max(500).optional().nullable(),
  referenceNumber: z.string().trim().optional().nullable(),
  transactionId: z.string().trim().optional().nullable(),
  paymentMethod: paymentMethodSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
});

export const paymentQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
  search: z.string().trim().optional(),
  studentId: z.string().trim().optional(),
  classId: z.string().trim().optional(),
  section: z.string().trim().optional(),
  feeType: z.string().trim().optional(),
  paymentMethod: paymentMethodSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  schoolId: z.string().trim().optional(),
  academicYear: z.string().trim().optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const feeStructureCreateSchema = z.object({
  academicYear: z.string().trim().min(1, 'Academic Year is required.'),
  classId: z.string().trim().optional().nullable(),
  feeType: z.string().trim().min(1, 'Fee Type is required.'),
  totalFee: z.coerce.number().positive('Total fee must be greater than zero.'),
  dueDate: dateOnlySchema.optional(),
  lateFee: z.coerce.number().nonnegative().optional().default(0),
  description: z.string().trim().max(500).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  schoolId: z.string().trim().optional(),
});

export const feeStructureUpdateSchema = z.object({
  academicYear: z.string().trim().optional(),
  classId: z.string().trim().optional().nullable(),
  feeType: z.string().trim().optional(),
  totalFee: z.coerce.number().positive().optional(),
  dueDate: dateOnlySchema.optional(),
  lateFee: z.coerce.number().nonnegative().optional(),
  description: z.string().trim().max(500).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const feeInvoiceCreateSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required.'),
  feeStructureId: z.string().trim().optional().nullable(),
  academicYear: z.string().trim().default('2026-2027'),
  feeType: z.string().trim().default('Tuition Fee'),
  totalFee: z.coerce.number().positive('Total fee must be positive.'),
  discount: z.coerce.number().nonnegative().optional().default(0),
  lateFee: z.coerce.number().nonnegative().optional().default(0),
  dueDate: dateOnlySchema.optional(),
  schoolId: z.string().trim().optional(),
});

export const pendingFeesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
  search: z.string().trim().optional(),
  classId: z.string().trim().optional(),
  academicYear: z.string().trim().optional(),
  schoolId: z.string().trim().optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
