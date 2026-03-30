async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
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
      const data = await requestJson("/api/stories");
      return data.stories;
    },
    createStory: async (payload) => {
      return requestJson("/api/stories", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    getStoryGraph: async (storyId) => {
      return requestJson(`/api/stories/${storyId}/graph`);
    },
    createChapter: async (storyId, payload) => {
      return requestJson(`/api/stories/${storyId}/chapters`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  };
}
