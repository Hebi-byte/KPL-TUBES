// Import utilities
import { escapeHtml } from './utils.js';
import { state, appEl } from './shared.js';

function renderSidebar() {
  const projectLinks = state.projects.map((project) => {
    const isActive = project.id_project === state.activeProjectId;

    return `
      <a href="/projects/${project.id_project}" class="project-link ${isActive ? "active" : ""}" data-project-id="${project.id_project}">
        <i class="fa-solid ${isActive ? "fa-folder-open" : "fa-folder"}"></i>
        <span>${escapeHtml(project.nama_project)}</span>
        <small>${project.total_task || 0}</small>
      </a>
    `;
  }).join("");

  return `
    <aside class="sidebar">
      <div class="logo"><h1>TaskFlow</h1></div>

      <div class="project-section">
        <p class="sidebar-title">MY PROJECT</p>
        <nav class="project-nav">
          ${projectLinks}
        </nav>
      </div>

      <div class="sidebar-bottom">
        <button class="add-project-btn" type="button">
          <i class="fa-solid fa-plus"></i>
          Add Project
        </button>
        <a href="#" class="settings-link">
          <i class="fa-solid fa-gear"></i>
          <span>Setting</span>
        </a>
      </div>
    </aside>
  `;
}

function renderEmptyProject() {
  appEl.innerHTML = `
    <aside class="sidebar">
      <div class="logo"><h1>TaskFlow</h1></div>
      <div class="project-section">
        <p class="sidebar-title">MY PROJECT</p>
        <nav class="project-nav">
          <p class="empty-state">Belum ada project.</p>
        </nav>
      </div>
    </aside>

    <main class="main-content">
      <section class="header-card">
        <div>
          <h2>Belum ada project</h2>
          <p class="muted">Tambahkan data ke tabel <b>projects</b> agar muncul di sidebar.</p>
        </div>
      </section>
    </main>
  `;
}

// Export functions
export { renderSidebar, renderEmptyProject };
