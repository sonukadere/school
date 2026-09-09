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
 * Helper to determine if a given due date has passed.
 * Due date day is valid until the end of that day (23:59:59.999).
 */
export function isInvoicePastDue(dueDate) {
  if (!dueDate) return false;
  const now = new Date();
  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);
  return now.getTime() > due.getTime();
}

/**
 * Calculates late fee, final payable, and pending balances dynamically based on due date.
 * Late fee is ONLY added if the due date has passed AND the invoice is not fully cleared.
 */
export function resolveInvoiceAmounts(invoice, feeStructure = null) {
  const isPastDue = isInvoicePastDue(invoice.dueDate);
  const structLateFee = Number(feeStructure?.lateFee ?? invoice.feeStructure?.lateFee ?? invoice.lateFee ?? 0);
  const totalFee = Number(invoice.totalFee) || 0;
  const discount = Number(invoice.discount) || 0;
  const paidAmount = Number(invoice.paidAmount) || 0;

  const isFullyPaid = invoice.status === 'PAID' || (paidAmount >= (totalFee - discount) && totalFee > 0);
  const applicableLateFee = (!isFullyPaid && isPastDue) ? Math.max(structLateFee, 0) : 0;

  const finalAmount = Math.max(totalFee - discount + applicableLateFee, 0);
  const pendingAmount = Math.max(finalAmount - paidAmount, 0);
  const status = pendingAmount === 0 && finalAmount > 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING';

  return {
    ...invoice,
    lateFee: applicableLateFee,
    finalAmount,
    pendingAmount,
    status,
    isPastDue,
  };
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
  const targetInvoiceId = data.invoiceId || data.feeInvoiceId;
  if (targetInvoiceId) {
    invoice = await prisma.feeInvoice.findFirst({
      where: { id: targetInvoiceId },
    });
    if (!invoice || invoice.deletedAt) {
      throw ApiError.badRequest('The specified fee invoice was not found.');
    }
    if (invoice.studentId && invoice.studentId !== student.id) {
      throw ApiError.badRequest('The specified invoice does not belong to the selected student.');
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
    const targetDueDate = feeStructure?.dueDate || null;
    const isPastDue = isInvoicePastDue(targetDueDate);
    const applicableLateFee = isPastDue ? (feeStructure?.lateFee || 0) : 0;
    const finalAmount = Math.max(totalFee + applicableLateFee, 0);

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
        pendingAmount: finalAmount,
        discount: 0,
        lateFee: applicableLateFee,
        finalAmount,
        dueDate: targetDueDate,
        status: 'PENDING',
        deletedAt: null,
      },
    });
  }

  // Calculate current remaining payable amount
  const remainingPayable = Number(invoice.pendingAmount);

  // VALIDATION: check if invoice is already fully cleared
  if (remainingPayable <= 0 && invoice.status === 'PAID') {
    throw ApiError.badRequest('This fee invoice has already been fully cleared.');
  }

  // VALIDATION: payment amount cannot exceed remaining payable amount
  if (payAmount > remainingPayable && remainingPayable > 0) {
    throw ApiError.badRequest(
      `Payment amount (${payAmount}) cannot exceed the remaining payable amount (${remainingPayable}).`
    );
  }

  // DUPLICATE PAYMENT GUARD: prevent duplicate charge if identical payment was recorded in the last 15 seconds
  const recentDuplicate = await prisma.payment.findFirst({
    where: {
      studentId: student.id,
      amount: payAmount,
      invoiceId: invoice.id,
      paymentDate: { gte: new Date(Date.now() - 15 * 1000) },
      ...notDeleted(),
    },
  });
  if (recentDuplicate) {
    throw ApiError.badRequest('A payment with the same amount for this student was just recorded. Please wait a moment before submitting again.');
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
      student: { connect: { id: student.id } },
      academicYear: data.academicYear || invoice.academicYear || '2026-2027',
      ...(invoice?.id ? { invoice: { connect: { id: invoice.id } } } : {}),
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
      ...(actor?.id ? { createdBy: { connect: { id: actor.id } } } : {}),
      deletedAt: null,
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
      payment: { connect: { id: payment.id } },
      student: { connect: { id: student.id } },
      ...(invoice?.id ? { invoice: { connect: { id: invoice.id } } } : {}),
      receiptDate: paymentDate,
      ...(actor?.id ? { generatedBy: { connect: { id: actor.id } } } : {}),
      metadata: JSON.stringify(receiptMetadata),
      deletedAt: null,
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
  if (!receiptNumberOrId) {
    throw ApiError.badRequest('Receipt number or identifier is required.');
  }

  const rawKey = String(receiptNumberOrId).trim();
  let decodedKey = rawKey;
  try {
    decodedKey = decodeURIComponent(rawKey).trim();
  } catch {
    decodedKey = rawKey;
  }

  const searchKeys = Array.from(new Set([rawKey, decodedKey])).filter(Boolean);

  const receipt = await prisma.paymentReceipt.findFirst({
    where: {
      OR: searchKeys.flatMap((key) => [
        { id: key },
        { receiptNumber: key },
        { paymentId: key },
      ]),
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

  if (!receipt || receipt.deletedAt) {
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

  if (metadata && metadata.payment) {
    if (receipt.invoice && !isInvoicePastDue(receipt.invoice.dueDate)) {
      const baseTotal = (receipt.invoice.totalFee || 0) - (receipt.invoice.discount || 0);
      if (metadata.payment.previousDue > baseTotal && baseTotal > 0) {
        const diff = metadata.payment.previousDue - baseTotal;
        metadata.payment.previousDue = baseTotal;
        metadata.payment.remainingDue = Math.max(metadata.payment.remainingDue - diff, 0);
      }
    }
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
        feeStructure: true,
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

  const data = invoices.map((rawInv) => {
    const inv = resolveInvoiceAmounts(rawInv, rawInv.feeStructure);
    const student = inv.student;
    const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
    let daysOverdue = 0;
    let status = inv.status;

    if (inv.isPastDue && inv.pendingAmount > 0 && dueDate) {
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
    where: {
      OR: [
        { id: studentId },
        { studentId: studentId },
        { userId: studentId },
      ],
      ...notDeleted(),
    },
    include: {
      class: { select: { id: true, name: true, section: true } },
      parent: { select: { firstName: true, lastName: true, phone: true } },
    },
  });

  if (!student) {
    throw ApiError.notFound('Student not found.');
  }

  // Access validation: student/parent can only see their own
  if (actor.role === 'STUDENT' && actor.student?.id !== student.id && actor.id !== student.userId) {
    throw ApiError.forbidden('You can only view your own fee records.');
  }
  if (actor.role === 'PARENT') {
    const childIds = await getVisibleStudentIds(actor);
    if (!childIds.includes(student.id)) {
      throw ApiError.forbidden('You can only view your child’s fee records.');
    }
  }
  if (actor.role === 'TEACHER') {
    throw ApiError.forbidden('Teachers are not authorized to view fee records.');
  }

  assertSchoolAccess(actor, student.schoolId);

  // REAL-TIME DYNAMIC SYNC:
  // Automatically generate active fee structure invoices for student's class if not already issued
  if (student.classId) {
    const activeStructures = await prisma.feeStructure.findMany({
      where: {
        OR: [
          { classId: student.classId },
          { classId: null },
        ],
        status: 'ACTIVE',
        ...notDeleted(),
      },
    });

    for (const struct of activeStructures) {
      const targetYear = struct.academicYear || '2026-2027';
      const existing = await prisma.feeInvoice.findFirst({
        where: {
          studentId: student.id,
          OR: [
            { feeStructureId: struct.id },
            { feeType: struct.feeType, academicYear: targetYear },
          ],
          ...notDeleted(),
        },
      });

      if (!existing) {
        const school = await getSchoolInfo(struct.schoolId || student.schoolId || 'SCH001');
        const invoiceNumber = await generateInvoiceNumber(school?.code || 'SCH001');
        const totalFee = struct.totalFee;
        const targetDueDate = struct.dueDate;
        const isPastDue = isInvoicePastDue(targetDueDate);
        const applicableLateFee = isPastDue ? (struct.lateFee || 0) : 0;
        const finalAmount = Math.max(totalFee + applicableLateFee, 0);

        await prisma.feeInvoice.create({
          data: {
            invoiceNumber,
            schoolId: school?.code || student.schoolId || 'SCH001',
            studentId: student.id,
            feeStructureId: struct.id,
            feeType: struct.feeType,
            academicYear: targetYear,
            totalFee,
            lateFee: applicableLateFee,
            discount: 0,
            finalAmount,
            paidAmount: 0,
            pendingAmount: finalAmount,
            dueDate: targetDueDate,
            status: 'PENDING',
          },
        });
      }
    }
  }

  const [rawInvoices, payments, receipts, legacyFees] = await Promise.all([
    prisma.feeInvoice.findMany({
      where: { studentId: student.id, ...notDeleted() },
      include: { feeStructure: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.findMany({
      where: { studentId: student.id, ...notDeleted() },
      include: { createdBy: { select: { name: true } } },
      orderBy: { paymentDate: 'desc' },
    }),
    prisma.paymentReceipt.findMany({
      where: { studentId: student.id, ...notDeleted() },
      orderBy: { receiptDate: 'desc' },
    }),
    prisma.fee.findMany({
      where: { studentId: student.id, ...notDeleted() },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Dynamically resolve late fees based on whether dueDate has passed
  const invoices = await Promise.all(
    rawInvoices.map(async (rawInv) => {
      const resolved = resolveInvoiceAmounts(rawInv, rawInv.feeStructure);
      if (
        rawInv.lateFee !== resolved.lateFee ||
        rawInv.finalAmount !== resolved.finalAmount ||
        rawInv.pendingAmount !== resolved.pendingAmount
      ) {
        await prisma.feeInvoice
          .update({
            where: { id: rawInv.id },
            data: {
              lateFee: resolved.lateFee,
              finalAmount: resolved.finalAmount,
              pendingAmount: resolved.pendingAmount,
              status: resolved.status,
            },
          })
          .catch((err) => console.warn('[Payment] Invoice late fee sync warning:', err.message));
      }
      return resolved;
    })
  );

  // Combine invoices with any legacy unmigrated fee records
  const allInvoices = [...invoices];
  legacyFees.forEach((lf) => {
    if (!allInvoices.some((inv) => inv.id === lf.id || inv.totalFee === lf.totalFee)) {
      allInvoices.push({
        id: lf.id,
        invoiceNumber: 'INV-LEGACY',
        feeType: 'Tuition Fee',
        totalFee: lf.totalFee,
        discount: 0,
        lateFee: 0,
        finalAmount: lf.totalFee,
        paidAmount: lf.paidAmount || lf.paidFee || 0,
        pendingAmount: lf.dueAmount ?? Math.max(lf.totalFee - (lf.paidAmount || 0), 0),
        dueDate: lf.paymentDate,
        status: lf.paymentStatus || 'PENDING',
        createdAt: lf.createdAt,
      });
    }
  });

  const totalFee = allInvoices.reduce((sum, inv) => sum + (inv.finalAmount || inv.totalFee || 0), 0);
  const paidAmount = payments
    .filter((p) => p.paymentStatus !== 'CANCELLED')
    .reduce((sum, p) => sum + p.amount, 0)
    + (allInvoices.filter((i) => i.invoiceNumber === 'INV-LEGACY').reduce((sum, i) => sum + (i.paidAmount || 0), 0));
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
    summary: {
      totalFee,
      totalFees: totalFee,
      paidAmount,
      totalPaid: paidAmount,
      pendingAmount,
      paymentStatus,
    },
    invoices: allInvoices,
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
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
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
      feeType: data.feeType || data.name,
      totalFee: Number(data.totalFee ?? data.amount),
      dueDate: data.dueDate ? toDateOnly(data.dueDate) : null,
      lateFee: Number(data.lateFee || 0),
      description: data.description || null,
      status: data.status || 'ACTIVE',
      ...(data.classId ? { class: { connect: { id: data.classId } } } : {}),
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
      academicYear: data.academicYear !== undefined ? data.academicYear : feeStructure.academicYear,
      feeType: data.feeType !== undefined ? data.feeType : feeStructure.feeType,
      totalFee: data.totalFee !== undefined ? Number(data.totalFee ?? data.amount) : feeStructure.totalFee,
      dueDate: data.dueDate !== undefined ? (data.dueDate ? toDateOnly(data.dueDate) : null) : feeStructure.dueDate,
      lateFee: data.lateFee !== undefined ? Number(data.lateFee) : feeStructure.lateFee,
      description: data.description !== undefined ? data.description : feeStructure.description,
      status: data.status !== undefined ? data.status : feeStructure.status,
      ...(data.classId !== undefined
        ? data.classId
          ? { class: { connect: { id: data.classId } } }
          : { class: { disconnect: true } }
        : {}),
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

/**
 * ASSIGN FEE STRUCTURE TO CLASS (BULK INVOICE GENERATION)
 */
export async function assignFeeStructureToClass(data, actor) {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw ApiError.forbidden('Only administrators can assign fee structures.');
  }

  const { feeStructureId, classId, discount = 0, dueDate, academicYear } = data;

  const structure = await prisma.feeStructure.findFirst({
    where: { id: feeStructureId, ...notDeleted() },
  });

  if (!structure) {
    throw ApiError.badRequest('Selected fee structure does not exist.');
  }

  const schoolId = getEffectiveSchoolId(actor, structure.schoolId);
  const school = await getSchoolInfo(schoolId);

  const targetClassId = classId || structure.classId;
  const studentWhere = {
    ...notDeleted(),
    ...(targetClassId ? { classId: targetClassId } : {}),
  };

  const students = await prisma.student.findMany({
    where: studentWhere,
    select: { id: true, studentId: true, firstName: true, lastName: true },
  });

  if (!students.length) {
    throw ApiError.badRequest('No students found in the target class to assign fees.');
  }

  const targetAcademicYear = academicYear || structure.academicYear || '2026-2027';
  const targetDueDate = dueDate ? toDateOnly(dueDate) : structure.dueDate;
  const discountAmount = Math.max(Number(discount) || 0, 0);
  const totalFee = structure.totalFee;
  const isPastDue = isInvoicePastDue(targetDueDate);
  const lateFee = isPastDue ? (structure.lateFee || 0) : 0;
  const finalAmount = Math.max(totalFee + lateFee - discountAmount, 0);

  let assignedCount = 0;
  let skippedCount = 0;

  for (const student of students) {
    // Check if invoice already exists
    const existing = await prisma.feeInvoice.findFirst({
      where: {
        studentId: student.id,
        feeType: structure.feeType,
        academicYear: targetAcademicYear,
        ...notDeleted(),
      },
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    const invoiceNumber = await generateInvoiceNumber(school.code || 'SCH001');

    await prisma.feeInvoice.create({
      data: {
        invoiceNumber,
        schoolId: school.code || schoolId || 'SCH001',
        student: { connect: { id: student.id } },
        academicYear: targetAcademicYear,
        ...(structure.id ? { feeStructure: { connect: { id: structure.id } } } : {}),
        feeType: structure.feeType,
        totalFee,
        paidAmount: 0,
        pendingAmount: finalAmount,
        discount: discountAmount,
        lateFee,
        finalAmount,
        dueDate: targetDueDate,
        status: 'PENDING',
        deletedAt: null,
      },
    });

    assignedCount++;
  }

  return {
    message: `Fee assignment completed. Assigned: ${assignedCount} students, Skipped (Already Assigned): ${skippedCount}.`,
    assignedCount,
    skippedCount,
    totalStudents: students.length,
    structureName: structure.feeType,
  };
}

/**
 * ASSIGN FEE INVOICE TO INDIVIDUAL STUDENT
 */
export async function assignFeeToStudent(data, actor) {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw ApiError.forbidden('Only administrators can assign student fees.');
  }

  const student = await prisma.student.findFirst({
    where: { id: data.studentId, ...notDeleted() },
  });

  if (!student) {
    throw ApiError.badRequest('Selected student does not exist.');
  }

  const schoolId = getEffectiveSchoolId(actor, data.schoolId || student.schoolId || 'SCH001');
  const school = await getSchoolInfo(schoolId);

  let totalFee = Number(data.totalFee ?? data.amount);
  if (isNaN(totalFee) || totalFee <= 0) {
    if (data.feeStructureId) {
      const struct = await prisma.feeStructure.findUnique({ where: { id: data.feeStructureId } });
      if (struct) totalFee = struct.totalFee;
    }
  }

  if (isNaN(totalFee) || totalFee <= 0) {
    throw ApiError.badRequest('Total fee must be greater than zero.');
  }

  const dueDate = data.dueDate ? toDateOnly(data.dueDate) : null;
  const isPastDue = isInvoicePastDue(dueDate);
  const discount = Math.max(Number(data.discount ?? data.discountAmount) || 0, 0);
  const lateFee = isPastDue ? Math.max(Number(data.lateFee ?? data.lateFeeAmount) || 0, 0) : 0;
  const finalAmount = Math.max(totalFee + lateFee - discount, 0);
  const invoiceNumber = await generateInvoiceNumber(school.code || 'SCH001');

  const invoice = await prisma.feeInvoice.create({
    data: {
      invoiceNumber,
      schoolId: school.code || schoolId || 'SCH001',
      student: { connect: { id: student.id } },
      academicYear: data.academicYear || '2026-2027',
      ...(data.feeStructureId ? { feeStructure: { connect: { id: data.feeStructureId } } } : {}),
      feeType: data.feeType || 'Tuition Fee',
      totalFee,
      paidAmount: 0,
      pendingAmount: finalAmount,
      discount,
      lateFee,
      finalAmount,
      dueDate,
      status: 'PENDING',
      deletedAt: null,
    },
  });

  return invoice;
}

/**
 * UNIFIED FINANCE DASHBOARD SUMMARY (STUDENT FEES + TEACHER SALARY + CASHFLOW)
 * All numbers calculated from real database records.
 */
export async function getFinanceSummary(query = {}, actor) {
  if (!actor && query && query.role) {
    actor = query;
    query = {};
  }
  if (!actor) {
    throw ApiError.unauthorized('Authentication required.');
  }
  if (actor.role === 'TEACHER' || actor.role === 'STUDENT' || actor.role === 'PARENT') {
    throw ApiError.forbidden('You are not authorized to view the finance summary.');
  }

  const schoolId = getEffectiveSchoolId(actor, query.schoolId);
  const academicYear = query.academicYear || '2026-2027';
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const invoiceWhere = {
    ...notDeleted(),
    ...(schoolId ? { schoolId } : {}),
    ...(academicYear ? { academicYear } : {}),
  };

  const paymentWhere = {
    ...notDeleted(),
    paymentStatus: { not: 'CANCELLED' },
    ...(schoolId ? { schoolId } : {}),
    ...(academicYear ? { academicYear } : {}),
  };

  const payrollWhere = {
    ...notDeleted(),
    salaryYear: currentYear,
    ...(schoolId ? { schoolId } : {}),
  };

  const [invoices, payments, payrolls, students] = await Promise.all([
    prisma.feeInvoice.findMany({ where: invoiceWhere }),
    prisma.payment.findMany({ where: paymentWhere }),
    prisma.payroll.findMany({ where: payrollWhere }),
    prisma.student.findMany({ where: notDeleted(), select: { id: true } }),
  ]);

  // Student Fee Metrics
  const totalExpectedFees = invoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);
  const totalCollectedFees = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPendingFees = invoices.reduce((sum, inv) => sum + (inv.pendingAmount || 0), 0);

  let totalOverdueFees = 0;
  for (const inv of invoices) {
    if (inv.pendingAmount > 0 && inv.dueDate && new Date(inv.dueDate) < now) {
      totalOverdueFees += inv.pendingAmount;
    }
  }

  // Student settlement distribution
  const studentFeeStatusMap = new Map();
  for (const s of students) {
    studentFeeStatusMap.set(s.id, { total: 0, paid: 0, pending: 0 });
  }

  for (const inv of invoices) {
    const s = studentFeeStatusMap.get(inv.studentId);
    if (s) {
      s.total += inv.finalAmount;
      s.paid += inv.paidAmount;
      s.pending += inv.pendingAmount;
    }
  }

  let fullyPaidStudents = 0;
  let partialPaidStudents = 0;
  let unpaidStudents = 0;

  for (const [, stat] of studentFeeStatusMap.entries()) {
    if (stat.total > 0 && stat.pending === 0) {
      fullyPaidStudents++;
    } else if (stat.paid > 0 && stat.pending > 0) {
      partialPaidStudents++;
    } else if (stat.total > 0 && stat.paid === 0) {
      unpaidStudents++;
    }
  }

  // Teacher Salary Metrics
  const totalSalaryPayable = payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
  const totalSalaryPaid = payrolls
    .filter((p) => p.paymentStatus === 'PAID')
    .reduce((sum, p) => sum + (p.netSalary || 0), 0);
  const totalSalaryPending = payrolls
    .filter((p) => p.paymentStatus === 'PENDING')
    .reduce((sum, p) => sum + (p.netSalary || 0), 0);

  const currentMonthPayrolls = payrolls.filter(
    (p) => p.salaryMonth === currentMonth && p.salaryYear === currentYear
  );
  const currentMonthPayrollTotal = currentMonthPayrolls.reduce(
    (sum, p) => sum + (p.netSalary || 0),
    0
  );

  // Financial Cashflow Summary
  const totalIncome = totalCollectedFees;
  const totalSalaryExpense = totalSalaryPaid;
  const netBalance = totalIncome - totalSalaryExpense;

  return {
    academicYear,
    totalIncome,
    totalSalaryExpense,
    netBalance,
    studentFees: {
      totalExpectedFees,
      totalCollected: totalCollectedFees,
      totalPending: totalPendingFees,
      totalOverdue: totalOverdueFees,
      fullyPaidStudents,
      partialPaidStudents,
      unpaidStudents,
      totalInvoicedCount: invoices.length,
    },
    teacherSalary: {
      totalSalaryPayable,
      totalSalaryPaid,
      totalSalaryPending,
      currentMonthPayroll: currentMonthPayrollTotal,
      currentMonth,
      currentYear,
      payrollRecordCount: payrolls.length,
    },
    financeSummary: {
      totalIncome,
      totalSalaryExpense,
      netBalance,
    },
  };
}

