import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import * as meController from '../controllers/me.controller.js';

const router = Router();

router.use(authenticate);

router.get('/profile', meController.getMyProfile);
router.get('/attendance', meController.getMyAttendance);
router.get('/results', meController.getMyResults);
router.get('/fees', meController.getMyFees);
router.get('/exams', meController.getMyExams);
router.get('/timetable', meController.getMyTimetable);
router.get('/notices', meController.getMyNotices);
router.get('/marksheets', meController.getMyMarksheets);
router.get('/transfer-certificate', meController.getMyTransferCertificate);

export default router;
