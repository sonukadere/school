import { Router } from 'express';
import { z } from 'zod';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as timetableController from '../controllers/timetable.controller.js';
import {
  timetableCreateSchema,
  timetableUpdateSchema,
  timetableQuerySchema,
  periodCreateSchema,
  periodUpdateSchema,
  periodGenerateSchema,
} from '../validators/timetable.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

const canReadAny = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT);
const canReadTeacher = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER);
const canWrite = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);

const classIdParamSchema = z.object({
  classId: z.string().min(1, 'Class ID is required.'),
});

const teacherIdParamSchema = z.object({
  teacherId: z.string().min(1, 'Teacher ID is required.'),
});

// Actor-specific timetable
router.get('/my-timetable', canReadAny, timetableController.getMyTimetable);

// Weekly matrix views
router.get(
  '/weekly/class/:classId',
  canReadAny,
  validate({ params: classIdParamSchema }),
  timetableController.getWeeklyClassTimetable
);

router.get(
  '/weekly/teacher/:teacherId',
  canReadTeacher,
  validate({ params: teacherIdParamSchema }),
  timetableController.getWeeklyTeacherTimetable
);

// Periods management routes
router.get('/periods', canReadAny, timetableController.listPeriods);
router.post('/periods', canWrite, validate({ body: periodCreateSchema }), timetableController.createPeriod);
router.post('/periods/generate', canWrite, validate({ body: periodGenerateSchema }), timetableController.generatePeriods);
router.put('/periods/:id', canWrite, validate({ params: idParamSchema, body: periodUpdateSchema }), timetableController.updatePeriod);
router.delete('/periods/:id', canWrite, validate({ params: idParamSchema }), timetableController.deletePeriod);

// Timetable slots CRUD
router.get('/', canReadAny, validate({ query: timetableQuerySchema }), timetableController.listTimetables);
router.get('/:id', canReadAny, validate({ params: idParamSchema }), timetableController.getTimetable);
router.post('/', canWrite, validate({ body: timetableCreateSchema }), timetableController.createTimetable);
router.put(
  '/:id',
  canWrite,
  validate({ params: idParamSchema, body: timetableUpdateSchema }),
  timetableController.updateTimetable
);
router.delete('/:id', canWrite, validate({ params: idParamSchema }), timetableController.deleteTimetable);

export default router;
