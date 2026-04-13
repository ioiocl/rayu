import { API_BASE_URL } from "./config.js";

const storyForm = document.getElementById("storyForm");
const storiesList = document.getElementById("storiesList");
const storyTemplate = document.getElementById("storyCardTemplate");
const storyDetail = document.getElementById("storyDetail");
const chapterForm = document.getElementById("chapterForm");
const chapterParent = document.getElementById("chapterParent");
const graphWrapper = document.getElementById("graphWrapper");
const graphSvg = document.getElementById("graph");

let selectedStory = null;
let selectedGraph = { nodes: [], edges: [] };

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function displayContent(type, content) {
  if (type === "image") {
    return `<img src="${esc(content)}" alt="micro historia" />`;
  }

  return `<p>${esc(content)}</p>`;
}

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

function renderStories(stories) {
  storiesList.innerHTML = "";

  if (!stories.length) {
    storiesList.innerHTML = "<p>Aún no hay historias. Publica la primera.</p>";
    return;
  }

  for (const story of stories) {
    const fragment = storyTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".story-card");
    const title = fragment.querySelector(".story-title");
    const meta = fragment.querySelector(".story-meta");
    const preview = fragment.querySelector(".story-preview");

    title.textContent = story.title;
    meta.textContent = `${story.createdBy} · ${story.chapterCount} capítulos`;
    preview.innerHTML = displayContent(story.contentType, story.coverContent);

    if (selectedStory && selectedStory.id === story.id) {
      card.classList.add("is-selected");
    }

    card.addEventListener("click", () => selectStory(story));

    storiesList.appendChild(fragment);
  }
}

function renderStoryDetail() {
  if (!selectedStory) {
    storyDetail.textContent =
      "Selecciona una micro historia para ver su grafo y agregar el siguiente capítulo.";
    chapterForm.classList.add("hidden");
    graphWrapper.classList.add("hidden");
    return;
  }

  storyDetail.innerHTML = `
    <h3>${esc(selectedStory.title)}</h3>
    <p><strong>Creador:</strong> ${esc(selectedStory.createdBy)}</p>
    <p><strong>Capítulos:</strong> ${selectedGraph.nodes.length}</p>
    <div>${displayContent(selectedStory.contentType, selectedStory.coverContent)}</div>
  `;

  chapterForm.classList.remove("hidden");
  graphWrapper.classList.remove("hidden");
}

function populateParentOptions() {
  chapterParent.innerHTML = "";

  const sorted = [...selectedGraph.nodes].sort(
    (a, b) => Number(a.chapterNumber) - Number(b.chapterNumber)
  );

  for (const node of sorted) {
    const option = document.createElement("option");
    option.value = node.id;
    option.textContent = `Capítulo ${node.chapterNumber} · ${node.contentType}`;
    chapterParent.appendChild(option);
  }
}

function drawGraph() {
  graphSvg.innerHTML = "";

  const { nodes, edges } = selectedGraph;
  if (!nodes.length) {
    return;
  }

  const sorted = [...nodes].sort(
    (a, b) => Number(a.chapterNumber) - Number(b.chapterNumber)
  );

  const positionById = new Map();
  const xStep = 160;
  const yBase = 220;
  const yAmplitude = 90;

  sorted.forEach((node, index) => {
    const x = 90 + index * xStep;
    const y = yBase + Math.sin(index) * yAmplitude;
    positionById.set(node.id, { x, y });
  });

  for (const edge of edges) {
    const from = positionById.get(edge.from);
    const to = positionById.get(edge.to);

    if (!from || !to) {
      continue;
    }

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(from.x));
    line.setAttribute("y1", String(from.y));
    line.setAttribute("x2", String(to.x));
    line.setAttribute("y2", String(to.y));
    line.setAttribute("class", "edge-line");
    graphSvg.appendChild(line);
  }

  for (const node of sorted) {
    const pos = positionById.get(node.id);

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", String(pos.x));
    circle.setAttribute("cy", String(pos.y));
    circle.setAttribute("r", "18");
    circle.setAttribute("class", "chapter-node");
    graphSvg.appendChild(circle);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(pos.x - 14));
    label.setAttribute("y", String(pos.y + 4));
    label.setAttribute("class", "chapter-label");
    label.textContent = `C${node.chapterNumber}`;
    graphSvg.appendChild(label);
  }
}

async function loadStories() {
  const data = await requestJson(`${API_BASE_URL}/api/stories`);
  renderStories(data.stories);
}

async function loadGraph(storyId) {
  const data = await requestJson(`${API_BASE_URL}/api/stories/${storyId}/graph`);
  selectedGraph = data;
  renderStoryDetail();
  populateParentOptions();
  drawGraph();
}

async function selectStory(story) {
  selectedStory = story;
  await loadStories();
  await loadGraph(story.id);
}

storyForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await requestJson(`${API_BASE_URL}/api/stories`, {
      method: "POST",
      body: JSON.stringify({
        username: document.getElementById("username").value,
        title: document.getElementById("title").value,
        contentType: document.getElementById("storyType").value,
        content: document.getElementById("storyContent").value,
      }),
    });

    storyForm.reset();
    selectedStory = null;
    await loadStories();
    renderStoryDetail();
    alert("Micro historia publicada");
  } catch (error) {
    alert(error.message);
  }
});

chapterForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!selectedStory) {
    return;
  }

  try {
    await requestJson(`${API_BASE_URL}/api/stories/${selectedStory.id}/chapters`, {
      method: "POST",
      body: JSON.stringify({
        username: document.getElementById("chapterUsername").value,
        parentChapterId: chapterParent.value,
        contentType: document.getElementById("chapterType").value,
        content: document.getElementById("chapterContent").value,
      }),
    });

    document.getElementById("chapterContent").value = "";
    await loadStories();
    await loadGraph(selectedStory.id);
    alert("Capítulo agregado");
  } catch (error) {
    alert(error.message);
  }
});

(async function init() {
  try {
    await loadStories();
    renderStoryDetail();
  } catch (error) {
    alert(error.message);
  }
})();
