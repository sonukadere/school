import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  getPagination,
  getPaginationMeta,
  notDeleted,
  searchFilter,
  toDateOnly,
} from '../utils/helpers.js';
import { assertStudentVisible, getVisibleStudentIds } from '../utils/access.js';

const SORTABLE_FIELDS = new Set(['tcNumber', 'issueDate', 'leavingDate', 'status', 'createdAt']);

const DEFAULT_INCLUDE = {
  student: {
    select: {
      id: true,
      studentId: true,
      firstName: true,
      lastName: true,
      gender: true,
      dob: true,
      fatherName: true,
      motherName: true,
      phone: true,
      email: true,
      address: true,
      rollNumber: true,
      admissionDate: true,
      class: { select: { id: true, name: true, section: true } },
    },
  },
  generatedBy: { select: { id: true, name: true, email: true } },
  approvedBy: { select: { id: true, name: true, email: true } },
};

/**
 * Generate sequential unique TC number e.g. TC/DDA/2026-27/0001
 */
export async function generateTcNumber() {
  const currentYear = new Date().getFullYear();
  const nextYearShort = String(currentYear + 1).slice(-2);
  const yearCode = `${currentYear}-${nextYearShort}`;
  const prefix = `TC/DDA/${yearCode}/`;

  const latest = await prisma.transferCertificate.findFirst({
    where: { tcNumber: { startsWith: prefix } },
    orderBy: { tcNumber: 'desc' },
    select: { tcNumber: true },
  });

  let nextNum = 1;
  if (latest?.tcNumber) {
    const numPart = parseInt(latest.tcNumber.replace(prefix, ''), 10);
    if (!isNaN(numPart)) {
      nextNum = numPart + 1;
    }
  }

  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

export async function listTransferCertificates(query = {}, actor = null) {
  const { page, limit, skip } = getPagination(query);
  const { search, status, studentId, classId, sortBy = 'createdAt', sortOrder = 'desc' } = query;

  const visibleStudentIds = actor ? await getVisibleStudentIds(actor) : null;
  if (visibleStudentIds !== null && visibleStudentIds.length === 0 && actor.role !== 'ADMIN') {
    return { data: [], pagination: getPaginationMeta(page, limit, 0) };
  }

  const where = {
    ...notDeleted(),
    ...(status ? { status } : {}),
    ...(studentId ? { studentId } : {}),
    ...(visibleStudentIds ? { studentId: { in: visibleStudentIds } } : {}),
    ...(classId ? { student: { classId } } : {}),
    ...(actor?.role === 'STUDENT' ? { status: { in: ['APPROVED', 'GENERATED'] } } : {}),
    ...searchFilter(['tcNumber', 'student.firstName', 'student.lastName', 'student.studentId'], search),
  };

  const [data, total] = await Promise.all([
    prisma.transferCertificate.findMany({
      where,
      include: DEFAULT_INCLUDE,
      orderBy: SORTABLE_FIELDS.has(sortBy) ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.transferCertificate.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

export async function getTransferCertificate(id, actor = null) {
  const tc = await prisma.transferCertificate.findFirst({
    where: {
      OR: [{ id }, { tcNumber: id }],
      ...notDeleted(),
    },
    include: DEFAULT_INCLUDE,
  });

  if (!tc) throw ApiError.notFound('Transfer certificate not found.');

  if (actor) {
    await assertStudentVisible(actor, tc.studentId);
    if (actor.role === 'STUDENT' && tc.status !== 'APPROVED' && tc.status !== 'GENERATED') {
      throw ApiError.forbidden('Your Transfer Certificate has not been approved yet.');
    }
  }

  const setting = await prisma.setting.findFirst({ where: notDeleted() });

  return {
    ...tc,
    school: {
      name: setting?.schoolName || 'Daily Day Academy',
      logo: setting?.schoolLogo || '/logo.svg',
      address: setting?.address || '123 Education Street, New Delhi - 110001',
      phone: setting?.phone || '+91 98765 43210',
      email: setting?.email || 'info@dailydayacademy.edu',
      website: setting?.website || 'www.dailydayacademy.edu',
      academicYear: setting?.academicYear || '2026-2027',
      affiliationNumber: setting?.affiliationNumber || 'CBSE-AFF/2026/89432',
      principalName: setting?.principalName || 'Dr. Rajeshwar Sharma',
    },
  };
}

export async function getStudentTransferCertificate(studentId, actor = null) {
  if (actor) {
    await assertStudentVisible(actor, studentId);
  }

  const tc = await prisma.transferCertificate.findFirst({
    where: {
      studentId,
      ...notDeleted(),
      ...(actor?.role === 'STUDENT' ? { status: { in: ['APPROVED', 'GENERATED'] } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: DEFAULT_INCLUDE,
  });

  if (!tc) return null;

  const setting = await prisma.setting.findFirst({ where: notDeleted() });

  return {
    ...tc,
    school: {
      name: setting?.schoolName || 'Daily Day Academy',
      logo: setting?.schoolLogo || '/logo.svg',
      address: setting?.address || '123 Education Street, New Delhi - 110001',
      phone: setting?.phone || '+91 98765 43210',
      email: setting?.email || 'info@dailydayacademy.edu',
      website: setting?.website || 'www.dailydayacademy.edu',
      academicYear: setting?.academicYear || '2026-2027',
      affiliationNumber: setting?.affiliationNumber || 'CBSE-AFF/2026/89432',
      principalName: setting?.principalName || 'Dr. Rajeshwar Sharma',
    },
  };
}

export async function createTransferCertificate(data, actor = null) {
  const student = await prisma.student.findFirst({
    where: { id: data.studentId, ...notDeleted() },
    include: { class: true },
  });

  if (!student) throw ApiError.badRequest('The selected student does not exist.');

  const tcNumber = data.tcNumber || (await generateTcNumber());
  const leavingDate = data.leavingDate ? toDateOnly(data.leavingDate) : toDateOnly(new Date());
  const issueDate = data.issueDate ? toDateOnly(data.issueDate) : toDateOnly(new Date());
  const lastClass = data.lastClass || (student.class ? `${student.class.name} - Section ${student.class.section}` : 'Class 10');

  const tc = await prisma.transferCertificate.create({
    data: {
      tcNumber,
      studentId: student.id,
      issueDate,
      leavingDate,
      lastClass,
      academicYear: data.academicYear || '2026-2027',
      reason: data.reason || 'Parent Transfer / Higher Studies',
      conduct: data.conduct || 'Good',
      resultStatus: data.resultStatus || 'PASS',
      remarks: data.remarks || 'Promoted to next class with good conduct.',
      status: data.status || 'GENERATED',
      generatedById: actor?.id ?? null,
      approvedById: data.status === 'APPROVED' || data.status === 'GENERATED' ? (actor?.id ?? null) : null,
    },
    include: DEFAULT_INCLUDE,
  });

  return getTransferCertificate(tc.id, actor);
}

export async function updateTransferCertificate(id, data, actor = null) {
  const existing = await prisma.transferCertificate.findFirst({
    where: { id, ...notDeleted() },
  });

  if (!existing) throw ApiError.notFound('Transfer certificate not found.');

  const updateData = { ...data };
  if (data.leavingDate) updateData.leavingDate = toDateOnly(data.leavingDate);
  if (data.issueDate) updateData.issueDate = toDateOnly(data.issueDate);

  if (data.status === 'APPROVED' && existing.status !== 'APPROVED') {
    updateData.approvedById = actor?.id ?? null;
  }

  const updated = await prisma.transferCertificate.update({
    where: { id },
    data: updateData,
    include: DEFAULT_INCLUDE,
  });

  return getTransferCertificate(updated.id, actor);
}

export async function deleteTransferCertificate(id, actor = null) {
  const existing = await prisma.transferCertificate.findFirst({
    where: { id, ...notDeleted() },
  });

  if (!existing) throw ApiError.notFound('Transfer certificate not found.');

  return prisma.transferCertificate.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'CANCELLED' },
  });
}
