import { requireLogin, logout } from "./Content/auth.js";
import { appEl, state } from "./Content/shared.js";
import { renderSidebar, renderEmptyProject } from "./Content/sidebar.js";
import { renderMain } from "./Content/main.js";
import { escapeHtml } from "./Content/utils.js";

const API = {
  projects: "/api/projects",
  tasks: "/api/tasks",
  // Di beberapa versi project route status bisa beda nama, jadi frontend coba dua endpoint ini.
  statusEndpoints: ["/api/statuses", "/api/status"],
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

  const statusList = await fetchStatuses();
  state.statuses = statusList.length > 0 ? statusList : buildStatusesFromTasks(state.tasks);

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

function normalizeStatusItem(status) {
  const id_status = Number(status.id_status || status.id || status.status_id || 0);
  const nama_status = String(
    status.nama_status || status.name || status.status || status.label || ""
  ).trim();

  if (!id_status || !nama_status) return null;

  return { id_status, nama_status };
}

function normalizeStatusList(list = []) {
  const seen = new Set();

  return list
    .map(normalizeStatusItem)
    .filter(Boolean)
    .filter((status) => {
      if (seen.has(status.id_status)) return false;
      seen.add(status.id_status);
      return true;
    });
}

async function fetchStatuses() {
  for (const endpoint of API.statusEndpoints) {
    try {
      const result = await apiFetch(endpoint);
      const list = Array.isArray(result.data) ? result.data : Array.isArray(result) ? result : [];
      const statuses = normalizeStatusList(list);

      if (statuses.length > 0) {
        return statuses;
      }
    } catch (error) {
      // Abaikan endpoint yang tidak ada, lalu coba endpoint berikutnya.
    }
  }

  return [];
}

function buildStatusesFromTasks(tasks = []) {
  const statuses = tasks
    .map((task) =>
      normalizeStatusItem({
        id_status: task.id_status,
        nama_status: task.nama_status || task.status,
      })
    )
    .filter(Boolean);

  return normalizeStatusList(statuses);
}

function getAvailableStatuses() {
  const statuses = normalizeStatusList(state.statuses || []);
  return statuses.length > 0 ? statuses : buildStatusesFromTasks(state.tasks);
}

function findTaskById(taskId) {
  return state.tasks.find((task) => Number(task.id_task) === Number(taskId)) || null;
}

function injectTaskTimeStyles() {
  if (document.getElementById("taskTimeStyle")) return;

  const style = document.createElement("style");
  style.id = "taskTimeStyle";
  style.textContent = `
    .table-header,
    .task-row {
      grid-template-columns: minmax(280px, 1fr) 180px 215px 145px 72px;
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

    .task-edit {
      border: 0;
      border-left: 1px solid rgba(108, 91, 160, 0.12);
      background: transparent;
      color: var(--primary, #6d50d6);
      font-weight: 800;
      cursor: pointer;
    }

    .task-edit:hover {
      background: rgba(109, 80, 214, 0.08);
    }

    @media (max-width: 980px) {
      .table-header,
      .task-row {
        grid-template-columns: minmax(240px, 1fr) 160px 160px 130px 68px;
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

function renderStatusOptions(selectedStatusId) {
  const statuses = getAvailableStatuses();

  if (statuses.length === 0) {
    return `<option value="">Status belum tersedia</option>`;
  }

  return statuses
    .map((status) => {
      const selected = Number(status.id_status) === Number(selectedStatusId) ? "selected" : "";
      return `<option value="${escapeHtml(status.id_status)}" ${selected}>${escapeHtml(status.nama_status)}</option>`;
    })
    .join("");
}

function renderEditTaskModal(taskId, errorMessage = "") {
  const task = findTaskById(taskId);

  if (!task) {
    alert("Task tidak ditemukan, coba refresh halaman dulu.");
    return;
  }

  const title = task.judul_task || task.nama_task || "";
  const description = task.deskripsi_task || task.deskripsi || "";
  const editorName = getCurrentUserName();

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div class="modal-backdrop" id="editTaskModal" role="dialog" aria-modal="true" aria-labelledby="editTaskTitle">
      <form class="modal-card modal-form" id="editTaskForm" data-task-id="${escapeHtml(task.id_task || "")}">
        <div class="modal-header">
          <h3 id="editTaskTitle">Edit Task</h3>
          <button class="modal-close" id="closeEditTaskModal" type="button" aria-label="Close">×</button>
        </div>

        <label for="editTaskName">
          Task name
          <input
            id="editTaskName"
            name="judul_task"
            type="text"
            value="${escapeHtml(title)}"
            required
            autofocus
          />
        </label>

        <label for="editTaskDescription">
          Description
          <textarea
            id="editTaskDescription"
            name="deskripsi_task"
            placeholder="Deskripsi singkat"
            rows="4"
          >${escapeHtml(description)}</textarea>
        </label>

        <label for="editTaskStatus">
          Status
          <select id="editTaskStatus" name="id_status" required>
            ${renderStatusOptions(task.id_status)}
          </select>
        </label>

        <label for="editTaskAssigneeAuto">
          Assignee otomatis setelah edit
          <input id="editTaskAssigneeAuto" type="text" value="${escapeHtml(editorName)}" disabled />
        </label>

        ${errorMessage ? `<p class="login-message">${escapeHtml(errorMessage)}</p>` : ""}
        <button class="login-btn" id="updateTaskBtn" type="submit">Update Task</button>
      </form>
    </div>
    `
  );

  document
    .getElementById("closeEditTaskModal")
    ?.addEventListener("click", closeEditTaskModal);

  document.getElementById("editTaskModal")?.addEventListener("click", (event) => {
    if (event.target.id === "editTaskModal") {
      closeEditTaskModal();
    }
  });

  document
    .getElementById("editTaskForm")
    ?.addEventListener("submit", handleUpdateTask);
}

function closeEditTaskModal() {
  document.getElementById("editTaskModal")?.remove();
}

async function handleUpdateTask(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const taskId = Number(form.dataset.taskId);
  const updateButton = document.getElementById("updateTaskBtn");
  const formData = new FormData(form);

  const judul_task = String(formData.get("judul_task") || "").trim();
  const deskripsi_task = String(formData.get("deskripsi_task") || "").trim();
  const id_status = Number(formData.get("id_status"));
  const updated_by = getCurrentUserId();

  if (!taskId || !judul_task || !id_status || !updated_by) {
    closeEditTaskModal();
    renderEditTaskModal(taskId, "Nama task, status, dan user login wajib tersedia.");
    return;
  }

  try {
    updateButton.disabled = true;
    updateButton.textContent = "Updating...";

    await apiFetch(`${API.tasks}/${taskId}`, {
      method: "PUT",
      body: JSON.stringify({
        judul_task,
        deskripsi_task,
        id_status,
        updated_by,
      }),
    });

    closeEditTaskModal();
    await loadData();
    renderApp();
  } catch (error) {
    closeEditTaskModal();
    renderEditTaskModal(taskId, error.message);
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

  document.querySelectorAll("[data-edit-task]").forEach((button) => {
    button.addEventListener("click", () => {
      renderEditTaskModal(button.dataset.editTask);
    });
  });

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
