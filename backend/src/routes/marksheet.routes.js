import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import { ROLES } from '../constants/index.js';
import * as marksheetController from '../controllers/marksheet.controller.js';

const router = Router();

router.use(authenticate);

// Marksheet generation & lookup endpoints with RBAC
router.get(
  '/student/:studentId/exam/:examId',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT),
  marksheetController.getStudentMarksheet
);

router.get(
  '/student/:studentId',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT),
  marksheetController.getStudentMarksheets
);

router.get(
  '/class/:classId/exam/:examId',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER),
  marksheetController.getClassMarksheets
);

export default router;
