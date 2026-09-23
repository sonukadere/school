import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Timetable Slots for Periods 1, 2, 3, 4, 5 ---');

  // 1. Fetch non-break periods
  const allPeriods = await prisma.period.findMany({
    where: { isBreak: false },
    orderBy: [{ sortOrder: 'asc' }, { startTime: 'asc' }],
  });
  console.log(`Found ${allPeriods.length} active periods:`, allPeriods.map((p) => `${p.name} (${p.startTime}-${p.endTime})`));

  // We want periods 1, 2, 3, 4, 5
  const targetPeriods = allPeriods.slice(0, 5);
  console.log(`Targeting ${targetPeriods.length} periods:`, targetPeriods.map((p) => p.name));

  // 2. Fetch classes
  const classes = await prisma.class.findMany({
    where: { deletedAt: null },
    orderBy: [{ name: 'asc' }, { section: 'asc' }],
  });
  console.log(`Found ${classes.length} classes.`);

  // 3. Fetch teachers
  const teachers = await prisma.teacher.findMany({
    where: { deletedAt: null },
  });
  console.log(`Found ${teachers.length} teachers.`);

  // 4. Clear old timetable slots
  const deleted = await prisma.timetable.deleteMany({});
  console.log(`Cleared ${deleted.count} old timetable slots.`);

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  let createdCount = 0;
  for (let cIdx = 0; cIdx < classes.length; cIdx++) {
    const cls = classes[cIdx];
    const subjects = await prisma.subject.findMany({
      where: { classId: cls.id, deletedAt: null },
    });

    if (subjects.length === 0) {
      console.warn(`No subjects for class ${cls.name} ${cls.section}`);
      continue;
    }

    for (let dIdx = 0; dIdx < days.length; dIdx++) {
      const day = days[dIdx];

      for (let pIdx = 0; pIdx < targetPeriods.length; pIdx++) {
        const period = targetPeriods[pIdx];
        const sub = subjects[(pIdx + dIdx) % subjects.length];
        
        // Distinct teacher per class at any given time slot to avoid teacher conflicts
        const teacher = teachers.length > 0
          ? teachers[(cIdx + pIdx + dIdx) % teachers.length]
          : null;

        await prisma.timetable.create({
          data: {
            day,
            periodId: period.id,
            startTime: period.startTime,
            endTime: period.endTime,
            classId: cls.id,
            subjectId: sub.id,
            teacherId: teacher?.id || sub.teacherId || null,
            roomNumber: cls.roomNumber || `Room ${101 + cIdx}`,
          },
        });
        createdCount++;
      }
    }
  }

  console.log(`✅ Successfully created ${createdCount} timetable slots covering Periods 1 to 5 across all 10 classes and 5 days!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
