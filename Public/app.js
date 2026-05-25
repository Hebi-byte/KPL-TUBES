import { requireLogin, logout } from "./Content/auth.js";
import { appEl, state } from "./Content/shared.js";
import { renderSidebar, renderEmptyProject } from "./Content/sidebar.js";
import { renderMain } from "./Content/main.js";
import { escapeHtml } from "./Content/utils.js";

const API = {
  projects: "/api/projects",
  tasks: "/api/tasks",
};

function getToken() {
  return localStorage.getItem("token");
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("taskflow_user") || "{}") || {};
  } catch (error) {
    return {};
  }
}

function getCurrentUserId() {
  const user = getCurrentUser();
  return Number(user.id_user || user.id || user.user_id || 0);
}

function getCurrentUserName() {
  const user = getCurrentUser();
  return user.nama_user || user.name || user.username || "User login";
}

async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let result = {};

  try {
    result = await response.json();
  } catch (error) {
    result = {};
  }

  if (!response.ok) {
    throw new Error(result.message || "Request gagal");
  }

  return result;
}

function getProjectIdFromUrl() {
  const match = window.location.pathname.match(/^\/projects\/(\d+)/);
  return match ? Number(match[1]) : null;
}

async function loadData() {
  const [projectResult, taskResult] = await Promise.all([
    apiFetch(API.projects),
    apiFetch(API.tasks),
  ]);

  state.projects = Array.isArray(projectResult.data) ? projectResult.data : [];
  state.tasks = Array.isArray(taskResult.data) ? taskResult.data : [];

  const projectIdFromUrl = getProjectIdFromUrl();

  state.activeProjectId =
    projectIdFromUrl || state.activeProjectId || state.projects[0]?.id_project || null;
}

function getActiveProject() {
  return (
    state.projects.find(
      (project) => Number(project.id_project) === Number(state.activeProjectId)
    ) || null
  );
}

function getActiveTasks() {
  return state.tasks.filter(
    (task) => Number(task.id_project) === Number(state.activeProjectId)
  );
}


function injectTaskTimeStyles() {
  if (document.getElementById("taskTimeStyle")) return;

  const style = document.createElement("style");
  style.id = "taskTimeStyle";
  style.textContent = `
    .table-header,
    .task-row {
      grid-template-columns: minmax(280px, 1fr) 180px 215px 145px 43px;
    }

    .task-time-wrap {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .task-time-label {
      color: var(--muted, #8d899a);
      font-size: 0.72rem;
      font-weight: 800;
      line-height: 1;
    }

    .task-time-value {
      color: #3e3d4d;
      font-size: 0.82rem;
      font-weight: 800;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .icon-time {
      font-size: 1rem;
      line-height: 1;
    }

    @media (max-width: 980px) {
      .table-header,
      .task-row {
        grid-template-columns: minmax(240px, 1fr) 160px 160px 130px 36px;
      }
    }

    @media (max-width: 720px) {
      .table-header,
      .task-row {
        min-width: 860px;
      }
    }
  `;
  document.head.appendChild(style);
}

