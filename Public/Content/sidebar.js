import { escapeHtml } from './utils.js';
import { state } from './shared.js';

function renderSidebar() {
  const projectLinks = state.projects.map((project) => {
    const isActive = Number(project.id_project) === Number(state.activeProjectId);
    return `
      <a href="/projects/${project.id_project}"
         class="project-link ${isActive ? 'active' : ''}"
         data-project-id="${project.id_project}">
        <span class="folder-icon" aria-hidden="true"></span>
        <span>${escapeHtml(project.nama_project)}</span>
      </a>
    `;
  }).join('');

  return `
    <aside class="sidebar">
      <div class="logo">
        <h1>TaskFlow</h1>
      </div>

      <section class="project-section">
        <p class="sidebar-title">My Project</p>
        <nav class="project-nav" aria-label="Project list">
          ${projectLinks}
        </nav>
      </section>

      <div class="sidebar-bottom">
        <button class="add-project-btn" id="addProjectBtn" type="button">
          <span class="icon-plus" aria-hidden="true"></span>
          <span>Add Project</span>
        </button>

        <button class="logout-btn" id="logoutBtn" type="button">
          <span class="icon-logout" aria-hidden="true"></span>
          <span>Logout</span>
        </button>

        <a class="settings-link" href="#">
          <span class="icon-gear" aria-hidden="true"></span>
          <span>Setting</span>
        </a>
      </div>
    </aside>
  `;
}

function renderEmptyProject() {
  return `
    <div class="dashboard-shell">
      <aside class="sidebar">
        <div class="logo"><h1>TaskFlow</h1></div>
        <section class="project-section">
          <p class="sidebar-title">My Project</p>
          <p class="empty-sidebar">Belum ada project.</p>
        </section>
        <div class="sidebar-bottom">
          <button class="add-project-btn" id="addProjectBtn" type="button">
            <span class="icon-plus" aria-hidden="true"></span>
            <span>Add Project</span>
          </button>
        </div>
      </aside>

      <main class="main-content">
        <div class="empty-state big">
          <h2>Belum ada project</h2>
          <p>Klik Add Project untuk membuat project baru.</p>
        </div>
      </main>
    </div>
  `;
}

export { renderSidebar, renderEmptyProject };
