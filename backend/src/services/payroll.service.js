import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  getPagination,
  getPaginationMeta,
  notDeleted,
  toDateOnly,
} from '../utils/helpers.js';
import {
  getEffectiveSchoolId,
  assertSchoolAccess,
} from '../utils/access.js';
import { getSchoolInfo } from './payment.service.js';

/**
 * Atomically generates a unique payroll number: PAY/<SCHOOL_CODE>/<YEAR>/<MONTH>/<0001>
 */
export async function generatePayrollNumber(schoolCode = 'SCH001', year, month) {
  const padMonth = String(month).padStart(2, '0');
  const counterKey = `payroll_${schoolCode}_${year}_${padMonth}`;
  const prefix = `PAY/${schoolCode}/${year}/${padMonth}/`;

  let existingSeq = await prisma.sequence.findUnique({
    where: { id: counterKey },
  });

  if (!existingSeq) {
    let maxExistingNum = 0;
    const latest = await prisma.payroll.findFirst({
      where: { payrollNumber: { startsWith: prefix } },
      orderBy: { payrollNumber: 'desc' },
      select: { payrollNumber: true },
    });

    if (latest?.payrollNumber) {
      const parts = latest.payrollNumber.split('/');
      const numPart = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(numPart)) maxExistingNum = numPart;
    }

    try {
      existingSeq = await prisma.sequence.create({
        data: { id: counterKey, seq: maxExistingNum },
      });
    } catch {
      existingSeq = await prisma.sequence.findUnique({ where: { id: counterKey } });
    }
  }

  const updated = await prisma.sequence.update({
    where: { id: counterKey },
    data: { seq: { increment: 1 } },
  });

  return `${prefix}${String(updated.seq).padStart(4, '0')}`;
}

/**
 * Atomically generates a unique payslip number: PSLIP/<SCHOOL_CODE>/<YEAR>/<MONTH>/<0001>
 */
export async function generatePayslipNumber(schoolCode = 'SCH001', year, month) {
  const padMonth = String(month).padStart(2, '0');
  const counterKey = `payslip_${schoolCode}_${year}_${padMonth}`;
  const prefix = `PSLIP/${schoolCode}/${year}/${padMonth}/`;

  let existingSeq = await prisma.sequence.findUnique({
    where: { id: counterKey },
  });

  if (!existingSeq) {
    let maxExistingNum = 0;
    const latest = await prisma.payslip.findFirst({
      where: { payslipNumber: { startsWith: prefix } },
      orderBy: { payslipNumber: 'desc' },
      select: { payslipNumber: true },
    });

    if (latest?.payslipNumber) {
      const parts = latest.payslipNumber.split('/');
      const numPart = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(numPart)) maxExistingNum = numPart;
    }

    try {
      existingSeq = await prisma.sequence.create({
        data: { id: counterKey, seq: maxExistingNum },
      });
    } catch {
      existingSeq = await prisma.sequence.findUnique({ where: { id: counterKey } });
    }
  }

  const updated = await prisma.sequence.update({
    where: { id: counterKey },
    data: { seq: { increment: 1 } },
  });

  return `${prefix}${String(updated.seq).padStart(4, '0')}`;
}

/**
 * LIST TEACHER SALARY STRUCTURES
 */
