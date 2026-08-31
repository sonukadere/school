import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as holidayController from '../controllers/holiday.controller.js';
import {
  holidayCreateSchema,
  holidayUpdateSchema,
  holidayQuerySchema,
} from '../validators/holiday.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

const canRead = authorize(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT, ROLES.STAFF);
const canWrite = authorize(ROLES.ADMIN);

router.get('/', canRead, validate({ query: holidayQuerySchema }), holidayController.listHolidays);
router.get('/:id', canRead, validate({ params: idParamSchema }), holidayController.getHoliday);
router.post('/', canWrite, validate({ body: holidayCreateSchema }), holidayController.createHoliday);
router.put(
  '/:id',
  canWrite,
  validate({ params: idParamSchema, body: holidayUpdateSchema }),
  holidayController.updateHoliday
);
router.delete('/:id', canWrite, validate({ params: idParamSchema }), holidayController.deleteHoliday);

export default router;
