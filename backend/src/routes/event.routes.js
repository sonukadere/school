import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as eventController from '../controllers/event.controller.js';
import { eventCreateSchema, eventUpdateSchema, eventQuerySchema } from '../validators/event.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

const canRead = authorize(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT, ROLES.STAFF);
const canWrite = authorize(ROLES.ADMIN);

router.get('/', canRead, validate({ query: eventQuerySchema }), eventController.listEvents);
router.get('/:id', canRead, validate({ params: idParamSchema }), eventController.getEvent);
router.post('/', canWrite, validate({ body: eventCreateSchema }), eventController.createEvent);
router.put(
  '/:id',
  canWrite,
  validate({ params: idParamSchema, body: eventUpdateSchema }),
  eventController.updateEvent
);
router.delete('/:id', canWrite, validate({ params: idParamSchema }), eventController.deleteEvent);

export default router;
