"use server";

import { notificationRepository } from "@/server/notificationRepository";
import { withAuth, type AuthenticatedResponse } from "@/server/authService";

type NotificationData = {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    npk: string | null;
  } | null;
};

export interface NotificationResponse extends AuthenticatedResponse {
  notifications?: NotificationData[];
  count?: number;
}

/**
 * Get notifications for current user
 */
export async function getNotifications(params?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<NotificationResponse> {
  return withAuth(async (user) => {
    try {
      const notifications = await notificationRepository.getByUserId({
        userId: user.id,
        limit: params?.limit,
        unreadOnly: params?.unreadOnly,
      });

      return {
        success: true,
        notifications,
      };
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return {
        success: false,
        message: "Failed to fetch notifications",
        notifications: [],
      };
    }
  });
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<{
  success: boolean;
  count?: number;
  message?: string;
}> {
  return withAuth(async (user) => {
    try {
      const count = await notificationRepository.getUnreadCount(user.id);

      return {
        success: true,
        count,
      };
    } catch (error) {
      console.error("Error getting unread count:", error);
      return {
        success: false,
        message: "Failed to get unread count",
        count: 0,
      };
    }
  });
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  id: string,
): Promise<NotificationResponse> {
  return withAuth(async (user) => {
    try {
      await notificationRepository.markAsRead(id, user.id);

      return {
        success: true,
        message: "Notification marked as read",
      };
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return {
        success: false,
        message: "Failed to mark notification as read",
      };
    }
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<NotificationResponse> {
  return withAuth(async (user) => {
    try {
      await notificationRepository.markAllAsRead(user.id);

      return {
        success: true,
        message: "All notifications marked as read",
      };
    } catch (error) {
      console.error("Error marking all as read:", error);
      return {
        success: false,
        message: "Failed to mark all as read",
      };
    }
  });
}

/**
 * Delete notification
 */
export async function deleteNotification(
  id: string,
): Promise<NotificationResponse> {
  return withAuth(async (user) => {
    try {
      await notificationRepository.delete(id, user.id);

      return {
        success: true,
        message: "Notification deleted",
      };
    } catch (error) {
      console.error("Error deleting notification:", error);
      return {
        success: false,
        message: "Failed to delete notification",
      };
    }
  });
}
