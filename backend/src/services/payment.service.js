import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  addDays,
  getPagination,
  getPaginationMeta,
  notDeleted,
  toDateOnly,
  today,
} from '../utils/helpers.js';
import {
  getEffectiveSchoolId,
  assertSchoolAccess,
  assertPaymentVisible,
  getVisibleStudentIds,
} from '../utils/access.js';

const SORTABLE_FIELDS = new Set([
  'paymentDate',
  'amount',
  'receiptNumber',
  'createdAt',
  'updatedAt',
]);

/**
 * Atomically generates a unique receipt number in format: RCPT/<SCHOOL_CODE>/<YEAR>/<0001>
 */
export async function generatePaymentReceiptNumber(schoolCode = 'SCH001') {
  const currentYear = new Date().getFullYear();
  const counterKey = `receipt_${schoolCode}_${currentYear}`;
  const prefix = `RCPT/${schoolCode}/${currentYear}/`;

  let existingSeq = await prisma.sequence.findUnique({
    where: { id: counterKey },
  });

  if (!existingSeq) {
    let maxExistingNum = 0;
    const latest = await prisma.payment.findFirst({
      where: { receiptNumber: { startsWith: prefix } },
      orderBy: { receiptNumber: 'desc' },
      select: { receiptNumber: true },
    });

    if (latest && latest.receiptNumber) {
      const parts = latest.receiptNumber.split('/');
      const numPart = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(numPart)) maxExistingNum = numPart;
    }

    try {
      existingSeq = await prisma.sequence.create({
        data: {
          id: counterKey,
          seq: maxExistingNum,
        },
      });
    } catch {
      existingSeq = await prisma.sequence.findUnique({
        where: { id: counterKey },
      });
    }
  }

  const updated = await prisma.sequence.update({
    where: { id: counterKey },
    data: {
      seq: { increment: 1 },
    },
  });

  return `${prefix}${String(updated.seq).padStart(4, '0')}`;
}

/**
 * Atomically generates a unique invoice number in format: INV/<SCHOOL_CODE>/<YEAR>/<0001>
 */
export async function generateInvoiceNumber(schoolCode = 'SCH001') {
  const currentYear = new Date().getFullYear();
  const counterKey = `invoice_${schoolCode}_${currentYear}`;
  const prefix = `INV/${schoolCode}/${currentYear}/`;

  let existingSeq = await prisma.sequence.findUnique({
    where: { id: counterKey },
  });

  if (!existingSeq) {
    let maxExistingNum = 0;
    const latest = await prisma.feeInvoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });

    if (latest && latest.invoiceNumber) {
      const parts = latest.invoiceNumber.split('/');
      const numPart = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(numPart)) maxExistingNum = numPart;
    }

    try {
      existingSeq = await prisma.sequence.create({
        data: {
          id: counterKey,
          seq: maxExistingNum,
        },
      });
    } catch {
      existingSeq = await prisma.sequence.findUnique({
        where: { id: counterKey },
      });
    }
  }

  const updated = await prisma.sequence.update({
    where: { id: counterKey },
    data: {
      seq: { increment: 1 },
    },
  });

  return `${prefix}${String(updated.seq).padStart(4, '0')}`;
}

/**
 * Helper to fetch school settings / info for receipt headers
 */
export async function getSchoolInfo(schoolId = 'SCH001') {
  let school = await prisma.school.findFirst({
    where: { OR: [{ id: schoolId }, { code: schoolId }], ...notDeleted() },
  });

  if (!school) {
    const setting = await prisma.setting.findFirst();
    return {
      id: schoolId || 'SCH001',
      code: 'SCH001',
      name: setting?.schoolName || 'Daily Day Academy',
      logo: setting?.schoolLogo || '/logo.svg',
      address: setting?.address || '123 Education Street, New Delhi - 110001',
      phone: setting?.phone || '+91 98765 43210',
      email: setting?.email || 'info@dailydayacademy.edu',
      website: setting?.website || 'www.dailydayacademy.edu',
      affiliationNumber: setting?.affiliationNumber || 'CBSE-AFF-2026-9921',
      principalName: setting?.principalName || 'Dr. R. K. Sharma',
      academicYear: setting?.academicYear || '2026-2027',
    };
  }

  return school;
}

