import { prisma } from '../config/database.js';

/**
 * Atomically generate the next sequential ID in format PREFIX-YEAR-XXX (3 digits padded).
 * Example: STU-2026-001, TCH-2026-001.
 *
 * Concurrency-safe: uses MongoDB atomic upsert / increment.
 * Ensures sequence starts above any existing IDs in the collection.
 */
export async function generateNextSequenceId(tx, type, prefixText, padLength = 3) {
  const client = tx || prisma;
  const year = new Date().getFullYear();
  const counterKey = `${type}_${year}`;
  const idPrefix = `${prefixText}-${year}-`;

  // Verify whether sequence counter exists; if not, initialize above any pre-existing records
  let existingSeq = await client.sequence.findUnique({
    where: { id: counterKey },
  });

  if (!existingSeq) {
    let maxExistingNum = 0;
    if (type === 'student') {
      const latest = await client.student.findFirst({
        where: { studentId: { startsWith: idPrefix } },
        orderBy: { studentId: 'desc' },
        select: { studentId: true },
      });
      if (latest && latest.studentId) {
        const numPart = parseInt(latest.studentId.replace(idPrefix, ''), 10);
        if (!isNaN(numPart)) maxExistingNum = numPart;
      }
    } else if (type === 'teacher') {
      const latest = await client.teacher.findFirst({
        where: { teacherId: { startsWith: idPrefix } },
        orderBy: { teacherId: 'desc' },
        select: { teacherId: true },
      });
      if (latest && latest.teacherId) {
        const numPart = parseInt(latest.teacherId.replace(idPrefix, ''), 10);
        if (!isNaN(numPart)) maxExistingNum = numPart;
      }
    }

    try {
      existingSeq = await client.sequence.create({
        data: {
          id: counterKey,
          seq: maxExistingNum,
        },
      });
    } catch {
      // In case of race condition on first creation, re-fetch
      existingSeq = await client.sequence.findUnique({
        where: { id: counterKey },
      });
    }
  }

  // Atomically increment the sequence counter
  const updated = await client.sequence.update({
    where: { id: counterKey },
    data: {
      seq: { increment: 1 },
    },
  });

  const numberPadded = String(updated.seq).padStart(padLength, '0');
  return `${idPrefix}${numberPadded}`;
}

/**
 * Generate temporary password (e.g. Stu@2026#749 or Tch@2026#832)
 */
export function generateTemporaryPassword(role = 'Student') {
  const prefix = role.toLowerCase().startsWith('t') ? 'Tch' : 'Stu';
  const year = new Date().getFullYear();
  const rand = Math.floor(100 + Math.random() * 900);
  return `${prefix}@${year}#${rand}`;
}
