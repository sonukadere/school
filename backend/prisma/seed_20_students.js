import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();
const hash = (pwd) => bcrypt.hash(pwd, 10);

export const STUDENT_TEST_RECORDS = [
  {
    studentId: 'STU001',
    firstName: 'Aarav',
    lastName: 'Sharma',
    gender: 'MALE',
    dob: new Date('2010-05-14'),
    fatherName: 'Rajesh Sharma',
    motherName: 'Sunita Sharma',
    phone: '9000000001',
    email: 'aarav.sharma@example.test',
    address: 'Vijay Nagar, Indore, Madhya Pradesh',
    className: 'Class 10',
    section: 'A',
    rollNumber: 1,
    admissionDate: new Date('2023-04-10'),
    status: 'ACTIVE',
  },
  {
    studentId: 'STU002',
    firstName: 'Vivaan',
    lastName: 'Verma',
    gender: 'MALE',
    dob: new Date('2010-08-22'),
    fatherName: 'Amit Verma',
    motherName: 'Poonam Verma',
    phone: '9000000002',
    email: 'vivaan.verma@example.test',
    address: 'Palasia, Indore, Madhya Pradesh',
    className: 'Class 10',
    section: 'A',
    rollNumber: 2,
    admissionDate: new Date('2023-04-10'),
    status: 'ACTIVE',
  },
  {
    studentId: 'STU003',
    firstName: 'Aditya',
    lastName: 'Patel',
    gender: 'MALE',
    dob: new Date('2010-01-18'),
    fatherName: 'Mahesh Patel',
    motherName: 'Rekha Patel',
    phone: '9000000003',
    email: 'aditya.patel@example.test',
    address: 'Rau, Indore, Madhya Pradesh',
    className: 'Class 10',
    section: 'A',
    rollNumber: 3,
    admissionDate: new Date('2023-04-11'),
    status: 'ACTIVE',
  },
  {
    studentId: 'STU004',
    firstName: 'Arjun',
    lastName: 'Singh',
    gender: 'MALE',
    dob: new Date('2010-03-25'),
    fatherName: 'Vikram Singh',
    motherName: 'Meena Singh',
    phone: '9000000004',
    email: 'arjun.singh@example.test',
    address: 'Rajendra Nagar, Indore, Madhya Pradesh',
    className: 'Class 10',
    section: 'A',
    rollNumber: 4,
    admissionDate: new Date('2023-04-12'),
    status: 'ACTIVE',
  },
  {
    studentId: 'STU005',
    firstName: 'Rohan',
    lastName: 'Gupta',
    gender: 'MALE',
    dob: new Date('2010-11-09'),
    fatherName: 'Suresh Gupta',
    motherName: 'Kavita Gupta',
    phone: '9000000005',
    email: 'rohan.gupta@example.test',
    address: 'Bhawarkua, Indore, Madhya Pradesh',
    className: 'Class 10',
    section: 'A',
    rollNumber: 5,
    admissionDate: new Date('2023-04-12'),
    status: 'ACTIVE',
  },
  {
    studentId: 'STU006',
    firstName: 'Rahul',
    lastName: 'Yadav',
    gender: 'MALE',
    dob: new Date('2010-07-12'),
    fatherName: 'Dinesh Yadav',
    motherName: 'Anita Yadav',
    phone: '9000000006',
    email: 'rahul.yadav@example.test',
    address: 'Sudama Nagar, Indore, Madhya Pradesh',
    className: 'Class 10',
    section: 'A',
    rollNumber: 6,
    admissionDate: new Date('2023-04-15'),
    status: 'ACTIVE',
  },
  {
    studentId: 'STU007',
    firstName: 'Kunal',
    lastName: 'Mishra',
    gender: 'MALE',
    dob: new Date('2010-09-03'),
    fatherName: 'Sanjay Mishra',
    motherName: 'Ritu Mishra',
    phone: '9000000007',
    email: 'kunal.mishra@example.test',
    address: 'Bengali Square, Indore, Madhya Pradesh',
    className: 'Class 10',
    section: 'A',
    rollNumber: 7,
    admissionDate: new Date('2023-04-15'),
    status: 'ACTIVE',
  },
  {
    studentId: 'STU008',
    firstName: 'Ananya',
    lastName: 'Sharma',
    gender: 'FEMALE',
    dob: new Date('2010-02-17'),
    fatherName: 'Deepak Sharma',
    motherName: 'Shalini Sharma',
    phone: '9000000008',
    email: 'ananya.sharma@example.test',
    address: 'Saket Nagar, Indore, Madhya Pradesh',
    className: 'Class 10',
    section: 'A',
    rollNumber: 8,
    admissionDate: new Date('2023-04-16'),
    status: 'ACTIVE',
  },
  {
    studentId: 'STU009',
    firstName: 'Priya',
    lastName: 'Patel',
    gender: 'FEMALE',
    dob: new Date('2010-06-20'),
    fatherName: 'Ramesh Patel',
    motherName: 'Seema Patel',
    phone: '9000000009',
    email: 'priya.patel@example.test',
    address: 'Annapurna Road, Indore, Madhya Pradesh',
    className: 'Class 10',
    section: 'A',
    rollNumber: 9,
    admissionDate: new Date('2023-04-16'),
    status: 'ACTIVE',
  },
  {
    studentId: 'STU010',
    firstName: 'Sneha',
    lastName: 'Verma',
    gender: 'FEMALE',
    dob: new Date('2010-10-11'),
    fatherName: 'Prakash Verma',
    motherName: 'Neelam Verma',
    phone: '9000000010',
    email: 'sneha.verma@example.test',
    address: 'Khandwa Road, Indore, Madhya Pradesh',
    className: 'Class 10',
    section: 'A',
    rollNumber: 10,
    admissionDate: new Date('2023-04-18'),
    status: 'ACTIVE',
  },
  {
    studentId: 'STU011',
    firstName: 'Kavya',
    lastName: 'Singh',
    gender: 'FEMALE',
    dob: new Date('2010-04-28'),
    fatherName: 'Ajay Singh',
    motherName: 'Sangeeta Singh',
    phone: '9000000011',
    email: 'kavya.singh@example.test',
    address: 'LIG Colony, Indore, Madhya Pradesh',
    className: 'Class 10',
    section: 'A',
    rollNumber: 11,
    admissionDate: new Date('2023-04-18'),
    status: 'ACTIVE',
  },
  {
    studentId: 'STU012',
    firstName: 'Neha',
    lastName: 'Gupta',
    gender: 'FEMALE',
    dob: new Date('2010-12-05'),
    fatherName: 'Anil Gupta',
    motherName: 'Mamta Gupta',
    phone: '9000000012',
    email: 'neha.gupta@example.test',
    address: 'Scheme No. 54, Indore, Madhya Pradesh',
    className: 'Class 10',
    section: 'A',
    rollNumber: 12,
    admissionDate: new Date('2023-04-20'),
    status: 'ACTIVE',
  },
  {
    studentId: 'STU013',
    firstName: 'Aditi',
    lastName: 'Yadav',
    gender: 'FEMALE',
    dob: new Date('2010-03-08'),
    fatherName: 'Rajendra Yadav',
    motherName: 'Kusum Yadav',
    phone: '9000000013',
    email: 'aditi.yadav@example.test',
    address: 'Bhanwarkua, Indore, Madhya Pradesh',
    className: 'Class 10',
    section: 'A',
    rollNumber: 13,
    admissionDate: new Date('2023-04-20'),
    status: 'ACTIVE',
  },
  {
    studentId: 'STU014',
    firstName: 'Ishita',
    lastName: 'Jain',
    gender: 'FEMALE',
    dob: new Date('2010-07-29'),
    fatherName: 'Nitin Jain',
    motherName: 'Renu Jain',
    phone: '9000000014',
    email: 'ishita.jain@example.test',
    address: 'Sudama Nagar, Indore, Madhya Pradesh',
    className: 'Class 10',
    section: 'A',
    rollNumber: 14,
    admissionDate: new Date('2023-04-22'),
    status: 'ACTIVE',
  },
  {
    studentId: 'STU015',
    firstName: 'Raj',
    lastName: 'Mehta',
    gender: 'MALE',
    dob: new Date('2010-01-30'),
    fatherName: 'Manish Mehta',
    motherName: 'Alka Mehta',
    phone: '9000000015',
    email: 'raj.mehta@example.test',
    address: 'MG Road, Indore, Madhya Pradesh',
    className: 'Class 10',
    section: 'A',
    rollNumber: 15,
    admissionDate: new Date('2023-04-22'),
    status: 'ACTIVE',
  },
  {
    studentId: 'STU016',
    firstName: 'Aman',
    lastName: 'Choudhary',
    gender: 'MALE',
    dob: new Date('2010-08-16'),
    fatherName: 'Mukesh Choudhary',
    motherName: 'Sarita Choudhary',
    phone: '9000000016',
    email: 'aman.choudhary@example.test',
    address: 'Kanadia Road, Indore, Madhya Pradesh',
    className: 'Class 10',
    section: 'A',
    rollNumber: 16,
    admissionDate: new Date('2023-04-24'),
    status: 'ACTIVE',
  },
  {
    studentId: 'STU017',
    firstName: 'Saurabh',
    lastName: 'Tiwari',
    gender: 'MALE',
    dob: new Date('2010-05-07'),
    fatherName: 'Ashok Tiwari',
    motherName: 'Geeta Tiwari',
    phone: '9000000017',
    email: 'saurabh.tiwari@example.test',
    address: 'Airport Road, Indore, Madhya Pradesh',
    className: 'Class 10',
    section: 'A',
    rollNumber: 17,
    admissionDate: new Date('2023-04-24'),
    status: 'ACTIVE',
  },
  {
    studentId: 'STU018',
    firstName: 'Pooja',
    lastName: 'Joshi',
    gender: 'FEMALE',
    dob: new Date('2010-09-21'),
    fatherName: 'Pradeep Joshi',
    motherName: 'Asha Joshi',
    phone: '9000000018',
    email: 'pooja.joshi@example.test',
    address: 'Tilak Nagar, Indore, Madhya Pradesh',
    className: 'Class 10',
    section: 'A',
    rollNumber: 18,
    admissionDate: new Date('2023-04-25'),
    status: 'ACTIVE',
  },
  {
    studentId: 'STU019',
    firstName: 'Nisha',
    lastName: 'Rathore',
    gender: 'FEMALE',
    dob: new Date('2010-02-09'),
    fatherName: 'Mahendra Rathore',
    motherName: 'Lata Rathore',
    phone: '9000000019',
    email: 'nisha.rathore@example.test',
    address: 'Dwarkapuri, Indore, Madhya Pradesh',
    className: 'Class 10',
    section: 'A',
    rollNumber: 19,
    admissionDate: new Date('2023-04-25'),
    status: 'ACTIVE',
  },
  {
    studentId: 'STU020',
    firstName: 'Deepak',
    lastName: 'Malviya',
    gender: 'MALE',
    dob: new Date('2010-06-15'),
    fatherName: 'Rakesh Malviya',
    motherName: 'Sushma Malviya',
    phone: '9000000020',
    email: 'deepak.malviya@example.test',
    address: 'Mhow Naka, Indore, Madhya Pradesh',
    className: 'Class 10',
    section: 'A',
    rollNumber: 20,
    admissionDate: new Date('2023-04-26'),
    status: 'ACTIVE',
  },
];

