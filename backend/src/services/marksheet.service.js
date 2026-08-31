import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { notDeleted } from '../utils/helpers.js';
import { assertStudentVisible, getVisibleStudentIds } from '../utils/access.js';

/**
 * Grade helper
 */
export function calculateGrade(percent) {
  const p = Number(percent);
  if (p >= 90) return { grade: 'A+', remarks: 'Outstanding' };
  if (p >= 80) return { grade: 'A', remarks: 'Excellent' };
  if (p >= 70) return { grade: 'B+', remarks: 'Very Good' };
  if (p >= 60) return { grade: 'B', remarks: 'Good' };
  if (p >= 50) return { grade: 'C', remarks: 'Average' };
  if (p >= 40) return { grade: 'D', remarks: 'Pass' };
  return { grade: 'F', remarks: 'Needs Improvement' };
}

/**
 * Derive Result Status (PASS / FAIL / PROMOTED)
 */
export function deriveResultStatus(subjects) {
  if (!subjects || subjects.length === 0) return 'PENDING';
  const failedSubjects = subjects.filter((s) => Number(s.marks) < (s.maxMarks * 0.35));
  if (failedSubjects.length === 0) return 'PASS';
  if (failedSubjects.length === 1) return 'PROMOTED';
  return 'FAIL';
}

/**
 * Generate a complete student marksheet from live database data.
 */
export async function generateStudentMarksheet(studentId, examId, actor = null) {
  if (actor) {
    await assertStudentVisible(actor, studentId);
  }

  const [student, exam, setting] = await Promise.all([
    prisma.student.findFirst({
      where: { id: studentId, ...notDeleted() },
      include: {
        class: { select: { id: true, name: true, section: true } },
        parent: { select: { firstName: true, lastName: true, phone: true } },
      },
    }),
    prisma.exam.findFirst({
      where: { id: examId, ...notDeleted() },
      include: {
        class: { select: { id: true, name: true, section: true } },
      },
    }),
    prisma.setting.findFirst({
      where: notDeleted(),
    }),
  ]);

  if (!student) throw ApiError.notFound('Student not found.');
  if (!exam) throw ApiError.notFound('Exam not found.');

  // Fetch all marks for this student and exam
  const marks = await prisma.mark.findMany({
    where: {
      studentId: student.id,
      examId: exam.id,
      ...notDeleted(),
    },
    include: {
      subject: { select: { id: true, name: true, code: true } },
    },
    orderBy: { subject: { name: 'asc' } },
  });

  // Calculate subject-wise items
  const subjectMarks = marks.map((m) => {
    const maxMarks = 100;
    const obtained = Number(m.marks || 0);
    const percent = Math.round((obtained / maxMarks) * 100);
    const gradeObj = calculateGrade(percent);

    return {
      subjectId: m.subjectId,
      subjectName: m.subject?.name || 'Subject',
      subjectCode: m.subject?.code || '',
      maxMarks,
      obtainedMarks: obtained,
      grade: m.grade || gradeObj.grade,
      remarks: m.remarks || gradeObj.remarks,
    };
  });

  const totalMaxMarks = subjectMarks.reduce((sum, s) => sum + s.maxMarks, 0);
  const totalObtainedMarks = subjectMarks.reduce((sum, s) => sum + s.obtainedMarks, 0);
  const percentage = totalMaxMarks > 0 ? Math.round((totalObtainedMarks / totalMaxMarks) * 100) : 0;
  const overallGrade = calculateGrade(percentage);
  const resultStatus = deriveResultStatus(subjectMarks);

  return {
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
    student: {
      id: student.id,
      studentId: student.studentId,
      fullName: `${student.firstName} ${student.lastName || ''}`.trim(),
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender,
      dob: student.dob,
      fatherName: student.fatherName || (student.parent ? `${student.parent.firstName} ${student.parent.lastName}` : '—'),
      motherName: student.motherName || '—',
      rollNumber: student.rollNumber,
      admissionDate: student.admissionDate,
      className: student.class ? `${student.class.name} - ${student.class.section}` : '',
      class: student.class?.name || '',
      section: student.class?.section || student.section || 'A',
      address: student.address || '',
      phone: student.phone || '',
      email: student.email || '',
    },
    exam: {
      id: exam.id,
      name: exam.name,
      startDate: exam.startDate,
      endDate: exam.endDate,
      academicYear: setting?.academicYear || '2026-2027',
    },
    subjects: subjectMarks,
    summary: {
      totalSubjects: subjectMarks.length,
      totalMaxMarks,
      totalObtainedMarks,
      percentage,
      grade: overallGrade.grade,
      remarks: overallGrade.remarks,
      resultStatus,
      isPassed: resultStatus === 'PASS' || resultStatus === 'PROMOTED',
      generatedAt: new Date(),
    },
  };
}

/**
 * Get all available marksheets for a student.
 */
export async function getStudentMarksheets(studentId, actor = null) {
  if (actor) {
    await assertStudentVisible(actor, studentId);
  }

  const marks = await prisma.mark.findMany({
    where: { studentId, ...notDeleted() },
    select: { examId: true },
    distinct: ['examId'],
  });

  const examIds = marks.map((m) => m.examId).filter(Boolean);
  if (examIds.length === 0) return [];

  const marksheets = [];
  for (const examId of examIds) {
    try {
      const ms = await generateStudentMarksheet(studentId, examId, actor);
      marksheets.push(ms);
    } catch {
      // skip unresolvable marksheet
    }
  }

  return marksheets;
}

/**
 * Get class-wide marksheets for an exam (Teacher/Admin).
 */
export async function getClassMarksheets(classId, examId, actor = null) {
  const visibleStudentIds = actor ? await getVisibleStudentIds(actor) : null;
  const where = {
    classId,
    ...notDeleted(),
    ...(visibleStudentIds ? { id: { in: visibleStudentIds } } : {}),
  };

  const students = await prisma.student.findMany({
    where,
    select: { id: true },
    orderBy: { rollNumber: 'asc' },
  });

  const marksheets = [];
  for (const s of students) {
    try {
      const ms = await generateStudentMarksheet(s.id, examId, actor);
      if (ms.subjects.length > 0) {
        marksheets.push(ms);
      }
    } catch {
      // skip
    }
  }

  return marksheets;
}
