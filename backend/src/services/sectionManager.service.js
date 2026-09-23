import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { notDeleted } from '../utils/helpers.js';

export const MAX_SECTION_CAPACITY = 50;

/**
 * Returns the alphabetical section letter for an index:
 * 0 -> 'A', 1 -> 'B', 2 -> 'C', 3 -> 'D', ...
 */
export function getSectionLetter(index) {
  return String.fromCharCode(65 + index);
}

/**
 * Calculates the required number of sections for a given student count:
 * 1–50 students   -> 1 section ('A')
 * 51–100 students  -> 2 sections ('A', 'B')
 * 101–150 students -> 3 sections ('A', 'B', 'C')
 */
export function calculateRequiredSections(studentCount) {
  if (studentCount <= 0) return 1;
  return Math.max(1, Math.ceil(studentCount / MAX_SECTION_CAPACITY));
}

/**
 * Ensures that the required sections (A, B, C...) exist for a given class name.
 * If student count <= 50, ensures only Section A is active and surplus empty sections are retired.
 * Returns an array of Class records sorted by section ('A', 'B', 'C'...).
 */
export async function ensureSectionsForGrade(txOrPrisma, className, academicSession = '2026-2027', requiredSectionCount = 1) {
  const db = txOrPrisma;

  // 1. Fetch all existing non-deleted sections for this class name
  let existingSections = await db.class.findMany({
    where: {
      name: className,
      academicSession,
      ...notDeleted(),
    },
    orderBy: { section: 'asc' },
  });

  // 2. Ensure Section 'A' exists as the default primary section
  let sectionA = existingSections.find((s) => s.section.toUpperCase() === 'A');
  if (!sectionA) {
    sectionA = await db.class.create({
      data: {
        name: className,
        section: 'A',
        capacity: MAX_SECTION_CAPACITY,
        academicSession,
        roomNumber: '101',
        deletedAt: null,
      },
    });
    existingSections.push(sectionA);
  }

  // 3. Ensure sections up to requiredSectionCount exist (e.g. 'B', 'C'...)
  for (let i = 1; i < requiredSectionCount; i++) {
    const letter = getSectionLetter(i);
    let sec = existingSections.find((s) => s.section.toUpperCase() === letter);
    if (!sec) {
      // Create new auto-section, inheriting room number pattern and capacity
      const baseRoom = parseInt(sectionA.roomNumber?.replace(/\D/g, '') || '101', 10);
      const newRoom = `Room ${baseRoom + i}`;

      sec = await db.class.create({
        data: {
          name: className,
          section: letter,
          capacity: MAX_SECTION_CAPACITY,
          academicSession,
          roomNumber: newRoom,
          deletedAt: null,
        },
      });
      existingSections.push(sec);

      // Clone subjects from Section A if available so new section has a complete academic curriculum
      const sectionASubjects = await db.subject.findMany({
        where: { classId: sectionA.id, ...notDeleted() },
      });
      for (const sub of sectionASubjects) {
        await db.subject.create({
          data: {
            name: sub.name,
            code: `${sub.code || sub.name.slice(0, 3).toUpperCase()}-${letter}`,
            classId: sec.id,
            teacherId: sub.teacherId,
          },
        });
      }
    }
  }

  // Re-fetch sorted sections
  return db.class.findMany({
    where: {
      name: className,
      academicSession,
      ...notDeleted(),
    },
    orderBy: { section: 'asc' },
  });
}

/**
 * Resolves the appropriate target section for a new student admission.
 * If Section A has < 50 students, assigns to Section A.
 * If Section A reaches 50, automatically ensures Section B exists and assigns to Section B.
 * If Section B reaches 50, automatically ensures Section C exists, etc.
 */
