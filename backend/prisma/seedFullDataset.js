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

// Protected user emails that must NEVER be deleted
const PROTECTED_EMAILS = new Set([
  'superadmin@school.com',
  'admin@school.com',
  'accountant@school.com',
  'sonukadere1506@gmail.com',
]);

async function safeCleanup() {
  console.log('==================================================');
  console.log('  PHASE 1: SAFE CLEANUP OF TEST & DEMO DATA');
  console.log('==================================================');

  // 1. Clear Payments, Receipts, and Fee Invoices
  console.log('Clearing old payments, receipts, and invoices...');
  await prisma.paymentReceipt.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.feeInvoice.deleteMany({});
  await prisma.fee.deleteMany({});
  await prisma.feeStructure.deleteMany({});

  // 2. Clear Marks, Exam Attempts, Exam Questions, and Exams
  console.log('Clearing old marks, exam questions, and exams...');
  await prisma.mark.deleteMany({});
  await prisma.examAttempt.deleteMany({});
  await prisma.examQuestion.deleteMany({});
  await prisma.exam.deleteMany({});

  // 3. Clear Timetable and Attendance
  console.log('Clearing old timetables and attendance...');
  await prisma.timetable.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.teacherAttendance.deleteMany({});

  // 4. Clear Transfer Certificates, Notifications, Audit Logs
  await prisma.transferCertificate.deleteMany({});

  // 5. Find and remove old demo Students and their linked Users
  console.log('Cleaning old demo students...');
  const existingStudents = await prisma.student.findMany({ select: { id: true, userId: true } });
  const studentUserIds = existingStudents.map((s) => s.userId).filter(Boolean);
  
  await prisma.student.deleteMany({});
  if (studentUserIds.length > 0) {
    await prisma.user.deleteMany({
      where: {
        id: { in: studentUserIds },
        email: { notIn: Array.from(PROTECTED_EMAILS) },
      },
    });
  }

  // 6. Clean old Parents and linked Users
  console.log('Cleaning old demo parents...');
  const existingParents = await prisma.parent.findMany({ select: { id: true, userId: true } });
  const parentUserIds = existingParents.map((p) => p.userId).filter(Boolean);
  await prisma.parent.deleteMany({});
  if (parentUserIds.length > 0) {
    await prisma.user.deleteMany({
      where: {
        id: { in: parentUserIds },
        email: { notIn: Array.from(PROTECTED_EMAILS) },
      },
    });
  }

  // 7. Delete Subjects and Classes before Teachers (relational dependency)
  console.log('Cleaning old subjects and classes...');
  await prisma.subject.deleteMany({});
  await prisma.class.deleteMany({});

  // 8. Clean Teacher Salary Structures and old demo Teachers (except sonukadere1506@gmail.com)
  console.log('Cleaning old demo teachers (preserving real accounts)...');
  await prisma.teacherSalaryStructure.deleteMany({});
  const demoTeachers = await prisma.teacher.findMany({
    where: {
      email: { notIn: Array.from(PROTECTED_EMAILS) },
    },
    select: { id: true, userId: true },
  });
  const demoTeacherIds = demoTeachers.map((t) => t.id);
  const demoTeacherUserIds = demoTeachers.map((t) => t.userId).filter(Boolean);

  await prisma.teacher.deleteMany({
    where: { id: { in: demoTeacherIds } },
  });
  if (demoTeacherUserIds.length > 0) {
    await prisma.user.deleteMany({
      where: {
        id: { in: demoTeacherUserIds },
        email: { notIn: Array.from(PROTECTED_EMAILS) },
      },
    });
  }

  // 9. Clean Receptionist user and staff if exists
  console.log('Cleaning receptionist accounts as requested...');
  const recepUser = await prisma.user.findFirst({ where: { role: 'RECEPTIONIST' } });
  if (recepUser && !PROTECTED_EMAILS.has(recepUser.email)) {
    await prisma.staff.deleteMany({ where: { userId: recepUser.id } });
    await prisma.user.delete({ where: { id: recepUser.id } });
  }

  console.log('✅ Phase 1: Safe cleanup completed successfully!\n');
}

