import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as academicController from '../controllers/academic.controller.js';
import {
  createLeaveRequestSchema,
  reviewLeaveRequestSchema,
  leaveRequestQuerySchema,
} from '../validators/academic.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();
router.use(authenticate);

const canReviewLeave = authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN);

router.get('/', validate({ query: leaveRequestQuerySchema }), academicController.listLeaveRequests);
router.get('/:id', validate({ params: idParamSchema }), academicController.getLeaveRequest);
router.post('/', validate({ body: createLeaveRequestSchema }), academicController.createLeaveRequest);
router.patch('/:id/review', canReviewLeave, validate({ params: idParamSchema, body: reviewLeaveRequestSchema }), academicController.reviewLeaveRequest);

export default router;
