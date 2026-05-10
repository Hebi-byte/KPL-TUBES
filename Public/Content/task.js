// Import utilities
import { escapeHtml, normalizeStatus } from './utils.js';

function renderTasks(tasks) {
  if (tasks.length === 0) {
    return `<p class="empty-state">Belum ada task untuk project ini.</p>`;
  }

  return tasks.map((task) => {
    const statusText = task.nama_status || "Pending";
    const statusClass = normalizeStatus(statusText);

    return `
      <div class="task-row">
        <div class="task-name">
          <i class="fa-solid fa-circle-check"></i>
          <div>
            <span>${escapeHtml(task.judul_task)}</span>
            ${task.deskripsi_task ? `<small>${escapeHtml(task.deskripsi_task)}</small>` : ""}
          </div>
        </div>

        <div class="task-user">
          <div class="user-initial">${escapeHtml((task.assignee || "?").charAt(0).toUpperCase())}</div>
          <span>${escapeHtml(task.assignee || "Belum di-assign")}</span>
        </div>

        <div class="task-status">
          <span class="status-badge ${statusClass}">${escapeHtml(statusText)}</span>
        </div>
      </div>
    `;
  }).join("");
}

// Export function
export { renderTasks };