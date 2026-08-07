import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as noticeController from '../controllers/notice.controller.js';
import {
  noticeCreateSchema,
  noticeUpdateSchema,
  noticeQuerySchema,
} from '../validators/notice.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

const canRead = authorize(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT, ROLES.STAFF);
const canWrite = authorize(ROLES.ADMIN);

router.get('/', canRead, validate({ query: noticeQuerySchema }), noticeController.listNotices);
router.get('/:id', canRead, validate({ params: idParamSchema }), noticeController.getNotice);
router.post('/', canWrite, validate({ body: noticeCreateSchema }), noticeController.createNotice);
router.put(
  '/:id',
  canWrite,
  validate({ params: idParamSchema, body: noticeUpdateSchema }),
  noticeController.updateNotice
);
router.delete('/:id', canWrite, validate({ params: idParamSchema }), noticeController.deleteNotice);

export default router;
