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
export async function getSchoolInfo() {
  const setting = await prisma.setting.findFirst();
  return {
    id: 'school-main',
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
 * UNIFIED FEE CALCULATION HELPER
 * Source of truth: The student's actual assigned fee invoices & payments.
 * totalAssignedFee = actual student's assigned fee
 * totalPaid = sum of valid payments
 * pendingAmount = max(totalAssignedFee - totalPaid, 0)
 * maxPayableAmount = pendingAmount
 */
export function calculateStudentFeeMetrics(invoices = [], payments = []) {
  const totalAssignedFee = (invoices || []).reduce(
    (sum, inv) => sum + Number(inv.finalAmount || inv.totalFee || 0),
    0
  );

  const validPayments = (payments || []).filter((p) => p.paymentStatus !== 'CANCELLED');
  const paymentsSum = validPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // Invoices paidAmount sum fallback for pre-seeded records where payments table rows may not exist
  const invoicesPaidSum = (invoices || []).reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
  const totalPaid = paymentsSum > 0 ? paymentsSum : invoicesPaidSum;

  const pendingAmount = Math.max(totalAssignedFee - totalPaid, 0);

  let paymentStatus = 'PENDING';
  if (pendingAmount === 0 && totalAssignedFee > 0) {
    paymentStatus = 'PAID';
  } else if (totalPaid > 0 && pendingAmount > 0) {
    paymentStatus = 'PARTIAL';
  } else {
    paymentStatus = 'PENDING';
  }

  return {
    totalAssignedFee,
    totalFee: totalAssignedFee,
    totalPaid,
    paidAmount: totalPaid,
    pendingAmount,
    maxPayableAmount: pendingAmount,
    paymentStatus,
    status: paymentStatus === 'PAID' ? 'Paid' : paymentStatus === 'PARTIAL' ? 'Partial' : 'Pending',
  };
}

/**
 * RECORD PAYMENT
 * Uses student's ACTUAL ASSIGNED FEE as the source of truth.
 * Validates: payAmount <= pendingAmount, payAmount > 0, pendingAmount > 0.
 * Updates invoices, records transaction, and generates official receipt.
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

  // 1. Fetch student's ACTUAL assigned fee invoices (source of truth)
  const studentInvoices = await prisma.feeInvoice.findMany({
    where: { studentId: student.id, ...notDeleted() },
    include: { feeStructure: true },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
  });

  if (studentInvoices.length === 0) {
    throw ApiError.badRequest('No fee structure or invoices have been assigned to this student. Please assign fees first.');
  }

  // Resolve late fees/discounts on all assigned invoices
  const resolvedInvoices = studentInvoices.map((inv) => resolveInvoiceAmounts(inv, inv.feeStructure));

  // 2. Fetch student's existing valid payments
  const studentPayments = await prisma.payment.findMany({
    where: { studentId: student.id, paymentStatus: { not: 'CANCELLED' }, ...notDeleted() },
  });

  // 3. Compute student's overall fee metrics
  const metrics = calculateStudentFeeMetrics(resolvedInvoices, studentPayments);

  // 4. MANDATORY BACKEND VALIDATION:
  if (metrics.pendingAmount <= 0) {
    throw ApiError.badRequest('All fees for this student have already been fully paid. Remaining balance is ₹0.');
  }

  if (payAmount > metrics.pendingAmount) {
    throw ApiError.badRequest(
      `Payment amount (₹${payAmount.toLocaleString('en-IN')}) exceeds the remaining pending amount of ₹${metrics.pendingAmount.toLocaleString('en-IN')}. Maximum payable is ₹${metrics.pendingAmount.toLocaleString('en-IN')}.`
    );
  }

  // DUPLICATE PAYMENT GUARD: prevent duplicate charge if identical payment was recorded in the last 10 seconds
  const recentDuplicate = await prisma.payment.findFirst({
    where: {
      studentId: student.id,
      amount: payAmount,
      paymentDate: { gte: new Date(Date.now() - 10 * 1000) },
      ...notDeleted(),
    },
  });
  if (recentDuplicate) {
    throw ApiError.badRequest('A payment with the same amount for this student was just recorded. Please wait a moment before submitting again.');
  }

  // 5. Target specific invoice if invoiceId provided, else apply across pending invoices
  let primaryInvoice = null;
  const targetInvoiceId = data.invoiceId || data.feeInvoiceId;

  if (targetInvoiceId) {
    primaryInvoice = resolvedInvoices.find((i) => i.id === targetInvoiceId);
    if (!primaryInvoice) {
      throw ApiError.badRequest('The specified fee invoice was not found for this student.');
    }
    if (primaryInvoice.pendingAmount <= 0) {
      throw ApiError.badRequest(`Invoice ${primaryInvoice.invoiceNumber} has already been fully paid.`);
    }
    if (payAmount > primaryInvoice.pendingAmount) {
      throw ApiError.badRequest(
        `Payment amount (₹${payAmount.toLocaleString('en-IN')}) exceeds the remaining pending balance of ₹${primaryInvoice.pendingAmount.toLocaleString('en-IN')} for invoice ${primaryInvoice.invoiceNumber}.`
      );
    }

    const updatedPaid = primaryInvoice.paidAmount + payAmount;
    const updatedPending = Math.max(primaryInvoice.finalAmount - updatedPaid, 0);
    const updatedStatus = updatedPending === 0 ? 'PAID' : 'PARTIAL';

    await prisma.feeInvoice.update({
      where: { id: primaryInvoice.id },
      data: {
        paidAmount: updatedPaid,
        pendingAmount: updatedPending,
        status: updatedStatus,
      },
    });
  } else {
    // Distribute payment across pending invoices in order of due date
    const pendingInvoices = resolvedInvoices.filter((i) => (i.pendingAmount || 0) > 0);
    primaryInvoice = pendingInvoices[0] || resolvedInvoices[0];

    let remainingToDistribute = payAmount;
    for (const inv of pendingInvoices) {
      if (remainingToDistribute <= 0) break;
      const applyAmount = Math.min(remainingToDistribute, inv.pendingAmount);
      const updatedPaid = inv.paidAmount + applyAmount;
      const updatedPending = Math.max(inv.finalAmount - updatedPaid, 0);
      const updatedStatus = updatedPending === 0 ? 'PAID' : 'PARTIAL';

      await prisma.feeInvoice.update({
        where: { id: inv.id },
        data: {
          paidAmount: updatedPaid,
          pendingAmount: updatedPending,
          status: updatedStatus,
        },
      });

      remainingToDistribute -= applyAmount;
    }
  }

  const previousDue = metrics.pendingAmount;
  const newRemainingDue = Math.max(metrics.pendingAmount - payAmount, 0);
  const paymentStatus = newRemainingDue === 0 ? 'PAID' : 'PARTIAL';

  const receiptNumber = await generatePaymentReceiptNumber(school.code || 'SCH001');
  const paymentDate = data.paymentDate ? toDateOnly(data.paymentDate) : new Date();

  // Create Payment record
  const payment = await prisma.payment.create({
    data: {
      receiptNumber,
      student: { connect: { id: student.id } },
      academicYear: data.academicYear || primaryInvoice.academicYear || '2026-2027',
      ...(primaryInvoice?.id ? { invoice: { connect: { id: primaryInvoice.id } } } : {}),
      feeType: data.feeType || primaryInvoice.feeType || 'School Fee',
      amount: payAmount,
      previousDue,
      remainingDue: newRemainingDue,
      paymentDate,
      paymentMethod: data.paymentMethod || 'CASH',
      paymentStatus,
      transactionId: data.transactionId || null,
      referenceNumber: data.referenceNumber || null,
      notes: data.notes || null,
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

  // Sync / update legacy Fee record if one exists
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

  // Dispatch fee payment email
  try {
    const { sendFeePaymentEmail } = await import('./email.service.js');
    const { generateFeeReceiptPDF } = await import('./pdf.service.js');
    const pdfBuffer = await generateFeeReceiptPDF({ student, receipt, payment, school });

    await sendFeePaymentEmail({
      student,
      parent: student.parent,
      receipt,
      payment,
      school,
      pdfBuffer
    });
  } catch (err) {
    console.warn('[Payment] Fee payment email dispatch skipped:', err.message);
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
      AND: [
        notDeleted(),
        { OR: [{ id }, { receiptNumber: id }] },
      ],
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
    const school = await getSchoolInfo();
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
    BANK_TRANSFER: 0,
    CHEQUE: 0,
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
      bankTransferCollection: methodMap.BANK_TRANSFER || 0,
      chequeCollection: methodMap.CHEQUE || 0,
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
      AND: [
        notDeleted(),
        {
          OR: [
            { id: studentId },
            { studentId: studentId },
            { userId: studentId },
          ],
        },
      ],
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
  if (actor.role === 'STUDENT') {
    const isSelf =
      // matched by student record ID
      (actor.student?.id && actor.student.id === student.id) ||
      // matched by the user account ID on the student record
      (student.userId && actor.id === student.userId);
    if (!isSelf) {
      throw ApiError.forbidden('You can only view your own fee records.');
    }
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

/**
 * STUDENT FEE RECORDS
 * Consolidated student-wise fee tracking matching UI specs
 */
export async function listStudentFeeRecords(query = {}, actor) {
  const { page = 1, limit = 10, search, classId, section, status } = query;
  const numPage = Math.max(parseInt(page, 10) || 1, 1);
  const numLimit = Math.max(parseInt(limit, 10) || 10, 1);

  const schoolId = getEffectiveSchoolId(actor, query.schoolId);

  const studentWhere = {
    ...notDeleted(),
    ...(schoolId ? { schoolId } : {}),
    ...(classId ? { classId } : {}),
  };

  if (section) {
    studentWhere.class = { section };
  }

  if (search && search.trim()) {
    const q = search.trim();
    const parts = q.split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      studentWhere.OR = [
        {
          AND: [
            { firstName: { contains: parts[0], mode: 'insensitive' } },
            { lastName: { contains: parts.slice(1).join(' '), mode: 'insensitive' } },
          ],
        },
        { studentId: { contains: q, mode: 'insensitive' } },
      ];
    } else {
      studentWhere.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { studentId: { contains: q, mode: 'insensitive' } },
      ];
    }
  }

  const [students, invoices, payments] = await Promise.all([
    prisma.student.findMany({
      where: studentWhere,
      include: {
        class: { select: { id: true, name: true, section: true } },
        feeInvoices: {
          where: notDeleted(),
          select: {
            id: true,
            invoiceNumber: true,
            feeType: true,
            totalFee: true,
            discount: true,
            lateFee: true,
            finalAmount: true,
            paidAmount: true,
            pendingAmount: true,
            status: true,
            dueDate: true,
            createdAt: true,
          },
        },
        payments: {
          where: { ...notDeleted(), paymentStatus: { not: 'CANCELLED' } },
          select: {
            id: true,
            amount: true,
            receiptNumber: true,
            transactionId: true,
            paymentMethod: true,
            paymentDate: true,
          },
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
    prisma.feeInvoice.findMany({
      where: notDeleted(),
      select: { finalAmount: true, totalFee: true, paidAmount: true, pendingAmount: true },
    }),
    prisma.payment.findMany({
      where: { ...notDeleted(), paymentStatus: { not: 'CANCELLED' } },
      select: { amount: true },
    }),
  ]);

  const schoolTotalFees = invoices.reduce((sum, inv) => sum + (inv.finalAmount || inv.totalFee || 0), 0);
  const schoolTotalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const schoolTotalPending = invoices.reduce((sum, inv) => sum + (inv.pendingAmount || 0), 0);

  let mappedRecords = students.map((s) => {
    const totalFee = s.feeInvoices.reduce((sum, inv) => sum + (inv.finalAmount || inv.totalFee || 0), 0);
    const paid = s.payments.reduce((sum, p) => sum + (p.amount || 0), 0) || s.feeInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const pending = Math.max(totalFee - paid, 0);

    let feeStatus = 'Pending';
    if (pending === 0 && totalFee > 0) {
      feeStatus = 'Paid';
    } else if (paid > 0 && pending > 0) {
      feeStatus = 'Partial';
    } else {
      feeStatus = 'Pending';
    }

    return {
      id: s.id,
      studentId: s.id,
      admissionNo: s.studentId || `ADM-${s.rollNumber || '000'}`,
      name: `${s.firstName} ${s.lastName || ''}`.trim(),
      firstName: s.firstName,
      lastName: s.lastName,
      avatar: s.avatar || null,
      class: `${s.class?.name || ''} ${s.class?.section || ''}`.trim(),
      className: s.class?.name || 'Unassigned',
      section: s.class?.section || 'A',
      classId: s.class?.id || '',
      totalFee,
      paid,
      pending,
      status: feeStatus,
      lastReceiptNumber: s.payments[0]?.receiptNumber || s.payments[0]?.transactionId || null,
      invoices: s.feeInvoices,
      payments: s.payments,
    };
  });

  if (status && status !== 'All' && status !== 'ALL') {
    mappedRecords = mappedRecords.filter((rec) => rec.status.toLowerCase() === status.toLowerCase());
  }

  const total = mappedRecords.length;
  const totalPages = Math.ceil(total / numLimit) || 1;
  const skip = (numPage - 1) * numLimit;
  const paginatedData = mappedRecords.slice(skip, skip + numLimit);

  return {
    metrics: {
      totalFees: schoolTotalFees,
      totalCollected: schoolTotalCollected,
      totalPending: schoolTotalPending,
    },
    data: paginatedData,
    pagination: {
      page: numPage,
      limit: numLimit,
      total,
      totalPages,
    },
  };
}

