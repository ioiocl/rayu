function createAppError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function validateContentType(contentType) {
  if (!["text", "image"].includes(contentType)) {
    throw createAppError("contentType debe ser text o image", 400);
  }
}

function createStoryService({
  storyRepository,
  storyGraphRepository,
  notificationRepository,
  idGenerator,
  now,
}) {
  async function listStories() {
    return storyRepository.listStoriesWithChapterCount();
  }

  async function createStory({ username, title, contentType, content }) {
    if (!username || !title || !contentType || !content) {
      throw createAppError(
        "username, title, contentType y content son obligatorios",
        400
      );
    }

    validateContentType(contentType);

    const storyId = idGenerator();
    const chapterId = idGenerator();
    const createdAt = now().toISOString();

    await storyRepository.withTransaction(async (tx) => {
      const user = await tx.findOrCreateUser(username);

      await tx.insertStory({
        id: storyId,
        title,
        contentType,
        coverContent: content,
        createdBy: user.id,
      });

      await storyGraphRepository.createRootChapter({
        id: chapterId,
        storyId,
        contentType,
        content,
        authorId: user.id,
        createdAt,
      });

      await tx.insertChapterActivity({
        id: idGenerator(),
        storyId,
        chapterId,
        chapterNumber: 1,
        parentChapterId: null,
        createdBy: user.id,
      });
    });

    return {
      story: {
        id: storyId,
        title,
        contentType,
        coverContent: content,
      },
      firstChapterId: chapterId,
    };
  }

  async function getStoryGraph(storyId) {
    return storyGraphRepository.getStoryGraph(storyId);
  }

  async function createChapter({
    storyId,
    username,
    parentChapterId,
    contentType,
    content,
  }) {
    if (!username || !parentChapterId || !contentType || !content) {
      throw createAppError(
        "username, parentChapterId, contentType y content son obligatorios",
        400
      );
    }

    validateContentType(contentType);

    const storyExists = await storyRepository.storyExists(storyId);

    if (!storyExists) {
      throw createAppError("La historia no existe", 404);
    }

    const parentChapter = await storyGraphRepository.findChapterInStory({
      storyId,
      chapterId: parentChapterId,
    });

    if (!parentChapter) {
      throw createAppError("No se encontró el capítulo padre en esta historia", 404);
    }

    const chapterId = idGenerator();
    const relationId = idGenerator();
    const chapterNumber = Number(parentChapter.chapterNumber) + 1;
    const createdAt = now().toISOString();

    await storyRepository.withTransaction(async (tx) => {
      const user = await tx.findOrCreateUser(username);

      await storyGraphRepository.createChildChapter({
        parentChapterId,
        chapterId,
        storyId,
        contentType,
        content,
        chapterNumber,
        authorId: user.id,
        relationId,
        createdAt,
      });

      await tx.insertChapterActivity({
        id: idGenerator(),
        storyId,
        chapterId,
        chapterNumber,
        parentChapterId,
        createdBy: user.id,
      });

      const storyCreator = await tx.getStoryCreator(storyId);
      if (storyCreator && storyCreator.id !== user.id && storyCreator.email) {
        await notificationRepository.createNotification({
          id: idGenerator(),
          userId: storyCreator.id,
          storyId,
          chapterId,
          message: `${username} agregó un nuevo capítulo a tu historia`,
        });
      }
    });

    return {
      chapter: {
        id: chapterId,
        storyId,
        parentChapterId,
        contentType,
        content,
        chapterNumber,
      },
    };
  }

  return {
    listStories,
    createStory,
    getStoryGraph,
    createChapter,
  };
}

module.exports = {
  createStoryService,
};
