import { findMatchingQuestions } from './src/services/questionMatcher.service.js';
import { detectDuplicateQuestion, computeStringSimilarity } from './src/services/duplicateDetector.service.js';
import { queryOERQuestions } from './src/services/oerProvider.service.js';
import { generateAIQuestions } from './src/services/aiQuestion.service.js';

async function runTests() {
  console.log('==================================================');
  console.log('  QUESTION MATCHING & DISCOVERY TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- Test 1: OER Provider Query ---
  console.log('--- Test 1: Authorized OER Provider ---');
  const oerResults = queryOERQuestions({
    className: 'Class 10',
    subjectName: 'Science',
    chapter: 'Chemical Reactions',
  });
  assert(oerResults.length > 0, `OER provider found ${oerResults.length} questions`);
  assert(oerResults[0].source === 'OPEN_EDUCATIONAL_RESOURCE', `Source is OPEN_EDUCATIONAL_RESOURCE`);
  assert(Boolean(oerResults[0].sourceUrl), `Source URL is transparently provided: ${oerResults[0].sourceUrl}`);
  assert(Boolean(oerResults[0].licenseInfo), `License info is provided: ${oerResults[0].licenseInfo}`);

  // --- Test 2: AI Question Synthesis ---
  console.log('\n--- Test 2: AI Question Synthesis ---');
  const aiResults = await generateAIQuestions({
    className: 'Class 10',
    board: 'CBSE',
    subjectName: 'Science',
    chapter: 'Chemical Reactions and Equations',
    topic: 'Corrosion',
    type: 'MCQ',
    marks: 1,
    count: 1,
  });
  assert(aiResults.length === 1, `AI generated ${aiResults.length} question`);
  assert(aiResults[0].source === 'AI_GENERATED', `Source is AI_GENERATED`);
  assert(aiResults[0].sourceName.includes('AI Generated'), `Source label clearly marked`);
  assert(Array.isArray(aiResults[0].options), `MCQ options structured correctly`);

  // --- Test 3: Duplicate Detection Engine ---
  console.log('\n--- Test 3: Duplicate Detection Engine ---');
  const str1 = 'Why should a magnesium ribbon be cleaned before burning in air?';
  const str2 = 'Why must we clean magnesium ribbon before burning it in air?';
  const str3 = 'Calculate the kinetic energy of an electron moving at high speed.';

  const simHigh = computeStringSimilarity(str1, str2);
  const simLow = computeStringSimilarity(str1, str3);
  assert(simHigh >= 0.70, `High similarity detected for paraphrased question (${Math.round(simHigh * 100)}%)`);
  assert(simLow < 0.20, `Low similarity detected for unrelated question (${Math.round(simLow * 100)}%)`);

  const dupCheck = await detectDuplicateQuestion(str2, {
    existingList: [{ id: 'q1', text: str1, source: 'SCHOOL_QUESTION_BANK' }],
    threshold: 0.70,
  });
  assert(dupCheck.isDuplicate === true, `Duplicate flag triggered (${dupCheck.similarity}%)`);
  assert(dupCheck.existingQuestion.id === 'q1', `Matched existing question ID`);

  // --- Test 4: Question Matching & Relevance Scoring ---
  console.log('\n--- Test 4: Question Matching & Relevance Scoring ---');
  const matched = await findMatchingQuestions({
    className: 'Class 10',
    board: 'CBSE',
    subjectName: 'Science',
    chapter: 'Chemical Reactions and Equations',
    topic: 'Oxidation of Metals',
    difficulty: 'EASY',
    marks: 2,
    includeAI: false,
  });

  assert(matched.length > 0, `Matcher returned ${matched.length} ranked questions`);
  const top = matched[0];
  assert(top.matchScore >= 75, `Top match scored high relevance (${top.matchScore}% Match)`);
  assert(Boolean(top.sourceName), `Top match has visible source: ${top.sourceName}`);
  assert(Boolean(top.correctAnswer), `Answer key included for review`);

  console.log('\n==================================================');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
