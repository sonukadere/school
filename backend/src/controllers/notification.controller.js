import * as notificationService from '../services/notification.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

export const registerToken = asyncHandler(async (req, res) => {
  const { token, deviceType } = req.body;
  if (!token) {
    throw ApiError.badRequest('Device token is required.');
  }

  const result = await notificationService.registerDeviceToken(req.user.id, token, deviceType);
  res.status(200).json(new ApiResponse(200, 'Device token registered successfully.', result));
});

export const unregisterToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) {
    throw ApiError.badRequest('Device token is required.');
  }

  await notificationService.unregisterDeviceToken(token);
  res.status(200).json(new ApiResponse(200, 'Device token unregistered successfully.'));
});

export const getMyNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(req.user.id, req.query);
  res.status(200).json(
    new ApiResponse(200, 'Notifications retrieved successfully.', result.data, {
      ...result.meta,
      unreadCount: result.unreadCount,
    })
  );
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await notificationService.markNotificationAsRead(req.user.id, id);
  res.status(200).json(new ApiResponse(200, 'Notification marked as read.'));
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllNotificationsAsRead(req.user.id);
  res.status(200).json(new ApiResponse(200, 'All notifications marked as read.'));
});

export const sendPush = asyncHandler(async (req, res) => {
  const { userId, role, audience, title, body, data, type } = req.body;

  if (!title || !body) {
    throw ApiError.badRequest('Title and body are required for notification.');
  }

  let result;
  if (userId) {
    result = await notificationService.sendNotificationToUser(userId, { title, body, data, type });
  } else if (role) {
    result = await notificationService.sendNotificationToRole(role, { title, body, data, type });
  } else {
    result = await notificationService.broadcastNotification({ title, body, audience: audience || 'ALL', data, type });
  }

  res.status(200).json(new ApiResponse(200, 'Notification dispatched successfully.', result));
});

export const sendTestPush = asyncHandler(async (req, res) => {
  const result = await notificationService.sendNotificationToUser(req.user.id, {
    title: '🎉 Test Notification',
    body: `Hello ${req.user.name}, your notification alert service is working perfectly!`,
    data: { test: true, url: '/dashboard' },
    type: 'GENERAL',
  });

  res.status(200).json(new ApiResponse(200, 'Test notification dispatched to your account.', result));
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await notificationService.deleteNotification(req.user.id, id);
  res.status(200).json(new ApiResponse(200, 'Notification deleted successfully.'));
});

export const clearAllNotifications = asyncHandler(async (req, res) => {
  await notificationService.deleteAllNotifications(req.user.id);
  res.status(200).json(new ApiResponse(200, 'All notifications cleared successfully.'));
});
