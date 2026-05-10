// Import modules from Content folder
import { renderSidebar, renderEmptyProject } from './Content/sidebar.js';
import { renderMain } from './Content/main.js';
import { renderTasks } from './Content/task.js';
import { state, appEl } from './Content/shared.js';
import { escapeHtml } from './Content/utils.js';

async function fetchJson(url) {
  const response = await fetch(url);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || `Gagal mengambil data dari ${url}`);
  }

  return result.data;
}

function getProjectIdFromPath() {
  const match = location.pathname.match(/^\/projects\/(\d+)/);
  return match ? Number(match[1]) : null;
}

async function loadProjects() {
  state.projects = await fetchJson("/api/projects");

  if (state.projects.length === 0) {
    state.activeProjectId = null;
    return;
  }

  const projectIdFromPath = getProjectIdFromPath();
  const projectExists = state.projects.some((project) => project.id_project === projectIdFromPath);

  state.activeProjectId = projectExists ? projectIdFromPath : state.projects[0].id_project;

  if (!projectExists && location.pathname.startsWith("/projects")) {
    history.replaceState({}, "", `/projects/${state.activeProjectId}`);
  }
}

async function loadDashboard() {
  appEl.innerHTML = `<p class="loading-text">Loading project...</p>`;

  try {
    await loadProjects();

    if (!state.activeProjectId) {
      renderEmptyProject();
      return;
    }

    const [activeProject, tasks] = await Promise.all([
      fetchJson(`/api/projects/${state.activeProjectId}`),
      fetchJson(`/api/projects/${state.activeProjectId}/tasks`),
    ]);

    renderDashboard(activeProject, tasks);
  } catch (error) {
    appEl.innerHTML = `
      <section class="error-card">
        <h2>Data gagal dimuat</h2>
        <p>${escapeHtml(error.message)}</p>
      </section>
    `;
  }
}

function renderDashboard(activeProject, tasks) {
  appEl.innerHTML = `
    ${renderSidebar()}
    ${renderMain(activeProject, tasks)}
  `;

  bindProjectLinks();
  bindSearch(tasks);
}

function bindProjectLinks() {
  document.querySelectorAll(".project-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      state.activeProjectId = Number(link.dataset.projectId);
      history.pushState({}, "", `/projects/${state.activeProjectId}`);
      loadDashboard();
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

window.addEventListener("popstate", loadDashboard);

loadDashboard();
