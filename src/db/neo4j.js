const neo4j = require("neo4j-driver");

const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;

if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
  throw new Error("Faltan variables de entorno de Neo4j");
}

const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
  {
    disableLosslessIntegers: true,
  }
);

async function initNeo4j() {
  const session = driver.session();

  try {
    await session.run(
      "CREATE CONSTRAINT chapter_id_unique IF NOT EXISTS FOR (c:Chapter) REQUIRE c.id IS UNIQUE"
    );
    await session.run(
      "CREATE INDEX chapter_story_id IF NOT EXISTS FOR (c:Chapter) ON (c.storyId)"
    );
  } finally {
    await session.close();
  }
}

module.exports = {
  driver,
  initNeo4j,
};