export async function getTeacherSalaryStructures(query = {}, actor) {
  const { page, limit, skip } = getPagination(query);
  const { search, schoolId: querySchoolId } = query;

  if (actor.role === 'TEACHER' || actor.role === 'STUDENT' || actor.role === 'PARENT') {
    throw ApiError.forbidden('You are not authorized to view salary structures.');
  }

  const schoolId = getEffectiveSchoolId(actor, querySchoolId);

  // Get all active teachers
  const teacherWhere = {
    ...notDeleted(),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { teacherId: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [teachers, total] = await Promise.all([
    prisma.teacher.findMany({
      where: teacherWhere,
      include: {
        salaryStructure: true,
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.teacher.count({ where: teacherWhere }),
  ]);

  const data = teachers.map((t) => {
    const struct = t.salaryStructure;
    const basicSalary = struct?.basicSalary ?? t.salary ?? 0;
    const allowances = struct?.allowances ?? 0;
    const bonus = struct?.bonus ?? 0;
    const deductions = struct?.deductions ?? 0;
    const advance = struct?.advance ?? 0;
    const grossSalary = struct?.grossSalary ?? (basicSalary + allowances + bonus);
    const netSalary = struct?.netSalary ?? Math.max(grossSalary - deductions - advance, 0);

    return {
      teacherId: t.id,
      teacherCode: t.teacherId,
      name: t.name,
      email: t.email,
      phone: t.phone,
      qualification: t.qualification,
      designation: struct?.designation || 'Teacher',
      subjectName: t.subject?.name || 'General',
      structureId: struct?.id || null,
      basicSalary,
      allowances,
      bonus,
      deductions,
      advance,
      grossSalary,
      netSalary,
      paymentMethod: struct?.paymentMethod || 'BANK_TRANSFER',
      bankAccount: struct?.bankAccount || '',
      bankName: struct?.bankName || '',
      ifscCode: struct?.ifscCode || '',
      status: struct?.status || 'ACTIVE',
    };
  });

  return {
    data,
    pagination: getPaginationMeta(page, limit, total),
  };
}

/**
 * SAVE / UPDATE TEACHER SALARY STRUCTURE
 */
export async function saveTeacherSalaryStructure(data, actor) {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw ApiError.forbidden('Only administrators can configure salary structures.');
  }

  const teacher = await prisma.teacher.findFirst({
    where: { id: data.teacherId, ...notDeleted() },
  });

  if (!teacher) {
    throw ApiError.badRequest('Selected teacher does not exist.');
  }

  const schoolId = getEffectiveSchoolId(actor, data.schoolId || 'SCH001');

  const basicSalary = Number(data.basicSalary) || 0;
  const allowances = Number(data.allowances) || 0;
  const bonus = Number(data.bonus) || 0;
  const deductions = Number(data.deductions) || 0;
  const advance = Number(data.advance) || 0;

  // Exact calculations required:
  // Gross Salary = Basic Salary + Allowances + Bonus
  // Net Salary = Gross Salary - Deductions - Advance
  const grossSalary = basicSalary + allowances + bonus;
  const netSalary = Math.max(grossSalary - deductions - advance, 0);

  const payload = {
    schoolId: schoolId || 'SCH001',
    designation: data.designation || 'Teacher',
    basicSalary,
    allowances,
    bonus,
    deductions,
    advance,
    grossSalary,
    netSalary,
    paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
    bankAccount: data.bankAccount || null,
    bankName: data.bankName || null,
    ifscCode: data.ifscCode || null,
    status: data.status || 'ACTIVE',
  };

  const saved = await prisma.teacherSalaryStructure.upsert({
    where: { teacherId: teacher.id },
    create: {
      ...payload,
      teacherId: teacher.id,
    },
    update: payload,
  });

  // Also sync teacher.salary field for backward compatibility
  await prisma.teacher.update({
    where: { id: teacher.id },
    data: { salary: basicSalary },
  });

  return saved;
}

/**
 * GENERATE MONTHLY PAYROLL
 * Prevents duplicate payroll for the same teacher and month.
 */
export async function generateMonthlyPayroll(data, actor) {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw ApiError.forbidden('Only administrators can generate monthly payroll.');
  }

  const month = parseInt(data.salaryMonth, 10);
  const year = parseInt(data.salaryYear, 10);

  if (!month || month < 1 || month > 12) {
    throw ApiError.badRequest('Invalid month. Month must be between 1 and 12.');
  }
  if (!year || year < 2000 || year > 2100) {
    throw ApiError.badRequest('Invalid year.');
  }

  const schoolId = getEffectiveSchoolId(actor, data.schoolId || 'SCH001');
  const school = await getSchoolInfo(schoolId);

  // Fetch all active teachers
  const teachers = await prisma.teacher.findMany({
    where: notDeleted(),
    include: { salaryStructure: true },
  });

  if (!teachers.length) {
    throw ApiError.badRequest('No active teachers found to generate payroll.');
  }

  // Fetch existing payroll records for this month and year to prevent duplicates
  const existingPayrolls = await prisma.payroll.findMany({
    where: {
      salaryMonth: month,
      salaryYear: year,
      ...notDeleted(),
    },
    select: { teacherId: true },
  });

  const existingTeacherIds = new Set(existingPayrolls.map((p) => p.teacherId));

  let generatedCount = 0;
  let skippedCount = 0;
  const createdRecords = [];

  for (const teacher of teachers) {
    if (existingTeacherIds.has(teacher.id)) {
      skippedCount++;
      continue;
    }

    const struct = teacher.salaryStructure;
    const basicSalary = struct?.basicSalary ?? teacher.salary ?? 25000;
    const allowances = struct?.allowances ?? 0;
    const bonus = struct?.bonus ?? 0;
    const deductions = struct?.deductions ?? 0;
    const advance = struct?.advance ?? 0;

    const grossSalary = basicSalary + allowances + bonus;
    const netSalary = Math.max(grossSalary - deductions - advance, 0);

    const payrollNumber = await generatePayrollNumber(school.code || 'SCH001', year, month);

    const record = await prisma.payroll.create({
      data: {
        payrollNumber,
        schoolId: school.code || schoolId || 'SCH001',
        teacherId: teacher.id,
        salaryMonth: month,
        salaryYear: year,
        designation: struct?.designation || 'Teacher',
        basicSalary,
        allowances,
        bonus,
        deductions,
        advance,
        grossSalary,
        netSalary,
        paymentStatus: 'PENDING',
        paymentMethod: struct?.paymentMethod || 'BANK_TRANSFER',
        createdById: actor.id,
      },
      include: {
        teacher: { select: { id: true, teacherId: true, name: true, email: true, phone: true } },
      },
    });

    createdRecords.push(record);
    generatedCount++;
  }

  return {
    message: `Payroll generation completed. Generated: ${generatedCount}, Skipped (Already Exists): ${skippedCount}.`,
    generatedCount,
    skippedCount,
    month,
    year,
    records: createdRecords,
  };
}

/**
 * LIST PAYROLL RECORDS
 */
export async function listPayroll(query = {}, actor) {
  const { page, limit, skip } = getPagination(query);
  const {
    search,
    teacherId,
    salaryMonth,
    salaryYear,
    paymentStatus,
    schoolId: querySchoolId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  // RBAC: If Teacher, only allow viewing their own payroll records
  let filterTeacherId = teacherId;
  if (actor.role === 'TEACHER') {
    if (!actor.teacher?.id) {
      return { data: [], pagination: getPaginationMeta(page, limit, 0) };
    }
    filterTeacherId = actor.teacher.id;
  } else if (actor.role === 'STUDENT' || actor.role === 'PARENT') {
    throw ApiError.forbidden('Students and parents are not authorized to view teacher payroll.');
  }

  const schoolId = getEffectiveSchoolId(actor, querySchoolId);

  const where = {
    ...notDeleted(),
    ...(schoolId ? { schoolId } : {}),
    ...(filterTeacherId ? { teacherId: filterTeacherId } : {}),
    ...(salaryMonth ? { salaryMonth: parseInt(salaryMonth, 10) } : {}),
    ...(salaryYear ? { salaryYear: parseInt(salaryYear, 10) } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(search
      ? {
          OR: [
            { payrollNumber: { contains: search, mode: 'insensitive' } },
            { teacher: { name: { contains: search, mode: 'insensitive' } } },
            { teacher: { teacherId: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.payroll.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            teacherId: true,
            name: true,
            email: true,
            phone: true,
            salaryStructure: true,
          },
        },
        createdBy: { select: { id: true, name: true, role: true } },
        payslip: { select: { id: true, payslipNumber: true, issueDate: true } },
      },
      orderBy: [{ salaryYear: 'desc' }, { salaryMonth: 'desc' }, { [sortBy]: sortOrder }],
      skip,
      take: limit,
    }),
    prisma.payroll.count({ where }),
  ]);

  return {
    data,
    pagination: getPaginationMeta(page, limit, total),
  };
}

/**
 * GET PAYROLL BY ID
 */
export async function getPayrollById(id, actor) {
  const payroll = await prisma.payroll.findFirst({
    where: {
      OR: [{ id }, { payrollNumber: id }],
      ...notDeleted(),
    },
    include: {
      teacher: {
        include: {
          salaryStructure: true,
          subject: true,
        },
      },
      createdBy: { select: { id: true, name: true, role: true } },
      payslip: true,
    },
  });

  if (!payroll) {
    throw ApiError.notFound('Payroll record not found.');
  }

  if (actor.role === 'TEACHER' && actor.teacher?.id !== payroll.teacherId) {
    throw ApiError.forbidden('You can only view your own payroll records.');
  }
  if (actor.role === 'STUDENT' || actor.role === 'PARENT') {
    throw ApiError.forbidden('You are not authorized to view payroll records.');
  }

  assertSchoolAccess(actor, payroll.schoolId);
  return payroll;
}

/**
 * MARK SALARY PAID & GENERATE OFFICIAL PAYSLIP
 */
export async function markSalaryPaid(id, data, actor) {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw ApiError.forbidden('Only administrators can record salary disbursements.');
  }

  const payroll = await prisma.payroll.findFirst({
    where: { id, ...notDeleted() },
    include: {
      teacher: {
        include: { salaryStructure: true },
      },
    },
  });

  if (!payroll) {
    throw ApiError.notFound('Payroll record not found.');
  }

  if (payroll.paymentStatus === 'PAID') {
    throw ApiError.badRequest('This monthly salary has already been marked as PAID.');
  }

  assertSchoolAccess(actor, payroll.schoolId);

  const school = await getSchoolInfo(payroll.schoolId);
  const paymentDate = data.paymentDate ? toDateOnly(data.paymentDate) : new Date();
  const paymentMethod = data.paymentMethod || payroll.paymentMethod || 'BANK_TRANSFER';

  // Update Payroll
  const updatedPayroll = await prisma.payroll.update({
    where: { id: payroll.id },
    data: {
      paymentStatus: 'PAID',
      paymentDate,
      paymentMethod,
      transactionId: data.transactionId || null,
      referenceNumber: data.referenceNumber || null,
      notes: data.notes || null,
    },
    include: {
      teacher: true,
    },
  });

  // Check or generate Payslip
  let payslip = await prisma.payslip.findUnique({
    where: { payrollId: payroll.id },
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[payroll.salaryMonth - 1] || `Month ${payroll.salaryMonth}`;

  const payslipMetadata = {
    school: {
      name: school.name,
      logo: school.logo,
      address: school.address,
      phone: school.phone,
      email: school.email,
      affiliationNumber: school.affiliationNumber,
    },
    teacher: {
      id: payroll.teacher.id,
      teacherId: payroll.teacher.teacherId,
      name: payroll.teacher.name,
      designation: payroll.designation || 'Teacher',
      email: payroll.teacher.email,
      phone: payroll.teacher.phone,
      bankAccount: payroll.teacher.salaryStructure?.bankAccount || 'On File',
      bankName: payroll.teacher.salaryStructure?.bankName || 'Direct Deposit',
      ifscCode: payroll.teacher.salaryStructure?.ifscCode || '—',
    },
    payroll: {
      payrollNumber: payroll.payrollNumber,
      month: monthName,
      year: payroll.salaryYear,
      basicSalary: payroll.basicSalary,
      allowances: payroll.allowances,
      bonus: payroll.bonus,
      grossSalary: payroll.grossSalary,
      deductions: payroll.deductions,
      advance: payroll.advance,
      netSalary: payroll.netSalary,
      paymentDate: paymentDate.toISOString(),
      paymentMethod,
      transactionId: data.transactionId || data.referenceNumber || 'N/A',
      paymentStatus: 'PAID',
    },
    authorized: {
      generatedBy: actor.name || 'Principal / Administrator',
      signatureLabel: 'Authorized School Bursar / Accounts Desk',
    },
  };

  if (!payslip) {
    const payslipNumber = await generatePayslipNumber(school.code || 'SCH001', payroll.salaryYear, payroll.salaryMonth);
    payslip = await prisma.payslip.create({
      data: {
        payslipNumber,
        schoolId: school.code || payroll.schoolId || 'SCH001',
        payrollId: payroll.id,
        teacherId: payroll.teacherId,
        issueDate: paymentDate,
        metadata: JSON.stringify(payslipMetadata),
      },
    });
  } else {
    payslip = await prisma.payslip.update({
      where: { id: payslip.id },
      data: {
        issueDate: paymentDate,
        metadata: JSON.stringify(payslipMetadata),
      },
    });
  }

  // Send push notification to teacher if linked account exists
  try {
    const { sendNotificationToUser } = await import('./notification.service.js');
    if (payroll.teacher.userId) {
      await sendNotificationToUser(payroll.teacher.userId, {
        title: `💵 Salary Disbursed for ${monthName} ${payroll.salaryYear}`,
        body: `Your net salary of $${payroll.netSalary} has been marked as paid via ${paymentMethod}. Payslip ${payslip.payslipNumber} is available.`,
        type: 'PAYROLL',
        data: { payslipNumber: payslip.payslipNumber, payrollId: payroll.id, url: '/fees' },
      });
    }
  } catch (err) {
    console.warn('[Payroll] Notification warning:', err.message);
  }

  return {
    payroll: updatedPayroll,
    payslip: {
      ...payslip,
      metadata: payslipMetadata,
    },
  };
}

/**
 * GET PAYSLIP BY NUMBER OR ID
 */
export async function getPayslip(payslipNumberOrId, actor) {
  const payslip = await prisma.payslip.findFirst({
    where: {
      OR: [{ id: payslipNumberOrId }, { payslipNumber: payslipNumberOrId }, { payrollId: payslipNumberOrId }],
      ...notDeleted(),
    },
    include: {
      payroll: true,
      teacher: {
        include: { salaryStructure: true },
      },
    },
  });

  if (!payslip) {
    throw ApiError.notFound('Payslip not found.');
  }

  if (actor.role === 'TEACHER' && actor.teacher?.id !== payslip.teacherId) {
    throw ApiError.forbidden('You can only view your own payslips.');
  }
  if (actor.role === 'STUDENT' || actor.role === 'PARENT') {
    throw ApiError.forbidden('You are not authorized to view teacher payslips.');
  }

  assertSchoolAccess(actor, payslip.schoolId);

  let metadata = null;
  if (payslip.metadata) {
    try {
      metadata = JSON.parse(payslip.metadata);
    } catch {
      metadata = null;
    }
  }

  if (!metadata) {
    const school = await getSchoolInfo(payslip.schoolId);
    const teacher = payslip.teacher;
    const payroll = payslip.payroll;
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = payroll ? monthNames[payroll.salaryMonth - 1] : '';

    metadata = {
      school: {
        name: school.name,
        logo: school.logo,
        address: school.address,
        phone: school.phone,
        email: school.email,
        affiliationNumber: school.affiliationNumber,
      },
      teacher: {
        id: teacher?.id,
        teacherId: teacher?.teacherId,
        name: teacher?.name,
        designation: payroll?.designation || 'Teacher',
        email: teacher?.email,
        phone: teacher?.phone,
        bankAccount: teacher?.salaryStructure?.bankAccount || 'On File',
        bankName: teacher?.salaryStructure?.bankName || 'Direct Deposit',
        ifscCode: teacher?.salaryStructure?.ifscCode || '—',
      },
      payroll: {
        payslipNumber: payslip.payslipNumber,
        payrollNumber: payroll?.payrollNumber,
        month: monthName,
        year: payroll?.salaryYear,
        basicSalary: payroll?.basicSalary || 0,
        allowances: payroll?.allowances || 0,
        bonus: payroll?.bonus || 0,
        grossSalary: payroll?.grossSalary || 0,
        deductions: payroll?.deductions || 0,
        advance: payroll?.advance || 0,
        netSalary: payroll?.netSalary || 0,
        paymentDate: payroll?.paymentDate ? payroll.paymentDate.toISOString() : payslip.issueDate.toISOString(),
        paymentMethod: payroll?.paymentMethod || 'BANK_TRANSFER',
        transactionId: payroll?.transactionId || 'N/A',
        paymentStatus: payroll?.paymentStatus || 'PAID',
      },
      authorized: {
        generatedBy: 'Principal / Administrator',
        signatureLabel: 'Authorized School Bursar / Accounts Desk',
      },
    };
  }

  return {
    ...payslip,
    metadata,
  };
}

/**
 * GET PAYROLL & FINANCE SUMMARY REPORTS
 */
export async function getPayrollReports(query = {}, actor) {
  if (actor.role === 'TEACHER' || actor.role === 'STUDENT' || actor.role === 'PARENT') {
    throw ApiError.forbidden('You are not authorized to view financial reports.');
  }

  const schoolId = getEffectiveSchoolId(actor, query.schoolId);
  const currentYear = query.year ? parseInt(query.year, 10) : new Date().getFullYear();

  const where = {
    ...notDeleted(),
    salaryYear: currentYear,
    ...(schoolId ? { schoolId } : {}),
  };

  const allPayrolls = await prisma.payroll.findMany({
    where,
    include: {
      teacher: { select: { id: true, name: true, teacherId: true } },
    },
  });

  const totalPayable = allPayrolls.reduce((sum, p) => sum + p.netSalary, 0);
  const paidPayrolls = allPayrolls.filter((p) => p.paymentStatus === 'PAID');
  const pendingPayrolls = allPayrolls.filter((p) => p.paymentStatus === 'PENDING');

  const totalPaid = paidPayrolls.reduce((sum, p) => sum + p.netSalary, 0);
  const totalPending = pendingPayrolls.reduce((sum, p) => sum + p.netSalary, 0);

  // Month-by-month expense breakdown
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyExpenses = monthNames.map((m, idx) => {
    const monthNum = idx + 1;
    const monthPayrolls = allPayrolls.filter((p) => p.salaryMonth === monthNum);
    const paid = monthPayrolls.filter((p) => p.paymentStatus === 'PAID').reduce((sum, p) => sum + p.netSalary, 0);
    const pending = monthPayrolls.filter((p) => p.paymentStatus === 'PENDING').reduce((sum, p) => sum + p.netSalary, 0);
    return {
      month: m,
      monthNum,
      paid,
      pending,
      total: paid + pending,
    };
  });

  return {
    year: currentYear,
    summary: {
      totalPayable,
      totalPaid,
      totalPending,
      totalRecords: allPayrolls.length,
      paidCount: paidPayrolls.length,
      pendingCount: pendingPayrolls.length,
    },
    monthlyExpenses,
  };
}
