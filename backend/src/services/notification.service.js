import { prisma } from '../config/database.js';
import { messaging } from '../config/firebase.js';
import { notDeleted, getPagination, getPaginationMeta } from '../utils/helpers.js';

/**
 * Register or update an FCM device token for a user
 */
export async function registerDeviceToken(userId, token, deviceType = 'web') {
  if (!token) return null;

  return prisma.deviceToken.upsert({
    where: { token },
    create: {
      userId,
      token,
      deviceType,
    },
    update: {
      userId,
      deviceType,
      updatedAt: new Date(),
    },
  });
}

/**
 * Unregister a device token (e.g. on logout)
 */
export async function unregisterDeviceToken(token) {
  if (!token) return;
  try {
    await prisma.deviceToken.deleteMany({ where: { token } });
  } catch (error) {
    console.warn('[Notification] Failed to remove token:', error.message);
  }
}

/**
 * Clean up invalid or expired FCM registration tokens
 */
async function cleanupInvalidTokens(responses, tokens) {
  const invalidTokens = [];
  responses.forEach((resp, idx) => {
    if (!resp.success && resp.error) {
      const code = resp.error.code;
      if (
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/registration-token-not-registered'
      ) {
        invalidTokens.push(tokens[idx]);
      }
    }
  });

  if (invalidTokens.length > 0) {
    try {
      await prisma.deviceToken.deleteMany({
        where: { token: { in: invalidTokens } },
      });
      console.log(`[Notification] Cleaned up ${invalidTokens.length} expired FCM tokens.`);
    } catch (e) {
      console.warn('[Notification] Error cleaning up tokens:', e.message);
    }
  }
}

/**
 * Send push notification to a specific user
 */
export async function sendNotificationToUser(userId, { title, body, data = {}, type = 'GENERAL' }) {
  // 1. Create in-app notification record
  const record = await prisma.notification.create({
    data: {
      userId,
      title,
      body,
      type,
      data: JSON.stringify(data),
    },
  });

  // 2. Dispatch FCM push notification
  if (messaging) {
    try {
      const deviceTokens = await prisma.deviceToken.findMany({
        where: { userId },
        select: { token: true },
      });

      if (deviceTokens.length > 0) {
        const tokens = deviceTokens.map((d) => d.token);
        const stringifiedData = {};
        Object.entries(data).forEach(([k, v]) => {
          stringifiedData[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
        });

        const message = {
          tokens,
          notification: { title, body },
          data: {
            ...stringifiedData,
            type,
            notificationId: record.id,
            timestamp: new Date().toISOString(),
          },
        };

        const response = await messaging.sendEachForMulticast(message);
        console.log(`[Notification] Push sent to user ${userId}: ${response.successCount} success, ${response.failureCount} failure`);

        if (response.failureCount > 0) {
          await cleanupInvalidTokens(response.responses, tokens);
        }
      }
    } catch (err) {
      console.warn('[Notification] FCM push error:', err.message);
    }
  }

  return record;
}

/**
 * Send push notification to all users with a specific role
 */
export async function sendNotificationToRole(role, { title, body, data = {}, type = 'GENERAL' }) {
  const users = await prisma.user.findMany({
    where: {
      role,
      isActive: true,
      ...notDeleted(),
    },
    select: { id: true },
  });

  const promises = users.map((u) =>
    sendNotificationToUser(u.id, { title, body, data, type })
  );
  return Promise.all(promises);
}

/**
 * Broadcast notification to all active users or by audience
 */
export async function broadcastNotification({ title, body, audience = 'ALL', data = {}, type = 'NOTICE' }) {
  let where = { isActive: true, ...notDeleted() };

  if (audience === 'STUDENT') {
    where.role = 'STUDENT';
  } else if (audience === 'TEACHER') {
    where.role = 'TEACHER';
  } else if (audience === 'PARENT') {
    where.role = 'PARENT';
  } else if (audience === 'ADMIN') {
    where.role = { in: ['ADMIN', 'SUPER_ADMIN'] };
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  const promises = users.map((u) =>
    sendNotificationToUser(u.id, { title, body, data, type })
  );
  return Promise.all(promises);
}

/**
 * Retrieve notifications for a user with pagination
 */
export async function getUserNotifications(userId, query = {}) {
  const { page, limit, skip } = getPagination(query);

  const where = {
    userId,
    ...notDeleted(),
  };

  const [total, notifications, unreadCount] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({
      where: { userId, isRead: false, ...notDeleted() },
    }),
  ]);

  return {
    data: notifications.map((n) => ({
      ...n,
      data: n.data ? JSON.parse(n.data) : {},
    })),
    unreadCount,
    meta: getPaginationMeta(page, limit, total),
  };
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(userId, notificationId) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

/**
 * Mark all notifications for a user as read
 */
export async function markAllNotificationsAsRead(userId) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

/**
 * Send push notification to multiple user IDs concurrently
 */
export async function notifyUsers(userIds = [], { title, body, data = {}, type = 'GENERAL' }) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) return [];
  const promises = uniqueIds.map((id) =>
    sendNotificationToUser(id, { title, body, data, type })
  );
  return Promise.all(promises);
}

/**
 * Delete a single notification for a user
 */
export async function deleteNotification(userId, notificationId) {
  return prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  });
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId) {
  return prisma.notification.deleteMany({
    where: { userId },
  });
}
