import { PrismaClient } from '@prisma/client';
import {
  calculateRequiredSections,
  getSectionLetter,
  rebalanceGradeSections,
  resolveTargetSectionForAdmission,
  MAX_SECTION_CAPACITY,
} from './src/services/sectionManager.service.js';
import { notDeleted } from './src/utils/helpers.js';

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- STARTING SECTION SCALING TESTS ---');

  // Test 1: Math calculation verification
  console.log('\n[Test 1] Section count calculation:');
  const tests = [
    { count: 1, expected: 1 },
    { count: 20, expected: 1 },
    { count: 50, expected: 1 },
    { count: 51, expected: 2 },
    { count: 100, expected: 2 },
    { count: 101, expected: 3 },
    { count: 150, expected: 3 },
    { count: 151, expected: 4 },
  ];

  for (const t of tests) {
    const res = calculateRequiredSections(t.count);
    if (res !== t.expected) {
      throw new Error(`Failed for count ${t.count}: expected ${t.expected}, got ${res}`);
    }
    console.log(`  ✓ ${t.count} students -> ${res} section(s) [Expected: ${t.expected}]`);
  }

  // Test 2: Active database verification (20 students in Class 10 -> Section A only)
  console.log('\n[Test 2] Database verification for Class 10:');
  const class10Sections = await prisma.class.findMany({
    where: { name: 'Class 10', ...notDeleted() },
    include: { _count: { select: { students: { where: notDeleted() } } } },
  });
  console.log('  Class 10 active sections count:', class10Sections.length);
  if (class10Sections.length !== 1 || class10Sections[0].section !== 'A') {
    throw new Error(`Expected only Section A for Class 10, found: ${class10Sections.map(s => s.section).join(', ')}`);
  }
  console.log(`  ✓ Class 10 has Section A only with ${class10Sections[0]._count.students} students (<= 50).`);

  // Test 3: Simulation - Add 35 students to Class 10 (Total = 55 students, > 50)
  console.log('\n[Test 3] Simulating admission exceeding 50 students (20 existing + 35 new = 55):');
  const testStudentIds = [];

  for (let i = 1; i <= 35; i++) {
    const targetSec = await resolveTargetSectionForAdmission(prisma, 'Class 10');
    const created = await prisma.student.create({
      data: {
        studentId: `TEST-STU-${1000 + i}`,
        firstName: `TestStudent${i}`,
        lastName: 'ScaleTest',
        admissionDate: new Date(),
        classId: targetSec.id,
        rollNumber: i,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
    testStudentIds.push(created.id);
  }

  // Rebalance Class 10
  await rebalanceGradeSections(prisma, 'Class 10');

  // Verify Class 10 now has Section A AND Section B
  const updatedSections = await prisma.class.findMany({
    where: { name: 'Class 10', ...notDeleted() },
    include: { _count: { select: { students: { where: notDeleted() } } } },
    orderBy: { section: 'asc' },
  });

  console.log('  Updated Class 10 sections after 55 students:');
  updatedSections.forEach(s => {
    console.log(`    Section ${s.section}: ${s._count.students} students`);
  });

  if (updatedSections.length !== 2) {
    throw new Error(`Expected 2 sections (A + B) for 55 students, got ${updatedSections.length}`);
  }
  if (updatedSections[0]._count.students !== 50) {
    throw new Error(`Expected exactly 50 students in Section A, got ${updatedSections[0]._count.students}`);
  }
  if (updatedSections[1]._count.students !== 5) {
    throw new Error(`Expected 5 students in Section B, got ${updatedSections[1]._count.students}`);
  }
  console.log('  ✓ Verified: 55 students automatically scaled to Section A (50) + Section B (5)!');

  // Test 4: Cleanup simulation students and rebalance back to 20
  console.log('\n[Test 4] Cleaning up test students and rebalancing back:');
  await prisma.student.deleteMany({
    where: { id: { in: testStudentIds } },
  });
  await rebalanceGradeSections(prisma, 'Class 10');

  const finalSections = await prisma.class.findMany({
    where: { name: 'Class 10', ...notDeleted() },
    include: { _count: { select: { students: { where: notDeleted() } } } },
  });

  console.log('  Final Class 10 sections after cleanup:');
  finalSections.forEach(s => {
    console.log(`    Section ${s.section}: ${s._count.students} students`);
  });

  if (finalSections.length !== 1 || finalSections[0].section !== 'A' || finalSections[0]._count.students !== 20) {
    throw new Error('Failed to cleanly dissolve Section B after student count reduced back <= 50');
  }
  console.log('  ✓ Verified: Surplus Section B cleanly dissolved when student count dropped <= 50!');
  console.log('  ✓ Verified: Surplus Section B cleanly dissolved when student count dropped <= 50!');

  console.log('\n=========================================');
  console.log('  ALL SECTION SCALING TESTS PASSED! 100%');
  console.log('=========================================');
}

runTests()
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
