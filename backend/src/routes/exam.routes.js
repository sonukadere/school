import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as examController from '../controllers/exam.controller.js';
import { examCreateSchema, examUpdateSchema, examQuerySchema } from '../validators/exam.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

const canRead = authorize(ROLES.ADMIN, ROLES.TEACHER);
const canWrite = authorize(ROLES.ADMIN);

router.get('/', canRead, validate({ query: examQuerySchema }), examController.listExams);
router.get('/:id', canRead, validate({ params: idParamSchema }), examController.getExam);
router.post('/', canWrite, validate({ body: examCreateSchema }), examController.createExam);
router.put(
  '/:id',
  canWrite,
  validate({ params: idParamSchema, body: examUpdateSchema }),
  examController.updateExam
);
router.delete('/:id', canWrite, validate({ params: idParamSchema }), examController.deleteExam);

export default router;
