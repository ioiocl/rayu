import { displayContent, escapeHtml } from "../domain/storyDomain.js";

function createArrow(from, to) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const midY = from.y + (to.y - from.y) * 0.5;
  const d = `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
  path.setAttribute("d", d);
  path.setAttribute("class", "edge-path");
  path.setAttribute("marker-end", "url(#arrowhead)");
  return path;
}

export function createDomStoryReaderView() {
  const titleElement = document.getElementById("storyTitle");
  const metaElement = document.getElementById("storyMeta");
  const emptyState = document.getElementById("emptyState");
  const graphBoard = document.getElementById("graphBoard");
  const edgesLayer = document.getElementById("edgesLayer");
  const nodesLayer = document.getElementById("nodesLayer");
  const chapterForm = document.getElementById("chapterForm");
  const openChapterModalButton = document.getElementById("openChapterModal");
  const closeChapterModalButton = document.getElementById("closeChapterModal");
  const chapterModal = document.getElementById("chapterModal");
  const chapterParent = document.getElementById("chapterParent");
  const chapterContentText = document.getElementById("chapterContentText");
  const chapterType = document.getElementById("chapterType");
  const zoomWrapper = document.getElementById("zoomWrapper");
  const zoomInButton = document.getElementById("zoomIn");
  const zoomOutButton = document.getElementById("zoomOut");
  const viewStoryButton = document.getElementById("viewStoryButton");
  const storyViewerModal = document.getElementById("storyViewerModal");
  const closeStoryViewerButton = document.getElementById("closeStoryViewer");
  const storyViewerContent = document.getElementById("storyViewerContent");

  let selectedNodes = new Set();
  let currentLayoutNodes = [];

  const ZOOM_STEP = 0.2;
  const ZOOM_MIN = 0.3;
  const ZOOM_MAX = 2.0;
  let zoomLevel = 1.0;

  function applyZoom() {
    if (!zoomWrapper) return;
    zoomWrapper.style.zoom = String(zoomLevel);
  }

  if (zoomInButton) {
    zoomInButton.addEventListener("click", () => {
      zoomLevel = Math.min(ZOOM_MAX, parseFloat((zoomLevel + ZOOM_STEP).toFixed(2)));
      applyZoom();
    });
  }

  if (zoomOutButton) {
    zoomOutButton.addEventListener("click", () => {
      zoomLevel = Math.max(ZOOM_MIN, parseFloat((zoomLevel - ZOOM_STEP).toFixed(2)));
      applyZoom();
    });
  }


  function openChapterModal() {
    chapterModal.classList.remove("hidden");
  }

  function closeChapterModal() {
    chapterModal.classList.add("hidden");
  }

  openChapterModalButton.addEventListener("click", openChapterModal);
  closeChapterModalButton.addEventListener("click", closeChapterModal);
  chapterModal.addEventListener("click", (event) => {
    if (event.target === chapterModal) {
      closeChapterModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeChapterModal();
    }
  });

  function setStoryHeader(story, chapterCount) {
    titleElement.textContent = story?.title || "Historia";
    const author = story?.createdBy ? `por ${story.createdBy}` : "";
    metaElement.textContent = `${chapterCount} capítulo(s) ${author}`.trim();
  }

  function showEmptyState() {
    emptyState.classList.remove("hidden");
    graphBoard.classList.add("hidden");
  }

  function showGraph() {
    emptyState.classList.add("hidden");
    graphBoard.classList.remove("hidden");
  }

  function renderGraph({ layoutNodes, edges, width, height }) {
    showGraph();
    zoomLevel = 1.0;
    if (zoomWrapper) {
      zoomWrapper.style.zoom = "1";
    }

    currentLayoutNodes = layoutNodes;
    selectedNodes.clear();
    updateViewStoryButton();

    nodesLayer.innerHTML = "";
    edgesLayer.innerHTML = "";
    nodesLayer.style.width = `${width}px`;
    nodesLayer.style.height = `${height}px`;
    edgesLayer.style.width = `${width}px`;
    edgesLayer.style.height = `${height}px`;
    edgesLayer.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerWidth", "7");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("orient", "auto-start-reverse");
    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrow.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    arrow.setAttribute("class", "edge-arrow");
    marker.appendChild(arrow);
    defs.appendChild(marker);
    edgesLayer.appendChild(defs);

    const centerById = new Map();

    for (const node of layoutNodes) {
      const article = document.createElement("article");
      article.className = "graph-node";
      article.style.left = `${node.x}px`;
      article.style.top = `${node.y}px`;
      article.dataset.nodeId = node.id;
      article.innerHTML = `
        <header class="graph-node-header">
          <span class="graph-node-chip">Capítulo ${escapeHtml(node.chapterNumber)}</span>
          <span class="graph-node-type">${escapeHtml(node.contentType)}</span>
        </header>
        <div class="graph-node-content">
          ${displayContent(node.contentType, node.content)}
        </div>
      `;

      article.addEventListener("click", () => toggleNodeSelection(node.id));
      article.style.cursor = "pointer";

      nodesLayer.appendChild(article);

      centerById.set(node.id, {
        x: node.x + node.width / 2,
        y: node.y + node.height / 2,
        top: node.y,
        bottom: node.y + node.height,
      });
    }

    for (const edge of edges) {
      const from = centerById.get(edge.from);
      const to = centerById.get(edge.to);

      if (!from || !to) {
        continue;
      }

      edgesLayer.appendChild(
        createArrow(
          { x: from.x, y: from.bottom },
          { x: to.x, y: to.top }
        )
      );
    }

    // Scroll so the root node appears centered horizontally and at the top
    requestAnimationFrame(() => {
      graphBoard.scrollTop = 0;
      graphBoard.scrollLeft = Math.max(0, (width - graphBoard.clientWidth) / 2);
    });
  }

  function showLoadError(message) {
    titleElement.textContent = "Error al cargar historia";
    metaElement.textContent = message;
    showEmptyState();
  }

  function populateParentOptions(nodes) {
    chapterParent.innerHTML = "";

    const sorted = [...nodes].sort(
      (a, b) => Number(a.chapterNumber) - Number(b.chapterNumber)
    );

    for (const node of sorted) {
      const option = document.createElement("option");
      option.value = node.id;
      option.textContent = `Capítulo ${node.chapterNumber} · ${node.contentType}`;
      chapterParent.appendChild(option);
    }
  }

  function bindChapterSubmit(handler) {
    chapterForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handler();
    });
  }

  function readCreateChapterForm() {
    const type = chapterType.value;
    let content = "";
    
    if (type === "text") {
      content = chapterContentText.value;
    } else if (type === "image") {
      const mediaUrl = window.chapterMediaCapture?.getContent();
      content = mediaUrl || document.getElementById("chapterImageUrl").value;
    } else if (type === "audio") {
      const mediaUrl = window.chapterMediaCapture?.getContent();
      content = mediaUrl || document.getElementById("chapterAudioUrl").value;
    } else if (type === "video") {
      const mediaUrl = window.chapterMediaCapture?.getContent();
      content = mediaUrl || document.getElementById("chapterVideoUrl").value;
    }
    
    return {
      username: document.getElementById("chapterUsername").value,
      parentChapterId: chapterParent.value,
      contentType: type,
      content: content,
    };
  }

  function clearChapterInput() {
    if (chapterContentText) chapterContentText.value = "";
    
    const imageUrl = document.getElementById("chapterImageUrl");
    const audioUrl = document.getElementById("chapterAudioUrl");
    const videoUrl = document.getElementById("chapterVideoUrl");
    
    if (imageUrl) imageUrl.value = "";
    if (audioUrl) audioUrl.value = "";
    if (videoUrl) videoUrl.value = "";
    
    if (window.chapterMediaCapture) {
      window.chapterMediaCapture.reset();
    }
    
    closeChapterModal();
  }

  function showSuccess(message) {
    alert(message);
  }

  function showError(message) {
    alert(message);
  }

  function updateAuthState(user) {
    const chapterUsernameField = document.getElementById("chapterUsername");
    
    if (user) {
      if (chapterUsernameField) {
        chapterUsernameField.value = user.nickname;
        chapterUsernameField.readOnly = true;
        chapterUsernameField.classList.add("readonly-field");
      }
    } else {
      if (chapterUsernameField) {
        chapterUsernameField.value = "";
        chapterUsernameField.readOnly = false;
        chapterUsernameField.classList.remove("readonly-field");
      }
    }
  }

  function toggleNodeSelection(nodeId) {
    if (selectedNodes.has(nodeId)) {
      selectedNodes.delete(nodeId);
    } else {
      const clickedNode = currentLayoutNodes.find((n) => n.id === nodeId);
      if (clickedNode) {
        const sameLevelNodes = currentLayoutNodes.filter(
          (n) => n.chapterNumber === clickedNode.chapterNumber
        );
        sameLevelNodes.forEach((n) => selectedNodes.delete(n.id));
      }
      selectedNodes.add(nodeId);
    }
    updateNodeStyles();
    updateViewStoryButton();
  }

  function updateNodeStyles() {
    const nodeElements = nodesLayer.querySelectorAll(".graph-node");
    nodeElements.forEach((element) => {
      const nodeId = element.dataset.nodeId;
      if (selectedNodes.has(nodeId)) {
        element.classList.add("selected");
      } else {
        element.classList.remove("selected");
      }
    });
  }

  function updateViewStoryButton() {
    if (viewStoryButton) {
      if (selectedNodes.size > 0) {
        viewStoryButton.classList.remove("hidden");
      } else {
        viewStoryButton.classList.add("hidden");
      }
    }
  }

  function openStoryViewer() {
    const sortedNodes = currentLayoutNodes
      .filter((node) => selectedNodes.has(node.id))
      .sort((a, b) => Number(a.chapterNumber) - Number(b.chapterNumber));

    storyViewerContent.innerHTML = "";

    for (const node of sortedNodes) {
      const section = document.createElement("section");
      section.className = "story-viewer-section";
      section.innerHTML = `
        <div class="story-viewer-header">
          <span class="story-viewer-chip">Capítulo ${escapeHtml(node.chapterNumber)}</span>
          <span class="story-viewer-type">${escapeHtml(node.contentType)}</span>
        </div>
        <div class="story-viewer-body">
          ${displayContent(node.contentType, node.content)}
        </div>
      `;
      storyViewerContent.appendChild(section);
    }

    storyViewerModal.classList.remove("hidden");
  }

  function closeStoryViewer() {
    storyViewerModal.classList.add("hidden");
  }

  if (viewStoryButton) {
    viewStoryButton.addEventListener("click", openStoryViewer);
  }

  if (closeStoryViewerButton) {
    closeStoryViewerButton.addEventListener("click", closeStoryViewer);
  }

  if (storyViewerModal) {
    storyViewerModal.addEventListener("click", (event) => {
      if (event.target === storyViewerModal) {
        closeStoryViewer();
      }
    });
  }

  return {
    setStoryHeader,
    showEmptyState,
    renderGraph,
    populateParentOptions,
    bindChapterSubmit,
    readCreateChapterForm,
    clearChapterInput,
    showSuccess,
    showLoadError,
    showError,
    updateAuthState,
  };
}
