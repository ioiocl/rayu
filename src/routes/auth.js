const express = require("express");

function resolveErrorStatus(error) {
  return Number(error?.status) || 500;
}

function createAuthRouter({ authService }) {
  const router = express.Router();

  router.post("/signup", async (req, res) => {
    try {
      const user = await authService.signup(req.body);
      req.session = req.session || {};
      req.session.userId = user.id;
      req.session.nickname = user.nickname;
      res.status(201).json({ user });
    } catch (error) {
      res.status(resolveErrorStatus(error)).json({ error: error.message });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const user = await authService.login(req.body);
      req.session = req.session || {};
      req.session.userId = user.id;
      req.session.nickname = user.nickname;
      res.json({ user });
    } catch (error) {
      res.status(resolveErrorStatus(error)).json({ error: error.message });
    }
  });

  router.post("/logout", (req, res) => {
    req.session = null;
    res.json({ success: true });
  });

  router.get("/me", (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    res.json({
      user: {
        id: req.session.userId,
        nickname: req.session.nickname,
      },
    });
  });

  router.get("/check-nickname/:nickname", async (req, res) => {
    try {
      const available = await authService.checkNicknameAvailable(req.params.nickname);
      res.json({ available });
    } catch (error) {
      res.status(resolveErrorStatus(error)).json({ error: error.message });
    }
  });

  return router;
}

module.exports = {
  createAuthRouter,
};
