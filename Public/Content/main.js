import { escapeHtml } from './utils.js';
import { state } from './shared.js';
import { renderTasks } from './task.js';

function renderMain(project, tasks, totalTaskCount = 0) {
  const title = escapeHtml(project?.nama_project || 'Project');
  const description = escapeHtml(
    project?.deskripsi_project ||
      project?.deskripsi ||
      project?.description ||
      'Belum ada deskripsi project.'
  );
  const taskLabel = `${Number(totalTaskCount) || 0} Task${Number(totalTaskCount) === 1 ? '' : 's'}`;
  const canManageTasks = Boolean(state.permissions?.canManageTasks);

  return `
    <main class="main-content">
      <section class="header-card">
        <div class="project-info">
          <div class="project-icon" aria-hidden="true"><span class="project-icon-shape"></span></div>
          <div class="project-heading">
            <h2>${title}</h2>
            <p class="project-description">${description}</p>
            <span class="badge task-count-badge" id="taskCountBadge">
              <span class="icon-task-count"></span>${escapeHtml(taskLabel)}
            </span>
          </div>
        </div>

        <div class="header-actions">
          <label class="search-box" for="taskSearch">
            <span class="icon-search"></span>
            <input id="taskSearch" type="search" placeholder="Search" />
          </label>
          <div class="avatar" aria-hidden="true"></div>
        </div>
      </section>

      <section class="toolbar" aria-label="Task toolbar">
        <button class="toolbar-btn active" id="toggleCompletedBtn" type="button">
          <span class="icon-filter"></span>Incomplete tasks
        </button>
        <button class="toolbar-btn" id="sortTaskBtn" type="button">
          <span class="icon-sort"></span>Sort
        </button>
        ${
          canManageTasks
            ? `
              <div class="add-task-group">
                <button class="toolbar-btn" id="addTaskBtn" type="button">
                  <span class="icon-plus"></span>Add task
                </button>
                <button class="toolbar-btn dropdown-btn" type="button" aria-label="Open task menu">
                  <span class="icon-chevron"></span>
                </button>
              </div>
            `
            : ''
        }
      </section>

      <section class="task-table">
        <div class="table-header">
          <div>Task name</div>
          <div><span class="icon-time">◷</span>Waktu</div>
          <div><span class="icon-time">◷</span>Deadline</div>
          <div><span class="icon-users"></span>Assignee</div>
          <div><span class="icon-status"></span>Status</div>
          <div class="add-column">${canManageTasks ? '+' : ''}</div>
        </div>

        <div class="task-content">
          <div class="task-list">
            ${renderTasks(tasks)}
          </div>
        </div>
      </section>
    </main>

    <nav class="mobile-nav" aria-label="Mobile navigation">
      <a href="/" aria-label="Home">⌂</a>
      ${canManageTasks ? '<button id="mobileAddTaskBtn" type="button" aria-label="Add task">＋</button>' : ''}
      <button id="mobileLogoutBtn" type="button" aria-label="Logout">↪</button>
    </nav>
  `;
}

export { renderMain };
