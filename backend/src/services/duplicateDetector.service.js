import { prisma } from '../config/database.js';
import { notDeleted } from '../utils/helpers.js';

/**
 * Normalize text for semantic duplicate comparison
 */
export function normalizeQuestionText(text = '') {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compute word-level Dice coefficient / token overlap similarity
 */
export function computeStringSimilarity(strA = '', strB = '') {
  const normA = normalizeQuestionText(strA);
  const normB = normalizeQuestionText(strB);

  if (!normA || !normB) return 0;
  if (normA === normB) return 1.0;

  const wordsA = new Set(normA.split(' ').filter((w) => w.length > 2));
  const wordsB = new Set(normB.split(' ').filter((w) => w.length > 2));

  if (wordsA.size === 0 || wordsB.size === 0) {
    return normA === normB ? 1.0 : 0.0;
  }

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersection += 1;
  }

  // Sørensen–Dice coefficient
  return (2 * intersection) / (wordsA.size + wordsB.size);
}

/**
 * Check if a candidate question text is a duplicate of any existing question in the bank
 * or an optional list of comparison questions.
 * @param {string} text - Candidate question text
 * @param {object} options - { classId, subjectName, threshold = 0.80, excludeId, existingList }
 * @returns {object} { isDuplicate, similarity, existingQuestion, options }
 */
export async function detectDuplicateQuestion(text, options = {}) {
  const {
    classId,
    subjectName,
    threshold = 0.80,
    excludeId = null,
    existingList = null,
  } = options;

  if (!text || text.trim().length === 0) {
    return { isDuplicate: false, similarity: 0, existingQuestion: null };
  }

  let candidatePool = existingList;

  // If no in-memory pool provided, query Question Bank from database
  if (!candidatePool) {
    candidatePool = await prisma.question.findMany({
      where: {
        ...notDeleted(),
        isArchived: false,
        ...(classId ? { classId } : {}),
        ...(subjectName ? { subjectName: { contains: subjectName, mode: 'insensitive' } } : {}),
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: {
        id: true,
        text: true,
        type: true,
        difficulty: true,
        marks: true,
        chapter: true,
        topic: true,
        source: true,
        sourceName: true,
      },
      take: 200,
    });
  }

  let highestScore = 0;
  let bestMatch = null;

  for (const item of candidatePool) {
    if (excludeId && item.id === excludeId) continue;
    const sim = computeStringSimilarity(text, item.text);
    if (sim > highestScore) {
      highestScore = sim;
      bestMatch = item;
    }
  }

  const isDuplicate = highestScore >= threshold;

  return {
    isDuplicate,
    similarity: Math.round(highestScore * 100),
    existingQuestion: isDuplicate ? bestMatch : null,
    recommendations: isDuplicate
      ? ['Use Existing Question', 'Add Anyway (Variant)', 'Edit Question']
      : ['No similar question detected'],
  };
}