export async function seed20Students() {
  console.log('--- Seeding 20 Full Student Records & RBAC ---');

  // 1. Ensure Class 10 Section A exists
  let class10A = await prisma.class.findUnique({
    where: { name_section: { name: 'Class 10', section: 'A' } },
  });

  if (!class10A) {
    class10A = await prisma.class.create({
      data: {
        name: 'Class 10',
        section: 'A',
        roomNumber: '601',
      },
    });
    console.log('Created Class 10 Section A');
  }

  // 2. Ensure previous sample student (if conflicting with roll 1) is adjusted
  const existingConflicting = await prisma.student.findFirst({
    where: { classId: class10A.id, rollNumber: 1, NOT: { studentId: 'STU001' } },
  });
  if (existingConflicting) {
    await prisma.student.update({
      where: { id: existingConflicting.id },
      data: { rollNumber: 99 },
    });
  }

  // 3. Ensure Teacher for Class 10 exists
  const teacher = await prisma.teacher.findFirst();

  // 4. Ensure Subjects for Class 10 exist
  let subjects10 = await prisma.subject.findMany({
    where: { classId: class10A.id, deletedAt: null },
  });

  if (subjects10.length === 0) {
    const subjectList = [
      { name: 'Mathematics', code: 'MAT-101-Class10-A' },
      { name: 'English', code: 'ENG-101-Class10-A' },
      { name: 'Science', code: 'SCI-101-Class10-A' },
      { name: 'Social Studies', code: 'SST-101-Class10-A' },
      { name: 'Computer Science', code: 'CS-101-Class10-A' },
    ];
    for (const s of subjectList) {
      const createdSub = await prisma.subject.upsert({
        where: { code: s.code },
        create: {
          name: s.name,
          code: s.code,
          classId: class10A.id,
          teacherId: teacher?.id,
        },
        update: { classId: class10A.id },
      });
      subjects10.push(createdSub);
    }
  }

  // 5. Ensure Timetable for Class 10 exists
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const times = [
    { start: '09:00 AM', end: '09:45 AM' },
    { start: '09:50 AM', end: '10:35 AM' },
    { start: '10:40 AM', end: '11:25 AM' },
    { start: '11:45 AM', end: '12:30 PM' },
    { start: '12:35 PM', end: '01:20 PM' },
  ];
  for (let d = 0; d < days.length; d++) {
    for (let t = 0; t < subjects10.length; t++) {
      const subj = subjects10[t];
      const slot = times[t] || times[0];
      const existingSlot = await prisma.timetable.findFirst({
        where: { classId: class10A.id, day: days[d], subjectId: subj.id },
      });
      if (!existingSlot) {
        await prisma.timetable.create({
          data: {
            classId: class10A.id,
            subjectId: subj.id,
            teacherId: teacher?.id,
            day: days[d],
            startTime: slot.start,
            endTime: slot.end,
          },
        });
      }
    }
  }

  // 6. Ensure Exams for Class 10 exist
  let exam10 = await prisma.exam.findUnique({
    where: { name_classId: { name: 'Mid-Term Exam', classId: class10A.id } },
  });
  if (!exam10) {
    exam10 = await prisma.exam.create({
      data: {
        name: 'Mid-Term Exam',
        classId: class10A.id,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-09-12'),
      },
    });
  }

  const defaultPasswordHash = await hash('student123');

  const seededStudents = [];

  for (const item of STUDENT_TEST_RECORDS) {
    const fullName = `${item.firstName} ${item.lastName}`.trim();
    const username = item.email.split('@')[0];

    // Create or update User record with STUDENT role
    let user = await prisma.user.findUnique({
      where: { email: item.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username,
          email: item.email,
          password: defaultPasswordHash,
          name: fullName,
          role: 'STUDENT',
          isActive: true,
        },
      });
      console.log(`[User] Created user account for ${item.email} (Role: STUDENT)`);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: fullName,
          role: 'STUDENT',
          isActive: true,
        },
      });
    }

    // Create or update Student record linked to User and Class 10 Section A
    let student = await prisma.student.findUnique({
      where: { studentId: item.studentId },
    });

    const studentData = {
      studentId: item.studentId,
      firstName: item.firstName,
      lastName: item.lastName,
      gender: item.gender,
      dob: item.dob,
      fatherName: item.fatherName,
      motherName: item.motherName,
      phone: item.phone,
      email: item.email,
      address: item.address,
      section: item.section,
      rollNumber: item.rollNumber,
      admissionDate: item.admissionDate,
      status: item.status,
      classId: class10A.id,
      userId: user.id,
    };

    if (!student) {
      student = await prisma.student.create({
        data: studentData,
      });
      console.log(`[Student] Created student profile ${item.studentId} - ${fullName} (Roll: ${item.rollNumber})`);
    } else {
      student = await prisma.student.update({
        where: { id: student.id },
        data: studentData,
      });
      console.log(`[Student] Updated student profile ${item.studentId} - ${fullName}`);
    }

    seededStudents.push(student);

    // 6. Seed Attendance records for this student
    const dates = [
      '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07',
      '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14',
    ];
    for (let dIdx = 0; dIdx < dates.length; dIdx++) {
      const dDate = new Date(`${dates[dIdx]}T00:00:00.000Z`);
      const seed = (dIdx * 3 + item.rollNumber * 7) % 20;
      const status = seed === 0 ? 'LEAVE' : seed <= 2 ? 'ABSENT' : 'PRESENT';

      await prisma.attendance.upsert({
        where: { studentId_date: { studentId: student.id, date: dDate } },
        create: {
          studentId: student.id,
          date: dDate,
          status,
          markedById: teacher?.id,
        },
        update: { status },
      });
    }

    // 7. Seed Fee voucher for this student
    const existingFee = await prisma.fee.findFirst({ where: { studentId: student.id } });
    if (!existingFee) {
      const totalFee = 5400;
      const isPaid = item.rollNumber % 3 === 0;
      const isPartial = item.rollNumber % 3 === 1;
      const paidAmount = isPaid ? totalFee : isPartial ? 2700 : 0;
      const dueAmount = totalFee - paidAmount;
      const paymentStatus = isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'PENDING';

      await prisma.fee.create({
        data: {
          studentId: student.id,
          totalFee,
          paidAmount,
          dueAmount,
          paymentStatus,
          paymentMethod: isPaid ? 'ONLINE' : isPartial ? 'CASH' : 'BANK_TRANSFER',
          paymentDate: isPaid || isPartial ? new Date('2026-07-20') : null,
        },
      });
    }

    // 8. Seed Exam Marks for this student across Class 10 subjects
    if (exam10 && subjects10.length > 0) {
      for (const subj of subjects10) {
        const existingMark = await prisma.mark.findUnique({
          where: {
            studentId_subjectId_examId: {
              studentId: student.id,
              subjectId: subj.id,
              examId: exam10.id,
            },
          },
        });
        if (!existingMark) {
          const score = 72 + ((item.rollNumber * 3 + subj.name.length * 4) % 26);
          const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : 'C';
          await prisma.mark.create({
            data: {
              studentId: student.id,
              subjectId: subj.id,
              examId: exam10.id,
              marks: score,
              grade,
              remarks: score >= 85 ? 'Excellent performance' : 'Good performance',
            },
          });
        }
      }
    }
  }

  console.log(`\n✅ Successfully seeded and connected all ${seededStudents.length} students with RBAC & profiles!`);
}

async function runStandalone() {
  try {
    await seed20Students();
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runStandalone();
}
