import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize, { requirePermission } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import { PERMISSIONS } from '../constants/permissions.js';
import * as paymentController from '../controllers/payment.controller.js';
import {
  recordPaymentSchema,
  updatePaymentSchema,
  paymentQuerySchema,
  feeStructureCreateSchema,
  feeStructureUpdateSchema,
  pendingFeesQuerySchema,
} from '../validators/payment.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

// All payment routes require valid authentication
router.use(authenticate);

// Role & Permission Middlewares
const canViewPayments = authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STUDENT, ROLES.PARENT);
const canManagePayments = authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN);
const canViewReports = authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN);

// --- Receipts ---
router.get('/receipt/:id(*)', canViewPayments, paymentController.getPaymentReceipt);

// --- Pending Fees ---
router.get(
  '/pending-fees',
  canManagePayments,
  validate({ query: pendingFeesQuerySchema }),
  paymentController.listPendingFees
);

// --- Payment Reports ---
router.get(
  '/reports',
  canViewReports,
  requirePermission(PERMISSIONS.REPORTS_FEES_VIEW),
  paymentController.getPaymentReports
);

// --- Student Ledger ---
router.get(
  '/student/:studentId',
  canViewPayments,
  paymentController.getStudentFeeLedger
);

// --- Fee Structures ---
router.get('/fee-structures', canViewPayments, paymentController.listFeeStructures);
router.post(
  '/fee-structures',
  canManagePayments,
  validate({ body: feeStructureCreateSchema }),
  paymentController.createFeeStructure
);
router.put(
  '/fee-structures/:id',
  canManagePayments,
  validate({ params: idParamSchema, body: feeStructureUpdateSchema }),
  paymentController.updateFeeStructure
);
router.delete(
  '/fee-structures/:id',
  canManagePayments,
  validate({ params: idParamSchema }),
  paymentController.deleteFeeStructure
);

// --- Finance Dashboard Summary ---
router.get('/finance-summary', canManagePayments, paymentController.getFinanceSummary);

// --- Fee Assignment Operations ---
router.post('/assign-class', canManagePayments, paymentController.assignFeeStructureToClass);
router.post('/assign-student', canManagePayments, paymentController.assignFeeToStudent);

// --- Schools List ---
router.get('/schools', canManagePayments, paymentController.listSchools);

// --- Payment Transactions ---
router.get(
  '/',
  canViewPayments,
  validate({ query: paymentQuerySchema }),
  paymentController.listPayments
);

router.get(
  '/:id',
  canViewPayments,
  paymentController.getPayment
);

router.post(
  '/',
  canManagePayments,
  requirePermission(PERMISSIONS.PAYMENTS_CREATE),
  validate({ body: recordPaymentSchema }),
  paymentController.recordPayment
);

router.put(
  '/:id',
  canManagePayments,
  requirePermission(PERMISSIONS.PAYMENTS_UPDATE),
  validate({ params: idParamSchema, body: updatePaymentSchema }),
  paymentController.updatePayment
);

router.delete(
  '/:id',
  canManagePayments,
  requirePermission(PERMISSIONS.PAYMENTS_DELETE),
  validate({ params: idParamSchema }),
  paymentController.cancelPayment
);

export default router;
