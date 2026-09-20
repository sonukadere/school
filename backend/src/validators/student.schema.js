import { z } from 'zod';
import { dateSchema, genderSchema, studentStatusSchema } from './common.js';

const baseStudentSchema = {
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters.').max(100),
  lastName: z.string().trim().min(1, 'Last name is required.').max(100),
  gender: genderSchema.optional(),
  dob: dateSchema.nullish(),
  fatherName: z.string().trim().max(100).optional().nullable(),
  motherName: z.string().trim().max(100).optional().nullable(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address.')
    .max(255)
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  classId: z.string().min(1).optional().nullable(),
  parentId: z.string().min(1).optional().nullable(),
  section: z.string().trim().max(20).optional().nullable(),
  rollNumber: z.number().int().nonnegative().optional().nullable(),
  admissionDate: dateSchema.nullish(),
  status: studentStatusSchema.optional(),

  // Daily Day Academy Admission Form (प्रवेश फार्म) Specific Fields
  photo: z.string().trim().optional().nullable().or(z.literal('')),
  formNo: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  scholarNo: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  medium: z.string().trim().max(20).optional().nullable().or(z.literal('')),
  nameInHindi: z.string().trim().max(150).optional().nullable().or(z.literal('')),
  fatherNameHindi: z.string().trim().max(150).optional().nullable().or(z.literal('')),
  motherNameHindi: z.string().trim().max(150).optional().nullable().or(z.literal('')),
  occupation: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  annualIncome: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  houseNo: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  apartmentSectorStreet: z.string().trim().max(150).optional().nullable().or(z.literal('')),
  colony: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  district: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  state: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  dobInWords: z.string().trim().max(200).optional().nullable().or(z.literal('')),
  ageAsOnJuly1: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  motherTongue: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  religion: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  caste: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  category: z.string().trim().max(30).optional().nullable().or(z.literal('')),
  previousSchool: z.string().trim().max(200).optional().nullable().or(z.literal('')),
  previousSchoolDiseCode: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  sssmId: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  familyId: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  bankAccountNo: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  ifscCode: z.string().trim().max(30).optional().nullable().or(z.literal('')),
  enclosures: z.string().trim().max(300).optional().nullable().or(z.literal('')),

  // FOR OFFICE USE ONLY (कार्यालयीन उपयोग हेतु)
  busNumber: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  admissionGranted: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  testDate: dateSchema.nullish(),
  testTime: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  testConductedBy: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  testRemarks: z.string().trim().max(500).optional().nullable().or(z.literal('')),
  interviewRemarks: z.string().trim().max(500).optional().nullable().or(z.literal('')),
  docBirthCertificate: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  docTransferCertificate: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  docCasteCertificate: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  docMarksheet: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  docPendingLastDate: dateSchema.nullish(),
  feeDepositDate: dateSchema.nullish(),
  officeInstructions: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
};

export const studentCreateSchema = z.object({
  ...baseStudentSchema,
  firstName: baseStudentSchema.firstName,
  lastName: baseStudentSchema.lastName,
  createLoginAccount: z.boolean().optional().default(true),
  username: z.string().trim().min(3, 'Username must be at least 3 characters.').max(50).optional().nullable().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(100).optional().nullable().or(z.literal('')),
});

export const studentResetCredentialsSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters.').max(50).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(100),
});

export const studentUpdateSchema = z.object({
  ...baseStudentSchema,
  studentId: z.string().trim().min(1).optional(),
});

export const studentQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().max(200).optional(),
  classId: z.string().optional(),
  section: z.string().trim().optional(),
  status: studentStatusSchema.optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
