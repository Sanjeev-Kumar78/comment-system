import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration and better error reporting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    // Enhanced error logging for production debugging
    console.error("API Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
    });

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  signup: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await api.post("/auth/signup", userData);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response.data;
  },
};

// Comments API
export const commentsAPI = {
  getAll: async () => {
    const response = await api.get("/comments");
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await api.get(`/comments/${id}`);
    return response.data;
  },

  getReplies: async (id: string) => {
    const response = await api.get(`/comments/${id}/replies`);
    return response.data;
  },

  create: async (commentData: { text: string; parentId?: string }) => {
    const response = await api.post("/comments", commentData);
    return response.data;
  },

  update: async (id: string, updateData: { text: string }) => {
    const response = await api.put(`/comments/${id}`, updateData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  },

  restore: async (id: string) => {
    const response = await api.post(`/comments/${id}/restore`);
    return response.data;
  },

  // Get current user's comments only
  getMyComments: async () => {
    const response = await api.get("/comments/my-comments");
    return response.data;
  },

  // Get current user's comments with full thread context
  getMyCommentsWithContext: async () => {
    const response = await api.get("/comments/my-comments/with-context");
    return response.data;
  },

  // Check ownership of all comments for current user
  checkOwnership: async () => {
    const response = await api.get("/comments/ownership-check");
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async (limit?: number) => {
    const params = limit ? `?limit=${limit}` : "";
    const response = await api.get(`/notifications${params}`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get("/notifications/unread-count");
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch("/notifications/mark-all-read");
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  parentId?: string;
  userId: string;
  user: User;
  replies?: Comment[];
}

export interface Notification {
  id: string;
  isRead: boolean;
  createdAt: string;
  type: "REPLY" | "MENTION" | "COMMENT_UPDATED" | "COMMENT_DELETED";
  title: string;
  message: string;
  comment?: {
    id: string;
    text: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
