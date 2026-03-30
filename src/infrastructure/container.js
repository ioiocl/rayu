const { v4: uuidv4 } = require("uuid");

const { pool } = require("../db/postgres");
const { driver } = require("../db/neo4j");
const { createStoryService } = require("../application/stories/storyService");
const {
  createPostgresStoryRepository,
} = require("./repositories/postgresStoryRepository");
const {
  createNeo4jStoryGraphRepository,
} = require("./repositories/neo4jStoryGraphRepository");

function createContainer() {
  const storyRepository = createPostgresStoryRepository({ pool });
  const storyGraphRepository = createNeo4jStoryGraphRepository({ driver });

  const storyService = createStoryService({
    storyRepository,
    storyGraphRepository,
    idGenerator: uuidv4,
    now: () => new Date(),
  });

  return {
    storyService,
  };
}

module.exports = {
  createContainer,
};
