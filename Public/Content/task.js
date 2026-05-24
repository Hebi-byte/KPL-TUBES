import { escapeHtml, normalizeStatus, getInitial } from './utils.js';

function renderTasks(tasks) {
  if (!tasks || tasks.length === 0) {
    return `
      <div class="empty-state">
        <p>Belum ada task untuk project ini.</p>
      </div>
    `;
  }

  return tasks.map((task) => {
    const statusText = task.nama_status || task.status || 'Pending';
    const statusClass = normalizeStatus(statusText);
    const assignee = task.assignee || task.nama_user || 'Belum di-assign';
    const desc = task.deskripsi_task || task.deskripsi || '';

    return `
      <article class="task-row" data-task-id="${task.id_task}">
        <div class="task-cell task-name">
          <button class="check-circle" data-complete-task="${task.id_task}" aria-label="Tandai selesai">✓</button>
          <div class="task-title-wrap">
            <div class="task-title">${escapeHtml(task.judul_task || task.nama_task || 'Untitled Task')}</div>
            ${desc ? `<div class="task-desc">${escapeHtml(desc)}</div>` : ''}
          </div>
        </div>

        <div class="task-cell task-user">
          <span class="task-user-avatar" aria-hidden="true">${escapeHtml(getInitial(assignee))}</span>
          <span>${escapeHtml(assignee)}</span>
        </div>

        <div class="task-cell task-status">
          <button class="status-badge ${statusClass}" type="button">${escapeHtml(statusText)}</button>
        </div>

        <button class="task-cell task-edit" data-edit-task="${task.id_task}" title="Edit task">Edit</button>
      </article>
    `;
  }).join('');
}

export { renderTasks };
