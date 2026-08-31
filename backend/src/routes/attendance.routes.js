import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as attendanceController from '../controllers/attendance.controller.js';
import {
  attendanceCreateSchema,
  attendanceUpdateSchema,
  attendanceQuerySchema,
  attendanceBulkSchema,
} from '../validators/attendance.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

const canRead = authorize(ROLES.ADMIN, ROLES.TEACHER);
const canWrite = authorize(ROLES.ADMIN, ROLES.TEACHER);

router.get('/', canRead, validate({ query: attendanceQuerySchema }), attendanceController.listAttendances);
router.get('/:id', canRead, validate({ params: idParamSchema }), attendanceController.getAttendance);
router.post('/bulk', canWrite, validate({ body: attendanceBulkSchema }), attendanceController.bulkMarkAttendance);
router.post('/', canWrite, validate({ body: attendanceCreateSchema }), attendanceController.markAttendance);
router.put(
  '/:id',
  canWrite,
  validate({ params: idParamSchema, body: attendanceUpdateSchema }),
  attendanceController.updateAttendance
);
router.delete('/:id', authorize(ROLES.ADMIN), validate({ params: idParamSchema }), attendanceController.deleteAttendance);

export default router;