export async function resolveTargetSectionForAdmission(txOrPrisma, classIdOrName, academicSession = '2026-2027') {
  const db = txOrPrisma;

  let targetClassName = classIdOrName;
  // If an ID was provided, fetch the class name
  if (classIdOrName.length > 15) {
    const cls = await db.class.findFirst({
      where: { id: classIdOrName, ...notDeleted() },
    });
    if (cls) {
      targetClassName = cls.name;
    }
  }

  // Fetch all active students in this grade level across all sections
  const existingStudents = await db.student.findMany({
    where: {
      class: {
        name: targetClassName,
        academicSession,
        ...notDeleted(),
      },
      ...notDeleted(),
    },
    select: { id: true, classId: true },
  });

  const totalCount = existingStudents.length;
  // +1 for the student being admitted
  const projectedCount = totalCount + 1;
  const requiredSectionCount = calculateRequiredSections(projectedCount);

  // Ensure necessary sections exist
  const sections = await ensureSectionsForGrade(db, targetClassName, academicSession, requiredSectionCount);

  // Find the first section that has fewer than MAX_SECTION_CAPACITY students
  for (const sec of sections) {
    const countInSec = existingStudents.filter((s) => s.classId === sec.id).length;
    if (countInSec < MAX_SECTION_CAPACITY) {
      return sec;
    }
  }

  // Fallback to the latest section
  return sections[sections.length - 1];
}

/**
 * Rebalances a class grade according to the 50 students per section rule:
 * - 1–50 students  -> Section A only (all students moved to A; Section B/C removed if empty)
 * - 51–100 students -> Sections A + B (50 in A, remainder in B)
 * - 101–150 students -> Sections A + B + C (50 in A, 50 in B, remainder in C)
 */
export async function rebalanceGradeSections(txOrPrisma, className, academicSession = '2026-2027') {
  const db = txOrPrisma;

  // 1. Fetch all active non-deleted students in this grade across all sections
  const students = await db.student.findMany({
    where: {
      class: {
        name: className,
        academicSession,
        ...notDeleted(),
      },
      ...notDeleted(),
    },
    orderBy: [{ rollNumber: 'asc' }, { studentId: 'asc' }, { createdAt: 'asc' }],
  });

  const totalStudents = students.length;
  const requiredSectionsCount = calculateRequiredSections(totalStudents);

  // 2. Ensure required sections exist
  const targetSections = await ensureSectionsForGrade(db, className, academicSession, requiredSectionsCount);

  // 3. Distribute students into sections (max 50 per section)
  let studentIdx = 0;
  for (let sIdx = 0; sIdx < requiredSectionsCount; sIdx++) {
    const sec = targetSections[sIdx];
    const sectionStudents = students.slice(sIdx * MAX_SECTION_CAPACITY, (sIdx + 1) * MAX_SECTION_CAPACITY);

    for (let r = 0; r < sectionStudents.length; r++) {
      const st = sectionStudents[r];
      const rollNumber = r + 1;

      // Update student if classId or rollNumber changed
      if (st.classId !== sec.id || st.rollNumber !== rollNumber) {
        await db.student.update({
          where: { id: st.id },
          data: {
            classId: sec.id,
            rollNumber,
          },
        });
      }
    }
  }

  // 4. If total students <= 50, ensure extra sections (B, C...) beyond required are cleaned up if empty
  const allSections = await db.class.findMany({
    where: {
      name: className,
      academicSession,
      ...notDeleted(),
    },
    include: {
      _count: { select: { students: { where: notDeleted() } } },
    },
    orderBy: { section: 'asc' },
  });

  for (const sec of allSections) {
    const sectionIndex = sec.section.toUpperCase().charCodeAt(0) - 65;
    if (sectionIndex >= requiredSectionsCount && sec._count.students === 0) {
      // Soft-delete empty surplus section
      await db.class.update({
        where: { id: sec.id },
        data: { deletedAt: new Date() },
      });
    }
  }

  return {
    className,
    totalStudents,
    requiredSectionsCount,
    sections: targetSections.slice(0, requiredSectionsCount).map((s) => s.section),
  };
}

/**
 * Rebalances all grades across the entire school:
 */
export async function rebalanceAllSchoolSections(academicSession = '2026-2027') {
  // Get all unique class names in the school
  const classes = await prisma.class.findMany({
    where: { academicSession, ...notDeleted() },
    select: { name: true },
    distinct: ['name'],
  });

  const results = [];
  for (const { name } of classes) {
    const result = await rebalanceGradeSections(prisma, name, academicSession);
    results.push(result);
  }

  return results;
}
