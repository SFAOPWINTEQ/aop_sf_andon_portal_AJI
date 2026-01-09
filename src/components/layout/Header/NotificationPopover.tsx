"use client";

import { useState, useTransition, useEffect } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Settings as SettingsIcon,
  Megaphone,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/server/notificationService";

type Notification = {
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

const getTypeIcon = (type: string) => {
  switch (type.toUpperCase()) {
    case "SUCCESS":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "WARNING":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "ERROR":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "SYSTEM":
      return <SettingsIcon className="h-4 w-4 text-blue-500" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

const getTypeBadgeVariant = (
  type: string,
): "default" | "secondary" | "destructive" | "outline" => {
  switch (type.toUpperCase()) {
    case "ERROR":
      return "destructive";
    case "WARNING":
      return "outline";
    case "SUCCESS":
      return "default";
    default:
      return "secondary";
  }
};

export function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<"user" | "broadcast">("user");
  const [isPending, startTransition] = useTransition();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch unread count with auto-refresh every 30 seconds
  const { data: unreadCountData, mutate: mutateUnreadCount } = useSWR(
    "notifications-unread-count",
    async () => {
      const result = await getUnreadCount();
      return result.success ? result.count : 0;
    },
    {
      refreshInterval: 30000, // Auto-refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  );

  // Fetch notifications only when popover is open
  const {
    data: notificationsData,
    mutate: mutateNotifications,
    isLoading,
  } = useSWR<Notification[]>(
    open ? "notifications-list" : null, // Only fetch when open
    async () => {
      const result = await getNotifications({ limit: 50 });
      return result.success && result.notifications ? result.notifications : [];
    },
    {
      revalidateOnFocus: false, // Don't refetch on focus since we have interval
      dedupingInterval: 5000, // Prevent duplicate requests within 5 seconds
    },
  );

  const unreadCount = unreadCountData ?? 0;
  const notifications: Notification[] = notificationsData ?? [];

  // Separate notifications by type
  const userNotifications = notifications.filter((n) => n.user !== null);
  const broadcastNotifications = notifications.filter((n) => n.user === null);

  const userUnreadCount = userNotifications.filter((n) => !n.isRead).length;
  const broadcastUnreadCount = broadcastNotifications.filter(
    (n) => !n.isRead,
  ).length;

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      // Optimistic update
      mutateNotifications(
        (current) =>
          current?.map((n) =>
            n.id === id ? { ...n, isRead: true, readAt: new Date() } : n,
          ),
        false, // Don't revalidate immediately
      );
      mutateUnreadCount((current) => Math.max(0, (current ?? 0) - 1), false);

      const result = await markNotificationAsRead(id);
      if (result.success) {
        // Revalidate after success
        mutateNotifications();
        mutateUnreadCount();
      } else {
        toast.error(result.message || "Failed to mark as read");
        // Revert optimistic update on error
        mutateNotifications();
        mutateUnreadCount();
      }
    });
  };

  const handleMarkAllAsRead = (type: "user" | "broadcast" | "all" = "all") => {
    startTransition(async () => {
      // Optimistic update - only mark notifications of specific type
      mutateNotifications(
        (current) =>
          current?.map((n) => {
            if (type === "all") {
              return { ...n, isRead: true, readAt: new Date() };
            }
            if (type === "user" && n.user !== null) {
              return { ...n, isRead: true, readAt: new Date() };
            }
            if (type === "broadcast" && n.user === null) {
              return { ...n, isRead: true, readAt: new Date() };
            }
            return n;
          }),
        false,
      );

      // Update unread count optimistically
      if (type === "all") {
        mutateUnreadCount(0, false);
      } else if (type === "user") {
        mutateUnreadCount(
          (current) => Math.max(0, (current ?? 0) - userUnreadCount),
          false,
        );
      } else if (type === "broadcast") {
        mutateUnreadCount(
          (current) => Math.max(0, (current ?? 0) - broadcastUnreadCount),
          false,
        );
      }

      const result = await markAllAsRead();
      if (result.success) {
        mutateNotifications();
        mutateUnreadCount();
        toast.success("All notifications marked as read");
      } else {
        toast.error(result.message || "Failed to mark all as read");
        mutateNotifications();
        mutateUnreadCount();
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const deletedNotification = notifications.find((n) => n.id === id);

      // Optimistic update
      mutateNotifications(
        (current) => current?.filter((n) => n.id !== id),
        false,
      );
      if (deletedNotification && !deletedNotification.isRead) {
        mutateUnreadCount((current) => Math.max(0, (current ?? 0) - 1), false);
      }

      const result = await deleteNotification(id);
      if (result.success) {
        mutateNotifications();
        mutateUnreadCount();
        toast.success("Notification deleted");
      } else {
        toast.error(result.message || "Failed to delete notification");
        mutateNotifications();
        mutateUnreadCount();
      }
    });
  };

  // Render notification list component
  const renderNotificationList = (
    notificationsList: Notification[],
    isBroadcast = false,
  ) => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      );
    }

    if (notificationsList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          {isBroadcast ? (
            <Megaphone className="h-12 w-12 text-muted-foreground/50 mb-2" />
          ) : (
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-2" />
          )}
          <p className="text-sm text-muted-foreground">
            {isBroadcast
              ? "No broadcast notifications"
              : "No notifications yet"}
          </p>
        </div>
      );
    }

    return (
      <div className="divide-y">
        {notificationsList.map((notification) => (
          <div
            key={notification.id}
            className={`group relative p-4 hover:bg-accent/50 transition-colors ${
              !notification.isRead ? "bg-accent/20" : ""
            }`}
          >
            {/* Unread Indicator */}
            {!notification.isRead && (
              <div className="absolute left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
            )}

            <div className="flex gap-3 pl-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getTypeIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium leading-none">
                    {notification.title}
                  </h4>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={isPending}
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {/* Only show delete button for user-specific notifications */}
                    {!isBroadcast && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(notification.id)}
                        disabled={isPending}
                        title="Delete"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {notification.message}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <Badge
                    variant={getTypeBadgeVariant(notification.type)}
                    className="text-xs px-1.5 py-0"
                  >
                    {notification.type}
                  </Badge>
                  {notification.category && (
                    <span className="text-xs text-muted-foreground">
                      {notification.category}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render content with tabs
  const renderContent = () => (
    <Tabs
      defaultValue="user"
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as "user" | "broadcast")}
      className="w-full"
    >
      {/* Header with Tabs */}
      <div className="p-4 pb-2 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="rounded-full">
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>

        <TabsList className="w-full">
          <TabsTrigger value="user" className="flex-1 gap-2">
            <User className="h-4 w-4" />
            Personal
            {userUnreadCount > 0 && (
              <Badge
                variant="destructive"
                className="h-5 min-w-5 rounded-full px-1 text-xs"
              >
                {userUnreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="flex-1 gap-2">
            <Megaphone className="h-4 w-4" />
            Broadcast
            {broadcastUnreadCount > 0 && (
              <Badge
                variant="destructive"
                className="h-5 min-w-5 rounded-full px-1 text-xs"
              >
                {broadcastUnreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </div>

      <Separator />

      {/* Personal Notifications Tab */}
      <TabsContent value="user" className="mt-0">
        <div className="px-4 py-2">
          {userNotifications.length > 0 && userUnreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMarkAllAsRead("user")}
              disabled={isPending}
              className="h-auto py-1 px-2 text-xs w-full"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px] md:h-[500px]">
          {renderNotificationList(userNotifications, false)}
        </ScrollArea>
      </TabsContent>

      {/* Broadcast Notifications Tab */}
      <TabsContent value="broadcast" className="mt-0">
        <div className="px-4 py-2">
          {broadcastNotifications.length > 0 && broadcastUnreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMarkAllAsRead("broadcast")}
              disabled={isPending}
              className="h-auto py-1 px-2 text-xs w-full"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px] md:h-[500px]">
          {renderNotificationList(broadcastNotifications, true)}
        </ScrollArea>
      </TabsContent>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full text-xs"
              onClick={() => {
                setOpen(false);
              }}
            >
              Close
            </Button>
          </div>
        </>
      )}
    </Tabs>
  );

  // Mobile: Full-screen Sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <>
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
                <span className="sr-only">
                  {unreadCount} unread notifications
                </span>
              </>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Notifications</SheetTitle>
          </SheetHeader>
          {renderContent()}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Popover with overlay
  return (
    <>
      {/* Overlay when popover is open */}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <>
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
                <span className="sr-only">
                  {unreadCount} unread notifications
                </span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0 z-50" align="end">
          {renderContent()}
        </PopoverContent>
      </Popover>
    </>
  );
}
