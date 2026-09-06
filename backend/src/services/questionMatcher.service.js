import { prisma } from '../config/database.js';
import { notDeleted } from '../utils/helpers.js';
import { queryOERQuestions } from './oerProvider.service.js';
import { generateAIQuestions } from './aiQuestion.service.js';
import { detectDuplicateQuestion, computeStringSimilarity } from './duplicateDetector.service.js';

/**
 * Compute relevance match score (0 - 100) between query criteria and a question
 */
export function calculateMatchScore(criteria, question) {
  let score = 0;

  // 1. Subject Alignment (25 pts)
  if (criteria.subjectName && question.subjectName) {
    const cSub = criteria.subjectName.toLowerCase().trim();
    const qSub = question.subjectName.toLowerCase().trim();
    if (cSub === qSub) {
      score += 25;
    } else if (cSub.includes(qSub) || qSub.includes(cSub)) {
      score += 20;
    }
  } else {
    score += 15; // neutral if not specified
  }

  // 2. Class Level Alignment (20 pts)
  if (criteria.className && question.className) {
    const cClass = criteria.className.toLowerCase().replace(/[^a-z0-9]/g, '');
    const qClass = question.className.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cClass === qClass) {
      score += 20;
    } else if (cClass.includes(qClass) || qClass.includes(cClass)) {
      score += 12;
    }
  } else {
    score += 10;
  }

  // 3. Chapter Alignment (15 pts)
  if (criteria.chapter && question.chapter) {
    const cChap = criteria.chapter.toLowerCase().trim();
    const qChap = question.chapter.toLowerCase().trim();
    if (cChap === qChap) {
      score += 15;
    } else if (cChap.includes(qChap) || qChap.includes(cChap)) {
      score += 12;
    } else {
      const sim = computeStringSimilarity(cChap, qChap);
      score += Math.round(sim * 15);
    }
  } else {
    score += 8;
  }

  // 4. Topic Alignment (10 pts)
  if (criteria.topic && question.topic) {
    const cTopic = criteria.topic.toLowerCase().trim();
    const qTopic = question.topic.toLowerCase().trim();
    if (cTopic === qTopic) {
      score += 10;
    } else if (cTopic.includes(qTopic) || qTopic.includes(cTopic)) {
      score += 8;
    } else {
      const sim = computeStringSimilarity(cTopic, qTopic);
      score += Math.round(sim * 10);
    }
  } else {
    score += 5;
  }

  // 5. Keyword Overlap (10 pts)
  if (criteria.keywords) {
    const kw = criteria.keywords.toLowerCase();
    const fullText = `${question.text} ${question.chapter || ''} ${question.topic || ''}`.toLowerCase();
    const tokens = kw.split(' ').filter((t) => t.length > 2);
    if (tokens.length > 0) {
      let matchedTokens = 0;
      tokens.forEach((t) => {
        if (fullText.includes(t)) matchedTokens += 1;
      });
      score += Math.round((matchedTokens / tokens.length) * 10);
    }
  } else {
    score += 6;
  }

  // 6. Question Type Match (8 pts)
  if (criteria.type && question.type) {
    if (criteria.type.toUpperCase() === question.type.toUpperCase()) {
      score += 8;
    }
  } else {
    score += 4;
  }

  // 7. Difficulty Match (5 pts)
  if (criteria.difficulty && question.difficulty) {
    if (criteria.difficulty.toUpperCase() === question.difficulty.toUpperCase()) {
      score += 5;
    } else {
      score += 2;
    }
  } else {
    score += 3;
  }

  // 8. Marks Weight Match (4 pts)
  if (criteria.marks && question.marks) {
    if (Number(criteria.marks) === Number(question.marks)) {
      score += 4;
    } else if (Math.abs(Number(criteria.marks) - Number(question.marks)) <= 1) {
      score += 2;
    }
  } else {
    score += 2;
  }

  // 9. Language Match (3 pts)
  if (criteria.language && question.language) {
    if (criteria.language.toLowerCase() === question.language.toLowerCase()) {
      score += 3;
    }
  } else {
    score += 2;
  }

  return Math.min(Math.max(score, 10), 99);
}

/**
 * Find and rank matching questions across authorized sources:
 * - Internal School Question Bank (DB)
 * - Authorized Public/Open Educational Resources (OER)
 * - AI Generated (Optional / on-demand)
 */
export async function findMatchingQuestions(criteria = {}, actor = null) {
  const {
    className,
    board = 'CBSE',
    subjectName,
    chapter,
    topic,
    difficulty,
    type,
    marks,
    language = 'English',
    keywords,
    includeAI = false,
    limit = 30,
  } = criteria;

  // 1. Fetch from School Question Bank (DB)
  const dbQuestions = await prisma.question.findMany({
    where: {
      ...notDeleted(),
      isArchived: false,
      ...(className ? { className: { contains: className, mode: 'insensitive' } } : {}),
      ...(subjectName ? { subjectName: { contains: subjectName, mode: 'insensitive' } } : {}),
      ...(chapter ? { chapter: { contains: chapter, mode: 'insensitive' } } : {}),
      ...(difficulty ? { difficulty } : {}),
      ...(type ? { type } : {}),
    },
    take: 50,
  });

  // 2. Fetch from Authorized Open Educational Resources (OER)
  const oerQuestions = queryOERQuestions({
    className,
    board,
    subjectName,
    chapter,
    topic,
    difficulty,
    type,
    marks,
    language,
    keywords,
  });

  // 3. Optional AI Generated Questions (clearly watermarked)
  let aiQuestions = [];
  if (includeAI) {
    try {
      aiQuestions = await generateAIQuestions({
        className,
        board,
        subjectName,
        chapter,
        topic,
        difficulty,
        type,
        marks,
        language,
        count: 2,
      });
    } catch (e) {
      console.warn('[QuestionMatcher] AI generation warning:', e.message);
    }
  }

  // Combine and deduplicate across pools
  const combined = [
    ...dbQuestions.map((q) => ({
      ...q,
      source: q.source || 'SCHOOL_QUESTION_BANK',
      sourceName: q.sourceName || 'School Question Bank',
    })),
    ...oerQuestions,
    ...aiQuestions,
  ];

  // Score each question
  const scoredList = [];
  for (const item of combined) {
    const matchScore = calculateMatchScore(criteria, item);

    // Duplicate check against the current bank
    const dupCheck = await detectDuplicateQuestion(item.text, {
      excludeId: item.id,
      existingList: dbQuestions,
      threshold: 0.80,
    });

    scoredList.push({
      ...item,
      matchScore,
      matchLabel: `${matchScore}% Match`,
      isDuplicate: dupCheck.isDuplicate,
      duplicateSimilarity: dupCheck.similarity,
      duplicateWith: dupCheck.existingQuestion
        ? {
            id: dupCheck.existingQuestion.id,
            text: dupCheck.existingQuestion.text,
            source: dupCheck.existingQuestion.source,
          }
        : null,
    });
  }

  // Sort descending by match score
  scoredList.sort((a, b) => b.matchScore - a.matchScore);

  return scoredList.slice(0, limit);
}
