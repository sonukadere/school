import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as userController from '../controllers/user.controller.js';
import {
  userCreateSchema,
  userUpdateSchema,
  userQuerySchema,
} from '../validators/user.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

// User account management is restricted to admins.
const canManage = authorize(ROLES.ADMIN);

router.get('/roles', canManage, userController.getRoleOptions);
router.get('/', canManage, validate({ query: userQuerySchema }), userController.listUsers);
router.get('/:id', canManage, validate({ params: idParamSchema }), userController.getUser);
router.post('/', canManage, validate({ body: userCreateSchema }), userController.createUser);
router.put(
  '/:id',
  canManage,
  validate({ params: idParamSchema, body: userUpdateSchema }),
  userController.updateUser
);
router.delete('/:id', canManage, validate({ params: idParamSchema }), userController.deleteUser);

export default router;
