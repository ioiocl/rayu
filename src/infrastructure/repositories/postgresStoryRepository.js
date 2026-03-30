function normalizeUsername(username) {
  const normalized = String(username || "").trim().toLowerCase();

  if (!normalized) {
    throw new Error("username es obligatorio");
  }

  return normalized;
}

function mapStoryRows(rows) {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    contentType: row.content_type,
    coverContent: row.cover_content,
    createdBy: row.created_by,
    createdAt: row.created_at,
    chapterCount: row.chapter_count || 0,
  }));
}

function createTransactionRepository(client) {
  async function findOrCreateUser(username) {
    const normalized = normalizeUsername(username);

    const existing = await client.query(
      "SELECT id, username FROM users WHERE username = $1",
      [normalized]
    );

    if (existing.rows[0]) {
      return existing.rows[0];
    }

    const { v4: uuidv4 } = require("uuid");

    const inserted = await client.query(
      "INSERT INTO users (id, username) VALUES ($1, $2) RETURNING id, username",
      [uuidv4(), normalized]
    );

    return inserted.rows[0];
  }

  async function insertStory({ id, title, contentType, coverContent, createdBy }) {
    await client.query(
      `INSERT INTO stories (id, title, content_type, cover_content, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, title, contentType, coverContent, createdBy]
    );
  }

  async function insertChapterActivity({
    id,
    storyId,
    chapterId,
    chapterNumber,
    parentChapterId,
    createdBy,
  }) {
    await client.query(
      `INSERT INTO chapter_activity (id, story_id, chapter_id, chapter_number, parent_chapter_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, storyId, chapterId, chapterNumber, parentChapterId, createdBy]
    );
  }

  return {
    findOrCreateUser,
    insertStory,
    insertChapterActivity,
  };
}

function createPostgresStoryRepository({ pool }) {
  async function listStoriesWithChapterCount() {
    const storiesResult = await pool.query(
      `SELECT s.id,
              s.title,
              s.content_type,
              s.cover_content,
              s.created_at,
              u.username AS created_by,
              COALESCE(stats.chapter_count, 0) AS chapter_count
         FROM stories s
         JOIN users u ON u.id = s.created_by
         LEFT JOIN (
           SELECT story_id, COUNT(*)::INT AS chapter_count
           FROM chapter_activity
           GROUP BY story_id
         ) stats ON stats.story_id = s.id
         ORDER BY s.created_at DESC
         LIMIT 50`
    );

    return mapStoryRows(storiesResult.rows);
  }

  async function storyExists(storyId) {
    const result = await pool.query("SELECT id FROM stories WHERE id = $1", [storyId]);
    return Boolean(result.rows.length);
  }

  async function withTransaction(work) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const txRepo = createTransactionRepository(client);
      const output = await work(txRepo);
      await client.query("COMMIT");
      return output;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  return {
    listStoriesWithChapterCount,
    storyExists,
    withTransaction,
  };
}

module.exports = {
  createPostgresStoryRepository,
};
