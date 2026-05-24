function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeStatus(status = '') {
  const text = String(status).toLowerCase();

  if (text.includes('complete') || text.includes('done') || text.includes('selesai')) {
    return 'completed';
  }

  if (text.includes('progress') || text.includes('proses') || text.includes('ongoing') || text.includes('on going')) {
    return 'in-progress';
  }

  return 'pending';
}

function getInitial(name = '?') {
  return String(name || '?').trim().charAt(0).toUpperCase() || '?';
}

export { escapeHtml, normalizeStatus, getInitial };
