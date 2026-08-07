import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as teacherAttendanceController from '../controllers/teacherAttendance.controller.js';
import {
  teacherAttendanceCreateSchema,
  teacherAttendanceUpdateSchema,
  teacherAttendanceQuerySchema,
  teacherAttendanceBulkSchema,
} from '../validators/teacherAttendance.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

const canRead = authorize(ROLES.ADMIN, ROLES.TEACHER);
const canWrite = authorize(ROLES.ADMIN, ROLES.TEACHER);

router.get('/', canRead, validate({ query: teacherAttendanceQuerySchema }), teacherAttendanceController.listTeacherAttendances);
router.get('/:id', canRead, validate({ params: idParamSchema }), teacherAttendanceController.getTeacherAttendance);
router.post('/bulk', canWrite, validate({ body: teacherAttendanceBulkSchema }), teacherAttendanceController.bulkMarkTeacherAttendance);
router.post('/', canWrite, validate({ body: teacherAttendanceCreateSchema }), teacherAttendanceController.markTeacherAttendance);
router.put(
  '/:id',
  canWrite,
  validate({ params: idParamSchema, body: teacherAttendanceUpdateSchema }),
  teacherAttendanceController.updateTeacherAttendance
);
router.delete('/:id', authorize(ROLES.ADMIN), validate({ params: idParamSchema }), teacherAttendanceController.deleteTeacherAttendance);

export default router;
