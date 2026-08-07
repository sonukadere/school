import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as classController from '../controllers/class.controller.js';
import { classCreateSchema, classUpdateSchema, classQuerySchema } from '../validators/class.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

const canRead = authorize(ROLES.ADMIN, ROLES.TEACHER);
const canWrite = authorize(ROLES.ADMIN);

router.get('/', canRead, validate({ query: classQuerySchema }), classController.listClasses);
router.get('/:id', canRead, validate({ params: idParamSchema }), classController.getClass);
router.post('/', canWrite, validate({ body: classCreateSchema }), classController.createClass);
router.put(
  '/:id',
  canWrite,
  validate({ params: idParamSchema, body: classUpdateSchema }),
  classController.updateClass
);
router.delete('/:id', canWrite, validate({ params: idParamSchema }), classController.deleteClass);

export default router;
