import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as tcController from '../controllers/transferCertificate.controller.js';
import {
  tcCreateSchema,
  tcUpdateSchema,
  tcQuerySchema,
} from '../validators/transferCertificate.schema.js';

const router = Router();

router.use(authenticate);

const canManage = authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN);
const canViewList = authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT);
const canViewSingle = authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT);

router.get('/', canViewList, validate({ query: tcQuerySchema }), tcController.listTransferCertificates);
router.get('/student/:studentId', canViewSingle, tcController.getStudentTransferCertificate);
router.get('/:id', canViewSingle, tcController.getTransferCertificate);

router.post('/', canManage, validate({ body: tcCreateSchema }), tcController.createTransferCertificate);
router.patch('/:id', canManage, validate({ body: tcUpdateSchema }), tcController.updateTransferCertificate);
router.put('/:id', canManage, validate({ body: tcUpdateSchema }), tcController.updateTransferCertificate);
router.delete('/:id', canManage, tcController.deleteTransferCertificate);

export default router;
