import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as settingController from '../controllers/setting.controller.js';
import { settingUpsertSchema } from '../validators/setting.schema.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Public read access so login, headers, notices, etc. can display school branding
router.get('/', settingController.getSettings);

// Admin-only for updating school settings
router.use(authenticate, authorize(ROLES.ADMIN));
router.put('/', validate({ body: settingUpsertSchema }), settingController.updateSettings);
router.post('/logo', upload.single('logo'), settingController.uploadLogo);

export default router;
