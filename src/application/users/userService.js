function createAppError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function createUserService({ userRepository, notificationRepository }) {
  async function getUserProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw createAppError("Usuario no encontrado", 404);
    }

    const stories = await userRepository.getUserStories(userId);
    const chapters = await userRepository.getUserChapters(userId);

    return {
      id: user.id,
      nickname: user.username,
      email: user.email,
      createdAt: user.created_at,
      stories,
      chapters,
    };
  }

  async function getNotifications(userId) {
    return notificationRepository.getUserNotifications(userId);
  }

  async function markNotificationAsRead(userId, notificationId) {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) {
      throw createAppError("Notificación no encontrada", 404);
    }

    if (notification.user_id !== userId) {
      throw createAppError("No autorizado", 403);
    }

    await notificationRepository.markAsRead(notificationId);
  }

  async function getUnreadNotificationCount(userId) {
    return notificationRepository.getUnreadCount(userId);
  }

  return {
    getUserProfile,
    getNotifications,
    markNotificationAsRead,
    getUnreadNotificationCount,
  };
}

module.exports = {
  createUserService,
};
