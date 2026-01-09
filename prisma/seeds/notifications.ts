import { PrismaClient } from "@prisma/client";

export async function seedNotifications(prisma: PrismaClient): Promise<void> {
  // Get some users to create notifications for
  const users = await prisma.user.findMany({
    select: { id: true, name: true },
    take: 3,
  });

  if (users.length === 0) {
    console.log("   ⚠️  No users found, skipping notification seeding");
    return;
  }

  // Create broadcast notifications (userId: null)
  const broadcastNotifications = [
    {
      title: "System Maintenance Notice",
      message:
        "Scheduled maintenance will occur on Saturday, 10 PM - 2 AM EST. Please save your work.",
      type: "WARNING",
      category: "SYSTEM",
      scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    {
      title: "Welcome to the Admin Portal",
      message:
        "Welcome to our new administration system. Please read the documentation for getting started.",
      type: "INFO",
      category: "SYSTEM",
    },
    {
      title: "Security Update",
      message:
        "New security features have been enabled. Please review your account settings.",
      type: "SUCCESS",
      category: "SECURITY",
    },
  ];

  // Create user-specific notifications
  const userNotifications = users.flatMap((user) => [
    {
      title: "Profile Update Required",
      message: `Hi ${user.name}, please update your profile information to continue using the system.`,
      type: "INFO",
      category: "USER",
      userId: user.id,
    },
    {
      title: "Task Assignment",
      message: `You have been assigned a new task. Please check your dashboard for details.`,
      type: "INFO",
      category: "USER",
      userId: user.id,
      isRead: Math.random() > 0.5, // Randomly mark some as read
      readAt: Math.random() > 0.5 ? new Date() : null,
    },
  ]);

  // Create some additional system notifications with different types
  const systemNotifications = [
    {
      title: "Database Backup Complete",
      message: "Daily database backup completed successfully at 3:00 AM.",
      type: "SUCCESS",
      category: "SYSTEM",
      sentAt: new Date(),
    },
    {
      title: "Failed Login Attempt",
      message: "Multiple failed login attempts detected from IP 192.168.1.100.",
      type: "ERROR",
      category: "SECURITY",
      sentAt: new Date(),
    },
    {
      title: "Monthly Report Available",
      message: "Your monthly usage report is now available for download.",
      type: "INFO",
      category: "REPORTS",
    },
  ];

  // Combine all notifications
  const allNotifications = [
    ...broadcastNotifications,
    ...userNotifications,
    ...systemNotifications,
  ];

  // Create all notifications using createMany
  const result = await prisma.notification.createMany({
    data: allNotifications,
    skipDuplicates: true,
  });

  console.log(
    `   🔔 Created ${result.count} notifications (skipped duplicates)`,
  );

  // Get total notification count for reporting
  const totalNotifications = await prisma.notification.count();
  const unreadCount = await prisma.notification.count({
    where: { isRead: false },
  });

  console.log(`   📊 Total notifications in database: ${totalNotifications}`);
  console.log(`   📩 Unread notifications: ${unreadCount}`);
}
