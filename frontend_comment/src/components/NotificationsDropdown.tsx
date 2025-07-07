import React, { useState, useEffect } from "react";
import { notificationsAPI } from "../services/api";
import type { Notification } from "../services/api";
import { useCommentsRefresh } from "../contexts/CommentsRefreshContext";

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  isOpen,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { refreshComments } = useCommentsRefresh();

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationsAPI.getAll(10);
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      // Refresh comments when a notification is marked as read
      refreshComments();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      // Refresh comments when all notifications are marked as read
      refreshComments();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "REPLY":
        return "💬";
      case "MENTION":
        return "@";
      case "COMMENT_UPDATED":
        return "✏️";
      case "COMMENT_DELETED":
        return "🗑️";
      default:
        return "🔔";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-12 right-0 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          <div className="flex space-x-2">
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-6 text-center text-gray-500">
            Loading notifications...
          </div>
        ) : error ? (
          <div className="px-4 py-6 text-center text-red-500">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-6 text-center text-gray-500">
            No notifications yet
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.isRead
                    ? "bg-blue-50 border-l-4 border-blue-400"
                    : ""
                }`}
                onClick={() => {
                  if (!notification.isRead) {
                    handleMarkAsRead(notification.id);
                  }
                }}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    {notification.comment && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700">
                        "
                        {notification.comment.text.length > 100
                          ? notification.comment.text.substring(0, 100) + "..."
                          : notification.comment.text}
                        "
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button
            onClick={() => {
              // Could navigate to a full notifications page
              onClose();
            }}
            className="text-sm text-blue-600 hover:text-blue-800 w-full text-center"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};
