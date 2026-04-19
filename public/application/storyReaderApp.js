function buildLayout(graph) {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const childrenById = new Map();
  const incoming = new Set();

  for (const node of graph.nodes) {
    childrenById.set(node.id, []);
  }

  for (const edge of graph.edges) {
    if (!childrenById.has(edge.from) || !nodesById.has(edge.to)) {
      continue;
    }

    childrenById.get(edge.from).push(edge.to);
    incoming.add(edge.to);
  }

  const roots = graph.nodes
    .filter((node) => !incoming.has(node.id))
    .sort((a, b) => Number(a.chapterNumber) - Number(b.chapterNumber));

  const depthById = new Map();
  const queue = roots.map((root) => ({ id: root.id, depth: 0 }));

  while (queue.length) {
    const { id, depth } = queue.shift();

    const currentDepth = depthById.get(id);
    if (currentDepth !== undefined && currentDepth <= depth) {
      continue;
    }

    depthById.set(id, depth);

    const children = childrenById.get(id) || [];
    for (const childId of children) {
      queue.push({ id: childId, depth: depth + 1 });
    }
  }

  for (const node of graph.nodes) {
    if (!depthById.has(node.id)) {
      depthById.set(node.id, 0);
    }
  }

  const levels = new Map();

  for (const node of graph.nodes) {
    const depth = depthById.get(node.id) || 0;

    if (!levels.has(depth)) {
      levels.set(depth, []);
    }

    levels.get(depth).push(node);
  }

  for (const levelNodes of levels.values()) {
    levelNodes.sort((a, b) => Number(a.chapterNumber) - Number(b.chapterNumber));
  }

  const levelKeys = Array.from(levels.keys()).sort((a, b) => a - b);
  const nodeWidth = 280;
  const nodeHeight = 220;
  const horizontalGap = 60;
  const verticalGap = 80;
  const margin = 48;

  const maxNodesInLevel = Math.max(...levelKeys.map((level) => levels.get(level).length));
  const boardWidth = Math.max(
    900,
    margin * 2 + maxNodesInLevel * nodeWidth + (maxNodesInLevel - 1) * horizontalGap
  );

  const boardHeight =
    margin * 2 + levelKeys.length * nodeHeight + (levelKeys.length - 1) * verticalGap;

  const layoutNodes = [];

  for (const level of levelKeys) {
    const levelNodes = levels.get(level);
    const levelWidth =
      levelNodes.length * nodeWidth + Math.max(0, levelNodes.length - 1) * horizontalGap;
    const startX = (boardWidth - levelWidth) / 2;
    const y = margin + level * (nodeHeight + verticalGap);

    levelNodes.forEach((node, index) => {
      layoutNodes.push({
        ...node,
        x: startX + index * (nodeWidth + horizontalGap),
        y,
        width: nodeWidth,
        height: nodeHeight,
      });
    });
  }

  return {
    layoutNodes,
    width: boardWidth,
    height: boardHeight,
  };
}

export function createStoryReaderApp({ storyApi, view }) {
  let currentStoryId = null;

  async function loadStory(storyId) {
    const [graph, stories] = await Promise.all([
      storyApi.getStoryGraph(storyId),
      storyApi.listStories(),
    ]);

    const story = stories.find((item) => item.id === storyId) || null;
    view.setStoryHeader(story, graph.nodes.length);
    view.populateParentOptions(graph.nodes);

    if (!graph.nodes.length) {
      view.showEmptyState();
      return;
    }

    const layout = buildLayout(graph);
    view.renderGraph({
      layoutNodes: layout.layoutNodes,
      edges: graph.edges,
      width: layout.width,
      height: layout.height,
    });
  }

  async function handleCreateChapter() {
    if (!currentStoryId) {
      return;
    }

    try {
      const payload = view.readCreateChapterForm();
      
      if (!payload.content || payload.content.trim() === "") {
        view.showError("Por favor proporciona contenido para el capítulo");
        return;
      }
      
      await storyApi.createChapter(currentStoryId, payload);
      view.clearChapterInput();
      await loadStory(currentStoryId);
      view.showSuccess("Capítulo agregado al grafo");
    } catch (error) {
      view.showError(error.message);
    }
  }

  async function init(storyId) {
    if (!storyId) {
      view.showLoadError("Falta storyId en la URL.");
      return;
    }

    currentStoryId = storyId;
    view.bindChapterSubmit(handleCreateChapter);

    try {
      await loadStory(storyId);
    } catch (error) {
      view.showLoadError(error.message);
    }
  }

  return {
    init,
  };
}
