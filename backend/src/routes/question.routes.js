import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import { ROLES } from '../constants/index.js';
import * as questionController from '../controllers/question.controller.js';

const router = Router();

router.use(authenticate);

// Faculty & Admin access for Question Bank & Discovery
const canManageQuestions = authorize(ROLES.ADMIN, ROLES.TEACHER);

router.get('/match', canManageQuestions, questionController.matchQuestions);
router.post('/detect-duplicate', canManageQuestions, questionController.checkDuplicate);

router.get('/', canManageQuestions, questionController.listQuestions);
router.post('/', canManageQuestions, questionController.createQuestion);
router.get('/:id', canManageQuestions, questionController.getQuestion);
router.put('/:id', canManageQuestions, questionController.updateQuestion);
router.delete('/:id', canManageQuestions, questionController.deleteQuestion);

export default router;
