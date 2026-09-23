import { PrismaClient } from '@prisma/client';
import { rebalanceAllSchoolSections } from '../src/services/sectionManager.service.js';

const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('  APPLYING SECTION AUTO-SCALING RULE');
  console.log('  1-50 Students -> Section A only');
  console.log('  51-100 Students -> Sections A + B');
  console.log('==================================================');

  // Fetch all classes
  const classes = await prisma.class.findMany({
    where: { deletedAt: null },
    include: {
      students: { where: { deletedAt: null } },
    },
    orderBy: [{ name: 'asc' }, { section: 'asc' }],
  });

  // Group classes by grade name (e.g. 'Class 6', 'Class 7'...)
  const gradeMap = new Map();
  for (const cls of classes) {
    if (!gradeMap.has(cls.name)) {
      gradeMap.set(cls.name, []);
    }
    gradeMap.get(cls.name).push(cls);
  }

  for (const [gradeName, classSections] of gradeMap.entries()) {
    // Total students across all sections for this grade
    const allStudents = classSections.flatMap((cs) => cs.students);
    const totalCount = allStudents.length;

    console.log(`\nProcessing ${gradeName}: Total students = ${totalCount}`);

    // Section A is the mandatory default
    const sectionA = classSections.find((cs) => cs.section.toUpperCase() === 'A');
    if (!sectionA) {
      console.error(`Section A not found for ${gradeName}! Skipping.`);
      continue;
    }

    if (totalCount <= 50) {
      console.log(`-> Student count (${totalCount}) <= 50: Consolidating into Section A only.`);

      // Move all students to Section A and sequence roll numbers 1..totalCount
      let roll = 1;
      for (const st of allStudents) {
        await prisma.student.update({
          where: { id: st.id },
          data: {
            classId: sectionA.id,
            rollNumber: roll++,
          },
        });
      }

      // Other sections (B, C...) for this grade should be removed / retired
      const otherSections = classSections.filter((cs) => cs.section.toUpperCase() !== 'A');
      for (const otherSec of otherSections) {
        console.log(`-> Retiring surplus Section ${otherSec.section} for ${gradeName}`);
        
        // Remove timetable slots for surplus section
        await prisma.timetable.deleteMany({
          where: { classId: otherSec.id },
        });

        // Soft-delete surplus section
        await prisma.class.update({
          where: { id: otherSec.id },
          data: { deletedAt: new Date() },
        });
      }
    }
  }

  console.log('\nRunning rebalanceAllSchoolSections to ensure 100% data integrity...');
  const summary = await rebalanceAllSchoolSections();
  console.log('Rebalance summary:', summary);

  // Final verification
  const activeClasses = await prisma.class.findMany({
    where: { deletedAt: null },
    include: {
      _count: { select: { students: { where: { deletedAt: null } } } },
    },
    orderBy: [{ name: 'asc' }, { section: 'asc' }],
  });

  console.log('\nFinal Active Classes:');
  activeClasses.forEach((c) => {
    console.log(`- ${c.name} (Section ${c.section}): ${c._count.students} students [Max: 50]`);
  });

  console.log('\n✅ Successfully applied 50 students per section scaling rule!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
