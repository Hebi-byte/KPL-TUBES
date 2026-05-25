import { escapeHtml, normalizeStatus, getInitial } from './utils.js';

function formatTaskTime(value) {
  if (!value) return 'Belum ada waktu';

  const raw = String(value);
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function renderTasks(tasks) {
  if (!tasks || tasks.length === 0) {
    return `
      <div class="empty-state">
        Belum ada task untuk project ini.
      </div>
    `;
  }

  return tasks
    .map((task) => {
      const statusText = task.nama_status || task.status || 'pending';
      const statusClass = normalizeStatus(statusText);
      const assignee = task.assignee || task.nama_user || task.creator || 'Belum di-assign';
      const desc = task.deskripsi_task || task.deskripsi || '';
      const taskTime = task.due_date || task.waktu_task || task.created_at || '';
      const timeLabel = task.due_date || task.waktu_task ? 'Deadline' : 'Dibuat';

      return `
        <div class="task-row" data-task-id="${escapeHtml(task.id_task || '')}">
          <div class="task-cell task-name">
            <button class="check-circle" type="button" data-complete-task="${escapeHtml(task.id_task || '')}" aria-label="Complete task">✓</button>
            <div class="task-title-wrap">
              <div class="task-title">${escapeHtml(task.judul_task || task.nama_task || 'Untitled Task')}</div>
              ${desc ? `<div class="task-desc">${escapeHtml(desc)}</div>` : ''}
            </div>
          </div>

          <div class="task-cell task-time">
            <div class="task-time-wrap">
              <div class="task-time-label">${escapeHtml(timeLabel)}</div>
              <div class="task-time-value">${escapeHtml(formatTaskTime(taskTime))}</div>
            </div>
          </div>

          <div class="task-cell task-assignee">
            <span class="task-user-avatar">${escapeHtml(getInitial(assignee))}</span>
            <span class="task-user">${escapeHtml(assignee)}</span>
          </div>

          <div class="task-cell task-status">
            <span class="status-badge ${escapeHtml(statusClass)}">${escapeHtml(statusText)}</span>
          </div>

          <button class="task-cell task-edit" type="button" data-edit-task="${escapeHtml(task.id_task || '')}">
            Edit
          </button>
        </div>
      `;
    })
    .join('');
}

export { renderTasks };
