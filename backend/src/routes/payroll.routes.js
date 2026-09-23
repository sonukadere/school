import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorize.js';
import { PERMISSIONS } from '../constants/permissions.js';
import validate from '../middleware/validate.js';
import * as payrollController from '../controllers/payroll.controller.js';
import {
  saveSalaryStructureSchema,
  generatePayrollSchema,
  markSalaryPaidSchema,
  payrollQuerySchema,
} from '../validators/payroll.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

// Authentication required for all payroll endpoints
router.use(authenticate);

// RBAC Middleware
const canManagePayroll = requirePermission(PERMISSIONS.PAYROLL_MANAGE);
const canViewPayroll = requirePermission(PERMISSIONS.PAYROLL_VIEW);

// --- Teacher Salary Structures ---
router.get('/structures', canManagePayroll, payrollController.listSalaryStructures);
router.post(
  '/structures',
  canManagePayroll,
  validate({ body: saveSalaryStructureSchema }),
  payrollController.saveSalaryStructure
);

// --- Monthly Payroll Operations ---
router.post(
  '/generate',
  canManagePayroll,
  validate({ body: generatePayrollSchema }),
  payrollController.generateMonthlyPayroll
);

router.get(
  '/reports',
  canManagePayroll,
  payrollController.getPayrollReports
);

router.get(
  '/payslip/:id(*)',
  canViewPayroll,
  payrollController.getPayslip
);

router.post(
  '/:id/pay',
  canManagePayroll,
  validate({ params: idParamSchema, body: markSalaryPaidSchema }),
  payrollController.markSalaryPaid
);

router.get(
  '/:id',
  canViewPayroll,
  validate({ params: idParamSchema }),
  payrollController.getPayrollById
);

router.get(
  '/',
  canViewPayroll,
  validate({ query: payrollQuerySchema }),
  payrollController.listPayroll
);

export default router;
