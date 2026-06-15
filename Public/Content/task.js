import { escapeHtml, normalizeStatus, getInitial } from './utils.js';
import { state } from './shared.js';

// Mengubah nilai datetime dari database menjadi format tanggal yang lebih mudah dibaca
function formatTaskTime(value) {
  if (!value) return 'Belum tersedia';

  // Normalisasi format datetime supaya bisa dibaca oleh objek Date
  const raw = String(value).trim();
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const date = new Date(normalized);

  // Kalau format tidak valid, tampilkan apa adanya
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

// Menentukan label waktu task: "Diedit" jika pernah diubah, "Dibuat" jika belum
function getActivityTime(task) {
  const createdAt = task.created_at || '';
  const updatedAt = task.updated_at || '';

  if (updatedAt && createdAt && String(updatedAt) !== String(createdAt)) {
    return { label: 'Diedit', value: updatedAt };
  }

  return { label: 'Dibuat', value: createdAt || updatedAt };
}

function renderTasks(tasks) {

   // Kalau task kosong, tampilkan pesan sesuai kondisi (hasil search atau memang belum ada task)
  if (!tasks || tasks.length === 0) {
  const keyword = String(state.searchQuery || '').trim();

  if (keyword) {
    return `
      <div class="empty-task">
        Tidak ada task yang cocok dengan "${escapeHtml(keyword)}".
      </div>
    `;
  }

  return `
    Belum ada task untuk project ini.
  `;
}

  const canManageTasks = Boolean(state.permissions?.canManageTasks);

  // Render setiap task menjadi satu baris di tabel
  return tasks
    .map((task) => {
      const statusText = task.nama_status || task.status || 'pending';
      const statusClass = normalizeStatus(statusText);
      const assignee = task.assignee || task.nama_user || task.creator || 'Belum di-assign';
      const desc = task.deskripsi_task || task.deskripsi || '';
      const activityTime = getActivityTime(task);

      return `
        <div class="task-row" data-task-id="${escapeHtml(task.id_task || '')}">
          <div class="task-cell task-name">
            <button class="check-circle" type="button" data-complete-task="${escapeHtml(task.id_task || '')}" aria-label="Complete task" ${canManageTasks ? '' : 'disabled'}>✓</button>
            <div class="task-title-wrap">
              <div class="task-title">${escapeHtml(task.judul_task || task.nama_task || 'Untitled Task')}</div>
              ${desc ? `<div class="task-desc">${escapeHtml(desc)}</div>` : ''}
            </div>
          </div>

          <div class="task-cell task-time">
            <div class="task-time-wrap">
              <div class="task-time-label">${escapeHtml(activityTime.label)}</div>
              <div class="task-time-value">${escapeHtml(formatTaskTime(activityTime.value))}</div>
            </div>
          </div>

          <div class="task-cell task-time">
            <div class="task-time-wrap">
              <div class="task-time-label">Deadline</div>
              <div class="task-time-value">${escapeHtml(formatTaskTime(task.due_date))}</div>
            </div>
          </div>

          <div class="task-cell task-assignee">
            <span class="task-user-avatar">${escapeHtml(getInitial(assignee))}</span>
            <span class="task-user">${escapeHtml(assignee)}</span>
          </div>

          <div class="task-cell task-status">
            <span class="status-badge ${escapeHtml(statusClass)}">${escapeHtml(statusText)}</span>
          </div>

          ${
            canManageTasks
              ? `
                <button class="task-cell task-edit" type="button" data-edit-task="${escapeHtml(task.id_task || '')}">
                  Edit
                </button>
              `
              : '<div class="task-cell task-readonly">View</div>'
          }
        </div>
      `;
    })
    .join('');
}

export { renderTasks };
