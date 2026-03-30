export function createStoryApp({ storyApi, view }) {
  let selectedStory = null;
  let selectedGraph = { nodes: [], edges: [] };

  async function loadStories() {
    const stories = await storyApi.listStories();
    view.renderStories(stories, selectedStory, handleOpenStoryPage);
  }

  function handleOpenStoryPage(story) {
    view.openStoryPage(story.id);
  }

  async function loadGraph(storyId) {
    selectedGraph = await storyApi.getStoryGraph(storyId);
    view.renderStoryDetail(selectedStory, selectedGraph);
    view.populateParentOptions(selectedGraph);
    view.drawGraph(selectedGraph);
  }

  async function handleCreateStory() {
    try {
      const payload = view.readCreateStoryForm();
      await storyApi.createStory(payload);

      view.resetStoryForm();
      selectedStory = null;
      selectedGraph = { nodes: [], edges: [] };

      await loadStories();
      view.renderStoryDetail(selectedStory, selectedGraph);
      view.showSuccess("Micro historia publicada");
    } catch (error) {
      view.showError(error.message);
    }
  }

  async function handleCreateChapter() {
    if (!selectedStory) {
      return;
    }

    try {
      const payload = view.readCreateChapterForm();
      await storyApi.createChapter(selectedStory.id, payload);

      view.clearChapterInput();
      await loadStories();
      await loadGraph(selectedStory.id);
      view.showSuccess("Capítulo agregado");
    } catch (error) {
      view.showError(error.message);
    }
  }

  async function init() {
    view.bindStorySubmit(handleCreateStory);
    view.bindChapterSubmit(handleCreateChapter);

    try {
      await loadStories();
      view.renderStoryDetail(selectedStory, selectedGraph);
    } catch (error) {
      view.showError(error.message);
    }
  }

  return {
    init,
  };
}