async function seedData() {
  console.log('==================================================');
  console.log('  PHASE 2: SEEDING COMPLETE RELATIONAL DATASET');
  console.log('==================================================');

  // -------------------------------------------------------------
  // 1. Settings
  // -------------------------------------------------------------
  console.log('1. Setting up School and General Settings...');
  const setting = await prisma.setting.upsert({
    where: { id: 'school-settings' },
    create: {
      id: 'school-settings',
      schoolName: 'Daily Day Academy',
      address: '123 Education Street, New Delhi - 110001',
      phone: '+91 98765 43210',
      email: 'info@dailydayacademy.edu',
      academicYear: '2026-2027',
    },
    update: {
      schoolName: 'Daily Day Academy',
      academicYear: '2026-2027',
    },
  });

  // -------------------------------------------------------------
  // 2. Core Administrative Accounts
  // -------------------------------------------------------------
  console.log('2. Ensuring Core Administrative Logins...');
  // Super Admin
  await prisma.user.upsert({
    where: { email: 'superadmin@school.com' },
    create: {
      username: 'superadmin',
      email: 'superadmin@school.com',
      password: await hash('superadmin123'),
      name: 'Chief Super Administrator',
      role: 'SUPER_ADMIN',
    },
    update: { role: 'SUPER_ADMIN', name: 'Chief Super Administrator' },
  });

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    create: {
      username: 'admin',
      email: 'admin@school.com',
      password: await hash('admin123'),
      name: 'System Administrator',
      role: 'ADMIN',
    },
    update: { role: 'ADMIN', name: 'System Administrator' },
  });

  // Accountant
  await prisma.user.upsert({
    where: { email: 'accountant@school.com' },
    create: {
      username: 'accountant',
      email: 'accountant@school.com',
      password: await hash('accountant123'),
      name: 'Ramesh Verma',
      role: 'ACCOUNTANT',
    },
    update: { role: 'ACCOUNTANT' },
  });

  // -------------------------------------------------------------
  // 3. Teachers (10 Teachers)
  // -------------------------------------------------------------
  console.log('3. Seeding 10 Teachers with User accounts...');
  const teacherConfigs = [
    {
      teacherId: 'TCH-001',
      name: 'Priya Sharma',
      email: 'teacher@school.com', // Primary demo teacher
      phone: '9871100001',
      qualification: 'M.Sc. Mathematics, B.Ed.',
      salary: 58000,
      joiningDate: new Date('2022-04-15'),
      subjectSpecialty: 'Mathematics',
    },
    {
      teacherId: 'TCH-002',
      name: 'Manish Trivedi',
      email: 'manish.trivedi@school.com',
      phone: '9871100002',
      qualification: 'M.Sc. Physics, M.Ed.',
      salary: 56000,
      joiningDate: new Date('2022-06-01'),
      subjectSpecialty: 'Science',
    },
    {
      teacherId: 'TCH-003',
      name: 'Sunita Rao',
      email: 'sunita.rao@school.com',
      phone: '9871100003',
      qualification: 'M.A. English Literature, B.Ed.',
      salary: 54000,
      joiningDate: new Date('2023-01-10'),
      subjectSpecialty: 'English',
    },
    {
      teacherId: 'TCH-004',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@school.com',
      phone: '9871100004',
      qualification: 'M.A. History, B.Ed.',
      salary: 53000,
      joiningDate: new Date('2023-03-20'),
      subjectSpecialty: 'Social Studies',
    },
    {
      teacherId: 'TCH-005',
      name: 'Ananya Gupta',
      email: 'ananya.gupta@school.com',
      phone: '9871100005',
      qualification: 'M.A. Hindi, Ph.D.',
      salary: 55000,
      joiningDate: new Date('2023-07-01'),
      subjectSpecialty: 'Hindi',
    },
    {
      teacherId: 'TCH-006',
      name: 'Vikram Malhotra',
      email: 'vikram.malhotra@school.com',
      phone: '9871100006',
      qualification: 'B.Tech Computer Science',
      salary: 60000,
      joiningDate: new Date('2023-09-15'),
      subjectSpecialty: 'Computer Science',
    },
    {
      teacherId: 'TCH-007',
      name: 'Neha Deshmukh',
      email: 'neha.deshmukh@school.com',
      phone: '9871100007',
      qualification: 'M.Sc. Chemistry, B.Ed.',
      salary: 55000,
      joiningDate: new Date('2024-02-01'),
      subjectSpecialty: 'Science',
    },
    {
      teacherId: 'TCH-008',
      name: 'Amit Singhal',
      email: 'amit.singhal@school.com',
      phone: '9871100008',
      qualification: 'M.Sc. Mathematics',
      salary: 54000,
      joiningDate: new Date('2024-04-10'),
      subjectSpecialty: 'Mathematics',
    },
    {
      teacherId: 'TCH-009',
      name: 'Kavita Reddy',
      email: 'kavita.reddy@school.com',
      phone: '9871100009',
      qualification: 'M.A. English, B.Ed.',
      salary: 52000,
      joiningDate: new Date('2024-06-01'),
      subjectSpecialty: 'English',
    },
    {
      teacherId: 'TCH-010',
      name: 'Deepak Chopra',
      email: 'deepak.chopra@school.com',
      phone: '9871100010',
      qualification: 'M.A. Geography, B.Ed.',
      salary: 53000,
      joiningDate: new Date('2024-08-01'),
      subjectSpecialty: 'Social Studies',
    },
  ];

  const teachers = [];
  for (const tc of teacherConfigs) {
    const username = tc.email.split('@')[0];
    const user = await prisma.user.create({
      data: {
        username,
        email: tc.email,
        password: await hash('teacher123'),
        name: tc.name,
        role: 'TEACHER',
      },
    });

    const teacher = await prisma.teacher.create({
      data: {
        teacherId: tc.teacherId,
        name: tc.name,
        email: tc.email,
        phone: tc.phone,
        qualification: tc.qualification,
        salary: tc.salary,
        joiningDate: tc.joiningDate,
        userId: user.id,
      },
    });
    teachers.push(teacher);
  }
  console.log(`✅ Seeded ${teachers.length} teachers.`);

  // -------------------------------------------------------------
  // 4. Classes & Sections (10 Classes)
  // -------------------------------------------------------------
  console.log('4. Seeding 10 Classes and assigning Class Teachers...');
  const classConfigs = [
    { name: 'Class 6', section: 'A', roomNumber: '601', teacherIdx: 0 },
    { name: 'Class 6', section: 'B', roomNumber: '602', teacherIdx: 1 },
    { name: 'Class 7', section: 'A', roomNumber: '701', teacherIdx: 2 },
    { name: 'Class 7', section: 'B', roomNumber: '702', teacherIdx: 3 },
    { name: 'Class 8', section: 'A', roomNumber: '801', teacherIdx: 4 },
    { name: 'Class 8', section: 'B', roomNumber: '802', teacherIdx: 5 },
    { name: 'Class 9', section: 'A', roomNumber: '901', teacherIdx: 6 },
    { name: 'Class 9', section: 'B', roomNumber: '902', teacherIdx: 7 },
    { name: 'Class 10', section: 'A', roomNumber: '1001', teacherIdx: 8 },
    { name: 'Class 10', section: 'B', roomNumber: '1002', teacherIdx: 9 },
  ];

  const classes = [];
  for (const cc of classConfigs) {
    const cls = await prisma.class.create({
      data: {
        name: cc.name,
        section: cc.section,
        roomNumber: cc.roomNumber,
        classTeacherId: teachers[cc.teacherIdx].id,
      },
    });
    classes.push(cls);
  }
  console.log(`✅ Seeded ${classes.length} classes.`);

  // -------------------------------------------------------------
  // 5. Subjects (6 subjects per class = 60 subjects)
  // -------------------------------------------------------------
  console.log('5. Seeding Subjects across classes with teacher mappings...');
  const subjectTemplates = [
    { name: 'Mathematics', codePrefix: 'MATH', teacherIdx: 0 },
    { name: 'Science', codePrefix: 'SCI', teacherIdx: 1 },
    { name: 'English', codePrefix: 'ENG', teacherIdx: 2 },
    { name: 'Social Studies', codePrefix: 'SST', teacherIdx: 3 },
    { name: 'Hindi', codePrefix: 'HIN', teacherIdx: 4 },
    { name: 'Computer Science', codePrefix: 'CS', teacherIdx: 5 },
  ];

  const subjectsByClass = {};
  for (const cls of classes) {
    subjectsByClass[cls.id] = [];
    for (const st of subjectTemplates) {
      const code = `${st.codePrefix}-${cls.name.replace(/\s+/g, '')}${cls.section}`;
      const sub = await prisma.subject.create({
        data: {
          name: st.name,
          code,
          classId: cls.id,
          teacherId: teachers[st.teacherIdx].id,
        },
      });
      subjectsByClass[cls.id].push(sub);
    }
  }
  console.log('✅ Seeded 60 subjects (6 per class).');

  // -------------------------------------------------------------
  // 6. Timetable
  // -------------------------------------------------------------
  console.log('6. Seeding Timetable schedule...');
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const dbPeriods = await prisma.period.findMany({
    where: { isBreak: false },
    orderBy: [{ sortOrder: 'asc' }, { startTime: 'asc' }],
  });
  const targetPeriods = dbPeriods.slice(0, 5);

  let timetableCount = 0;
  for (let cIdx = 0; cIdx < classes.length; cIdx++) {
    const cls = classes[cIdx];
    const classSubs = subjectsByClass[cls.id];
    for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
      const day = days[dayIdx];
      for (let pIdx = 0; pIdx < targetPeriods.length; pIdx++) {
        const period = targetPeriods[pIdx];
        const sub = classSubs[(dayIdx + pIdx) % classSubs.length];
        const teacher = teachers.length > 0 ? teachers[(cIdx + pIdx + dayIdx) % teachers.length] : null;

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
        timetableCount++;
      }
    }
  }
  console.log(`✅ Seeded ${timetableCount} timetable slots covering Periods 1 to 5.`);

  // -------------------------------------------------------------
  // 7. 100 Students & Parents (10 students per class)
  // -------------------------------------------------------------
  console.log('7. Seeding 100 Students (10 per class) with Users & Parents...');
  const firstNamesBoys = [
    'Aarav', 'Aditya', 'Rohan', 'Vikrant', 'Kabir', 'Devansh', 'Arjun', 'Shaurya', 'Reyansh', 'Ishaan',
    'Dhruv', 'Siddharth', 'Tanmay', 'Varun', 'Pranav', 'Yash', 'Atharv', 'Aniket', 'Ayush', 'Kunal',
    'Aryan', 'Shivam', 'Kartik', 'Harsh', 'Mayank', 'Rishabh', 'Abhinav', 'Gaurav', 'Manish', 'Nikhil',
    'Raghav', 'Tejas', 'Samarth', 'Daksh', 'Chirag', 'Tushar', 'Vivek', 'Hardik', 'Jayesh', 'Lalit',
    'Akash', 'Bhavesh', 'Chetan', 'Deepak', 'Hemant', 'Jatin', 'Kamal', 'Madhav', 'Pankaj', 'Rohit'
  ];

  const firstNamesGirls = [
    'Ayesha', 'Ananya', 'Myra', 'Sneha', 'Priya', 'Diya', 'Isha', 'Riya', 'Kavya', 'Saanvi',
    'Tanvi', 'Navya', 'Avni', 'Kiara', 'Pooja', 'Shreya', 'Meera', 'Roshni', 'Simran', 'Kriti',
    'Aditi', 'Bhavna', 'Charu', 'Divya', 'Garima', 'Harshita', 'Jyoti', 'Komal', 'Lavanya', 'Muskan',
    'Nandini', 'Prachi', 'Radhika', 'Sakshi', 'Trisha', 'Urvi', 'Vanshika', 'Yamini', 'Zoya', 'Alka',
    'Deepali', 'Ekta', 'Geetika', 'Heena', 'Indu', 'Jaya', 'Kajal', 'Lata', 'Mansi', 'Neha'
  ];

  const lastNames = [
    'Sharma', 'Verma', 'Khan', 'Patel', 'Reddy', 'Iyer', 'Gupta', 'Singh', 'Malhotra', 'Joshi',
    'Mehta', 'Nair', 'Das', 'Bhatia', 'Saxena', 'Chawla', 'Agarwal', 'Deshmukh', 'Mishra', 'Chopra'
  ];

  const students = [];
  let studentGlobalIndex = 1;

  for (let cIdx = 0; cIdx < classes.length; cIdx++) {
    const cls = classes[cIdx];

    for (let r = 1; r <= 10; r++) {
      const isFemale = (studentGlobalIndex % 2) === 1;
      const firstName = isFemale
        ? firstNamesGirls[(studentGlobalIndex - 1) % firstNamesGirls.length]
        : firstNamesBoys[(studentGlobalIndex - 1) % firstNamesBoys.length];
      const lastName = lastNames[(studentGlobalIndex * 3 + r) % lastNames.length];
      const studentId = `STU-2026-${String(studentGlobalIndex).padStart(3, '0')}`;
      
      // Class 10 (A) first student is the demo student account: student@school.com
      const isDemoStudent = cls.name === 'Class 10' && cls.section === 'A' && r === 1;
      const email = isDemoStudent ? 'student@school.com' : `student${studentGlobalIndex}@school.com`;
      const username = isDemoStudent ? 'student' : `stu-2026-${String(studentGlobalIndex).padStart(3, '0')}`;

      // Create Student User
      const sUser = await prisma.user.create({
        data: {
          username,
          email,
          password: await hash('student123'),
          name: isDemoStudent ? 'Ayesha Khan' : `${firstName} ${lastName}`,
          role: 'STUDENT',
        },
      });

      // Create Parent
      const fatherFirst = firstNamesBoys[(studentGlobalIndex + 5) % firstNamesBoys.length];
      const motherFirst = firstNamesGirls[(studentGlobalIndex + 7) % firstNamesGirls.length];
      const pEmail = `parent${studentGlobalIndex}@school.com`;
      
      const pUser = await prisma.user.create({
        data: {
          username: `par-2026-${String(studentGlobalIndex).padStart(3, '0')}`,
          email: pEmail,
          password: await hash('parent123'),
          name: `${fatherFirst} ${lastName}`,
          role: 'PARENT',
        },
      });

      const parent = await prisma.parent.create({
        data: {
          parentId: `PAR-2026-${String(studentGlobalIndex).padStart(3, '0')}`,
          firstName: fatherFirst,
          lastName,
          email: pEmail,
          phone: `98200${String(10000 + studentGlobalIndex).slice(1)}`,
          occupation: ['Engineer', 'Doctor', 'Businessman', 'Teacher', 'Architect', 'Civil Servant'][studentGlobalIndex % 6],
          relation: 'Father',
          userId: pUser.id,
        },
      });

      // Birth date: Class 6 is ~11 yrs, Class 10 is ~15 yrs
      const birthYear = 2015 - Math.floor(cIdx / 2);
      const dob = new Date(`${birthYear}-0${(studentGlobalIndex % 9) + 1}-15`);

      const student = await prisma.student.create({
        data: {
          studentId,
          firstName: isDemoStudent ? 'Ayesha' : firstName,
          lastName: isDemoStudent ? 'Khan' : lastName,
          email,
          phone: `98700${String(10000 + studentGlobalIndex).slice(1)}`,
          gender: isDemoStudent ? 'FEMALE' : (isFemale ? 'FEMALE' : 'MALE'),
          dob,
          fatherName: `${fatherFirst} ${lastName}`,
          motherName: `${motherFirst} ${lastName}`,
          address: `${10 + (studentGlobalIndex % 90)}, Block ${(studentGlobalIndex % 8) + 1}, Vasant Vihar, New Delhi`,
          rollNumber: r,
          admissionDate: new Date('2024-04-05'),
          status: 'ACTIVE',
          medium: studentGlobalIndex % 3 === 0 ? 'HINDI' : 'ENGLISH',
          category: ['GEN', 'OBC', 'SC', 'ST'][studentGlobalIndex % 4],
          classId: cls.id,
          parentId: parent.id,
          userId: sUser.id,
        },
      });

      students.push(student);
      studentGlobalIndex++;
    }
  }
  console.log(`✅ Seeded ${students.length} students across 10 classes.`);

  // -------------------------------------------------------------
  // 8. Daily Attendance (Past 10 instructional days)
  // -------------------------------------------------------------
  console.log('8. Seeding 10 Days Attendance for all 100 students and 10 teachers...');
  const attendanceDates = [
    '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11',
    '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18',
  ];

  let studentAttCount = 0;
  for (let dIdx = 0; dIdx < attendanceDates.length; dIdx++) {
    const date = new Date(`${attendanceDates[dIdx]}T00:00:00.000Z`);

    const studentAttBatch = [];
    for (let sIdx = 0; sIdx < students.length; sIdx++) {
      const s = students[sIdx];
      const hashVal = (sIdx * 17 + dIdx * 23) % 100;
      const status = hashVal < 85 ? 'PRESENT' : hashVal < 95 ? 'ABSENT' : 'LEAVE';

      studentAttBatch.push({
        studentId: s.id,
        date,
        status,
        markedById: teachers[0].id,
      });
      studentAttCount++;
    }
    await prisma.attendance.createMany({ data: studentAttBatch });

    const teacherAttBatch = teachers.map((t) => ({
      teacherId: t.id,
      date,
      status: 'PRESENT',
    }));
    await prisma.teacherAttendance.createMany({ data: teacherAttBatch });
  }
  console.log(`✅ Seeded ${studentAttCount} student attendance records and 100 teacher attendance records.`);

  // -------------------------------------------------------------
  // 9. Exams & Marks (Mid-Term & Final Exams)
  // -------------------------------------------------------------
  console.log('9. Seeding Exams and Marks with grades and remarks...');
  let totalMarksCount = 0;

  for (const cls of classes) {
    const classSubs = subjectsByClass[cls.id];
    const classStudents = students.filter((s) => s.classId === cls.id);

    // Mid-Term Exam (COMPLETED)
    const midTerm = await prisma.exam.create({
      data: {
        name: `Term 1 Mid-Term Examination 2026`,
        type: 'NORMAL',
        status: 'COMPLETED',
        startDate: new Date('2026-08-10'),
        endDate: new Date('2026-08-20'),
        board: 'CBSE',
        totalMarks: 100,
        passingMarks: 33,
        durationMinutes: 180,
        instructions: 'Attempt all questions. Calculators are strictly prohibited.',
        classId: cls.id,
      },
    });

    // Final Exam (SCHEDULED)
    await prisma.exam.create({
      data: {
        name: `Term 1 Final Examination 2026`,
        type: 'NORMAL',
        status: 'SCHEDULED',
        startDate: new Date('2026-10-15'),
        endDate: new Date('2026-10-25'),
        board: 'CBSE',
        totalMarks: 100,
        passingMarks: 33,
        durationMinutes: 180,
        instructions: 'Admit card and identity card mandatory in examination hall.',
        classId: cls.id,
      },
    });

    // Enter marks for Mid-Term exam
    const marksBatch = [];
    for (const st of classStudents) {
      for (const sub of classSubs) {
        // Pseudo-random deterministic marks between 45 and 98
        const studentSeed = parseInt(st.studentId.slice(-3), 10);
        const subSeed = sub.name.length;
        const rawScore = 48 + ((studentSeed * 13 + subSeed * 7) % 51);
        
        let grade = 'C1';
        let remarks = 'Satisfactory performance. Regular practice needed.';
        if (rawScore >= 91) {
          grade = 'A1';
          remarks = 'Outstanding performance! Demonstrates exceptional conceptual mastery.';
        } else if (rawScore >= 81) {
          grade = 'A2';
          remarks = 'Excellent work. Shows deep understanding and diligence.';
        } else if (rawScore >= 71) {
          grade = 'B1';
          remarks = 'Very good. Consistent performance throughout the syllabus.';
        } else if (rawScore >= 61) {
          grade = 'B2';
          remarks = 'Good effort. Can score higher with systematic revision.';
        } else if (rawScore >= 51) {
          grade = 'C1';
          remarks = 'Average. Focus on core problem-solving techniques.';
        }

        marksBatch.push({
          marks: rawScore,
          grade,
          remarks,
          studentId: st.id,
          subjectId: sub.id,
          examId: midTerm.id,
        });
        totalMarksCount++;
      }
    }
    await prisma.mark.createMany({ data: marksBatch });
  }
  console.log(`✅ Seeded ${totalMarksCount} marks records across all classes.`);

  // -------------------------------------------------------------
  // 10. Fee Structures, Invoices, Payments & Receipts
  // -------------------------------------------------------------
  console.log('10. Seeding Fee Structures, Invoices (Paid, Partial, Pending, Overdue), and Receipts...');

  // Create Fee Structures per class
  const feeTypes = [
    { feeType: 'Tuition Fee', totalFee: 18000, lateFee: 500, description: 'Annual general instructional and tuition fee' },
    { feeType: 'Examination Fee', totalFee: 2500, lateFee: 200, description: 'Examination papers and marksheet evaluation fee' },
    { feeType: 'Computer Lab Fee', totalFee: 3500, lateFee: 150, description: 'Computer lab access, internet and coding software' },
    { feeType: 'Sports & Activity Fee', totalFee: 1500, lateFee: 100, description: 'Annual sports, equipment and co-curricular charges' },
  ];

  for (const cls of classes) {
    for (const ft of feeTypes) {
      await prisma.feeStructure.create({
        data: {
          academicYear: '2026-2027',
          classId: cls.id,
          feeType: ft.feeType,
          totalFee: ft.totalFee,
          dueDate: new Date('2026-10-31'),
          lateFee: ft.lateFee,
          description: ft.description,
          status: 'ACTIVE',
        },
      });
    }
  }
  console.log('✅ Seeded Fee Structures for all 10 classes.');

  // Create Invoices for 100 Students:
  // 25 Paid, 25 Partial, 25 Pending, 25 Overdue
  const paymentMethods = ['UPI', 'CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE'];
  let invoiceCount = 0;
  let paymentCount = 0;

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const category = i % 4; // 0 = PAID, 1 = PARTIAL, 2 = PENDING, 3 = OVERDUE
    const invoiceNumber = `INV/2026/${String(i + 1).padStart(4, '0')}`;
    
    const baseTotalFee = 25500;
    
    // Discounts on select students
    let discount = 0;
    if (i % 10 === 0) discount = 2500; // Merit scholarship
    else if (i % 10 === 5) discount = 1500; // Sibling discount

    const feeAfterDiscount = baseTotalFee - discount;
    let lateFee = 0;
    let paidAmount = 0;
    let pendingAmount = feeAfterDiscount;
    let status = 'PENDING';
    let dueDate = new Date('2026-11-30');

    if (category === 0) {
      // 100% PAID
      status = 'PAID';
      paidAmount = feeAfterDiscount;
      pendingAmount = 0;
      dueDate = new Date('2026-10-15');
    } else if (category === 1) {
      // PARTIAL
      status = 'PARTIAL';
      paidAmount = 13000;
      pendingAmount = feeAfterDiscount - paidAmount;
      dueDate = new Date('2026-11-15');
    } else if (category === 2) {
      // PENDING
      status = 'PENDING';
      paidAmount = 0;
      pendingAmount = feeAfterDiscount;
      dueDate = new Date('2026-11-30');
    } else if (category === 3) {
      // OVERDUE
      status = 'OVERDUE';
      lateFee = 500;
      paidAmount = 0;
      pendingAmount = feeAfterDiscount + lateFee;
      dueDate = new Date('2026-08-31'); // Past due
    }

    const finalAmount = feeAfterDiscount + lateFee;

    const invoice = await prisma.feeInvoice.create({
      data: {
        invoiceNumber,
        studentId: s.id,
        academicYear: '2026-2027',
        feeType: 'Annual Comprehensive School Fee',
        totalFee: baseTotalFee,
        discount,
        lateFee,
        finalAmount,
        paidAmount,
        pendingAmount,
        dueDate,
        status,
      },
    });
    invoiceCount++;

    // Record Payments and Receipts for PAID and PARTIAL invoices
    if (paidAmount > 0) {
      const receiptNumber = `RCPT/2026/${String(paymentCount + 1).padStart(4, '0')}`;
      const paymentDate = new Date(Date.now() - (paymentCount + 1) * 86400000 * 1.5);
      const payMethod = paymentMethods[paymentCount % paymentMethods.length];

      const payment = await prisma.payment.create({
        data: {
          receiptNumber,
          studentId: s.id,
          academicYear: '2026-2027',
          invoiceId: invoice.id,
          feeType: 'Annual Comprehensive School Fee',
          amount: paidAmount,
          previousDue: finalAmount,
          remainingDue: pendingAmount,
          paymentDate,
          paymentMethod: payMethod,
          paymentStatus: category === 0 ? 'PAID' : 'PARTIAL',
          transactionId: `TXN-2026-${String(100000 + paymentCount + 1)}`,
          referenceNumber: `REF-2026-${String(200000 + paymentCount + 1)}`,
          notes: category === 0 ? 'Full annual fee settlement received' : 'First installment fee receipt',
          createdById: admin.id,
        },
      });

      // Payment Receipt with metadata
      const receiptMeta = {
        school: {
          name: setting.schoolName,
          address: setting.address,
          phone: setting.phone,
          email: setting.email,
          affiliation: 'CBSE-AFF-2026-9921',
        },
        student: {
          studentId: s.studentId,
          name: `${s.firstName} ${s.lastName}`,
          class: classes.find((c) => c.id === s.classId)?.name,
          section: classes.find((c) => c.id === s.classId)?.section,
          fatherName: s.fatherName,
        },
        payment: {
          receiptNumber,
          transactionId: payment.transactionId,
          amount: paidAmount,
          method: payMethod,
          date: paymentDate.toISOString(),
          status: payment.paymentStatus,
          remainingDue: pendingAmount,
        },
      };

      await prisma.paymentReceipt.create({
        data: {
          receiptNumber,
          paymentId: payment.id,
          invoiceId: invoice.id,
          studentId: s.id,
          receiptDate: paymentDate,
          generatedById: admin.id,
          metadata: JSON.stringify(receiptMeta),
        },
      });

      paymentCount++;
    }
  }

  console.log(`✅ Seeded ${invoiceCount} fee invoices (25 Paid, 25 Partial, 25 Pending, 25 Overdue).`);
  console.log(`✅ Seeded ${paymentCount} payments and payment receipts with transaction IDs.`);

  console.log('\n==================================================');
  console.log('  DATASET SEEDING COMPLETE!');
  console.log('==================================================');
}

async function main() {
  try {
    await safeCleanup();
    await seedData();
  } catch (error) {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
