import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as subjectController from '../controllers/subject.controller.js';
import {
  subjectCreateSchema,
  subjectUpdateSchema,
  subjectQuerySchema,
} from '../validators/subject.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

const canRead = authorize(ROLES.ADMIN, ROLES.TEACHER);
const canWrite = authorize(ROLES.ADMIN);

router.get('/', canRead, validate({ query: subjectQuerySchema }), subjectController.listSubjects);
router.get('/:id', canRead, validate({ params: idParamSchema }), subjectController.getSubject);
router.post('/', canWrite, validate({ body: subjectCreateSchema }), subjectController.createSubject);
router.put(
  '/:id',
  canWrite,
  validate({ params: idParamSchema, body: subjectUpdateSchema }),
  subjectController.updateSubject
);
router.delete('/:id', canWrite, validate({ params: idParamSchema }), subjectController.deleteSubject);

export default router;
