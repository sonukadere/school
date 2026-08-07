import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as authController from '../controllers/auth.controller.js';
import { loginSchema, registerSchema } from '../validators/auth.schema.js';

const router = Router();

router.post('/login', validate({ body: loginSchema }), authController.login);

router.post(
  '/register',
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ body: registerSchema }),
  authController.register
);

router.post('/logout', authenticate, authController.logout);

router.get('/profile', authenticate, authController.getProfile);

export default router;
