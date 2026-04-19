export function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function displayContent(contentType, content) {
  if (contentType === "image") {
    return `<img src="${escapeHtml(content)}" alt="micro historia" />`;
  }

  if (contentType === "audio") {
    return `<audio controls src="${escapeHtml(content)}">Tu navegador no soporta el elemento de audio.</audio>`;
  }

  if (contentType === "video") {
    return `<video controls src="${escapeHtml(content)}">Tu navegador no soporta el elemento de video.</video>`;
  }

  return `<p>${escapeHtml(content)}</p>`;
}

export function sortChaptersByNumber(nodes) {
  return [...nodes].sort(
    (a, b) => Number(a.chapterNumber) - Number(b.chapterNumber)
  );
}
