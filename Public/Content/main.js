// Import utilities
import { escapeHtml } from './utils.js';
import { renderTasks } from './task.js';

function renderMain(project, tasks) {
  return `
    <main class="main-content">
      <div class="container">
        <section class="header-card">
          <div class="project-info">
            <div class="project-icon">
              <i class="fa-solid fa-diagram-project"></i>
            </div>
            <div >
              <h2>${escapeHtml(project.nama_project)}</h2>
              <p class="project-description">${escapeHtml(project.deskripsi || "Tidak ada deskripsi project.")}</p>
              <div class="badge">
                <i class="fa-solid fa-list-check"></i>
                ${tasks.length} task
              </div>
            </div>
          </div>

          <div class="header-actions">
            <div class="search-box">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input id="taskSearch" type="text" placeholder="Search task">
            </div>
            <div class="avatar"><i class="fa-solid fa-user"></i></div>
          </div>
        </section>

        <section class="toolbar">
          <button class="toolbar-btn" type="button">
            <i class="fa-solid fa-circle-check"></i>
            Incomplete tasks
          </button>
          <button class="toolbar-btn" type="button">
            <i class="fa-solid fa-arrow-up-wide-short"></i>
            Sort
          </button>
          <button class="toolbar-btn" type="button">
            <i class="fa-solid fa-plus"></i>
            Add task
          </button>
        </section>

        <section class="task-table">
          <div class="table-header">
            <div class="task-column">Task name</div>
            <div class="assignee-column"><i class="fa-solid fa-users"></i> Assignee</div>
            <div class="status-column"><i class="fa-solid fa-sun"></i> Status</div>
          </div>
          <div id="taskContent" class="task-content">
            ${renderTasks(tasks)}
          </div>
        </section>
      </div>
    </main>
  `;
}

// Export function
export { renderMain };
