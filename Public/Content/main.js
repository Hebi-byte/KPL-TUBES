import { escapeHtml } from './utils.js';
import { renderTasks } from './task.js';

function renderMain(project, tasks, totalTaskCount = 0) {
  const title = escapeHtml(project?.nama_project || 'Project');
  const description = escapeHtml(
    project?.deskripsi
    || project?.description
    || 'Belum ada deskripsi project.'
  );
  const taskLabel = `${Number(totalTaskCount) || 0} Task${Number(totalTaskCount) === 1 ? '' : 's'}`;

  return `
    <main class="main-content">
      <section class="header-card">
        <div class="project-info">
          <div class="project-icon" aria-hidden="true">
            <span class="project-icon-shape"></span>
          </div>

          <div class="project-heading">
            <h2>${title}</h2>
            <p class="project-description">${description}</p>
            <span class="badge task-count-badge" id="taskCountBadge">
              <span class="icon-task-count" aria-hidden="true"></span>
              ${escapeHtml(taskLabel)}
            </span>
          </div>
        </div>

        <div class="header-actions">
          <label class="search-box" for="taskSearch">
            <span class="icon-search" aria-hidden="true"></span>
            <input id="taskSearch" type="search" placeholder="Search" autocomplete="off" />
          </label>
          <div class="avatar" title="User profile" aria-hidden="true"></div>
        </div>
      </section>

      <section class="toolbar" aria-label="Task tools">
        <button class="toolbar-btn" id="toggleCompletedBtn" type="button">
          <span class="icon-filter" aria-hidden="true"></span>
          <span>Incomplete tasks</span>
        </button>
        <button class="toolbar-btn" id="sortTaskBtn" type="button">
          <span class="icon-sort" aria-hidden="true"></span>
          <span>Sort</span>
        </button>
        <div class="add-task-group">
          <button class="toolbar-btn" id="addTaskBtn" type="button">
            <span class="icon-plus" aria-hidden="true"></span>
            <span>Add task</span>
          </button>
          <button class="toolbar-btn dropdown-btn" type="button" aria-label="More add task options">
            <span class="icon-chevron" aria-hidden="true"></span>
          </button>
        </div>
      </section>

      <section class="task-table">
        <div class="table-header">
          <div>Task name</div>
          <div><span class="icon-users" aria-hidden="true"></span>Assignee</div>
          <div><span class="icon-status" aria-hidden="true"></span>Status</div>
          <div class="add-column">+</div>
        </div>

        <div class="task-content" id="taskContent">
          <div class="task-list">
            ${renderTasks(tasks)}
          </div>
        </div>
      </section>

      <nav class="mobile-nav" aria-label="Mobile navigation">
        <a href="/dashboard" class="active">⌂</a>
        <button type="button" id="mobileAddTaskBtn">＋</button>
        <button type="button" id="mobileLogoutBtn">↪</button>
      </nav>
    </main>
  `;
}

export { renderMain };
