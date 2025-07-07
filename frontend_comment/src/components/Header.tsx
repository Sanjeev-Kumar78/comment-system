import React from "react";
import { useAuth } from "../hooks/useAuth";
import { NotificationsBell } from "./NotificationsBell";

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Comment System</h1>

        {user && (
          <div className="flex items-center space-x-4">
            <NotificationsBell />
            <span className="text-gray-700">
              Welcome, {user.firstName} {user.lastName}
            </span>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
