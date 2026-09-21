import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as academicController from '../controllers/academic.controller.js';
import {
  createStudyMaterialSchema,
  updateStudyMaterialSchema,
  studyMaterialQuerySchema,
} from '../validators/academic.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();
router.use(authenticate);

const canManageStudyMaterial = authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER);

router.get('/', validate({ query: studyMaterialQuerySchema }), academicController.listStudyMaterials);
router.get('/:id', validate({ params: idParamSchema }), academicController.getStudyMaterial);
router.post('/', canManageStudyMaterial, validate({ body: createStudyMaterialSchema }), academicController.createStudyMaterial);
router.put('/:id', canManageStudyMaterial, validate({ params: idParamSchema, body: updateStudyMaterialSchema }), academicController.updateStudyMaterial);
router.delete('/:id', canManageStudyMaterial, validate({ params: idParamSchema }), academicController.deleteStudyMaterial);

export default router;
