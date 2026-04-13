import { API_BASE_URL } from "../config.js";

export function createHttpUserApi() {
  async function getProfile() {
    const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
      credentials: "include",
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al obtener perfil");
    }

    return data.profile;
  }

  async function getNotifications() {
    const response = await fetch(`${API_BASE_URL}/api/users/notifications`, {
      credentials: "include",
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al obtener notificaciones");
    }

    return data.notifications;
  }

  async function markNotificationAsRead(notificationId) {
    const response = await fetch(`${API_BASE_URL}/api/users/notifications/${notificationId}/read`, {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al marcar notificación");
    }

    return data;
  }

  async function getUnreadNotificationCount() {
    const response = await fetch(`${API_BASE_URL}/api/users/notifications/unread-count`, {
      credentials: "include",
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al obtener contador");
    }

    return data.count;
  }

  return {
    getProfile,
    getNotifications,
    markNotificationAsRead,
    getUnreadNotificationCount,
  };
}
