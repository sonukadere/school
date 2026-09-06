import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Payment Management Data ---');

  // 1. Ensure School entity
  let school = await prisma.school.findFirst({ where: { code: 'SCH001' } });
  if (!school) {
    school = await prisma.school.create({
      data: {
        code: 'SCH001',
        name: 'Daily Day Academy',
        logo: '/logo.svg',
        address: '123 Education Street, New Delhi - 110001',
        phone: '+91 98765 43210',
        email: 'info@dailydayacademy.edu',
        website: 'www.dailydayacademy.edu',
        affiliationNumber: 'CBSE-AFF-2026-9921',
        principalName: 'Dr. R. K. Sharma',
        academicYear: '2026-2027',
      },
    });
    console.log('Seeded School: Daily Day Academy (SCH001)');
  }

  // 2. Classes
  const classes = await prisma.class.findMany();
  console.log(`Found ${classes.length} classes.`);

  // 3. Fee Structures
  const feeTypes = [
    { feeType: 'Tuition Fee', totalFee: 15000, lateFee: 500, description: 'Annual general tuition and classroom instruction fee' },
    { feeType: 'Admission Fee', totalFee: 5000, lateFee: 0, description: 'One-time admission registration fee' },
    { feeType: 'Examination Fee', totalFee: 2500, lateFee: 200, description: 'Term exams and marksheet processing fee' },
    { feeType: 'Transport Fee', totalFee: 6000, lateFee: 300, description: 'School bus transportation fee' },
    { feeType: 'Computer Fee', totalFee: 3000, lateFee: 150, description: 'Computer lab and internet infrastructure fee' },
    { feeType: 'Library Fee', totalFee: 1200, lateFee: 100, description: 'Library access, journals and book maintenance fee' },
  ];

  const feeStructures = [];
  for (const c of classes) {
    for (const ft of feeTypes) {
      let existing = await prisma.feeStructure.findFirst({
        where: { classId: c.id, feeType: ft.feeType, academicYear: '2026-2027' },
      });
      if (!existing) {
        existing = await prisma.feeStructure.create({
          data: {
            schoolId: 'SCH001',
            academicYear: '2026-2027',
            classId: c.id,
            feeType: ft.feeType,
            totalFee: ft.totalFee,
            dueDate: new Date('2026-10-31'),
            lateFee: ft.lateFee,
            description: ft.description,
            status: 'ACTIVE',
          },
        });
      }
      feeStructures.push(existing);
    }
  }
  console.log(`Seeded fee structures for classes.`);

  // 4. Students, Invoices, Payments, Receipts
  const students = await prisma.student.findMany({
    include: {
      class: true,
      parent: true,
    },
  });
  console.log(`Processing ${students.length} students for fee invoices and payments.`);

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const adminId = admin?.id || null;
  const adminName = admin?.name || 'System Administrator';

  const paymentMethods = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'ONLINE'];

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const existingInvoices = await prisma.feeInvoice.count({ where: { studentId: s.id } });

    if (existingInvoices === 0) {
      // Create primary Tuition Fee Invoice
      const tuitionFee = 15000;
      const invNum = `INV/SCH001/2026/${String(i + 1).padStart(4, '0')}`;
      const isFullPaid = i % 4 === 0;
      const isPartial = i % 4 === 1;
      const isPending = i % 4 === 2;
      const isOverdue = i % 4 === 3;

      const dueDate = isOverdue ? new Date('2026-08-15') : new Date('2026-11-30');
      const paidAmount = isFullPaid ? tuitionFee : isPartial ? 7500 : 0;
      const pendingAmount = tuitionFee - paidAmount;
      const status = isFullPaid ? 'PAID' : isPartial ? 'PARTIAL' : isOverdue ? 'OVERDUE' : 'PENDING';

      const invoice = await prisma.feeInvoice.create({
        data: {
          invoiceNumber: invNum,
          schoolId: 'SCH001',
          studentId: s.id,
          academicYear: '2026-2027',
          feeType: 'Tuition Fee',
          totalFee: tuitionFee,
          paidAmount,
          pendingAmount,
          discount: 0,
          lateFee: isOverdue ? 500 : 0,
          finalAmount: tuitionFee + (isOverdue ? 500 : 0),
          dueDate,
          status,
        },
      });

      // If paid or partial, create Payment and PaymentReceipt
      if (paidAmount > 0) {
        const rcptNum = `RCPT/SCH001/2026/${String(i + 1).padStart(4, '0')}`;
        const payMethod = paymentMethods[i % paymentMethods.length];
        const payDate = new Date(Date.now() - (i + 1) * 86400000 * 2);

        const payment = await prisma.payment.create({
          data: {
            receiptNumber: rcptNum,
            schoolId: 'SCH001',
            studentId: s.id,
            academicYear: '2026-2027',
            invoiceId: invoice.id,
            feeType: 'Tuition Fee',
            amount: paidAmount,
            previousDue: tuitionFee,
            remainingDue: pendingAmount,
            paymentDate: payDate,
            paymentMethod: payMethod,
            paymentStatus: isFullPaid ? 'PAID' : 'PARTIAL',
            transactionId: `TXN-${20260000 + i + 1}`,
            referenceNumber: `REF-${30260000 + i + 1}`,
            notes: isFullPaid ? 'Complete annual tuition fee settled' : 'First semester installment paid',
            createdById: adminId,
          },
        });

        const studentFullName = `${s.firstName} ${s.lastName || ''}`.trim();
        const parentName = s.parent ? `${s.parent.firstName} ${s.parent.lastName || ''}`.trim() : s.fatherName || 'Parent';

        const metadata = {
          school: {
            name: school.name,
            logo: school.logo,
            address: school.address,
            phone: school.phone,
            email: school.email,
            affiliationNumber: school.affiliationNumber,
          },
          student: {
            id: s.id,
            studentId: s.studentId,
            name: studentFullName,
            className: s.class?.name || 'Class 6',
            section: s.class?.section || 'A',
            parentName,
          },
          payment: {
            receiptNumber: rcptNum,
            paymentDate: payDate.toISOString(),
            feeType: 'Tuition Fee',
            amount: paidAmount,
            paymentMethod: payMethod,
            transactionId: payment.transactionId,
            previousDue: tuitionFee,
            remainingDue: pendingAmount,
            paymentStatus: payment.paymentStatus,
          },
          authorized: {
            generatedBy: adminName,
            signatureLabel: 'Authorized School Cashier / Bursar',
          },
        };

        await prisma.paymentReceipt.create({
          data: {
            receiptNumber: rcptNum,
            schoolId: 'SCH001',
            paymentId: payment.id,
            invoiceId: invoice.id,
            studentId: s.id,
            receiptDate: payDate,
            generatedById: adminId,
            metadata: JSON.stringify(metadata),
          },
        });
      }
    }
  }

  console.log('Seeding completed successfully!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
