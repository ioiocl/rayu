const { v4: uuidv4 } = require("uuid");

const { pool } = require("../db/postgres");
const { driver } = require("../db/neo4j");
const { createStoryService } = require("../application/stories/storyService");
const { createAuthService } = require("../application/auth/authService");
const { createUserService } = require("../application/users/userService");
const {
  createPostgresStoryRepository,
} = require("./repositories/postgresStoryRepository");
const {
  createNeo4jStoryGraphRepository,
} = require("./repositories/neo4jStoryGraphRepository");
const {
  createPostgresUserRepository,
} = require("./repositories/postgresUserRepository");
const {
  createPostgresNotificationRepository,
} = require("./repositories/postgresNotificationRepository");

function createContainer() {
  const storyRepository = createPostgresStoryRepository({ pool });
  const storyGraphRepository = createNeo4jStoryGraphRepository({ driver });
  const userRepository = createPostgresUserRepository({ pool });
  const notificationRepository = createPostgresNotificationRepository({ pool });

  const storyService = createStoryService({
    storyRepository,
    storyGraphRepository,
    notificationRepository,
    idGenerator: uuidv4,
    now: () => new Date(),
  });

  const authService = createAuthService({
    userRepository,
    idGenerator: uuidv4,
  });

  const userService = createUserService({
    userRepository,
    notificationRepository,
  });

  return {
    storyService,
    authService,
    userService,
  };
}

module.exports = {
  createContainer,
};
