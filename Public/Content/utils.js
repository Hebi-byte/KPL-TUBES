function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeStatus(status = "") {
  const text = status.toLowerCase();

  if (text.includes("complete") || text.includes("done") || text.includes("selesai")) {
    return "completed";
  }

  if (text.includes("progress") || text.includes("proses")) {
    return "in-progress";
  }

  return "pending";
}

// Export functions
export { escapeHtml, normalizeStatus };