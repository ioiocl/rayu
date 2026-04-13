import {
  displayContent,
  escapeHtml,
  sortChaptersByNumber,
} from "../domain/storyDomain.js";

export function createDomStoryView() {
  const storyForm = document.getElementById("storyForm");
  const storiesList = document.getElementById("storiesList");
  const storyTemplate = document.getElementById("storyCardTemplate");
  const storySearch = document.getElementById("storySearch");

  let allStories = [];
  let currentOnOpenStory = null;
  let currentSelectedStory = null;

  if (storySearch) {
    storySearch.addEventListener("input", () => {
      const query = storySearch.value.trim().toLowerCase();
      const filtered = query
        ? allStories.filter((s) => s.title.toLowerCase().includes(query))
        : allStories;
      renderStoryCards(filtered, currentSelectedStory, currentOnOpenStory);
    });
  }
  const storyDetail = document.getElementById("storyDetail");
  const openStoryModalButton = document.getElementById("openStoryModal");
  const closeStoryModalButton = document.getElementById("closeStoryModal");
  const storyModal = document.getElementById("storyModal");
  const chapterForm = document.getElementById("chapterForm");
  const chapterParent = document.getElementById("chapterParent");
  const graphWrapper = document.getElementById("graphWrapper");
  const graphSvg = document.getElementById("graph");

  function openStoryModal() {
    storyModal.classList.remove("hidden");
  }

  function closeStoryModal() {
    storyModal.classList.add("hidden");
  }

  openStoryModalButton.addEventListener("click", openStoryModal);
  closeStoryModalButton.addEventListener("click", closeStoryModal);
  storyModal.addEventListener("click", (event) => {
    if (event.target === storyModal) {
      closeStoryModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeStoryModal();
    }
  });

  function renderStoryCards(stories, selectedStory, onOpenStory) {
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
      const shareBtn = fragment.querySelector(".action-share");
      const likeBtn = fragment.querySelector(".action-like");
      const dislikeBtn = fragment.querySelector(".action-dislike");

      title.textContent = story.title;
      meta.textContent = `${story.createdBy} · ${story.chapterCount} capítulos`;
      preview.innerHTML = displayContent(story.contentType, story.coverContent);

      if (selectedStory && selectedStory.id === story.id) {
        card.classList.add("is-selected");
      }

      card.addEventListener("click", () => onOpenStory(story));

      shareBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const url = `${window.location.origin}/story.html?storyId=${story.id}`;
        navigator.clipboard.writeText(url).then(() => {
          alert("Enlace copiado al portapapeles");
        }).catch(() => {
          alert(`Enlace: ${url}`);
        });
      });

      likeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        likeBtn.style.background = "#d4edda";
        dislikeBtn.style.background = "";
      });

      dislikeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dislikeBtn.style.background = "#f8d7da";
        likeBtn.style.background = "";
      });

      storiesList.appendChild(fragment);
    }
  }

  function renderStories(stories, selectedStory, onOpenStory) {
    allStories = stories;
    currentSelectedStory = selectedStory;
    currentOnOpenStory = onOpenStory;

    const query = storySearch ? storySearch.value.trim().toLowerCase() : "";
    const filtered = query
      ? stories.filter((s) => s.title.toLowerCase().includes(query))
      : stories;

    renderStoryCards(filtered, selectedStory, onOpenStory);
  }

  function openStoryPage(storyId) {
    window.location.href = `/story.html?storyId=${encodeURIComponent(storyId)}`;
  }

  function renderStoryDetail(selectedStory, selectedGraph) {
    if (!storyDetail) return;

    if (!selectedStory) {
      storyDetail.textContent =
        "Selecciona una micro historia para ver su grafo y agregar el siguiente capítulo.";
      if (chapterForm) chapterForm.classList.add("hidden");
      if (graphWrapper) graphWrapper.classList.add("hidden");
      return;
    }

    storyDetail.innerHTML = `
      <h3>${escapeHtml(selectedStory.title)}</h3>
      <p><strong>Creador:</strong> ${escapeHtml(selectedStory.createdBy)}</p>
      <p><strong>Capítulos:</strong> ${selectedGraph.nodes.length}</p>
      <div>${displayContent(selectedStory.contentType, selectedStory.coverContent)}</div>
    `;

    if (chapterForm) chapterForm.classList.remove("hidden");
    if (graphWrapper) graphWrapper.classList.remove("hidden");
  }

  function populateParentOptions(selectedGraph) {
    if (!chapterParent) return;
    chapterParent.innerHTML = "";

    const sorted = sortChaptersByNumber(selectedGraph.nodes);

    for (const node of sorted) {
      const option = document.createElement("option");
      option.value = node.id;
      option.textContent = `Capítulo ${node.chapterNumber} · ${node.contentType}`;
      chapterParent.appendChild(option);
    }
  }

  function drawGraph(selectedGraph) {
    if (!graphSvg) return;
    graphSvg.innerHTML = "";

    const { nodes, edges } = selectedGraph;

    if (!nodes.length) {
      return;
    }

    const sorted = sortChaptersByNumber(nodes);
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

  function readCreateStoryForm() {
    return {
      username: document.getElementById("username").value,
      title: document.getElementById("title").value,
      contentType: document.getElementById("storyType").value,
      content: document.getElementById("storyContent").value,
    };
  }

  function readCreateChapterForm() {
    return {
      username: document.getElementById("chapterUsername").value,
      parentChapterId: chapterParent.value,
      contentType: document.getElementById("chapterType").value,
      content: document.getElementById("chapterContent").value,
    };
  }

  function resetStoryForm() {
    storyForm.reset();
    closeStoryModal();
  }

  function clearChapterInput() {
    document.getElementById("chapterContent").value = "";
  }

  function bindStorySubmit(handler) {
    storyForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handler();
    });
  }

  function bindChapterSubmit(handler) {
    if (!chapterForm) return;
    chapterForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handler();
    });
  }

  function showError(message) {
    alert(message);
  }

  function showSuccess(message) {
    alert(message);
  }

  function updateAuthState(user) {
    const usernameField = document.getElementById("username");
    const chapterUsernameField = document.getElementById("chapterUsername");
    
    if (user) {
      if (usernameField) {
        usernameField.value = user.nickname;
        usernameField.readOnly = true;
        usernameField.classList.add("readonly-field");
      }
      if (chapterUsernameField) {
        chapterUsernameField.value = user.nickname;
        chapterUsernameField.readOnly = true;
        chapterUsernameField.classList.add("readonly-field");
      }
    } else {
      if (usernameField) {
        usernameField.value = "";
        usernameField.readOnly = false;
        usernameField.classList.remove("readonly-field");
      }
      if (chapterUsernameField) {
        chapterUsernameField.value = "";
        chapterUsernameField.readOnly = false;
        chapterUsernameField.classList.remove("readonly-field");
      }
    }
  }

  return {
    renderStories,
    openStoryPage,
    renderStoryDetail,
    populateParentOptions,
    drawGraph,
    readCreateStoryForm,
    readCreateChapterForm,
    resetStoryForm,
    clearChapterInput,
    bindStorySubmit,
    bindChapterSubmit,
    showError,
    showSuccess,
    updateAuthState,
  };
}
