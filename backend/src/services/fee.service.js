import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  addDays,
  getPagination,
  getPaginationMeta,
  notDeleted,
  toDateOnly,
} from '../utils/helpers.js';
import { getVisibleStudentIds } from '../utils/access.js';

const SORTABLE_FIELDS = new Set(['totalFee', 'paidAmount', 'dueAmount', 'paymentDate', 'createdAt', 'updatedAt']);

const DEFAULT_INCLUDE = {
  student: {
    select: {
      id: true,
      studentId: true,
      firstName: true,
      lastName: true,
      class: { select: { id: true, name: true, section: true } },
    },
  },
};

/**
 * Derive due amount and payment status from the fee amounts.
 */
const deriveAmounts = (data) => {
  const totalFee = Number(data.totalFee ?? 0);
  const paidAmount = Number(data.paidAmount ?? 0);
  const dueAmount = data.dueAmount !== undefined ? Number(data.dueAmount) : Math.max(totalFee - paidAmount, 0);
  let paymentStatus = data.paymentStatus;
  if (!paymentStatus) {
    paymentStatus = paidAmount >= totalFee && totalFee > 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING';
  }
  return { dueAmount, paymentStatus };
};

const buildPaymentRange = (from, to) => {
  if (!from && !to) return {};
  const gte = toDateOnly(from);
  const lt = to ? addDays(toDateOnly(to), 1) : undefined;
  return { paymentDate: { ...(gte ? { gte } : {}), ...(lt ? { lt } : {}) } };
};

export async function listFees(query = {}, actor = null) {
  const { page, limit, skip } = getPagination(query);
  const { studentId, paymentStatus, paymentMethod, from, to, sortBy = 'createdAt', sortOrder = 'desc' } = query;

  const visibleIds = actor ? await getVisibleStudentIds(actor) : null;
  if (visibleIds !== null && visibleIds.length === 0 && actor.role !== 'ADMIN') {
    return { data: [], pagination: getPaginationMeta(page, limit, 0) };
  }

  const where = {
    ...notDeleted(),
    ...(studentId ? { studentId } : {}),
    ...(visibleIds ? { studentId: { in: visibleIds } } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(paymentMethod ? { paymentMethod } : {}),
    ...buildPaymentRange(from, to),
  };

  const [data, total] = await Promise.all([
    prisma.fee.findMany({
      where,
      include: DEFAULT_INCLUDE,
      orderBy: SORTABLE_FIELDS.has(sortBy) ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.fee.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

export async function getFee(id) {
  const fee = await prisma.fee.findFirst({ where: { id, ...notDeleted() }, include: DEFAULT_INCLUDE });
  if (!fee) {
    throw ApiError.notFound('Fee record not found.');
  }
  return fee;
}

export async function createFee(data) {
  const student = await prisma.student.findFirst({ where: { id: data.studentId, ...notDeleted() } });
  if (!student) {
    throw ApiError.badRequest('The selected student does not exist.');
  }

  const { dueAmount, paymentStatus } = deriveAmounts(data);
  return prisma.fee.create({
    data: {
      studentId: data.studentId,
      totalFee: data.totalFee,
      paidAmount: data.paidAmount ?? 0,
      dueAmount,
      paymentDate: data.paymentDate ? toDateOnly(data.paymentDate) : null,
      paymentMethod: data.paymentMethod,
      paymentStatus,
    },
    include: DEFAULT_INCLUDE,
  });
}

export async function updateFee(id, data) {
  const fee = await prisma.fee.findFirst({ where: { id, ...notDeleted() } });
  if (!fee) {
    throw ApiError.notFound('Fee record not found.');
  }

  const merged = {
    totalFee: data.totalFee ?? fee.totalFee,
    paidAmount: data.paidAmount ?? fee.paidAmount,
    dueAmount: data.dueAmount,
    paymentStatus: data.paymentStatus,
  };
  const { dueAmount, paymentStatus } = deriveAmounts(merged);

  return prisma.fee.update({
    where: { id },
    data: {
      ...(data.totalFee !== undefined && { totalFee: data.totalFee }),
      ...(data.paidAmount !== undefined && { paidAmount: data.paidAmount }),
      ...(data.paymentDate !== undefined && {
        paymentDate: data.paymentDate ? toDateOnly(data.paymentDate) : null,
      }),
      ...(data.paymentMethod !== undefined && { paymentMethod: data.paymentMethod }),
      ...(data.paymentStatus !== undefined && { paymentStatus: data.paymentStatus }),
      dueAmount,
      paymentStatus,
    },
    include: DEFAULT_INCLUDE,
  });
}

export async function deleteFee(id) {
  const fee = await prisma.fee.findFirst({ where: { id, ...notDeleted() } });
  if (!fee) {
    throw ApiError.notFound('Fee record not found.');
  }
  return prisma.fee.update({ where: { id }, data: { deletedAt: new Date() } });
}
