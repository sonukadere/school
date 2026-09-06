import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  addDays,
  formatDate,
  getPagination,
  getPaginationMeta,
  notDeleted,
  searchFilter,
  toDateOnly,
} from '../utils/helpers.js';
import { resolveActorClassIds } from '../utils/access.js';
import { assertTeacherAssignedToClass } from '../utils/teacherAccess.js';
import { logAudit } from '../utils/auditLogger.js';

const SORTABLE_FIELDS = new Set(['name', 'startDate', 'endDate', 'createdAt', 'updatedAt']);

const DEFAULT_INCLUDE = {
  class: { select: { id: true, name: true, section: true } },
  _count: { select: { marks: true, questions: true, attempts: true } },
};

export async function listExams(query = {}, actor = null) {
  const { page, limit, skip } = getPagination(query);
  const { search, classId, type, from, to, sortBy = 'startDate', sortOrder = 'desc' } = query;

  const visibleClassIds = actor ? await resolveActorClassIds(actor) : null;
  if (visibleClassIds !== null && visibleClassIds.length === 0 && actor.role !== 'ADMIN') {
    return { data: [], pagination: getPaginationMeta(page, limit, 0) };
  }

  const where = {
    ...notDeleted(),
    ...(classId ? { classId } : {}),
    ...(type ? { type } : {}),
    ...(visibleClassIds ? { classId: { in: visibleClassIds } } : {}),
    ...searchFilter(['name', 'subjectName', 'board'], search),
    ...(from || to
      ? {
          startDate: {
            ...(from ? { gte: toDateOnly(from) } : {}),
            ...(to ? { lt: addDays(toDateOnly(to), 1) } : {}),
          },
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.exam.findMany({
      where,
      include: DEFAULT_INCLUDE,
      orderBy: SORTABLE_FIELDS.has(sortBy) ? { [sortBy]: sortOrder } : { startDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.exam.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

export async function getExam(id, actor = null) {
  const exam = await prisma.exam.findFirst({
    where: { id, ...notDeleted() },
    include: {
      ...DEFAULT_INCLUDE,
      questions: {
        include: {
          question: true,
        },
        orderBy: { order: 'asc' },
      },
      marks: {
        where: notDeleted(),
        select: {
          id: true,
          marks: true,
          grade: true,
          studentId: true,
          subjectId: true,
          subject: { select: { name: true, code: true } },
          student: {
            select: { id: true, studentId: true, firstName: true, lastName: true, rollNumber: true },
          },
        },
        orderBy: { student: { rollNumber: 'asc' } },
      },
    },
  });
  if (!exam) {
    throw ApiError.notFound('Exam not found.');
  }
  if (actor && actor.role === 'TEACHER') {
    await assertTeacherAssignedToClass(actor, exam.classId);
  }
  return exam;
}

export async function createExam(data, actor = null) {
  const cls = await prisma.class.findFirst({ where: { id: data.classId, ...notDeleted() } });
  if (!cls) {
    throw ApiError.badRequest('The selected class does not exist.');
  }
  const start = toDateOnly(data.startDate || data.date);
  const end = toDateOnly(data.endDate || data.date || data.startDate);
  if (end < start) {
    throw ApiError.badRequest('End date cannot be before start date.');
  }

  const examType = data.type === 'DIGITAL' ? 'DIGITAL' : 'NORMAL';

  const exam = await prisma.exam.create({
    data: {
      name: data.name,
      classId: data.classId,
      type: examType,
      status: data.status || 'SCHEDULED',
      startDate: start,
      endDate: end,
      board: data.board || 'CBSE',
      subjectName: data.subjectName || data.subject || 'General',
      totalMarks: data.totalMarks ? Number(data.totalMarks) : 100,
      passingMarks: data.passingMarks ? Number(data.passingMarks) : 33,
      durationMinutes: data.durationMinutes ? Number(data.durationMinutes) : 180,
      instructions: data.instructions || 'Read all questions carefully before answering.',
    },
    include: DEFAULT_INCLUDE,
  });

  // If initial questions provided, attach them
  if (Array.isArray(data.questions) && data.questions.length > 0) {
    await addQuestionsToExam(exam.id, data.questions, actor);
  }

  // Automatically dispatch push notifications to students and parents of the class
  try {
    const { sendNotificationToUser } = await import('./notification.service.js');
    const students = await prisma.student.findMany({
      where: { classId: data.classId, ...notDeleted() },
      include: { parent: { select: { userId: true } } },
    });

    const startStr = formatDate(start);
    const endStr = formatDate(end);

    for (const st of students) {
      const userIds = [st.userId, st.parent?.userId].filter(Boolean);
      for (const uid of userIds) {
        await sendNotificationToUser(uid, {
          title: `📝 New ${examType === 'DIGITAL' ? 'Digital' : ''} Exam Scheduled: ${exam.name}`,
          body: `Examination scheduled for ${cls.name} (${cls.section}) from ${startStr} to ${endStr}.`,
          type: 'EXAM',
          data: { examId: exam.id, classId: cls.id, url: '/exams' },
        });
      }
    }
  } catch (err) {
    console.warn('[Exam] Notification dispatch warning:', err.message);
  }

  return exam;
}

export async function updateExam(id, data, actor = null) {
  const exam = await prisma.exam.findFirst({ where: { id, ...notDeleted() } });
  if (!exam) {
    throw ApiError.notFound('Exam not found.');
  }
  const updateData = { ...data };
  if (updateData.startDate) updateData.startDate = toDateOnly(updateData.startDate);
  if (updateData.endDate) updateData.endDate = toDateOnly(updateData.endDate);

  delete updateData.questions;
  delete updateData.marks;

  const updated = await prisma.exam.update({
    where: { id },
    data: updateData,
    include: DEFAULT_INCLUDE,
  });

  return updated;
}

export async function deleteExam(id, actor = null) {
  const exam = await prisma.exam.findFirst({ where: { id, ...notDeleted() } });
  if (!exam) {
    throw ApiError.notFound('Exam not found.');
  }
  return prisma.exam.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/**
 * Attach or sync questions to an Exam (Used for both Normal & Digital Exam)
 * Supports selecting existing Question Bank questions, OER questions, or AI-generated questions
 */
export async function addQuestionsToExam(examId, questions = [], actor = null) {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, ...notDeleted() },
    include: { class: true },
  });
  if (!exam) {
    throw ApiError.notFound('Exam not found.');
  }

  // Clear existing question associations if re-syncing
  await prisma.examQuestion.deleteMany({
    where: { examId },
  });

  let orderIndex = 1;
  let runningTotalMarks = 0;

  for (const item of questions) {
    let questionId = item.id || item.questionId;

    // If item does not yet exist in Question Bank (e.g. from OER or AI generation), save it to Question Bank first
    if (!questionId || questionId.startsWith('oer-') || questionId.startsWith('ai-gen-')) {
      const createdQ = await prisma.question.create({
        data: {
          text: item.text,
          type: item.type || 'SHORT_ANSWER',
          classId: exam.classId,
          className: exam.class?.name || null,
          board: item.board || exam.board || 'CBSE',
          subjectName: item.subjectName || exam.subjectName || 'General',
          chapter: item.chapter || null,
          topic: item.topic || null,
          difficulty: item.difficulty || 'MEDIUM',
          marks: item.marks ? Number(item.marks) : 1,
          negativeMarks: item.negativeMarks ? Number(item.negativeMarks) : 0,
          language: item.language || 'English',
          options: item.options || null,
          correctAnswer: item.correctAnswer || null,
          explanation: item.explanation || null,
          rubric: item.rubric || null,
          source: item.source || 'SCHOOL_QUESTION_BANK',
          sourceName: item.sourceName || 'Imported to Exam',
          sourceUrl: item.sourceUrl || null,
          licenseInfo: item.licenseInfo || 'Educational Use',
          retrievalDate: item.retrievalDate ? new Date(item.retrievalDate) : new Date(),
          aiModel: item.aiModel || null,
          createdById: actor?.id || null,
        },
      });
      questionId = createdQ.id;
    }

    const assignedMarks = item.marks ? Number(item.marks) : 1;
    runningTotalMarks += assignedMarks;

    await prisma.examQuestion.create({
      data: {
        examId,
        questionId,
        order: item.order || orderIndex++,
        marks: assignedMarks,
        sectionName: item.sectionName || 'Section A',
      },
    });
  }

  // Update total marks on the exam
  await prisma.exam.update({
    where: { id: examId },
    data: { totalMarks: runningTotalMarks },
  });

  return getExam(examId, actor);
}

/**
 * Fetch compiled Question Paper, Answer Key & Marking Scheme
 * IMPORTANT SECURITY RULE:
 * If requester is a Student, strip correctAnswer, explanation, and rubric!
 */
export async function getExamPaper(examId, actor = null) {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, ...notDeleted() },
    include: {
      class: { select: { id: true, name: true, section: true } },
      questions: {
        include: {
          question: true,
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!exam) {
    throw ApiError.notFound('Exam not found.');
  }

  const isStudent = actor?.role === 'STUDENT';

  // Group questions by section
  const sections = {};
  exam.questions.forEach((eq) => {
    const sName = eq.sectionName || 'General Section';
    if (!sections[sName]) sections[sName] = [];

    const q = eq.question;
    const sanitizedQuestion = {
      examQuestionId: eq.id,
      questionId: q.id,
      order: eq.order,
      marks: eq.marks,
      text: q.text,
      type: q.type,
      chapter: q.chapter,
      topic: q.topic,
      difficulty: q.difficulty,
      language: q.language,
      options: q.options, // Options are needed for students (without answers)
      source: q.source,
      sourceName: q.sourceName,
      // CONFIDENTIAL FIELDS: Only exposed to Teachers and Admins!
      correctAnswer: isStudent ? undefined : q.correctAnswer,
      explanation: isStudent ? undefined : q.explanation,
      rubric: isStudent ? undefined : q.rubric,
    };

    sections[sName].push(sanitizedQuestion);
  });

  return {
    examId: exam.id,
    name: exam.name,
    type: exam.type,
    status: exam.status,
    board: exam.board || 'CBSE',
    className: `${exam.class?.name} ${exam.class?.section || ''}`.trim(),
    subjectName: exam.subjectName || 'General',
    startDate: exam.startDate,
    endDate: exam.endDate,
    totalMarks: exam.totalMarks,
    passingMarks: exam.passingMarks,
    durationMinutes: exam.durationMinutes,
    instructions: exam.instructions,
    totalQuestions: exam.questions.length,
    sections,
    isAnswerKeyIncluded: !isStudent,
  };
}

/**
 * Start or retrieve student's Digital Exam attempt
 */
export async function startDigitalExamAttempt(examId, actor) {
  if (!actor || actor.role !== 'STUDENT') {
    throw ApiError.forbidden('Only students can attempt digital exams.');
  }

  const student = await prisma.student.findFirst({
    where: { userId: actor.id, ...notDeleted() },
  });
  if (!student) {
    throw ApiError.forbidden('Student profile not found for this user account.');
  }

  const exam = await prisma.exam.findFirst({
    where: { id: examId, ...notDeleted() },
  });
  if (!exam) {
    throw ApiError.notFound('Exam not found.');
  }
  if (exam.type !== 'DIGITAL') {
    throw ApiError.badRequest('This examination is configured as a Normal/Paper exam.');
  }

  // Upsert or retrieve in-progress attempt
  let attempt = await prisma.examAttempt.findUnique({
    where: { examId_studentId: { examId, studentId: student.id } },
  });

  if (!attempt) {
    attempt = await prisma.examAttempt.create({
      data: {
        examId,
        studentId: student.id,
        status: 'IN_PROGRESS',
        startTime: new Date(),
        answers: {},
      },
    });
  }

  const paper = await getExamPaper(examId, actor);

  return {
    attempt,
    paper,
  };
}

/**
 * Auto-save / Submit student's Digital Exam attempt
 */
export async function submitDigitalExamAttempt(examId, data, actor) {
  if (!actor || actor.role !== 'STUDENT') {
    throw ApiError.forbidden('Only students can submit digital exam attempts.');
  }

  const student = await prisma.student.findFirst({
    where: { userId: actor.id, ...notDeleted() },
  });
  if (!student) {
    throw ApiError.forbidden('Student profile not found.');
  }

  const exam = await prisma.exam.findFirst({
    where: { id: examId, ...notDeleted() },
    include: {
      questions: { include: { question: true } },
    },
  });

  if (!exam) {
    throw ApiError.notFound('Exam not found.');
  }

  const submittedAnswers = data.answers || {};
  let calculatedScore = 0;
  let autoEvaluated = true;

  // Auto-evaluation for objective questions (MCQ & True/False)
  exam.questions.forEach((eq) => {
    const q = eq.question;
    const studentAns = submittedAnswers[q.id];

    if (q.type === 'MCQ' || q.type === 'TRUE_FALSE') {
      if (
        studentAns &&
        String(studentAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()
      ) {
        calculatedScore += Number(eq.marks);
      } else if (studentAns && q.negativeMarks) {
        calculatedScore = Math.max(0, calculatedScore - Number(q.negativeMarks));
      }
    } else {
      // Subjective question requires manual teacher evaluation
      autoEvaluated = false;
    }
  });

  const isFinalSubmission = data.isFinal === true;

  const attempt = await prisma.examAttempt.upsert({
    where: { examId_studentId: { examId, studentId: student.id } },
    create: {
      examId,
      studentId: student.id,
      answers: submittedAnswers,
      status: isFinalSubmission ? (autoEvaluated ? 'EVALUATED' : 'SUBMITTED') : 'IN_PROGRESS',
      submittedAt: isFinalSubmission ? new Date() : null,
      score: autoEvaluated ? calculatedScore : null,
      autoEvaluated,
    },
    update: {
      answers: submittedAnswers,
      status: isFinalSubmission ? (autoEvaluated ? 'EVALUATED' : 'SUBMITTED') : 'IN_PROGRESS',
      submittedAt: isFinalSubmission ? new Date() : undefined,
      score: autoEvaluated ? calculatedScore : undefined,
      autoEvaluated,
    },
  });

  return {
    attemptId: attempt.id,
    status: attempt.status,
    submittedAt: attempt.submittedAt,
    autoEvaluated,
    score: autoEvaluated ? calculatedScore : null,
    message: isFinalSubmission
      ? autoEvaluated
        ? `Exam submitted and evaluated successfully. Score: ${calculatedScore}/${exam.totalMarks}`
        : 'Exam submitted successfully. Subjective responses pending teacher evaluation.'
      : 'Answers auto-saved.',
  };
}

/**
 * Teacher grading & evaluation for digital exam attempt
 */
export async function evaluateDigitalAttempt(attemptId, evaluationData, actor = null) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: { exam: true, student: true },
  });

  if (!attempt) {
    throw ApiError.notFound('Exam attempt record not found.');
  }

  const finalScore = Number(evaluationData.score ?? attempt.score ?? 0);

  const updated = await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      score: finalScore,
      feedback: evaluationData.feedback || 'Evaluated by Faculty',
      status: 'EVALUATED',
    },
  });

  return updated;
}
