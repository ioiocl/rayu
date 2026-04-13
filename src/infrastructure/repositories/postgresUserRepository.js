function createPostgresUserRepository({ pool }) {
  async function findByEmail(email) {
    const result = await pool.query(
      "SELECT id, username, email, password, created_at FROM users WHERE email = $1",
      [email]
    );
    return result.rows[0] || null;
  }

  async function findByNickname(nickname) {
    const normalizedNickname = nickname.trim().toLowerCase();
    const result = await pool.query(
      "SELECT id, username, email, created_at FROM users WHERE username = $1",
      [normalizedNickname]
    );
    return result.rows[0] || null;
  }

  async function findByEmailOrNickname(email, nickname) {
    const result = await pool.query(
      "SELECT id, username, email, created_at FROM users WHERE email = $1 OR username = $2",
      [email, nickname.trim().toLowerCase()]
    );
    return result.rows[0] || null;
  }

  async function findById(userId) {
    const result = await pool.query(
      "SELECT id, username, email, created_at FROM users WHERE id = $1",
      [userId]
    );
    return result.rows[0] || null;
  }

  async function createUser({ id, email, password, username }) {
    await pool.query(
      "INSERT INTO users (id, email, password, username) VALUES ($1, $2, $3, $4)",
      [id, email, password, username]
    );
  }

  async function getUserStories(userId) {
    const result = await pool.query(
      `SELECT s.id, s.title, s.content_type, s.cover_content, s.created_at,
              COALESCE(stats.chapter_count, 0) AS chapter_count
       FROM stories s
       LEFT JOIN (
         SELECT story_id, COUNT(*)::INT AS chapter_count
         FROM chapter_activity
         GROUP BY story_id
       ) stats ON stats.story_id = s.id
       WHERE s.created_by = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      contentType: row.content_type,
      coverContent: row.cover_content,
      createdAt: row.created_at,
      chapterCount: row.chapter_count,
    }));
  }

  async function getUserChapters(userId) {
    const result = await pool.query(
      `SELECT ca.chapter_id, ca.chapter_number, ca.created_at,
              s.id AS story_id, s.title AS story_title
       FROM chapter_activity ca
       JOIN stories s ON s.id = ca.story_id
       WHERE ca.created_by = $1
       ORDER BY ca.created_at DESC
       LIMIT 50`,
      [userId]
    );

    return result.rows.map((row) => ({
      chapterId: row.chapter_id,
      chapterNumber: row.chapter_number,
      createdAt: row.created_at,
      storyId: row.story_id,
      storyTitle: row.story_title,
    }));
  }

  return {
    findByEmail,
    findByNickname,
    findByEmailOrNickname,
    findById,
    createUser,
    getUserStories,
    getUserChapters,
  };
}

module.exports = {
  createPostgresUserRepository,
};
