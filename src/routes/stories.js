const express = require("express");

function resolveErrorStatus(error) {
  return Number(error?.status) || 500;
}

function createStoriesRouter({ storyService }) {
  const router = express.Router();

  router.get("/stories", async (_req, res) => {
    try {
      const stories = await storyService.listStories();
      res.json({ stories });
    } catch (error) {
      res.status(resolveErrorStatus(error)).json({ error: error.message });
    }
  });

  router.post("/stories", async (req, res) => {
    try {
      const result = await storyService.createStory(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(resolveErrorStatus(error)).json({ error: error.message });
    }
  });

  router.get("/stories/:storyId/graph", async (req, res) => {
    try {
      const graph = await storyService.getStoryGraph(req.params.storyId);
      res.json(graph);
    } catch (error) {
      res.status(resolveErrorStatus(error)).json({ error: error.message });
    }
  });

  router.post("/stories/:storyId/chapters", async (req, res) => {
    try {
      const result = await storyService.createChapter({
        storyId: req.params.storyId,
        ...req.body,
      });

      res.status(201).json(result);
    } catch (error) {
      res.status(resolveErrorStatus(error)).json({ error: error.message });
    }
  });

  return router;
}

module.exports = {
  createStoriesRouter,
};
