import { escapeHtml } from './utils.js';
import { state } from './shared.js';

// Fungsi untuk membuat tampilan sidebar (daftar project + tombol logout)
function renderSidebar() {
  const canManageProjects = Boolean(state.permissions?.canManageProjects);

  // Buat link untuk setiap project, tandai yang sedang aktif
  const projectLinks = state.projects
    .map((project) => {
      const isActive = Number(project.id_project) === Number(state.activeProjectId);

      return `
        <a
          class="project-link ${isActive ? 'active' : ''}"
          href="/projects/${escapeHtml(project.id_project)}"
          data-project-id="${escapeHtml(project.id_project)}"
        >
          <span class="folder-icon"></span>
          <span>${escapeHtml(project.nama_project)}</span>
        </a>
      `;
    })
    .join('');

  return `
    <aside class="sidebar">
      <div class="brand">TaskFlow</div>

      <div class="sidebar-section-title">My Project</div>

      <nav class="project-nav" aria-label="Project navigation">
        ${projectLinks || '<p class="sidebar-empty">Belum ada project.</p>'}
      </nav>

      <div class="sidebar-actions">
        ${
          canManageProjects
            ? `
              <button class="sidebar-btn add-project" id="addProjectBtn" type="button">
                <span>＋</span> Add Project
              </button>
            `
            : ''
        }

        <button class="sidebar-btn logout" id="logoutBtn" type="button">
          <span>↪</span> Logout
        </button>
      </div>
    </aside>
  `;
}

// Fungsi untuk tampilan khusus saat belum ada project sama sekali
function renderEmptyProject() {
  const canManageProjects = Boolean(state.permissions?.canManageProjects);

  return `
    <div class="dashboard-shell">
      <aside class="sidebar">
        <div class="brand">TaskFlow</div>
        <div class="sidebar-section-title">My Project</div>
        <p class="sidebar-empty">Belum ada project.</p>

        <div class="sidebar-actions">
          ${
            canManageProjects
              ? `
                <button class="sidebar-btn add-project" id="addProjectBtn" type="button">
                  <span>＋</span> Add Project
                </button>
              `
              : ''
          }
          <button class="sidebar-btn logout" id="logoutBtn" type="button">
            <span>↪</span> Logout
          </button>
        </div>
      </aside>

      <main class="main-content">
        <div class="empty-state big">
          <h2>Belum ada project</h2>
          <p>
            ${
              canManageProjects
                ? 'Klik Add Project untuk membuat project baru.'
                : 'Role kamu hanya bisa melihat data yang sudah tersedia.'
            }
          </p>
        </div>
      </main>
    </div>
  `;
}

export { renderSidebar, renderEmptyProject };
