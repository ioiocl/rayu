function mapChapterNode(node) {
  return {
    id: node.properties.id,
    storyId: node.properties.storyId,
    contentType: node.properties.contentType,
    content: node.properties.content,
    chapterNumber: node.properties.chapterNumber,
    parentChapterId: node.properties.parentChapterId || null,
    authorId: node.properties.authorId,
    createdAt: node.properties.createdAt,
  };
}

function createNeo4jStoryGraphRepository({ driver }) {
  async function createRootChapter({
    id,
    storyId,
    contentType,
    content,
    authorId,
    createdAt,
  }) {
    const session = driver.session();

    try {
      await session.run(
        `CREATE (c:Chapter {
          id: $chapterId,
          storyId: $storyId,
          contentType: $contentType,
          content: $content,
          chapterNumber: 1,
          parentChapterId: null,
          authorId: $authorId,
          createdAt: datetime($createdAt)
        })`,
        {
          chapterId: id,
          storyId,
          contentType,
          content,
          authorId,
          createdAt,
        }
      );
    } finally {
      await session.close();
    }
  }

  async function getStoryGraph(storyId) {
    const session = driver.session();

    try {
      const result = await session.run(
        `MATCH (c:Chapter {storyId: $storyId})
         OPTIONAL MATCH (parent:Chapter)-[r:NEXT]->(c)
         RETURN c, parent, r`,
        { storyId }
      );

      const nodesById = new Map();
      const edges = [];

      for (const record of result.records) {
        const chapterNode = record.get("c");
        const parentNode = record.get("parent");
        const relation = record.get("r");

        if (chapterNode) {
          nodesById.set(chapterNode.properties.id, mapChapterNode(chapterNode));
        }

        if (parentNode) {
          nodesById.set(parentNode.properties.id, mapChapterNode(parentNode));
        }

        if (relation && parentNode && chapterNode) {
          edges.push({
            id: relation.properties.id,
            from: parentNode.properties.id,
            to: chapterNode.properties.id,
          });
        }
      }

      return {
        nodes: Array.from(nodesById.values()),
        edges,
      };
    } finally {
      await session.close();
    }
  }

  async function findChapterInStory({ storyId, chapterId }) {
    const session = driver.session();

    try {
      const result = await session.run(
        "MATCH (c:Chapter {id: $chapterId, storyId: $storyId}) RETURN c LIMIT 1",
        { chapterId, storyId }
      );

      if (!result.records.length) {
        return null;
      }

      return result.records[0].get("c").properties;
    } finally {
      await session.close();
    }
  }

  async function createChildChapter({
    parentChapterId,
    chapterId,
    storyId,
    contentType,
    content,
    chapterNumber,
    authorId,
    relationId,
    createdAt,
  }) {
    const session = driver.session();

    try {
      await session.run(
        `MATCH (parent:Chapter {id: $parentChapterId, storyId: $storyId})
         CREATE (child:Chapter {
           id: $chapterId,
           storyId: $storyId,
           contentType: $contentType,
           content: $content,
           chapterNumber: $chapterNumber,
           parentChapterId: $parentChapterId,
           authorId: $authorId,
           createdAt: datetime($createdAt)
         })
         CREATE (parent)-[:NEXT {id: $relationId, createdAt: datetime($createdAt)}]->(child)
         RETURN child`,
        {
          parentChapterId,
          chapterId,
          storyId,
          contentType,
          content,
          chapterNumber,
          authorId,
          relationId,
          createdAt,
        }
      );
    } finally {
      await session.close();
    }
  }

  return {
    createRootChapter,
    getStoryGraph,
    findChapterInStory,
    createChildChapter,
  };
}

module.exports = {
  createNeo4jStoryGraphRepository,
};
