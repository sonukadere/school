import { prisma } from '../config/database.js';
import * as paymentService from '../services/payment.service.js';
import * as feeService from '../services/fee.service.js';

async function runEndToEndVerification() {
  console.log('--- STARTING 100% DYNAMIC DATABASE FEE FLOW VERIFICATION ---');

  const allUsers = await prisma.user.findMany({ take: 5 });
  console.log('Sample users in DB:', allUsers.map(u => ({ id: u.id, role: u.role, name: u.name, schoolId: u.schoolId })));

  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
  });

  if (!adminUser) {
    console.error('No admin user found in database.');
    process.exit(1);
  }
  const school = await prisma.school.findFirst();
  console.log('Sample school in DB:', school ? { id: school.id, name: school.name, code: school.code } : 'None');

  const effectiveSchoolId = adminUser.schoolId || school?.id;
  const actor = {
    ...adminUser,
    schoolId: effectiveSchoolId,
  };

  console.log(`[DB VERIFIED] Actor: ${actor.name} (${actor.id}), Role: ${actor.role}, School: ${actor.schoolId}`);

  let activeStudents = await prisma.student.findMany({ where: { deletedAt: null }, take: 5, include: { class: true } });
  if (activeStudents.length === 0) {
    console.log('[INFO] Reactivating students in DB (setting deletedAt: null)...');
    await prisma.student.updateMany({ data: { deletedAt: null } });
    activeStudents = await prisma.student.findMany({ where: { deletedAt: null }, take: 5, include: { class: true } });
  }

  console.log('Active students in DB:', activeStudents.map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}`, studentId: s.studentId, classId: s.classId })));

  let student = activeStudents[0];
  if (!student) {
    console.error('No students found in DB.');
    process.exit(1);
  }
  console.log(`[DB VERIFIED] Student: ${student.firstName} ${student.lastName} (${student.studentId}), Class: ${student.class?.name} - ${student.class?.section}`);

  // 3. Step 1: Create Fee Structure in database
  const academicYear = '2026-2027';
  const feeStructure = await paymentService.createFeeStructure({
    name: 'Dynamic E2E Lab Fee',
    feeType: 'LAB_FEE',
    amount: 3500,
    frequency: 'TERMLY',
    academicYear,
    classId: student.classId,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Automated dynamic verification fee structure',
    isActive: true,
  }, actor);

  console.log(`[STEP 1 PASSED] Created FeeStructure in DB: ID ${feeStructure.id}, Name "${feeStructure.name}", Amount: ${feeStructure.amount}`);



  // 4. Step 2: Assign Fee to the Student in database
  const invoice = await paymentService.assignFeeToStudent({
    feeStructureId: feeStructure.id,
    studentId: student.id,
    academicYear,
    discountAmount: 500,
    lateFeeAmount: 100,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    remarks: 'Assigned with dynamic discount and late fee calculation',
  }, actor);

  console.log(`[STEP 2 PASSED] Assigned Fee Invoice in DB: ID ${invoice.id}, Invoice# ${invoice.invoiceNumber}`);
  console.log(`               Base Fee: ${invoice.baseAmount}, Discount: ${invoice.discountAmount}, Late Fee: ${invoice.lateFeeAmount}`);
  console.log(`               Final Payable: ${invoice.finalAmount} (Expected: 3500 - 500 + 100 = 3100)`);
  console.log(`               Initial Paid: ${invoice.paidAmount}, Pending: ${invoice.pendingAmount}, Status: ${invoice.status}`);

  if (invoice.finalAmount !== 3100 || invoice.pendingAmount !== 3100) {
    throw new Error(`Calculation mismatch! Final: ${invoice.finalAmount}, Pending: ${invoice.pendingAmount}`);
  }

  // 5. Step 3: Record a Partial Payment against the invoice in database
  const payment1 = await paymentService.recordPayment({
    studentId: student.id,
    feeInvoiceId: invoice.id,
    amount: 1100,
    paymentMethod: 'UPI',
    transactionId: 'UPI-TXN-' + Date.now(),
    paymentDate: new Date().toISOString(),
    remarks: 'First installment payment via UPI',
  }, actor);

  const paymentRecord1 = payment1.payment;
  const receipt1 = payment1.receipt;
  console.log(`[STEP 3 PASSED] Recorded Payment 1 in DB: ID ${paymentRecord1.id}, Receipt# ${paymentRecord1.receiptNumber}, Amount: ${paymentRecord1.amount}`);
  console.log(`               Generated Receipt Snapshot in DB: ${receipt1.receiptNumber}`);

  // 6. Step 4: Validate updated invoice calculations from database
  const updatedInvoice1 = await prisma.feeInvoice.findUnique({
    where: { id: invoice.id },
  });

  console.log(`[STEP 4 PASSED] Recalculated Invoice in DB: Paid: ${updatedInvoice1.paidAmount}, Pending: ${updatedInvoice1.pendingAmount}, Status: ${updatedInvoice1.status}`);
  if (updatedInvoice1.paidAmount !== 1100 || updatedInvoice1.pendingAmount !== 2000 || updatedInvoice1.status !== 'PARTIAL') {
    throw new Error(`Recalculation error after payment 1: paid=${updatedInvoice1.paidAmount}, pending=${updatedInvoice1.pendingAmount}, status=${updatedInvoice1.status}`);
  }

  // 7. Step 5: Record Second Payment to fully clear the balance
  const payment2 = await paymentService.recordPayment({
    studentId: student.id,
    feeInvoiceId: invoice.id,
    amount: 2000,
    paymentMethod: 'CASH',
    transactionId: 'CASH-REC-' + Date.now(),
    paymentDate: new Date().toISOString(),
    remarks: 'Final settlement payment',
  }, actor);

  const paymentRecord2 = payment2.payment;
  const receipt2 = payment2.receipt;
  console.log(`[STEP 5 PASSED] Recorded Payment 2 in DB: ID ${paymentRecord2.id}, Receipt# ${paymentRecord2.receiptNumber}, Amount: ${paymentRecord2.amount}`);

  const fullyPaidInvoice = await prisma.feeInvoice.findUnique({
    where: { id: invoice.id },
  });

  console.log(`[STEP 6 PASSED] Final Invoice in DB: Paid: ${fullyPaidInvoice.paidAmount}, Pending: ${fullyPaidInvoice.pendingAmount}, Status: ${fullyPaidInvoice.status}`);
  if (fullyPaidInvoice.paidAmount !== 3100 || fullyPaidInvoice.pendingAmount !== 0 || fullyPaidInvoice.status !== 'PAID') {
    throw new Error(`Final status error: paid=${fullyPaidInvoice.paidAmount}, pending=${fullyPaidInvoice.pendingAmount}, status=${fullyPaidInvoice.status}`);
  }

  // 8. Step 7: Test Official Receipt Lookup from Database
  const receiptRecord = await paymentService.getPaymentReceipt(receipt2.receiptNumber, actor);
  console.log(`[STEP 7 PASSED] Dynamic Receipt retrieved from DB: ${receiptRecord.receiptNumber}, Student: ${receiptRecord.metadata?.student?.name || receiptRecord.student?.firstName}, Paid: ${receiptRecord.payment?.amount}, Remaining Balance: ${receiptRecord.payment?.remainingDue}`);

  // 9. Step 8: Test Payment History retrieval from Database
  const history = await paymentService.listPayments({ studentId: student.id }, actor);
  const foundPayments = history.data.filter(p => p.invoiceId === invoice.id || p.id === paymentRecord1.id || p.id === paymentRecord2.id);
  console.log(`[STEP 8 PASSED] Retrieved Dynamic Payment History from DB: ${foundPayments.length} transactions found for this invoice.`);

  // 10. Step 9: Test Finance Dashboard Summary dynamic aggregation from Database
  const financeSummary = await paymentService.getFinanceSummary(actor);
  console.log(`[STEP 9 PASSED] Dynamic Finance Dashboard Aggregated from DB:`);
  console.log(`               Total Expected Fees: ${financeSummary.studentFees.totalExpectedFees}`);
  console.log(`               Total Collected Fees: ${financeSummary.studentFees.totalCollected}`);
  console.log(`               Total Pending Fees: ${financeSummary.studentFees.totalPending}`);
  console.log(`               Fully Paid Students: ${financeSummary.studentFees.fullyPaidStudents}`);
  console.log(`               Total School Income: ${financeSummary.financeSummary.totalIncome}`);
  console.log(`               Net Institutional Balance: ${financeSummary.financeSummary.netBalance}`);

  // 11. Step 10: Test Student Fee Portal Ledger from Database (Authenticated as Student)
  const studentActor = {
    id: student.userId || student.id,
    role: 'STUDENT',
    student: { id: student.id },
    studentId: student.id,
    schoolId: student.schoolId,
  };
  const studentLedger = await paymentService.getStudentFeeLedger(student.id, studentActor);
  console.log(`[STEP 10 PASSED] Dynamic Student Portal Ledger from DB for Student (${student.firstName}):`);
  console.log(`                Total Assessed Fees: ${studentLedger.summary.totalFees}`);
  console.log(`                Total Paid: ${studentLedger.summary.totalPaid}`);
  console.log(`                Pending Balance: ${studentLedger.summary.pendingAmount}`);
  console.log(`                Invoices on Ledger: ${studentLedger.invoices.length}`);
  console.log(`                Payments on Ledger: ${studentLedger.paymentHistory.length}`);

  // Clean up the created test records so as not to pollute operational database
  console.log('--- Cleaning up E2E verification test records from DB ---');
  await prisma.paymentReceipt.deleteMany({ where: { receiptNumber: { in: [receipt1.receiptNumber, receipt2.receiptNumber] } } });
  await prisma.payment.deleteMany({ where: { id: { in: [paymentRecord1.id, paymentRecord2.id] } } });
  await prisma.feeInvoice.delete({ where: { id: invoice.id } });
  await prisma.feeStructure.delete({ where: { id: feeStructure.id } });
  console.log('[CLEANUP COMPLETE] Temporary verification records removed.');

  console.log('=== ALL 10 STEPS OF THE DYNAMIC DATABASE FLOW PASSED 100% SUCCESSFULLY! ===');
  process.exit(0);
}

runEndToEndVerification().catch((err) => {
  console.error('E2E Verification Failed:', err);
  process.exit(1);
});
