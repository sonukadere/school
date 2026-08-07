import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as timetableController from '../controllers/timetable.controller.js';
import {
  timetableCreateSchema,
  timetableUpdateSchema,
  timetableQuerySchema,
} from '../validators/timetable.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

const canRead = authorize(ROLES.ADMIN, ROLES.TEACHER);
const canWrite = authorize(ROLES.ADMIN);

router.get('/', canRead, validate({ query: timetableQuerySchema }), timetableController.listTimetables);
router.get('/:id', canRead, validate({ params: idParamSchema }), timetableController.getTimetable);
router.post('/', canWrite, validate({ body: timetableCreateSchema }), timetableController.createTimetable);
router.put(
  '/:id',
  canWrite,
  validate({ params: idParamSchema, body: timetableUpdateSchema }),
  timetableController.updateTimetable
);
router.delete('/:id', canWrite, validate({ params: idParamSchema }), timetableController.deleteTimetable);

export default router;
