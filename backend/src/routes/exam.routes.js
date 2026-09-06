import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import { ROLES } from '../constants/index.js';
import * as examController from '../controllers/exam.controller.js';

const router = Router();

router.use(authenticate);

const canManage = authorize(ROLES.ADMIN, ROLES.TEACHER);
const canAttempt = authorize(ROLES.STUDENT);
const canRead = authorize(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT);
const adminOnly = authorize(ROLES.ADMIN);

router.get('/', canRead, examController.listExams);
router.post('/', canManage, examController.createExam);
router.get('/:id', canRead, examController.getExam);
router.put('/:id', canManage, examController.updateExam);
router.delete('/:id', adminOnly, examController.deleteExam);

// Question Paper, Answer Key & Marking Scheme
router.get('/:id/paper', canRead, examController.getExamPaper);
router.post('/:id/questions', canManage, examController.addQuestions);

// Digital Exam Student Attempt & Evaluation
router.post('/:id/digital/attempt', canAttempt, examController.startDigitalAttempt);
router.post('/:id/digital/submit', canAttempt, examController.submitDigitalAttempt);
router.post('/attempts/:attemptId/evaluate', canManage, examController.evaluateDigitalAttempt);

export default router;
