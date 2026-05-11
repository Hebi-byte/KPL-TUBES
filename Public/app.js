import { renderSidebar, renderEmptyProject } from './Content/sidebar.js';
import { renderMain } from './Content/main.js';
import { renderTasks } from './Content/task.js';
import { state, appEl } from './Content/shared.js';
import { requireLogin, logout } from './Content/auth.js';

requireLogin();

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`
    }
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Gagal mengambil data");
  }

  return result.data;
}

function getProjectIdFromPath() {
  const match = location.pathname.match(/^\/projects\/(\d+)/);
  return match ? Number(match[1]) : null;
}

function bindProjectLinks() {
  document.querySelectorAll(".project-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      state.activeProjectId = Number(link.dataset.projectId);
      history.pushState({}, "", `/projects/${state.activeProjectId}`);
      renderDashboard();
    });
  });
}

function bindSearch(allTasks) {
  const input = document.getElementById("taskSearch");
  const taskContent = document.getElementById("taskContent");

  if (!input || !taskContent) return;

  input.addEventListener("input", () => {
    const keyword = input.value.toLowerCase();
    const filteredTasks = allTasks.filter((task) => {
      return [task.judul_task, task.deskripsi_task, task.assignee, task.nama_status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword));
    });

    taskContent.innerHTML = renderTasks(filteredTasks);
  });
}

async function renderDashboard() {
  try {
    const projects = await fetchJson("/api/projects");
    const allTasks = await fetchJson("/api/tasks");

    state.projects = projects.map((project) => ({
      ...project,
      total_task: allTasks.filter((task) => task.id_project === project.id_project).length
    }));

    if (state.projects.length === 0) {
      renderEmptyProject();
      return;
    }

    const pathProjectId = getProjectIdFromPath();
    const hasPathProject = state.projects.some((project) => project.id_project === pathProjectId);
    state.activeProjectId = hasPathProject ? pathProjectId : state.projects[0].id_project;

    const activeProject = state.projects.find((project) => project.id_project === state.activeProjectId);
    const projectTasks = allTasks.filter((task) => task.id_project === state.activeProjectId);

    appEl.innerHTML = `
      ${renderSidebar()}
      ${renderMain(activeProject, projectTasks)}
    `;

    const sidebarBottom = document.querySelector(".sidebar-bottom");
    if (sidebarBottom && !document.getElementById("logoutBtn")) {
      sidebarBottom.insertAdjacentHTML("beforeend", `
        <button id="logoutBtn" class="add-project-btn" type="button">
          <i class="fa-solid fa-right-from-bracket"></i>
          Logout
        </button>
      `);
    }

    document.getElementById("logoutBtn")?.addEventListener("click", logout);

    bindProjectLinks();
    bindSearch(projectTasks);
  } catch (error) {
    appEl.innerHTML = `
      <main class="main-content">
        <div class="container">
          <section class="header-card">
            <div>
              <h2>Gagal memuat dashboard</h2>
              <p>${error.message}</p>
              <button id="logoutBtn" class="toolbar-btn" type="button">Logout</button>
            </div>
          </section>
        </div>
      </main>
    `;

    document.getElementById("logoutBtn")?.addEventListener("click", logout);
  }
}

window.addEventListener("popstate", renderDashboard);
renderDashboard();
