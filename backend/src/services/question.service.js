import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  getPagination,
  getPaginationMeta,
  notDeleted,
  searchFilter,
} from '../utils/helpers.js';
import { detectDuplicateQuestion } from './duplicateDetector.service.js';
import { logAudit } from '../utils/auditLogger.js';

export async function listQuestions(query = {}, actor = null) {
  const { page, limit, skip } = getPagination(query);
  const {
    search,
    classId,
    className,
    subjectName,
    chapter,
    topic,
    difficulty,
    type,
    source,
    isArchived,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const where = {
    ...notDeleted(),
    isArchived: isArchived === 'true' ? true : false,
    ...(classId ? { classId } : {}),
    ...(className ? { className: { contains: className, mode: 'insensitive' } } : {}),
    ...(subjectName ? { subjectName: { contains: subjectName, mode: 'insensitive' } } : {}),
    ...(chapter ? { chapter: { contains: chapter, mode: 'insensitive' } } : {}),
    ...(topic ? { topic: { contains: topic, mode: 'insensitive' } } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(type ? { type } : {}),
    ...(source ? { source } : {}),
    ...searchFilter(['text', 'chapter', 'topic', 'explanation'], search),
  };

  const [data, total] = await Promise.all([
    prisma.question.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.question.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

export async function getQuestion(id, actor = null) {
  const question = await prisma.question.findFirst({
    where: { id, ...notDeleted() },
  });
  if (!question) {
    throw ApiError.notFound('Question not found.');
  }
  return question;
}

export async function createQuestion(data, actor = null) {
  if (!data.text || data.text.trim().length === 0) {
    throw ApiError.badRequest('Question text is required.');
  }

  // Duplicate detection check
  if (!data.forceAdd) {
    const dupCheck = await detectDuplicateQuestion(data.text, {
      classId: data.classId,
      subjectName: data.subjectName,
      threshold: 0.85,
    });

    if (dupCheck.isDuplicate) {
      return {
        warning: 'Similar question already exists in question bank.',
        duplicateWith: dupCheck.existingQuestion,
        similarity: dupCheck.similarity,
        options: ['Use Existing Question', 'Add Anyway', 'Edit Question'],
      };
    }
  }

  const teacherId = actor?.role === 'TEACHER' && actor.teacher?.id ? actor.teacher.id : null;

  const question = await prisma.question.create({
    data: {
      text: data.text.trim(),
      type: data.type || 'SHORT_ANSWER',
      classId: data.classId || null,
      className: data.className || null,
      board: data.board || 'CBSE',
      subjectId: data.subjectId || null,
      subjectName: data.subjectName || null,
      chapter: data.chapter || null,
      topic: data.topic || null,
      difficulty: data.difficulty || 'MEDIUM',
      marks: data.marks ? Number(data.marks) : 1,
      negativeMarks: data.negativeMarks ? Number(data.negativeMarks) : 0,
      language: data.language || 'English',
      options: data.options || null,
      correctAnswer: data.correctAnswer || null,
      explanation: data.explanation || null,
      rubric: data.rubric || null,
      source: data.source || (teacherId ? 'TEACHER_UPLOADED' : 'SCHOOL_QUESTION_BANK'),
      sourceName: data.sourceName || (teacherId ? `Uploaded by Teacher` : 'School Question Bank'),
      sourceUrl: data.sourceUrl || null,
      licenseInfo: data.licenseInfo || 'Internal School Educational Material',
      retrievalDate: data.retrievalDate ? new Date(data.retrievalDate) : new Date(),
      aiModel: data.aiModel || null,
      createdByTeacherId: teacherId,
      createdById: actor?.id || null,
    },
  });

  if (actor) {
    logAudit({
      action: 'CREATE_QUESTION',
      user: actor,
      resource: 'Question',
      resourceId: question.id,
      status: 'SUCCESS',
      details: { textSnippet: question.text.slice(0, 50), type: question.type, marks: question.marks },
    });
  }

  return question;
}

export async function updateQuestion(id, data, actor = null) {
  const existing = await getQuestion(id, actor);

  const updated = await prisma.question.update({
    where: { id },
    data: {
      ...(data.text ? { text: data.text.trim() } : {}),
      ...(data.type ? { type: data.type } : {}),
      ...(data.classId !== undefined ? { classId: data.classId || null } : {}),
      ...(data.className !== undefined ? { className: data.className || null } : {}),
      ...(data.board ? { board: data.board } : {}),
      ...(data.subjectId !== undefined ? { subjectId: data.subjectId || null } : {}),
      ...(data.subjectName !== undefined ? { subjectName: data.subjectName || null } : {}),
      ...(data.chapter !== undefined ? { chapter: data.chapter || null } : {}),
      ...(data.topic !== undefined ? { topic: data.topic || null } : {}),
      ...(data.difficulty ? { difficulty: data.difficulty } : {}),
      ...(data.marks !== undefined ? { marks: Number(data.marks) } : {}),
      ...(data.negativeMarks !== undefined ? { negativeMarks: Number(data.negativeMarks) } : {}),
      ...(data.language ? { language: data.language } : {}),
      ...(data.options !== undefined ? { options: data.options } : {}),
      ...(data.correctAnswer !== undefined ? { correctAnswer: data.correctAnswer } : {}),
      ...(data.explanation !== undefined ? { explanation: data.explanation } : {}),
      ...(data.rubric !== undefined ? { rubric: data.rubric } : {}),
      ...(data.isArchived !== undefined ? { isArchived: Boolean(data.isArchived) } : {}),
    },
  });

  return updated;
}

export async function deleteQuestion(id, actor = null) {
  await getQuestion(id, actor);
  return prisma.question.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
