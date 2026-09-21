import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as academicController from '../controllers/academic.controller.js';
import { createHomeworkSchema, updateHomeworkSchema, homeworkQuerySchema } from '../validators/academic.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();
router.use(authenticate);

const canManageHomework = authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER);

router.get('/', validate({ query: homeworkQuerySchema }), academicController.listHomework);
router.get('/:id', validate({ params: idParamSchema }), academicController.getHomework);
router.post('/', canManageHomework, validate({ body: createHomeworkSchema }), academicController.createHomework);
router.put('/:id', canManageHomework, validate({ params: idParamSchema, body: updateHomeworkSchema }), academicController.updateHomework);
router.delete('/:id', canManageHomework, validate({ params: idParamSchema }), academicController.deleteHomework);

export default router;
