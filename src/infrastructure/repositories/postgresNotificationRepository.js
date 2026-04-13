function createPostgresNotificationRepository({ pool }) {
  async function createNotification({ id, userId, storyId, chapterId, message }) {
    await pool.query(
      `INSERT INTO notifications (id, user_id, story_id, chapter_id, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, userId, storyId, chapterId, message]
    );
  }

  async function getUserNotifications(userId) {
    const result = await pool.query(
      `SELECT n.id, n.story_id, n.chapter_id, n.message, n.read, n.created_at,
              s.title AS story_title
       FROM notifications n
       JOIN stories s ON s.id = n.story_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      storyId: row.story_id,
      storyTitle: row.story_title,
      chapterId: row.chapter_id,
      message: row.message,
      read: row.read,
      createdAt: row.created_at,
    }));
  }

  async function findById(notificationId) {
    const result = await pool.query(
      "SELECT id, user_id, story_id, chapter_id, message, read FROM notifications WHERE id = $1",
      [notificationId]
    );
    return result.rows[0] || null;
  }

  async function markAsRead(notificationId) {
    await pool.query(
      "UPDATE notifications SET read = TRUE WHERE id = $1",
      [notificationId]
    );
  }

  async function getUnreadCount(userId) {
    const result = await pool.query(
      "SELECT COUNT(*)::INT AS count FROM notifications WHERE user_id = $1 AND read = FALSE",
      [userId]
    );
    return result.rows[0]?.count || 0;
  }

  return {
    createNotification,
    getUserNotifications,
    findById,
    markAsRead,
    getUnreadCount,
  };
}

module.exports = {
  createPostgresNotificationRepository,
};
