import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as academicController from '../controllers/academic.controller.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  assignmentQuerySchema,
  submitAssignmentSchema,
  gradeSubmissionSchema,
} from '../validators/academic.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();
router.use(authenticate);

const canManageAssignment = authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER);
const canSubmitAssignment = authorize(ROLES.STUDENT);

router.get('/', validate({ query: assignmentQuerySchema }), academicController.listAssignments);
router.get('/:id', validate({ params: idParamSchema }), academicController.getAssignment);
router.post('/', canManageAssignment, validate({ body: createAssignmentSchema }), academicController.createAssignment);
router.put('/:id', canManageAssignment, validate({ params: idParamSchema, body: updateAssignmentSchema }), academicController.updateAssignment);
router.delete('/:id', canManageAssignment, validate({ params: idParamSchema }), academicController.deleteAssignment);

router.post('/:id/submit', canSubmitAssignment, validate({ params: idParamSchema, body: submitAssignmentSchema }), academicController.submitAssignment);
router.patch('/:id/submissions/:submissionId', canManageAssignment, validate({ body: gradeSubmissionSchema }), academicController.gradeSubmission);

export default router;
