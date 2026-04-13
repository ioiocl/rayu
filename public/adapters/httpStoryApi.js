import { API_BASE_URL } from "../config.js";

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Error inesperado");
  }

  return data;
}

export function createHttpStoryApi() {
  return {
    listStories: async () => {
      const data = await requestJson(`${API_BASE_URL}/api/stories`);
      return data.stories;
    },
    createStory: async (payload) => {
      return requestJson(`${API_BASE_URL}/api/stories`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    getStoryGraph: async (storyId) => {
      return requestJson(`${API_BASE_URL}/api/stories/${storyId}/graph`);
    },
    createChapter: async (storyId, payload) => {
      return requestJson(`${API_BASE_URL}/api/stories/${storyId}/chapters`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  };
}
