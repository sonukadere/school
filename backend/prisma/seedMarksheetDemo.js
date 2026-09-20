import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const STANDARD_SUBJECTS = [
  { name: 'Hindi (Special)', code: 'HIN-101' },
  { name: 'English (General)', code: 'ENG-102' },
  { name: 'Mathematics', code: 'MAT-103' },
  { name: 'Science & Technology', code: 'SCI-104' },
  { name: 'Social Science', code: 'SST-105' },
  { name: 'Computer Applications', code: 'CA-106' },
];

function getGrade(score) {
  if (score >= 90) return { grade: 'A+', remarks: 'Outstanding performance' };
  if (score >= 80) return { grade: 'A', remarks: 'Excellent grasp of concepts' };
  if (score >= 70) return { grade: 'B+', remarks: 'Very good, keep it up' };
  if (score >= 60) return { grade: 'B', remarks: 'Good, scope for improvement' };
  if (score >= 50) return { grade: 'C', remarks: 'Satisfactory performance' };
  if (score >= 35) return { grade: 'D', remarks: 'Pass, needs more practice' };
  return { grade: 'F', remarks: 'Needs significant improvement' };
}

async function seedMarksheetData() {
  console.log('--- Seeding Comprehensive Marksheet Testing Data ---');

  // 1. Get all active classes
  const classes = await prisma.class.findMany({
    where: { deletedAt: null },
    include: { students: { where: { deletedAt: null } } },
  });

  if (classes.length === 0) {
    console.log('No classes found. Please ensure basic classes exist.');
    return;
  }

  console.log(`Found ${classes.length} active classes.`);

  let totalMarksCreated = 0;
  let totalExamsCreated = 0;

  for (const cls of classes) {
    console.log(`\nProcessing Class: ${cls.name} (${cls.section || 'A'}) - ${cls.students.length} students`);

    // Ensure standard subjects exist for this class
    const classSubjects = [];
    for (const subDef of STANDARD_SUBJECTS) {
      let subject = await prisma.subject.findFirst({
        where: { classId: cls.id, name: subDef.name, deletedAt: null },
      });

      if (!subject) {
        subject = await prisma.subject.create({
          data: {
            name: subDef.name,
            code: `${subDef.code}-${cls.name.replace(/\D/g, '') || '1'}`,
            classId: cls.id,
          },
        });
      }
      classSubjects.push(subject);
    }

    // Ensure 2 official exams exist for this class
    const examsToEnsure = [
      {
        name: 'Half Yearly Examination 2026-27',
        classId: cls.id,
        className: cls.name,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-09-12'),
        status: 'COMPLETED',
        totalMarks: 100,
        passingMarks: 33,
      },
      {
        name: 'Annual Examination 2026-27',
        classId: cls.id,
        className: cls.name,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-15'),
        status: 'PUBLISHED',
        totalMarks: 100,
        passingMarks: 33,
      },
    ];

    const classExams = [];
    for (const exDef of examsToEnsure) {
      let exam = await prisma.exam.findFirst({
        where: { name: exDef.name, classId: cls.id, deletedAt: null },
      });

      if (!exam) {
        exam = await prisma.exam.create({
          data: {
            name: exDef.name,
            classId: cls.id,
            type: 'NORMAL',
            status: exDef.status,
            board: 'CBSE / MP Board',
            subjectName: 'All Subjects',
            totalMarks: exDef.totalMarks,
            passingMarks: exDef.passingMarks,
            durationMinutes: 180,
            instructions: 'All questions are compulsory. Use blue or black pen only.',
            startDate: exDef.startDate,
            endDate: exDef.endDate,
          },
        });
        totalExamsCreated++;
      }
      classExams.push(exam);
    }

    // Ensure marks exist for each student across all subjects
    for (let sIdx = 0; sIdx < cls.students.length; sIdx++) {
      const student = cls.students[sIdx];

      // Update student particulars if missing
      await prisma.student.update({
        where: { id: student.id },
        data: {
          rollNumber: student.rollNumber || sIdx + 1,
          fatherName: student.fatherName || 'Rajesh Sharma',
          motherName: student.motherName || 'Sunita Sharma',
          dob: student.dob || new Date('2014-07-15'),
          scholarNo: student.scholarNo || `SCH-${100 + sIdx + 1}`,
          admissionDate: student.admissionDate || new Date('2024-04-01'),
          medium: student.medium || 'HINDI',
        },
      });

      // Seed marks for each exam
      for (const exam of classExams) {
        for (let subIdx = 0; subIdx < classSubjects.length; subIdx++) {
          const subject = classSubjects[subIdx];

          // Deterministic realistic scores between 60 and 97
          const seed = (sIdx * 17 + subIdx * 13 + (exam.name.includes('Annual') ? 5 : 0)) % 38;
          const score = 60 + seed; // 60 to 97
          const gradeInfo = getGrade(score);

          const existing = await prisma.mark.findFirst({
            where: {
              studentId: student.id,
              subjectId: subject.id,
              examId: exam.id,
              deletedAt: null,
            },
          });

          if (!existing) {
            await prisma.mark.create({
              data: {
                studentId: student.id,
                subjectId: subject.id,
                examId: exam.id,
                marks: score,
                grade: gradeInfo.grade,
                remarks: gradeInfo.remarks,
              },
            });
            totalMarksCreated++;
          }
        }
      }
    }
  }

  console.log(`\n✅ Marksheet Seeding Completed Successfully!`);
  console.log(`Total New Exams: ${totalExamsCreated}`);
  console.log(`Total Marks Seeded: ${totalMarksCreated}`);
}

seedMarksheetData()
  .catch((err) => {
    console.error('Error during marksheet seeding:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
