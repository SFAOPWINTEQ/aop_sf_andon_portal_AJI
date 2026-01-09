import { db } from "@/lib/db";

export const notificationRepository = {
  /**
   * Get notifications for a specific user
   */
  async getByUserId(params: {
    userId: string;
    limit?: number;
    unreadOnly?: boolean;
  }) {
    const { userId, limit = 50, unreadOnly = false } = params;

    const where = {
      OR: [
        { userId }, // User-specific notifications
        { userId: null }, // Broadcast notifications
      ],
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const notifications = await db.notification.findMany({
      where,
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            npk: true,
          },
        },
      },
    });

    return notifications;
  },

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string) {
    const count = await db.notification.count({
      where: {
        OR: [{ userId }, { userId: null }],
        isRead: false,
      },
    });

    return count;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string) {
    // Verify notification belongs to user or is broadcast
    const notification = await db.notification.findFirst({
      where: {
        id,
        OR: [{ userId }, { userId: null }],
      },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    return await db.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return await db.notification.updateMany({
      where: {
        OR: [{ userId }, { userId: null }],
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  },

  /**
   * Delete notification
   */
  async delete(id: string, userId: string) {
    // Verify notification belongs to user
    const notification = await db.notification.findFirst({
      where: {
        id,
        userId, // Only allow deleting user-specific notifications
      },
    });

    if (!notification) {
      throw new Error("Notification not found or cannot be deleted");
    }

    return await db.notification.delete({
      where: { id },
    });
  },

  /**
   * Create notification
   */
  async create(data: {
    title: string;
    message: string;
    type?: string;
    category?: string;
    userId?: string | null;
    scheduledFor?: Date;
  }) {
    return await db.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type || "INFO",
        category: data.category,
        userId: data.userId,
        scheduledFor: data.scheduledFor,
        sentAt: data.scheduledFor ? undefined : new Date(),
      },
    });
  },
};
