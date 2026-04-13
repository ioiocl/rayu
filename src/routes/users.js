const express = require("express");

function resolveErrorStatus(error) {
  return Number(error?.status) || 500;
}

function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "No autenticado" });
  }
  next();
}

function createUsersRouter({ userService }) {
  const router = express.Router();

  router.get("/profile", requireAuth, async (req, res) => {
    try {
      const profile = await userService.getUserProfile(req.session.userId);
      res.json({ profile });
    } catch (error) {
      res.status(resolveErrorStatus(error)).json({ error: error.message });
    }
  });

  router.get("/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await userService.getNotifications(req.session.userId);
      res.json({ notifications });
    } catch (error) {
      res.status(resolveErrorStatus(error)).json({ error: error.message });
    }
  });

  router.post("/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      await userService.markNotificationAsRead(req.session.userId, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(resolveErrorStatus(error)).json({ error: error.message });
    }
  });

  router.get("/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await userService.getUnreadNotificationCount(req.session.userId);
      res.json({ count });
    } catch (error) {
      res.status(resolveErrorStatus(error)).json({ error: error.message });
    }
  });

  return router;
}

module.exports = {
  createUsersRouter,
};
