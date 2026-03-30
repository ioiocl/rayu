const path = require("path");
const express = require("express");

const { createStoriesRouter } = require("../../routes/stories");

function createHttpApp({ storyService }) {
  const app = express();

  app.use(express.json({ limit: "2mb" }));
  app.use(express.static(path.join(__dirname, "../../../public")));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(
    "/api",
    createStoriesRouter({
      storyService,
    })
  );

  app.use((err, _req, res, _next) => {
    res.status(500).json({ error: err.message || "Error interno" });
  });

  return app;
}

module.exports = {
  createHttpApp,
};
