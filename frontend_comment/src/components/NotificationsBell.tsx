import React, { useState, useEffect } from "react";
import { notificationsAPI } from "../services/api";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { useCommentsRefresh } from "../contexts/CommentsRefreshContext";

export const NotificationsBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { refreshComments } = useCommentsRefresh();

  useEffect(() => {
    loadUnreadCount();
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await notificationsAPI.getUnreadCount();
      setUnreadCount(count.count || 0);
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  };

  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
    // Refresh comments when opening notifications
    if (!isDropdownOpen) {
      refreshComments();
    }
  };

  const handleDropdownClose = () => {
    setIsDropdownOpen(false);
    // Refresh unread count and comments when dropdown closes
    loadUnreadCount();
    refreshComments();
  };

  return (
    <div className="relative">
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        {/* Bell Icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <NotificationsDropdown
        isOpen={isDropdownOpen}
        onClose={handleDropdownClose}
      />
    </div>
  );
};