function renderAddProjectModal(errorMessage = "") {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div class="modal-backdrop" id="addProjectModal" role="dialog" aria-modal="true" aria-labelledby="addProjectTitle">
      <form class="modal-card modal-form" id="addProjectForm">
        <div class="modal-header">
          <h3 id="addProjectTitle">Add Project</h3>
          <button class="modal-close" id="closeProjectModal" type="button" aria-label="Close">×</button>
        </div>

        <label for="projectName">
          Project name
          <input
            id="projectName"
            name="nama_project"
            type="text"
            placeholder="Project baru"
            required
            autofocus
          />
        </label>

        <label for="projectDescription">
          Description
          <textarea
            id="projectDescription"
            name="deskripsi"
            placeholder="Deskripsi singkat project"
            rows="4"
          ></textarea>
        </label>

        ${errorMessage ? `<p class="login-message">${escapeHtml(errorMessage)}</p>` : ""}
        <button class="login-btn" id="saveProjectBtn" type="submit">Save Project</button>
      </form>
    </div>
    `
  );

  document
    .getElementById("closeProjectModal")
    ?.addEventListener("click", closeAddProjectModal);

  document.getElementById("addProjectModal")?.addEventListener("click", (event) => {
    if (event.target.id === "addProjectModal") {
      closeAddProjectModal();
    }
  });

  document
    .getElementById("addProjectForm")
    ?.addEventListener("submit", handleCreateProject);
}

function closeAddProjectModal() {
  document.getElementById("addProjectModal")?.remove();
}

async function handleCreateProject(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const saveButton = document.getElementById("saveProjectBtn");
  const formData = new FormData(form);

  const nama_project = String(formData.get("nama_project") || "").trim();
  const deskripsi = String(formData.get("deskripsi") || "").trim();

  if (!nama_project) return;

  try {
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    const result = await apiFetch(API.projects, {
      method: "POST",
      body: JSON.stringify({
        nama_project,
        deskripsi,
      }),
    });

    closeAddProjectModal();
    await loadData();

    state.activeProjectId =
      result.data?.id_project || state.projects[0]?.id_project || state.activeProjectId;

    if (state.activeProjectId) {
      history.pushState({}, "", `/projects/${state.activeProjectId}`);
    }

    renderApp();
  } catch (error) {
    closeAddProjectModal();
    renderAddProjectModal(error.message);
  }
}

function renderAddTaskModal(errorMessage = "") {
  const assigneeName = getCurrentUserName();

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div class="modal-backdrop" id="addTaskModal" role="dialog" aria-modal="true" aria-labelledby="addTaskTitle">
      <form class="modal-card modal-form" id="addTaskForm">
        <div class="modal-header">
          <h3 id="addTaskTitle">Add Task</h3>
          <button class="modal-close" id="closeTaskModal" type="button" aria-label="Close">×</button>
        </div>

        <label for="taskName">
          Task name
          <input
            id="taskName"
            name="judul_task"
            type="text"
            placeholder="Task baru"
            required
            autofocus
          />
        </label>

        <label for="taskDescription">
          Description
          <textarea
            id="taskDescription"
            name="deskripsi_task"
            placeholder="Deskripsi singkat"
            rows="4"
          ></textarea>
        </label>

        <label for="taskDueDate">
          Waktu / Deadline
          <input
            id="taskDueDate"
            name="due_date"
            type="datetime-local"
          />
        </label>

        <label for="taskAssigneeAuto">
          Assignee
          <input id="taskAssigneeAuto" type="text" value="${escapeHtml(assigneeName)}" disabled />
        </label>

        <label for="taskStatusAuto">
          Status
          <input id="taskStatusAuto" type="text" value="pending" disabled />
        </label>

        ${errorMessage ? `<p class="login-message">${escapeHtml(errorMessage)}</p>` : ""}
        <button class="login-btn" id="saveTaskBtn" type="submit">Save Task</button>
      </form>
    </div>
    `
  );

  document
    .getElementById("closeTaskModal")
    ?.addEventListener("click", closeAddTaskModal);

  document.getElementById("addTaskModal")?.addEventListener("click", (event) => {
    if (event.target.id === "addTaskModal") {
      closeAddTaskModal();
    }
  });

  document
    .getElementById("addTaskForm")
    ?.addEventListener("submit", handleCreateTask);
}

function closeAddTaskModal() {
  document.getElementById("addTaskModal")?.remove();
}

async function handleCreateTask(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const saveButton = document.getElementById("saveTaskBtn");
  const formData = new FormData(form);

  const judul_task = String(formData.get("judul_task") || "").trim();
  const deskripsi_task = String(formData.get("deskripsi_task") || "").trim();
  const due_date = String(formData.get("due_date") || "").trim();
  const created_by = getCurrentUserId();
  const id_project = Number(state.activeProjectId);

  if (!judul_task || !id_project || !created_by) {
    closeAddTaskModal();
    renderAddTaskModal("Task name, project, dan user login wajib tersedia.");
    return;
  }

  try {
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    await apiFetch(API.tasks, {
      method: "POST",
      body: JSON.stringify({
        id_project,
        judul_task,
        deskripsi_task,
        due_date: due_date || null,
        created_by,
      }),
    });

    closeAddTaskModal();
    await loadData();
    renderApp();
  } catch (error) {
    closeAddTaskModal();
    renderAddTaskModal(error.message);
  }
}

function renderApp() {
  let activeProject = getActiveProject();

  if (!activeProject && state.projects.length > 0) {
    state.activeProjectId = state.projects[0].id_project;
    activeProject = getActiveProject();
  }

  if (!activeProject) {
    appEl.innerHTML = renderEmptyProject();
  } else {
    const activeTasks = getActiveTasks();

    appEl.innerHTML = `
      <div class="dashboard-shell">
        ${renderSidebar()}
        ${renderMain(activeProject, activeTasks, activeTasks.length)}
      </div>
    `;
  }

  bindEvents();
}

function bindEvents() {
  document.querySelectorAll(".project-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      state.activeProjectId = Number(link.dataset.projectId);
      history.pushState({}, "", `/projects/${state.activeProjectId}`);
      renderApp();
    });
  });

  document
    .getElementById("addProjectBtn")
    ?.addEventListener("click", () => renderAddProjectModal());

  document
    .getElementById("addTaskBtn")
    ?.addEventListener("click", () => renderAddTaskModal());

  document
    .getElementById("mobileAddTaskBtn")
    ?.addEventListener("click", () => renderAddTaskModal());

  document.getElementById("logoutBtn")?.addEventListener("click", logout);
  document.getElementById("mobileLogoutBtn")?.addEventListener("click", logout);
}

async function init() {
  requireLogin();
  injectTaskTimeStyles();

  try {
    await loadData();
    renderApp();
  } catch (error) {
    appEl.innerHTML = `
      <main class="main-content">
        <div class="empty-state big">
          <h2>Gagal memuat dashboard</h2>
          <p>${escapeHtml(error.message)}</p>
        </div>
      </main>
    `;
  }
}

window.addEventListener("popstate", () => {
  state.activeProjectId = getProjectIdFromUrl() || state.projects[0]?.id_project || null;
  renderApp();
});

init();
