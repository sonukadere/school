import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// User endpoints
router.get('/', notificationController.getMyNotifications);
router.post('/register-token', notificationController.registerToken);
router.post('/unregister-token', notificationController.unregisterToken);
router.post('/test', notificationController.sendTestPush);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/clear-all', notificationController.clearAllNotifications);
router.delete('/:id', notificationController.deleteNotification);
router.delete('/', notificationController.clearAllNotifications);

// Admin dispatch endpoint
router.post('/send', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), notificationController.sendPush);

export default router;
