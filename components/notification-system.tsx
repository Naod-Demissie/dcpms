"use client";

import React, { useState, useEffect } from "react";
import { Bell, X, CheckCircle, AlertCircle, Info, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface Notification {
  id: string;
  type: "success" | "warning" | "info" | "appointment";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionRequired?: boolean;
}

interface NotificationSystemProps {
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationSystem({
  onNotificationClick,
}: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "appointment",
      title: "Upcoming Appointment",
      message: "John Doe has an appointment in 30 minutes",
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: false,
      actionRequired: true,
    },
    {
      id: "2",
      type: "success",
      title: "Treatment Completed",
      message:
        "Root canal treatment for Jane Smith has been completed successfully",
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      read: false,
    },
    {
      id: "3",
      type: "info",
      title: "Invoice Generated",
      message: "Invoice INV-001 has been generated and sent to patient",
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: true,
    },
    {
      id: "4",
      type: "warning",
      title: "Prescription Expiring",
      message: "Prescription RX-001 will expire in 2 days",
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      read: false,
      actionRequired: true,
    },
  ]);

  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "appointment":
        return <Clock className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    onNotificationClick?.(notification);

    if (notification.actionRequired) {
      toast.info(`Action required: ${notification.title}`);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate a new notification every 2 minutes
      if (Math.random() > 0.7) {
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: ["success", "info", "warning", "appointment"][
            Math.floor(Math.random() * 4)
          ] as Notification["type"],
          title: "New Notification",
          message: "This is a simulated real-time notification",
          timestamp: new Date(),
          read: false,
          actionRequired: Math.random() > 0.5,
        };

        setNotifications((prev) => [newNotification, ...prev]);
        toast.info("New notification received");
      }
    }, 120000); // Every 2 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-background border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                    !notification.read ? "bg-muted/20" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-sm font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {notification.title}
                        </p>
                        <div className="flex items-center space-x-1">
                          {notification.actionRequired && (
                            <Badge variant="outline" className="text-xs">
                              Action
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="h-4 w-4 opacity-50 hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for managing notifications globally
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (
    notification: Omit<Notification, "id" | "timestamp" | "read">
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);
    toast.info(notification.title);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return {
    notifications,
    addNotification,
    markAsRead,
    removeNotification,
  };
}
