const { initNeo4j, driver } = require("../db/neo4j");
const { initPostgres, pool } = require("../db/postgres");
const { createContainer } = require("./container");
const { createHttpApp } = require("./http/createHttpApp");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function initializeDatabasesWithRetry({ retries, retryDelayMs }) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await initNeo4j();
      await initPostgres();
      return;
    } catch (error) {
      lastError = error;

      console.error(
        `Intento ${attempt}/${retries} fallido al conectar DB: ${error.message}`
      );

      if (attempt < retries) {
        await sleep(retryDelayMs);
      }
    }
  }

  throw lastError;
}

async function closeResources() {
  try {
    await driver.close();
  } catch (_error) {
  }

  try {
    await pool.end();
  } catch (_error) {
  }
}

async function bootstrapApp({ port, startupRetries, startupRetryDelayMs }) {
  await initializeDatabasesWithRetry({
    retries: startupRetries,
    retryDelayMs: startupRetryDelayMs,
  });

  const container = createContainer();
  const app = createHttpApp({ 
    storyService: container.storyService,
    authService: container.authService,
    userService: container.userService,
  });

  const server = app.listen(port, () => {
    console.log(`Rayu escuchando en http://localhost:${port}`);
  });

  const shutdown = async () => {
    try {
      await new Promise((resolve) => {
        server.close(() => resolve());
      });
    } catch (_error) {
    }

    await closeResources();
  };

  return {
    app,
    server,
    shutdown,
  };
}

module.exports = {
  bootstrapApp,
  closeResources,
};