/**
 * RECORD PAYMENT
 * Creates a real payment record, checks payable constraints, updates invoices,
 * generates unique receipt number, and prepares receipt snapshot.
 */
export async function recordPayment(data, actor) {
  if (actor.role === 'TEACHER') {
    throw ApiError.forbidden('Teachers are not authorized to record payments.');
  }

  const student = await prisma.student.findFirst({
    where: { id: data.studentId, ...notDeleted() },
    include: {
      class: { select: { id: true, name: true, section: true } },
      parent: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, userId: true } },
    },
  });

  if (!student) {
    throw ApiError.badRequest('Selected student does not exist.');
  }

  const schoolId = getEffectiveSchoolId(actor, data.schoolId || student.schoolId || 'SCH001');
  const school = await getSchoolInfo(schoolId);
  const payAmount = Number(data.amount);

  if (isNaN(payAmount) || payAmount <= 0) {
    throw ApiError.badRequest('Payment amount must be greater than zero.');
  }

  // Find or determine the active FeeInvoice for this student & feeType
  let invoice = null;
  if (data.invoiceId) {
    invoice = await prisma.feeInvoice.findFirst({
      where: { id: data.invoiceId, studentId: student.id, ...notDeleted() },
    });
    if (!invoice) {
      throw ApiError.badRequest('The specified fee invoice was not found.');
    }
  } else {
    invoice = await prisma.feeInvoice.findFirst({
      where: {
        studentId: student.id,
        feeType: data.feeType || 'Tuition Fee',
        pendingAmount: { gt: 0 },
        ...notDeleted(),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // If no invoice exists, check existing fee structure or create a default invoice
  if (!invoice) {
    let feeStructure = null;
    if (data.feeStructureId) {
      feeStructure = await prisma.feeStructure.findFirst({
        where: { id: data.feeStructureId, ...notDeleted() },
      });
    } else if (student.classId) {
      feeStructure = await prisma.feeStructure.findFirst({
        where: {
          classId: student.classId,
          feeType: data.feeType || 'Tuition Fee',
          status: 'ACTIVE',
          ...notDeleted(),
        },
      });
    }

    const totalFee = feeStructure?.totalFee || 5000;
    const invNumber = await generateInvoiceNumber(school.code || 'SCH001');

    invoice = await prisma.feeInvoice.create({
      data: {
        invoiceNumber: invNumber,
        schoolId: school.code || schoolId,
        studentId: student.id,
        academicYear: data.academicYear || school.academicYear || '2026-2027',
        feeStructureId: feeStructure?.id || null,
        feeType: data.feeType || feeStructure?.feeType || 'Tuition Fee',
        totalFee,
        paidAmount: 0,
        pendingAmount: totalFee,
        discount: 0,
        lateFee: feeStructure?.lateFee || 0,
        finalAmount: totalFee + (feeStructure?.lateFee || 0),
        status: 'PENDING',
      },
    });
  }

  // Calculate current remaining payable amount
  const remainingPayable = Number(invoice.pendingAmount);

  // VALIDATION: payment amount cannot exceed remaining payable amount
  if (payAmount > remainingPayable && remainingPayable > 0) {
    throw ApiError.badRequest(
      `Payment amount (${payAmount}) cannot exceed the remaining payable amount (${remainingPayable}).`
    );
  }

  const previousDue = remainingPayable;
  const newRemainingDue = Math.max(remainingPayable - payAmount, 0);
  const newPaidAmount = invoice.paidAmount + payAmount;
  const newInvoiceStatus = newRemainingDue === 0 ? 'PAID' : newPaidAmount > 0 ? 'PARTIAL' : 'PENDING';

  const receiptNumber = await generatePaymentReceiptNumber(school.code || 'SCH001');
  const paymentDate = data.paymentDate ? toDateOnly(data.paymentDate) : new Date();

  // Create Payment record
  const payment = await prisma.payment.create({
    data: {
      receiptNumber,
      schoolId: school.code || schoolId,
      studentId: student.id,
      academicYear: data.academicYear || invoice.academicYear || '2026-2027',
      invoiceId: invoice.id,
      feeType: data.feeType || invoice.feeType || 'Tuition Fee',
      amount: payAmount,
      previousDue,
      remainingDue: newRemainingDue,
      paymentDate,
      paymentMethod: data.paymentMethod || 'CASH',
      paymentStatus: newInvoiceStatus,
      transactionId: data.transactionId || null,
      referenceNumber: data.referenceNumber || null,
      notes: data.notes || null,
      gateway: data.gateway || 'MANUAL',
      gatewayOrderId: data.gatewayOrderId || null,
      gatewayPaymentId: data.gatewayPaymentId || null,
      createdById: actor.id,
    },
    include: {
      student: {
        select: {
          id: true,
          studentId: true,
          firstName: true,
          lastName: true,
          fatherName: true,
          motherName: true,
          class: { select: { id: true, name: true, section: true } },
          parent: { select: { firstName: true, lastName: true, phone: true, email: true } },
        },
      },
      invoice: true,
      createdBy: { select: { id: true, name: true, role: true } },
    },
  });

  // Update FeeInvoice
  await prisma.feeInvoice.update({
    where: { id: invoice.id },
    data: {
      paidAmount: newPaidAmount,
      pendingAmount: newRemainingDue,
      status: newInvoiceStatus,
    },
  });

  // Sync / update legacy Fee record if one exists for student
  try {
    const existingLegacyFee = await prisma.fee.findFirst({
      where: { studentId: student.id, ...notDeleted() },
    });
    if (existingLegacyFee) {
      const updatedPaid = (existingLegacyFee.paidAmount || 0) + payAmount;
      const updatedDue = Math.max(existingLegacyFee.totalFee - updatedPaid, 0);
      await prisma.fee.update({
        where: { id: existingLegacyFee.id },
        data: {
          paidAmount: updatedPaid,
          dueAmount: updatedDue,
          paymentStatus: updatedDue === 0 ? 'PAID' : updatedPaid > 0 ? 'PARTIAL' : 'PENDING',
          paymentDate,
          paymentMethod: data.paymentMethod || existingLegacyFee.paymentMethod,
        },
      });
    }
  } catch (err) {
    console.warn('[Payment] Legacy Fee sync warning:', err.message);
  }

  // Build full snapshot for PaymentReceipt
  const studentFullName = `${student.firstName} ${student.lastName || ''}`.trim();
  const parentName =
    student.parent
      ? `${student.parent.firstName} ${student.parent.lastName || ''}`.trim()
      : student.fatherName || student.motherName || 'N/A';

  const receiptMetadata = {
    school: {
      name: school.name,
      logo: school.logo,
      address: school.address,
      phone: school.phone,
      email: school.email,
      affiliationNumber: school.affiliationNumber,
    },
    student: {
      id: student.id,
      studentId: student.studentId,
      name: studentFullName,
      className: student.class?.name || 'Unassigned',
      section: student.class?.section || 'A',
      parentName,
    },
    payment: {
      receiptNumber,
      paymentDate: paymentDate.toISOString(),
      feeType: payment.feeType,
      amount: payAmount,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId || payment.referenceNumber || 'N/A',
      previousDue,
      remainingDue: newRemainingDue,
      paymentStatus: payment.paymentStatus,
    },
    authorized: {
      generatedBy: actor.name || 'Accounts Administrator',
      signatureLabel: 'Authorized School Cashier / Bursar',
    },
  };

  const receipt = await prisma.paymentReceipt.create({
    data: {
      receiptNumber,
      schoolId: school.code || schoolId,
      paymentId: payment.id,
      invoiceId: invoice.id,
      studentId: student.id,
      receiptDate: paymentDate,
      generatedById: actor.id,
      metadata: JSON.stringify(receiptMetadata),
    },
  });

  // Dispatch real push notification if user account exists
  try {
    const { sendNotificationToUser } = await import('./notification.service.js');
    const userIds = [student.userId, student.parent?.userId].filter(Boolean);
    for (const uid of userIds) {
      await sendNotificationToUser(uid, {
        title: '💳 Payment Received - Receipt ' + receiptNumber,
        body: `Payment of $${payAmount} recorded for ${studentFullName}. Remaining Balance: $${newRemainingDue}.`,
        type: 'FEE',
        data: { receiptNumber, paymentId: payment.id, studentId: student.id, url: '/fees' },
      });
    }
  } catch (err) {
    console.warn('[Payment] Notification dispatch skipped:', err.message);
  }

  return {
    payment,
    receipt: {
      ...receipt,
      metadata: receiptMetadata,
    },
  };
}

/**
 * LIST PAYMENTS
 * Filterable payment history with multi-tenant and role-based scoping.
 */
export async function listPayments(query = {}, actor) {
  const { page, limit, skip } = getPagination(query);
  const {
    search,
    studentId,
    classId,
    section,
    feeType,
    paymentMethod,
    paymentStatus,
    academicYear,
    schoolId: querySchoolId,
    from,
    to,
    sortBy = 'paymentDate',
    sortOrder = 'desc',
  } = query;

  if (actor.role === 'TEACHER') {
    throw ApiError.forbidden('Teachers are not authorized to view payment history.');
  }

  const schoolId = getEffectiveSchoolId(actor, querySchoolId);

  // Determine authorized student IDs for student/parent roles
  let visibleStudentIds = null;
  if (actor.role === 'STUDENT') {
    if (!actor.student?.id) return { data: [], pagination: getPaginationMeta(page, limit, 0) };
    visibleStudentIds = [actor.student.id];
  } else if (actor.role === 'PARENT') {
    visibleStudentIds = await getVisibleStudentIds(actor);
    if (!visibleStudentIds.length) return { data: [], pagination: getPaginationMeta(page, limit, 0) };
  }

  const where = {
    ...notDeleted(),
    ...(schoolId ? { schoolId } : {}),
    ...(studentId ? { studentId } : {}),
    ...(visibleStudentIds ? { studentId: { in: visibleStudentIds } } : {}),
    ...(feeType ? { feeType } : {}),
    ...(paymentMethod ? { paymentMethod } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(academicYear ? { academicYear } : {}),
    ...(from || to
      ? {
          paymentDate: {
            ...(from ? { gte: toDateOnly(from) } : {}),
            ...(to ? { lte: addDays(toDateOnly(to), 1) } : {}),
          },
        }
      : {}),
    ...(classId || section
      ? {
          student: {
            ...(classId ? { classId } : {}),
            ...(section ? { section } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { receiptNumber: { contains: search, mode: 'insensitive' } },
            { transactionId: { contains: search, mode: 'insensitive' } },
            { referenceNumber: { contains: search, mode: 'insensitive' } },
            { student: { firstName: { contains: search, mode: 'insensitive' } } },
            { student: { lastName: { contains: search, mode: 'insensitive' } } },
            { student: { studentId: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            class: { select: { id: true, name: true, section: true } },
          },
        },
        createdBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: SORTABLE_FIELDS.has(sortBy) ? { [sortBy]: sortOrder } : { paymentDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    data,
    pagination: getPaginationMeta(page, limit, total),
  };
}

/**
 * GET PAYMENT BY ID
 */
export async function getPayment(id, actor) {
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [{ id }, { receiptNumber: id }],
      ...notDeleted(),
    },
    include: {
      student: {
        select: {
          id: true,
          studentId: true,
          firstName: true,
          lastName: true,
          fatherName: true,
          motherName: true,
          class: { select: { id: true, name: true, section: true } },
          parent: { select: { firstName: true, lastName: true, phone: true, email: true } },
        },
      },
      invoice: true,
      createdBy: { select: { id: true, name: true, role: true } },
      receipt: true,
    },
  });

  if (!payment) {
    throw ApiError.notFound('Payment record not found.');
  }

  await assertPaymentVisible(actor, payment);
  return payment;
}

/**
 * GET PAYMENT RECEIPT
 */
export async function getPaymentReceipt(receiptNumberOrId, actor) {
  const receipt = await prisma.paymentReceipt.findFirst({
    where: {
      OR: [{ id: receiptNumberOrId }, { receiptNumber: receiptNumberOrId }, { paymentId: receiptNumberOrId }],
      ...notDeleted(),
    },
    include: {
      payment: true,
      student: {
        include: {
          class: true,
          parent: true,
        },
      },
      invoice: true,
      generatedBy: { select: { id: true, name: true, role: true } },
    },
  });

  if (!receipt) {
    throw ApiError.notFound('Payment receipt not found.');
  }

  await assertPaymentVisible(actor, receipt);

  let metadata = null;
  if (receipt.metadata) {
    try {
      metadata = JSON.parse(receipt.metadata);
    } catch {
      metadata = null;
    }
  }

  if (!metadata) {
    const school = await getSchoolInfo(receipt.schoolId);
    const student = receipt.student;
    const payment = receipt.payment;
    metadata = {
      school: {
        name: school.name,
        logo: school.logo,
        address: school.address,
        phone: school.phone,
        email: school.email,
        affiliationNumber: school.affiliationNumber,
      },
      student: {
        id: student?.id,
        studentId: student?.studentId,
        name: `${student?.firstName} ${student?.lastName || ''}`.trim(),
        className: student?.class?.name || 'Unassigned',
        section: student?.class?.section || 'A',
        parentName: student?.parent
          ? `${student.parent.firstName} ${student.parent.lastName || ''}`.trim()
          : student?.fatherName || 'N/A',
      },
      payment: {
        receiptNumber: receipt.receiptNumber,
        paymentDate: payment?.paymentDate?.toISOString() || receipt.receiptDate.toISOString(),
        feeType: payment?.feeType || 'Tuition Fee',
        amount: payment?.amount || 0,
        paymentMethod: payment?.paymentMethod || 'CASH',
        transactionId: payment?.transactionId || payment?.referenceNumber || 'N/A',
        previousDue: payment?.previousDue || 0,
        remainingDue: payment?.remainingDue || 0,
        paymentStatus: payment?.paymentStatus || 'PAID',
      },
      authorized: {
        generatedBy: receipt.generatedBy?.name || 'Accounts Administrator',
        signatureLabel: 'Authorized School Cashier / Bursar',
      },
    };
  }

  return {
    ...receipt,
    metadata,
  };
}

/**
 * UPDATE PAYMENT
 */
export async function updatePayment(id, data, actor) {
  if (actor.role === 'TEACHER' || actor.role === 'STUDENT' || actor.role === 'PARENT') {
    throw ApiError.forbidden('You are not authorized to edit payment records.');
  }

  const payment = await prisma.payment.findFirst({
    where: { id, ...notDeleted() },
  });

  if (!payment) {
    throw ApiError.notFound('Payment record not found.');
  }

  assertSchoolAccess(actor, payment.schoolId);

  const updated = await prisma.payment.update({
    where: { id },
    data: {
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.referenceNumber !== undefined ? { referenceNumber: data.referenceNumber } : {}),
      ...(data.transactionId !== undefined ? { transactionId: data.transactionId } : {}),
      ...(data.paymentMethod ? { paymentMethod: data.paymentMethod } : {}),
      ...(data.paymentStatus ? { paymentStatus: data.paymentStatus } : {}),
    },
    include: {
      student: { select: { id: true, studentId: true, firstName: true, lastName: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return updated;
}

/**
 * CANCEL PAYMENT
 */
export async function cancelPayment(id, actor) {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw ApiError.forbidden('Only administrators can cancel payment records.');
  }

  const payment = await prisma.payment.findFirst({
    where: { id, ...notDeleted() },
    include: { invoice: true },
  });

  if (!payment) {
    throw ApiError.notFound('Payment record not found.');
  }

  assertSchoolAccess(actor, payment.schoolId);

  // Void payment
  const cancelled = await prisma.payment.update({
    where: { id },
    data: {
      paymentStatus: 'CANCELLED',
      notes: payment.notes ? `${payment.notes} [Cancelled by ${actor.name}]` : `Cancelled by ${actor.name}`,
    },
  });

  // Restore invoice pending balance
  if (payment.invoiceId && payment.invoice) {
    const inv = payment.invoice;
    const restoredPending = inv.pendingAmount + payment.amount;
    const restoredPaid = Math.max(inv.paidAmount - payment.amount, 0);
    const restoredStatus = restoredPending >= inv.finalAmount ? 'PENDING' : restoredPaid > 0 ? 'PARTIAL' : 'PENDING';

    await prisma.feeInvoice.update({
      where: { id: inv.id },
      data: {
        pendingAmount: restoredPending,
        paidAmount: restoredPaid,
        status: restoredStatus,
      },
    });
  }

  return cancelled;
}

/**
 * PENDING FEES VIEW
 * Dynamic calculation of: Pending Amount = Total Fee + Late Fee - Discount - Paid Amount.
 * Calculates Days Overdue.
 */
export async function listPendingFees(query = {}, actor) {
  const { page, limit, skip } = getPagination(query);
  const { search, classId, academicYear, schoolId: querySchoolId } = query;

  if (actor.role === 'TEACHER') {
    throw ApiError.forbidden('Teachers are not authorized to view pending fees.');
  }

  const schoolId = getEffectiveSchoolId(actor, querySchoolId);

  // Enforce student/parent data isolation
  let visibleStudentIds = null;
  if (actor.role === 'STUDENT') {
    if (!actor.student?.id) return { data: [], pagination: getPaginationMeta(page, limit, 0) };
    visibleStudentIds = [actor.student.id];
  } else if (actor.role === 'PARENT') {
    visibleStudentIds = await getVisibleStudentIds(actor);
    if (!visibleStudentIds.length) return { data: [], pagination: getPaginationMeta(page, limit, 0) };
  }

  const where = {
    ...notDeleted(),
    pendingAmount: { gt: 0 },
    ...(schoolId ? { schoolId } : {}),
    ...(academicYear ? { academicYear } : {}),
    ...(visibleStudentIds ? { studentId: { in: visibleStudentIds } } : {}),
    ...(classId
      ? {
          student: {
            classId,
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { invoiceNumber: { contains: search, mode: 'insensitive' } },
            { student: { firstName: { contains: search, mode: 'insensitive' } } },
            { student: { lastName: { contains: search, mode: 'insensitive' } } },
            { student: { studentId: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [invoices, total] = await Promise.all([
    prisma.feeInvoice.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
            class: { select: { id: true, name: true, section: true } },
          },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.feeInvoice.count({ where }),
  ]);

  const currentDate = new Date();

  const data = invoices.map((inv) => {
    const student = inv.student;
    const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
    let daysOverdue = 0;
    let status = inv.status;

    if (dueDate && dueDate < currentDate && inv.pendingAmount > 0) {
      const diffMs = currentDate.getTime() - dueDate.getTime();
      daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      status = 'OVERDUE';
    }

    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      studentId: student?.id,
      studentCode: student?.studentId,
      studentName: student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Unknown',
      className: student?.class?.name || 'Unassigned',
      section: student?.class?.section || 'A',
      feeType: inv.feeType,
      totalFee: inv.totalFee,
      paidAmount: inv.paidAmount,
      dueAmount: inv.pendingAmount,
      discount: inv.discount,
      lateFee: inv.lateFee,
      finalAmount: inv.finalAmount,
      dueDate: inv.dueDate,
      daysOverdue,
      status,
    };
  });

  return {
    data,
    pagination: getPaginationMeta(page, limit, total),
  };
}

/**
 * PAYMENT REPORTS
 * Real aggregations from database for Admin & Super Admin:
 * Daily, Monthly, Academic Year Collection, Method breakdown, Class breakdown.
 */
export async function getPaymentReports(query = {}, actor) {
  if (actor.role === 'TEACHER' || actor.role === 'STUDENT' || actor.role === 'PARENT') {
    throw ApiError.forbidden('You are not authorized to view financial reports.');
  }

  const schoolId = getEffectiveSchoolId(actor, query.schoolId);
  const academicYear = query.academicYear || '2026-2027';

  const baseWhere = {
    ...notDeleted(),
    paymentStatus: { not: 'CANCELLED' },
    ...(schoolId ? { schoolId } : {}),
    ...(academicYear ? { academicYear } : {}),
  };

  const invoiceWhere = {
    ...notDeleted(),
    ...(schoolId ? { schoolId } : {}),
    ...(academicYear ? { academicYear } : {}),
  };

  const [allPayments, allInvoices, classes] = await Promise.all([
    prisma.payment.findMany({
      where: baseWhere,
      include: {
        student: { select: { id: true, studentId: true, firstName: true, lastName: true, classId: true } },
      },
    }),
    prisma.feeInvoice.findMany({
      where: invoiceWhere,
      include: {
        student: { select: { id: true, studentId: true, firstName: true, lastName: true, classId: true } },
      },
    }),
    prisma.class.findMany({
      where: notDeleted(),
      select: { id: true, name: true, section: true },
    }),
  ]);

  // Key totals
  const totalCollection = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPending = allInvoices.reduce((sum, i) => sum + (i.pendingAmount || 0), 0);
  const totalInvoiced = allInvoices.reduce((sum, i) => sum + (i.finalAmount || 0), 0);
  const totalTransactions = allPayments.length;

  // Method breakdowns
  const methodMap = {
    CASH: 0,
    UPI: 0,
    CARD: 0,
    BANK_TRANSFER: 0,
    CHEQUE: 0,
    ONLINE: 0,
  };

  for (const p of allPayments) {
    const m = p.paymentMethod || 'CASH';
    methodMap[m] = (methodMap[m] || 0) + p.amount;
  }

  // Time groupings: Daily (last 30 days) and Monthly (current year)
  const now = new Date();
  const dailyMap = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    dailyMap[dateStr] = 0;
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyMap = {};
  monthNames.forEach((m) => (monthlyMap[m] = 0));

  for (const p of allPayments) {
    if (!p.paymentDate) continue;
    const pDate = new Date(p.paymentDate);
    const dateStr = pDate.toISOString().slice(0, 10);
    if (dailyMap[dateStr] !== undefined) {
      dailyMap[dateStr] += p.amount;
    }
    const mName = monthNames[pDate.getMonth()];
    if (monthlyMap[mName] !== undefined) {
      monthlyMap[mName] += p.amount;
    }
  }

  const dailyCollection = Object.entries(dailyMap).map(([date, amount]) => ({ date, amount }));
  const monthlyCollection = Object.entries(monthlyMap).map(([month, amount]) => ({ month, amount }));

  // Class-wise breakdown
  const classMap = {};
  classes.forEach((c) => {
    classMap[c.id] = {
      classId: c.id,
      className: `${c.name} ${c.section}`.trim(),
      collected: 0,
      pending: 0,
      studentCount: 0,
    };
  });

  for (const p of allPayments) {
    const cId = p.student?.classId;
    if (cId && classMap[cId]) {
      classMap[cId].collected += p.amount;
    }
  }

  for (const inv of allInvoices) {
    const cId = inv.student?.classId;
    if (cId && classMap[cId]) {
      classMap[cId].pending += inv.pendingAmount;
    }
  }

  const classWiseReport = Object.values(classMap).filter((c) => c.collected > 0 || c.pending > 0);

  // Status breakdown
  const statusCounts = {
    PAID: allInvoices.filter((i) => i.status === 'PAID').length,
    PARTIAL: allInvoices.filter((i) => i.status === 'PARTIAL').length,
    PENDING: allInvoices.filter((i) => i.status === 'PENDING').length,
    OVERDUE: allInvoices.filter((i) => i.status === 'OVERDUE' || (i.dueDate && new Date(i.dueDate) < now && i.pendingAmount > 0)).length,
  };

  return {
    academicYear,
    summary: {
      totalCollection,
      totalPending,
      totalInvoiced,
      totalTransactions,
      cashCollection: methodMap.CASH || 0,
      upiCollection: methodMap.UPI || 0,
      cardCollection: methodMap.CARD || 0,
      bankTransferCollection: methodMap.BANK_TRANSFER || 0,
      onlineCollection: (methodMap.ONLINE || 0) + (methodMap.CHEQUE || 0),
    },
    methodBreakdown: Object.entries(methodMap).map(([method, amount]) => ({
      method,
      amount,
      percentage: totalCollection > 0 ? Math.round((amount / totalCollection) * 100) : 0,
    })),
    dailyCollection,
    monthlyCollection,
    classWiseReport,
    statusCounts,
  };
}

/**
 * STUDENT FEE LEDGER
 * Complete financial profile for a specific student.
 */
export async function getStudentFeeLedger(studentId, actor) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, ...notDeleted() },
    include: {
      class: { select: { id: true, name: true, section: true } },
      parent: { select: { firstName: true, lastName: true, phone: true } },
    },
  });

  if (!student) {
    throw ApiError.notFound('Student not found.');
  }

  // Access validation: student/parent can only see their own
  if (actor.role === 'STUDENT' && actor.student?.id !== studentId) {
    throw ApiError.forbidden('You can only view your own fee records.');
  }
  if (actor.role === 'PARENT') {
    const childIds = await getVisibleStudentIds(actor);
    if (!childIds.includes(studentId)) {
      throw ApiError.forbidden('You can only view your child’s fee records.');
    }
  }
  if (actor.role === 'TEACHER') {
    throw ApiError.forbidden('Teachers are not authorized to view fee records.');
  }

  assertSchoolAccess(actor, student.schoolId);

  const [invoices, payments, receipts] = await Promise.all([
    prisma.feeInvoice.findMany({
      where: { studentId, ...notDeleted() },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.findMany({
      where: { studentId, ...notDeleted() },
      include: { createdBy: { select: { name: true } } },
      orderBy: { paymentDate: 'desc' },
    }),
    prisma.paymentReceipt.findMany({
      where: { studentId, ...notDeleted() },
      orderBy: { receiptDate: 'desc' },
    }),
  ]);

  const totalFee = invoices.reduce((sum, inv) => sum + inv.finalAmount, 0);
  const paidAmount = payments
    .filter((p) => p.paymentStatus !== 'CANCELLED')
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = Math.max(totalFee - paidAmount, 0);
  const paymentStatus = pendingAmount === 0 && totalFee > 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING';

  return {
    student: {
      id: student.id,
      studentId: student.studentId,
      name: `${student.firstName} ${student.lastName || ''}`.trim(),
      className: student.class?.name || 'Unassigned',
      section: student.class?.section || 'A',
      fatherName: student.fatherName,
      motherName: student.motherName,
    },
    ledger: {
      totalFee,
      paidAmount,
      pendingAmount,
      paymentStatus,
    },
    invoices,
    payments,
    receipts,
  };
}

/**
 * FEE STRUCTURES CRUD
 */
export async function listFeeStructures(query = {}, actor) {
  const { page, limit, skip } = getPagination(query);
  const { academicYear, classId, status, schoolId: querySchoolId } = query;

  const schoolId = getEffectiveSchoolId(actor, querySchoolId);

  const where = {
    ...notDeleted(),
    ...(schoolId ? { schoolId } : {}),
    ...(academicYear ? { academicYear } : {}),
    ...(classId ? { classId } : {}),
    ...(status ? { status } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.feeStructure.findMany({
      where,
      include: {
        class: { select: { id: true, name: true, section: true } },
      },
      orderBy: [{ classId: 'asc' }, { feeType: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.feeStructure.count({ where }),
  ]);

  return {
    data,
    pagination: getPaginationMeta(page, limit, total),
  };
}

export async function createFeeStructure(data, actor) {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw ApiError.forbidden('Only administrators can configure fee structures.');
  }

  const schoolId = getEffectiveSchoolId(actor, data.schoolId);

  const created = await prisma.feeStructure.create({
    data: {
      schoolId: schoolId || 'SCH001',
      academicYear: data.academicYear || '2026-2027',
      classId: data.classId || null,
      feeType: data.feeType,
      totalFee: Number(data.totalFee),
      dueDate: data.dueDate ? toDateOnly(data.dueDate) : null,
      lateFee: Number(data.lateFee || 0),
      description: data.description || null,
      status: data.status || 'ACTIVE',
    },
    include: {
      class: { select: { id: true, name: true, section: true } },
    },
  });

  return created;
}

export async function updateFeeStructure(id, data, actor) {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw ApiError.forbidden('Only administrators can edit fee structures.');
  }

  const feeStructure = await prisma.feeStructure.findFirst({
    where: { id, ...notDeleted() },
  });

  if (!feeStructure) {
    throw ApiError.notFound('Fee structure record not found.');
  }

  assertSchoolAccess(actor, feeStructure.schoolId);

  const updated = await prisma.feeStructure.update({
    where: { id },
    data: {
      ...(data.academicYear ? { academicYear: data.academicYear } : {}),
      ...(data.classId !== undefined ? { classId: data.classId || null } : {}),
      ...(data.feeType ? { feeType: data.feeType } : {}),
      ...(data.totalFee !== undefined ? { totalFee: Number(data.totalFee) } : {}),
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? toDateOnly(data.dueDate) : null } : {}),
      ...(data.lateFee !== undefined ? { lateFee: Number(data.lateFee) } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.status ? { status: data.status } : {}),
    },
    include: {
      class: { select: { id: true, name: true, section: true } },
    },
  });

  return updated;
}

export async function deleteFeeStructure(id, actor) {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw ApiError.forbidden('Only administrators can delete fee structures.');
  }

  const feeStructure = await prisma.feeStructure.findFirst({
    where: { id, ...notDeleted() },
  });

  if (!feeStructure) {
    throw ApiError.notFound('Fee structure record not found.');
  }

  assertSchoolAccess(actor, feeStructure.schoolId);

  return prisma.feeStructure.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
