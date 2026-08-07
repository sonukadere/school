import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const hash = (password) => bcrypt.hash(password, 10);

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@school.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';

  // 1. Super Admin
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        username: adminEmail.split('@')[0],
        email: adminEmail,
        password: await hash(adminPassword),
        name: adminName,
        role: 'ADMIN',
      },
    });
    console.log(`Seeded admin user: ${adminEmail}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  // 2. Default settings
  const settingsCount = await prisma.setting.count();
  if (settingsCount === 0) {
    await prisma.setting.create({
      data: {
        id: 'school-settings',
        schoolName: 'My School',
        academicYear: String(new Date().getFullYear()),
      },
    });
    console.log('Seeded default school settings.');
  }

  // 3. Demo class
  let demoClass = await prisma.class.findFirst({ where: { name: 'Class 6', section: 'A' } });
  if (!demoClass) {
    demoClass = await prisma.class.create({
      data: { name: 'Class 6', section: 'A', roomNumber: '201' },
    });
    console.log('Seeded demo class: Class 6-A');
  }

  // 4. Demo teacher + login account
  let demoTeacher = await prisma.teacher.findUnique({
    where: { teacherId: 'TCH-DEMO-001' },
  });
  if (!demoTeacher) {
    demoTeacher = await prisma.teacher.create({
      data: {
        teacherId: 'TCH-DEMO-001',
        name: 'Priya Teacher',
        email: 'teacher@school.com',
        phone: '9811111111',
        qualification: 'M.Sc. Mathematics, B.Ed.',
        salary: 55000,
        joiningDate: new Date(),
      },
    });
    console.log('Seeded demo teacher.');
  }
  if (!demoTeacher.userId) {
    let teacherUser = await prisma.user.findUnique({ where: { email: 'teacher@school.com' } });
    if (!teacherUser) {
      teacherUser = await prisma.user.create({
        data: {
          username: 'teacher',
          email: 'teacher@school.com',
          password: await hash('teacher123'),
          name: demoTeacher.name,
          role: 'TEACHER',
        },
      });
      await prisma.teacher.update({ where: { id: demoTeacher.id }, data: { userId: teacherUser.id } });
      console.log('Seeded demo teacher account: teacher@school.com / teacher123');
    }
  }
  // Make the demo teacher the class teacher.
  await prisma.class.update({
    where: { id: demoClass.id },
    data: { classTeacherId: demoTeacher.id },
  });

  // 5. Demo student + login account (linked to parent)
  let demoStudent = await prisma.student.findUnique({ where: { studentId: 'STU-DEMO-001' } });
  if (!demoStudent) {
    demoStudent = await prisma.student.create({
      data: {
        studentId: 'STU-DEMO-001',
        firstName: 'Aarav',
        lastName: 'Student',
        email: 'student@school.com',
        phone: '9812222222',
        gender: 'MALE',
        rollNumber: 1,
        classId: demoClass.id,
        admissionDate: new Date(),
      },
    });
    console.log('Seeded demo student.');
  } else {
    await prisma.student.update({ where: { id: demoStudent.id }, data: { classId: demoClass.id } });
  }

  // 6. Demo parent + login account
  let demoParent = await prisma.parent.findUnique({ where: { parentId: 'PAR-DEMO-001' } });
  if (!demoParent) {
    demoParent = await prisma.parent.create({
      data: {
        parentId: 'PAR-DEMO-001',
        firstName: 'Rakesh',
        lastName: 'Parent',
        email: 'parent@school.com',
        phone: '9813333333',
        occupation: 'Engineer',
        relation: 'Father',
      },
    });
    console.log('Seeded demo parent.');
  }
  if (!demoStudent.parentId) {
    await prisma.student.update({ where: { id: demoStudent.id }, data: { parentId: demoParent.id } });
  }
  if (!demoParent.userId) {
    let parentUser = await prisma.user.findUnique({ where: { email: 'parent@school.com' } });
    if (!parentUser) {
      parentUser = await prisma.user.create({
        data: {
          username: 'parent',
          email: 'parent@school.com',
          password: await hash('parent123'),
          name: `${demoParent.firstName} ${demoParent.lastName}`,
          role: 'PARENT',
        },
      });
      await prisma.parent.update({ where: { id: demoParent.id }, data: { userId: parentUser.id } });
      console.log('Seeded demo parent account: parent@school.com / parent123');
    }
  }
  if (!demoStudent.userId) {
    let studentUser = await prisma.user.findUnique({ where: { email: 'student@school.com' } });
    if (!studentUser) {
      studentUser = await prisma.user.create({
        data: {
          username: 'student',
          email: 'student@school.com',
          password: await hash('student123'),
          name: `${demoStudent.firstName} ${demoStudent.lastName}`,
          role: 'STUDENT',
        },
      });
      await prisma.student.update({ where: { id: demoStudent.id }, data: { userId: studentUser.id } });
      console.log('Seeded demo student account: student@school.com / student123');
    }
  }

  // 7. Demo staff + login account
  let demoStaff = await prisma.staff.findUnique({ where: { staffId: 'STF-DEMO-001' } });
  if (!demoStaff) {
    demoStaff = await prisma.staff.create({
      data: {
        staffId: 'STF-DEMO-001',
        name: 'Ravi Staff',
        email: 'staff@school.com',
        phone: '9814444444',
        position: 'Office Assistant',
        department: 'Administration',
        salary: 30000,
        joiningDate: new Date(),
      },
    });
    console.log('Seeded demo staff.');
  }
  if (!demoStaff.userId) {
    let staffUser = await prisma.user.findUnique({ where: { email: 'staff@school.com' } });
    if (!staffUser) {
      staffUser = await prisma.user.create({
        data: {
          username: 'staff',
          email: 'staff@school.com',
          password: await hash('staff123'),
          name: demoStaff.name,
          role: 'STAFF',
        },
      });
      await prisma.staff.update({ where: { id: demoStaff.id }, data: { userId: staffUser.id } });
      console.log('Seeded demo staff account: staff@school.com / staff123');
    }
  }

  // 8. Demo fee record for the demo student
  const feeCount = await prisma.fee.count();
  if (feeCount === 0) {
    await prisma.fee.create({
      data: {
        studentId: demoStudent.id,
        totalFee: 4800,
        paidAmount: 3200,
        dueAmount: 1600,
        paymentStatus: 'PARTIAL',
        paymentMethod: 'CASH',
        paymentDate: new Date(),
      },
    });
    console.log('Seeded demo fee record.');
  }

  // 9. Demo notice
  const noticeCount = await prisma.notice.count();
  if (noticeCount === 0) {
    await prisma.notice.create({
      data: {
        title: 'Welcome to the new academic year',
        description: 'All students are requested to collect their books from the library.',
        audience: 'ALL',
        publishDate: new Date(),
      },
    });
    console.log('Seeded demo notice.');
  }

  // 10. Demo event + holiday
  const eventCount = await prisma.event.count();
  if (eventCount === 0) {
    await prisma.event.create({
      data: { title: 'Annual Sports Day', description: 'Inter-class sports competition.', date: new Date(Date.now() + 14 * 86400000) },
    });
    console.log('Seeded demo event.');
  }
  const holidayCount = await prisma.holiday.count();
  if (holidayCount === 0) {
    await prisma.holiday.create({
      data: { name: 'Independence Day', date: new Date(Date.now() + 30 * 86400000), type: 'PUBLIC' },
    });
    console.log('Seeded demo holiday.');
  }

  // 11. A few demo subjects for the demo class so timetables/results render.
  const subjectCount = await prisma.subject.count();
  if (subjectCount === 0) {
    await prisma.subject.createMany({
      data: [
        { name: 'Mathematics', code: 'MAT-101', classId: demoClass.id },
        { name: 'English', code: 'ENG-101', classId: demoClass.id },
        { name: 'Science', code: 'SCI-101', classId: demoClass.id },
      ],
    });
    console.log('Seeded demo subjects.');
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
