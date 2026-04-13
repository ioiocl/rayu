const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");

const { createStoriesRouter } = require("../../routes/stories");
const { createAuthRouter } = require("../../routes/auth");
const { createUsersRouter } = require("../../routes/users");

function createHttpApp({ storyService, authService, userService }) {
  const app = express();

  app.use(cors({
    origin: true,
    credentials: true
  }));

  app.use(express.json({ limit: "2mb" }));
  
  app.use(
    cookieSession({
      name: "session",
      keys: [process.env.SESSION_SECRET || "rayu-secret-key-change-in-production"],
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
  );

  app.use(express.static(path.join(__dirname, "../../../public")));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", createAuthRouter({ authService }));
  app.use("/api/users", createUsersRouter({ userService }));
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
