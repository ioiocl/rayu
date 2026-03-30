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

  return `<p>${escapeHtml(content)}</p>`;
}

export function sortChaptersByNumber(nodes) {
  return [...nodes].sort(
    (a, b) => Number(a.chapterNumber) - Number(b.chapterNumber)
  );
}
