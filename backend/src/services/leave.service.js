import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { getPagination, getPaginationMeta, notDeleted, toDateOnly } from '../utils/helpers.js';

export async function listLeaveRequests(query = {}, actor = null) {
  const { page, limit, skip } = getPagination(query);
  const { status, role, userId, sortBy = 'createdAt', sortOrder = 'desc' } = query;

  const roleUpper = (actor?.role || '').toUpperCase();
  const isManager = ['SUPER_ADMIN', 'ADMIN'].includes(roleUpper);

  // Non-managers can only see their own leave requests
  let filterUserId = userId;
  if (!isManager && actor?.id) {
    filterUserId = actor.id;
  }

  const where = {
    AND: [
      notDeleted(),
      ...(filterUserId ? [{ userId: filterUserId }] : []),
      ...(status ? [{ status }] : []),
      ...(role ? [{ role }] : []),
    ],
  };

  const [items, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        reviewedBy: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  return {
    data: items,
    pagination: getPaginationMeta(page, limit, total),
  };
}

export async function getLeaveRequestById(id) {
  const item = await prisma.leaveRequest.findFirst({
    where: { id, ...notDeleted() },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      reviewedBy: { select: { id: true, name: true, role: true } },
    },
  });

  if (!item) {
    throw ApiError.notFound('Leave request not found.');
  }

  return item;
}

export async function createLeaveRequest(data, actor) {
  if (!actor?.id) {
    throw ApiError.unauthorized('Authentication required to submit leave request.');
  }

  const startDate = toDateOnly(data.startDate);
  const endDate = toDateOnly(data.endDate);

  if (new Date(startDate) > new Date(endDate)) {
    throw ApiError.badRequest('End date cannot be earlier than start date.');
  }

  const leave = await prisma.leaveRequest.create({
    data: {
      userId: actor.id,
      role: actor.rawRole || actor.role || 'TEACHER',
      startDate,
      endDate,
      reason: data.reason.trim(),
      attachment: data.attachment?.trim() || null,
      status: 'PENDING',
    },
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
  });

  return leave;
}

export async function reviewLeaveRequest(id, data, actor) {
  const item = await getLeaveRequestById(id);

  if (item.status !== 'PENDING') {
    throw ApiError.badRequest(`This leave request has already been ${item.status.toLowerCase()}.`);
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: data.status,
      reviewedById: actor?.id || null,
      reviewRemarks: data.reviewRemarks?.trim() || null,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  return updated;
}
