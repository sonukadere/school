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

async function main() {
  console.log('--- Starting Database Seeding ---');

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@school.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';

  // 1. Settings
  let setting = await prisma.setting.findFirst();
  if (!setting) {
    setting = await prisma.setting.create({
      data: {
        id: 'school-settings',
        schoolName: 'Daily Day Academy',
        address: '123 Education Street, New Delhi - 110001',
        phone: '+91 98765 43210',
        email: 'info@dailydayacademy.edu',
        academicYear: '2026-2027',
      },
    });
    console.log('Seeded school settings: Daily Day Academy');
  } else {
    await prisma.setting.update({
      where: { id: setting.id },
      data: {
        schoolName: 'Daily Day Academy',
        address: '123 Education Street, New Delhi - 110001',
        phone: '+91 98765 43210',
        email: 'info@dailydayacademy.edu',
        academicYear: '2026-2027',
      },
    });
  }

  // 2. Super Admin User & Admin User
  let superAdmin = await prisma.user.findUnique({ where: { email: 'superadmin@school.com' } });
  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        username: 'superadmin',
        email: 'superadmin@school.com',
        password: await hash('superadmin123'),
        name: 'Chief Super Administrator',
        role: 'SUPER_ADMIN',
      },
    });
    console.log('Seeded super admin user: superadmin@school.com');
  } else {
    await prisma.user.update({
      where: { id: superAdmin.id },
      data: { role: 'SUPER_ADMIN', name: 'Chief Super Administrator' },
    });
  }

  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: adminEmail,
        password: await hash(adminPassword),
        name: adminName,
        role: 'ADMIN',
      },
    });
    console.log(`Seeded admin user: ${adminEmail}`);
  }

  // 3. Classes
  const classDefs = [
    { name: 'Class 5', section: 'A', roomNumber: '101' },
    { name: 'Class 6', section: 'A', roomNumber: '201' },
    { name: 'Class 6', section: 'B', roomNumber: '202' },
    { name: 'Class 7', section: 'A', roomNumber: '301' },
    { name: 'Class 8', section: 'A', roomNumber: '401' },
    { name: 'Class 9', section: 'A', roomNumber: '501' },
    { name: 'Class 10', section: 'A', roomNumber: '601' },
  ];

  const classes = [];
  for (const c of classDefs) {
    let existing = await prisma.class.findFirst({
      where: { name: c.name, section: c.section, deletedAt: null },
    });
    if (!existing) {
      existing = await prisma.class.create({ data: c });
    }
    classes.push(existing);
  }
  console.log(`Seeded ${classes.length} classes.`);

  const class6A = classes.find((c) => c.name === 'Class 6' && c.section === 'A') || classes[1];

  // 4. Teachers & Logins
  const teacherDefs = [
    {
      teacherId: 'TCH-001',
      name: 'Priya Sharma',
      email: 'teacher@school.com',
      phone: '9811111111',
      qualification: 'M.Sc. Mathematics, B.Ed.',
      salary: 55000,
      subjectName: 'Mathematics',
      className: 'Class 6',
    },
    {
      teacherId: 'TCH-002',
      name: 'Manish Trivedi',
      email: 'manish@school.com',
      phone: '9811111112',
      qualification: 'M.Sc. Physics',
      salary: 52000,
      subjectName: 'Science',
      className: 'Class 7',
    },
    {
      teacherId: 'TCH-003',
      name: 'Sunita Rao',
      email: 'sunita@school.com',
      phone: '9811111113',
      qualification: 'M.A. English Literature',
      salary: 48000,
      subjectName: 'English',
      className: 'Class 8',
    },
    {
      teacherId: 'TCH-004',
      name: 'Rajesh Kumar',
      email: 'rajesh@school.com',
      phone: '9811111114',
      qualification: 'M.Sc. Chemistry',
      salary: 54000,
      subjectName: 'Physics',
      className: 'Class 9',
    },
    {
      teacherId: 'TCH-005',
      name: 'Ananya Gupta',
      email: 'ananya@school.com',
      phone: '9811111115',
      qualification: 'M.A. History',
      salary: 47000,
      subjectName: 'History',
      className: 'Class 10',
    },
  ];

  const teachers = [];
  for (const t of teacherDefs) {
    let teacherUser = await prisma.user.findUnique({ where: { email: t.email } });
    if (!teacherUser) {
      teacherUser = await prisma.user.create({
        data: {
          username: t.email.split('@')[0],
          email: t.email,
          password: await hash('teacher123'),
          name: t.name,
          role: 'TEACHER',
        },
      });
    }

    let teacher = await prisma.teacher.findUnique({ where: { teacherId: t.teacherId } });
    if (!teacher) {
      teacher = await prisma.teacher.create({
        data: {
          teacherId: t.teacherId,
          name: t.name,
          email: t.email,
          phone: t.phone,
          qualification: t.qualification,
          salary: t.salary,
          joiningDate: new Date('2024-06-01'),
          userId: teacherUser.id,
        },
      });
    }
    teachers.push(teacher);
  }
  console.log(`Seeded ${teachers.length} teachers.`);

  // Set class teacher for Class 6-A
  if (teachers[0] && class6A) {
    await prisma.class.update({
      where: { id: class6A.id },
      data: { classTeacherId: teachers[0].id },
    });
  }

  // 5. Subjects across classes
  const subjectList = [
    { name: 'Mathematics', code: 'MAT-101' },
    { name: 'English', code: 'ENG-101' },
    { name: 'Science', code: 'SCI-101' },
    { name: 'Social Studies', code: 'SST-101' },
    { name: 'Computer Science', code: 'CS-101' },
  ];

  const subjects = [];
  for (const c of classes) {
    for (let i = 0; i < subjectList.length; i++) {
      const s = subjectList[i];
      let sub = await prisma.subject.findFirst({
        where: { name: s.name, classId: c.id, deletedAt: null },
      });
      if (!sub) {
        sub = await prisma.subject.create({
          data: {
            name: s.name,
            code: `${s.code}-${c.name.replace(/\s+/g, '')}`,
            classId: c.id,
            teacherId: teachers[i % teachers.length]?.id,
          },
        });
      }
      subjects.push(sub);
    }
  }
  console.log(`Seeded ${subjects.length} subjects.`);

  // 6. Parents & Logins
  const parentDefs = [
    { parentId: 'PAR-001', firstName: 'Tariq', lastName: 'Khan', email: 'parent@school.com', phone: '9812222201', occupation: 'Architect' },
    { parentId: 'PAR-002', firstName: 'Rajesh', lastName: 'Sharma', email: 'rajesh.sharma@parent.com', phone: '9812222202', occupation: 'Engineer' },
    { parentId: 'PAR-003', firstName: 'Venkat', lastName: 'Reddy', email: 'venkat.reddy@parent.com', phone: '9812222203', occupation: 'Doctor' },
    { parentId: 'PAR-004', firstName: 'Sundar', lastName: 'Iyer', email: 'sundar.iyer@parent.com', phone: '9812222204', occupation: 'Consultant' },
    { parentId: 'PAR-005', firstName: 'Manoj', lastName: 'Verma', email: 'manoj.verma@parent.com', phone: '9812222205', occupation: 'Businessman' },
  ];

  const parents = [];
  for (const p of parentDefs) {
    let pUser = await prisma.user.findUnique({ where: { email: p.email } });
    if (!pUser) {
      pUser = await prisma.user.create({
        data: {
          username: p.email.split('@')[0],
          email: p.email,
          password: await hash('parent123'),
          name: `${p.firstName} ${p.lastName}`,
          role: 'PARENT',
        },
      });
    }

    let parent = await prisma.parent.findUnique({ where: { parentId: p.parentId } });
    if (!parent) {
      parent = await prisma.parent.create({
        data: {
          parentId: p.parentId,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          phone: p.phone,
          occupation: p.occupation,
          relation: 'Father',
          userId: pUser.id,
        },
      });
    }
    parents.push(parent);
  }
  console.log(`Seeded ${parents.length} parents.`);

  // 7. Students & Logins
  const studentDefs = [
    { studentId: 'STU-001', firstName: 'Ayesha', lastName: 'Khan', email: 'student@school.com', gender: 'FEMALE', rollNumber: 1, classIdx: 1, parentIdx: 0, fatherName: 'Tariq Khan', motherName: 'Farida Khan' },
    { studentId: 'STU-002', firstName: 'Aarav', lastName: 'Sharma', email: 'aarav@school.com', gender: 'MALE', rollNumber: 2, classIdx: 1, parentIdx: 1, fatherName: 'Rajesh Sharma', motherName: 'Sunita Sharma' },
    { studentId: 'STU-003', firstName: 'Myra', lastName: 'Reddy', email: 'myra@school.com', gender: 'FEMALE', rollNumber: 3, classIdx: 1, parentIdx: 2, fatherName: 'Venkat Reddy', motherName: 'Kavita Reddy' },
    { studentId: 'STU-004', firstName: 'Ananya', lastName: 'Iyer', email: 'ananya.i@school.com', gender: 'FEMALE', rollNumber: 4, classIdx: 1, parentIdx: 3, fatherName: 'Sundar Iyer', motherName: 'Meenakshi Iyer' },
    { studentId: 'STU-005', firstName: 'Aditya', lastName: 'Verma', email: 'aditya@school.com', gender: 'MALE', rollNumber: 5, classIdx: 1, parentIdx: 4, fatherName: 'Manoj Verma', motherName: 'Pooja Verma' },
    { studentId: 'STU-006', firstName: 'Rohan', lastName: 'Mehta', email: 'rohan@school.com', gender: 'MALE', rollNumber: 1, classIdx: 3, parentIdx: 1, fatherName: 'Alok Mehta', motherName: 'Ritu Mehta' },
    { studentId: 'STU-007', firstName: 'Sneha', lastName: 'Patel', email: 'sneha@school.com', gender: 'FEMALE', rollNumber: 2, classIdx: 4, parentIdx: 2, fatherName: 'Kirit Patel', motherName: 'Neeta Patel' },
    { studentId: 'STU-008', firstName: 'Vikrant', lastName: 'Joshi', email: 'vikrant@school.com', gender: 'MALE', rollNumber: 3, classIdx: 5, parentIdx: 3, fatherName: 'Deepak Joshi', motherName: 'Seema Joshi' },
    { studentId: 'STU-009', firstName: 'Priya', lastName: 'Nair', email: 'priya.n@school.com', gender: 'FEMALE', rollNumber: 1, classIdx: 6, parentIdx: 4, fatherName: 'Harish Nair', motherName: 'Radha Nair' },
    { studentId: 'STU-010', firstName: 'Kabir', lastName: 'Das', email: 'kabir@school.com', gender: 'MALE', rollNumber: 2, classIdx: 0, parentIdx: 0, fatherName: 'Amit Das', motherName: 'Gita Das' },
  ];

  const students = [];
  for (const s of studentDefs) {
    let sUser = await prisma.user.findUnique({ where: { email: s.email } });
    if (!sUser) {
      sUser = await prisma.user.create({
        data: {
          username: s.email.split('@')[0],
          email: s.email,
          password: await hash('student123'),
          name: `${s.firstName} ${s.lastName}`,
          role: 'STUDENT',
        },
      });
    }

    let student = await prisma.student.findUnique({ where: { studentId: s.studentId } });
    const targetClass = classes[s.classIdx] || class6A;
    const targetParent = parents[s.parentIdx] || parents[0];

    if (!student) {
      student = await prisma.student.create({
        data: {
          studentId: s.studentId,
          firstName: s.firstName,
          lastName: s.lastName,
          email: s.email,
          phone: `98700000${s.rollNumber}`,
          gender: s.gender,
          dob: new Date('2013-05-15'),
          fatherName: s.fatherName,
          motherName: s.motherName,
          address: '42 Lotus Colony, New Delhi',
          rollNumber: s.rollNumber,
          admissionDate: new Date('2024-04-10'),
          status: 'ACTIVE',
          classId: targetClass.id,
          parentId: targetParent.id,
          userId: sUser.id,
        },
      });
    }
    students.push(student);
  }
  console.log(`Seeded ${students.length} students.`);

  // 8. Staff & Logins
  let staffUser = await prisma.user.findUnique({ where: { email: 'staff@school.com' } });
  if (!staffUser) {
    staffUser = await prisma.user.create({
      data: {
        username: 'staff',
        email: 'staff@school.com',
        password: await hash('staff123'),
        name: 'Ravi Verma',
        role: 'STAFF',
      },
    });
  }

  let staff = await prisma.staff.findUnique({ where: { staffId: 'STF-001' } });
  if (!staff) {
    staff = await prisma.staff.create({
      data: {
        staffId: 'STF-001',
        name: 'Ravi Verma',
        email: 'staff@school.com',
        phone: '9814444444',
        position: 'Office Administrator',
        department: 'Administration',
        salary: 35000,
        joiningDate: new Date('2023-01-15'),
        userId: staffUser.id,
      },
    });
    console.log('Seeded staff member.');
  }

  // 9. Historical Attendance for students
  const dates = [
    '2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30', '2026-07-31',
    '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07',
  ];

  let attCount = 0;
  for (let dIdx = 0; dIdx < dates.length; dIdx++) {
    const dStr = dates[dIdx];
    const dDate = new Date(`${dStr}T00:00:00.000Z`);

    for (let sIdx = 0; sIdx < students.length; sIdx++) {
      const student = students[sIdx];
      // Deterministic patterns: 85% Present, 10% Absent, 5% Leave
      const seed = (dIdx * 7 + sIdx * 13) % 20;
      const status = seed === 0 ? 'LEAVE' : seed <= 2 ? 'ABSENT' : 'PRESENT';

      await prisma.attendance.upsert({
        where: { studentId_date: { studentId: student.id, date: dDate } },
        create: {
          studentId: student.id,
          date: dDate,
          status,
          markedById: teachers[0]?.id,
        },
        update: { status },
      });
      attCount++;
    }
  }
  console.log(`Seeded ${attCount} student attendance records.`);

  // 10. Teacher Attendance
  for (let dIdx = 0; dIdx < dates.length; dIdx++) {
    const dDate = new Date(`${dates[dIdx]}T00:00:00.000Z`);
    for (const teacher of teachers) {
      await prisma.teacherAttendance.upsert({
        where: { teacherId_date: { teacherId: teacher.id, date: dDate } },
        create: {
          teacherId: teacher.id,
          date: dDate,
          status: 'PRESENT',
        },
        update: { status: 'PRESENT' },
      });
    }
  }
  console.log('Seeded teacher attendance records.');

  // 11. Fees
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const feeCount = await prisma.fee.count({ where: { studentId: s.id } });
    if (feeCount === 0) {
      const totalFee = 4800 + (i % 3) * 400;
      const isPaid = i % 3 === 0;
      const isPartial = i % 3 === 1;
      const paidAmount = isPaid ? totalFee : isPartial ? totalFee / 2 : 0;
      const dueAmount = totalFee - paidAmount;
      const paymentStatus = isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'PENDING';

      await prisma.fee.create({
        data: {
          studentId: s.id,
          totalFee,
          paidAmount,
          dueAmount,
          paymentStatus,
          paymentMethod: isPaid ? 'ONLINE' : isPartial ? 'CASH' : 'BANK_TRANSFER',
          paymentDate: isPaid || isPartial ? new Date('2026-07-15') : null,
        },
      });
    }
  }
  console.log('Seeded student fee vouchers.');

  // 12. Exams & Marks
  const examDefs = [
    { name: 'Weekly Test 1', classId: class6A.id, startDate: new Date('2026-08-10'), endDate: new Date('2026-08-15') },
    { name: 'Mid-Term Exam', classId: class6A.id, startDate: new Date('2026-09-01'), endDate: new Date('2026-09-12') },
    { name: 'Monthly Test 1', classId: classes[3]?.id || class6A.id, startDate: new Date('2026-08-20'), endDate: new Date('2026-08-25') },
  ];

  const exams = [];
  for (const e of examDefs) {
    let exam = await prisma.exam.findFirst({
      where: { name: e.name, classId: e.classId, deletedAt: null },
    });
    if (!exam) {
      exam = await prisma.exam.create({ data: e });
    }
    exams.push(exam);
  }
  console.log(`Seeded ${exams.length} exams.`);

  // Marks for Class 6-A students
  const class6Students = students.filter((s) => s.classId === class6A.id);
  const class6Subjects = subjects.filter((s) => s.classId === class6A.id);

  if (exams[0] && class6Subjects.length) {
    for (const student of class6Students) {
      for (const subject of class6Subjects) {
        const existingMark = await prisma.mark.findFirst({
          where: { studentId: student.id, examId: exams[0].id, subjectId: subject.id },
        });
        if (!existingMark) {
          const score = 70 + Math.floor(Math.random() * 26);
          const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : 'C';
          await prisma.mark.create({
            data: {
              studentId: student.id,
              examId: exams[0].id,
              subjectId: subject.id,
              marks: score,
              grade,
              remarks: score >= 90 ? 'Outstanding work' : 'Good performance',
            },
          });
        }
      }
    }
    console.log('Seeded exam marks.');
  }

  // 13. Notices
  const noticeDefs = [
    { title: 'Annual Sports Day 2026', description: 'Annual Sports Day will be held on 25th December 2026 at the school ground.', audience: 'ALL', publishDate: new Date('2026-08-01') },
    { title: 'Mid-Term Exam Schedule', description: 'Mid-term examinations will commence from 1st September 2026. The timetable has been published.', audience: 'ALL', publishDate: new Date('2026-08-03') },
    { title: 'Parent-Teacher Meeting (PTM)', description: 'A parent-teacher meeting is scheduled for Saturday 22nd August from 9:00 AM to 1:00 PM.', audience: 'PARENT', publishDate: new Date('2026-07-28') },
    { title: 'Teacher Faculty Meeting', description: 'Monthly staff review meeting in Conference Room A on Friday 3:30 PM.', audience: 'TEACHER', publishDate: new Date('2026-08-04') },
    { title: 'Science Exhibition 2026', description: 'Register your science project models with the science department by 20th August.', audience: 'STUDENT', publishDate: new Date('2026-08-05') },
  ];

  for (const n of noticeDefs) {
    const existing = await prisma.notice.findFirst({ where: { title: n.title, deletedAt: null } });
    if (!existing) {
      await prisma.notice.create({ data: n });
    }
  }
  console.log('Seeded school notices.');

  // 14. Events & Holidays
  const eventCount = await prisma.event.count();
  if (eventCount === 0) {
    await prisma.event.createMany({
      data: [
        { title: 'Science Olympiad', description: 'Annual inter-school science test', date: new Date('2026-08-25'), location: 'Auditorium' },
        { title: 'Independence Day Celebration', description: 'Flag hoisting and cultural program', date: new Date('2026-08-15'), location: 'Main Ground' },
      ],
    });
  }

  const holidayCount = await prisma.holiday.count();
  if (holidayCount === 0) {
    await prisma.holiday.createMany({
      data: [
        { name: 'Independence Day', date: new Date('2026-08-15'), type: 'PUBLIC' },
        { name: 'Raksha Bandhan', date: new Date('2026-08-28'), type: 'RELIGIOUS' },
        { name: 'Janmashtami', date: new Date('2026-09-04'), type: 'RELIGIOUS' },
      ],
    });
  }
  console.log('Seeded events and holidays.');

  console.log('--- Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
