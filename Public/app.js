// Import fungsi autentikasi, state global, komponen UI, dan utility
import { requireLogin, logout } from "./Content/auth.js";
import { appEl, state } from "./Content/shared.js";
import { renderSidebar, renderEmptyProject } from "./Content/sidebar.js";
import { renderMain } from "./Content/main.js";
import { escapeHtml } from "./Content/utils.js";

// Konfigurasi endpoint API backend
const API = {
  projects: "/api/projects",
  tasks: "/api/tasks",
  // Di beberapa versi project route status bisa beda nama, jadi frontend coba dua endpoint ini.
  statusEndpoints: ["/api/statuses", "/api/status"],
};

// Mapping ID role ke nama role
const ROLE_BY_ID = {
  1: "owner",
  2: "read",
  3: "edit",
};

// Mengambil token login dari localStorage
function getToken() {
  return localStorage.getItem("token");
}

// Mengambil data user yang sedang login
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("taskflow_user") || "{}") || {};
  } catch (error) {
    return {};
  }
}

// Mengambil ID user yang sedang login
function getCurrentUserId() {
  const user = getCurrentUser();
  return Number(user.id_user || user.id || user.user_id || 0);
}

// Mengambil nama user yang sedang login
function getCurrentUserName() {
  const user = getCurrentUser();
  return user.nama_user || user.name || user.username || "User login";
}

// Menormalisasi nama role menjadi huruf kecil
function normalizeRoleName(value) {
  return String(value || "").trim().toLowerCase();
}

// Mengambil role user saat ini
function getCurrentRoleName() {
  const user = getCurrentUser();
  return normalizeRoleName(user.nama_role || user.role || ROLE_BY_ID[Number(user.id_role)]) || "read";
}

// Mengatur hak akses berdasarkan role user
function refreshPermissions() {
  const roleName = getCurrentRoleName();

  state.permissions = {
    roleName,
    canManageProjects: roleName === "owner",
    canManageTasks: roleName === "owner" || roleName === "edit",
    readOnly: roleName === "read",
  };

  return state.permissions;
}

// Mengecek apakah user boleh mengelola project
function canManageProjects() {
  return Boolean(refreshPermissions().canManageProjects);
}

function canManageTasks() {
  return Boolean(refreshPermissions().canManageTasks);
}

// Mengecek apakah user boleh mengelola task
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

// Wrapper fetch API yang otomatis menambahkan token Authorization
function getProjectIdFromUrl() {
  const match = window.location.pathname.match(/^\/projects\/(\d+)/);
  return match ? Number(match[1]) : null;
}

// Mengambil ID project dari URL browser
async function loadData() {
  refreshPermissions();

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

// Mengambil project yang sedang aktif
function getActiveProject() {
  return (
    state.projects.find(
      (project) => Number(project.id_project) === Number(state.activeProjectId)
    ) || null
  );
}

// Menormalisasi teks pencarian
function normalizeSearchText(value) {
  return String(value || "").toLowerCase().trim();
}

// Mengecek apakah task sesuai kata kunci pencarian
function taskMatchesSearch(task, keyword) {
  const query = normalizeSearchText(keyword);

  if (!query) return true;

  return [
    task.judul_task,
    task.nama_task,
    task.deskripsi_task,
    task.deskripsi,
    task.nama_project,
    task.nama_status,
    task.status,
    task.assignee,
    task.creator,
    task.due_date,
    task.created_at,
    task.updated_at,
  ].some((field) => normalizeSearchText(field).includes(query));
}

// Mengambil task pada project aktif
function getActiveTasks() {
  return state.tasks
    .filter((task) => Number(task.id_project) === Number(state.activeProjectId))
    .filter((task) => taskMatchesSearch(task, state.searchQuery));
}

// Menghitung jumlah task project aktif
function getActiveTaskCount() {
  return state.tasks.filter(
    (task) => Number(task.id_project) === Number(state.activeProjectId)
  ).length;
}

// Menormalisasi data status dari API
function normalizeStatusItem(status) {
  const id_status = Number(status.id_status || status.id || status.status_id || 0);
  const nama_status = String(
    status.nama_status || status.name || status.status || status.label || ""
  ).trim();

  if (!id_status || !nama_status) return null;

  return { id_status, nama_status };
}

// Menghilangkan data status duplikat
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

// Mengambil daftar status dari backend
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

// Membuat daftar status berdasarkan data task
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

// Mengambil status yang tersedia
function getAvailableStatuses() {
  const statuses = normalizeStatusList(state.statuses || []);
  return statuses.length > 0 ? statuses : buildStatusesFromTasks(state.tasks);
}

// Mencari task berdasarkan ID
function findTaskById(taskId) {
  return state.tasks.find((task) => Number(task.id_task) === Number(taskId)) || null;
}

// Mencari project berdasarkan ID
function findProjectById(projectId) {
  return state.projects.find((project) => Number(project.id_project) === Number(projectId)) || null;
}

// Menutup dropdown menu project
function closeProjectMenu() {
  const dropdown = document.getElementById("projectMenuDropdown");
  const button = document.getElementById("projectMenuBtn");

  if (dropdown) dropdown.hidden = true;
  if (button) button.setAttribute("aria-expanded", "false");
}

// Mengubah format tanggal menjadi datetime-local
function toDateTimeLocalValue(value) {
  if (!value) return "";

  const clean = String(value).trim().replace(" ", "T");
  const match = clean.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return match ? `${match[1]}T${match[2]}` : "";
}

// Menambahkan style CSS untuk tampilan task
function injectTaskTimeStyles() {
  if (document.getElementById("taskTimeStyle")) return;

  const style = document.createElement("style");
  style.id = "taskTimeStyle";
  style.textContent = `
    .table-header,
    .task-row {
      grid-template-columns: minmax(250px, 1fr) 175px 175px 190px 145px 72px;
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

    .task-readonly {
      color: var(--muted, #8d899a);
      font-size: 0.82rem;
      font-weight: 800;
      justify-content: center;
    }

    .check-circle:disabled {
      cursor: default;
      opacity: 0.55;
    }

    @media (max-width: 980px) {
      .table-header,
      .task-row {
        grid-template-columns: minmax(230px, 1fr) 155px 155px 160px 130px 68px;
      }
    }

    @media (max-width: 720px) {
      .table-header,
      .task-row {
        min-width: 1040px;
      }
    }
  `;
  document.head.appendChild(style);
}

// Menampilkan modal tambah project
function renderAddProjectModal(errorMessage = "") {
  if (!canManageProjects()) {
    alert("Role kamu tidak boleh menambah project.");
    return;
  }

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

// Menutup modal tambah projec
function closeAddProjectModal() {
  document.getElementById("addProjectModal")?.remove();
}

// Menyimpan project baru ke database
async function handleCreateProject(event) {
  event.preventDefault();

  if (!canManageProjects()) {
    closeAddProjectModal();
    alert("Role kamu tidak boleh menambah project.");
    return;
  }

  const form = event.currentTarget;
  const saveButton = document.getElementById("saveProjectBtn");
  const formData = new FormData(form);

  const nama_project = String(formData.get("nama_project") || "").trim();
  const deskripsi = String(formData.get("deskripsi") || "").trim();
  const created_by = getCurrentUserId();

  if (!nama_project || !created_by) return;

  try {
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    const result = await apiFetch(API.projects, {
      method: "POST",
      body: JSON.stringify({
        nama_project,
        deskripsi,
        created_by,
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

// Menampilkan modal edit project
function renderEditProjectModal(projectId = state.activeProjectId, errorMessage = "") {
  if (!canManageProjects()) {
    alert("Role kamu tidak boleh mengedit project.");
    return;
  }

  const project = findProjectById(projectId);

  if (!project) {
    alert("Project tidak ditemukan, coba refresh halaman dulu.");
    return;
  }

  closeProjectMenu();

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div class="modal-backdrop" id="editProjectModal" role="dialog" aria-modal="true" aria-labelledby="editProjectTitle">
      <form class="modal-card modal-form" id="editProjectForm" data-project-id="${escapeHtml(project.id_project || "")}">
        <div class="modal-header">
          <h3 id="editProjectTitle">Edit Project</h3>
          <button class="modal-close" id="closeEditProjectModal" type="button" aria-label="Close">×</button>
        </div>

        <label for="editProjectName">
          Project name
          <input
            id="editProjectName"
            name="nama_project"
            type="text"
            value="${escapeHtml(project.nama_project || "")}"
            required
            autofocus
          />
        </label>

        <label for="editProjectDescription">
          Description
          <textarea
            id="editProjectDescription"
            name="deskripsi"
            placeholder="Deskripsi singkat project"
            rows="4"
          >${escapeHtml(project.deskripsi || project.deskripsi_project || "")}</textarea>
        </label>

        ${errorMessage ? `<p class="login-message">${escapeHtml(errorMessage)}</p>` : ""}
        <div class="modal-actions">
          <button class="login-btn" id="updateProjectBtn" type="submit">Update Project</button>
          <button class="danger-btn" id="deleteProjectBtn" type="button">Delete Project</button>
        </div>
      </form>
    </div>
    `
  );

  document
    .getElementById("closeEditProjectModal")
    ?.addEventListener("click", closeEditProjectModal);

  document.getElementById("editProjectModal")?.addEventListener("click", (event) => {
    if (event.target.id === "editProjectModal") {
      closeEditProjectModal();
    }
  });

  document
    .getElementById("editProjectForm")
    ?.addEventListener("submit", handleUpdateProject);

  document
    .getElementById("deleteProjectBtn")
    ?.addEventListener("click", () => handleDeleteProject(project.id_project));
}

// Menutup modal edit project
function closeEditProjectModal() {
  document.getElementById("editProjectModal")?.remove();
}

// Mengupdate data project
async function handleUpdateProject(event) {
  event.preventDefault();

  if (!canManageProjects()) {
    closeEditProjectModal();
    alert("Role kamu tidak boleh mengedit project.");
    return;
  }

  const form = event.currentTarget;
  const projectId = Number(form.dataset.projectId);
  const updateButton = document.getElementById("updateProjectBtn");
  const formData = new FormData(form);

  const nama_project = String(formData.get("nama_project") || "").trim();
  const deskripsi = String(formData.get("deskripsi") || "").trim();
  const updated_by = getCurrentUserId();

  if (!projectId || !nama_project || !updated_by) {
    closeEditProjectModal();
    renderEditProjectModal(projectId, "Nama project dan user login wajib tersedia.");
    return;
  }

  try {
    updateButton.disabled = true;
    updateButton.textContent = "Updating...";

    await apiFetch(`${API.projects}/${projectId}`, {
      method: "PUT",
      body: JSON.stringify({ nama_project, deskripsi, updated_by }),
    });

    closeEditProjectModal();
    await loadData();
    renderApp();
  } catch (error) {
    closeEditProjectModal();
    renderEditProjectModal(projectId, error.message);
  }
}

// Menghapus project beserta task di dalamnya
async function handleDeleteProject(projectId = state.activeProjectId) {
  if (!canManageProjects()) {
    alert("Role kamu tidak boleh menghapus project.");
    return;
  }

  const project = findProjectById(projectId);
  const projectName = project?.nama_project || "project ini";
  const confirmed = window.confirm(
    `Hapus project "${projectName}"? Semua task yang ada di dalam project ini juga akan dihapus.`
  );

  if (!confirmed) return;

  try {
    await apiFetch(`${API.projects}/${projectId}`, {
      method: "DELETE",
      body: JSON.stringify({ deleted_by: getCurrentUserId() }),
    });

    closeEditProjectModal();
    closeProjectMenu();
    state.activeProjectId = null;
    history.pushState({}, "", "/dashboard");
    await loadData();
    state.activeProjectId = state.projects[0]?.id_project || null;
    history.replaceState(
      {},
      "",
      state.activeProjectId ? `/projects/${state.activeProjectId}` : "/dashboard"
    );
    renderApp();
  } catch (error) {
    alert(error.message);
  }
}

// Menampilkan modal tambah task
function renderAddTaskModal(errorMessage = "") {
  if (!canManageTasks()) {
    alert("Role kamu hanya bisa melihat, tidak boleh menambah task.");
    return;
  }

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
          Due date
          <input
            id="taskDueDate"
            name="due_date"
            type="datetime-local"
            required
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

// Menutup modal tambah task
function closeAddTaskModal() {
  document.getElementById("addTaskModal")?.remove();
}

// Menyimpan task baru ke database
async function handleCreateTask(event) {
  event.preventDefault();

  if (!canManageTasks()) {
    closeAddTaskModal();
    alert("Role kamu hanya bisa melihat, tidak boleh menambah task.");
    return;
  }

  const form = event.currentTarget;
  const saveButton = document.getElementById("saveTaskBtn");
  const formData = new FormData(form);

  const judul_task = String(formData.get("judul_task") || "").trim();
  const deskripsi_task = String(formData.get("deskripsi_task") || "").trim();
  const due_date = String(formData.get("due_date") || "").trim();
  const created_by = getCurrentUserId();
  const id_project = Number(state.activeProjectId);

  if (!judul_task || !due_date || !id_project || !created_by) {
    closeAddTaskModal();
    renderAddTaskModal("Task name, due date, project, dan user login wajib tersedia.");
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

// Membuat pilihan status pada form edit task
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

// Menampilkan modal edit task
function renderEditTaskModal(taskId, errorMessage = "") {
  if (!canManageTasks()) {
    alert("Role kamu hanya bisa melihat, tidak boleh mengedit task.");
    return;
  }

  const task = findTaskById(taskId);

  if (!task) {
    alert("Task tidak ditemukan, coba refresh halaman dulu.");
    return;
  }

  const title = task.judul_task || task.nama_task || "";
  const description = task.deskripsi_task || task.deskripsi || "";
  const dueDate = toDateTimeLocalValue(task.due_date);
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

        <label for="editTaskDueDate">
          Due date
          <input
            id="editTaskDueDate"
            name="due_date"
            type="datetime-local"
            value="${escapeHtml(dueDate)}"
            required
          />
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
        <div class="modal-actions">
          <button class="login-btn" id="updateTaskBtn" type="submit">Update Task</button>
          ${
            canManageProjects()
              ? '<button class="danger-btn" id="deleteTaskBtn" type="button">Delete Task</button>'
              : ''
          }
        </div>
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

  document
    .getElementById("deleteTaskBtn")
    ?.addEventListener("click", () => handleDeleteTask(task.id_task));
}

// Menutup modal edit task
function closeEditTaskModal() {
  document.getElementById("editTaskModal")?.remove();
}

// Mengupdate data task
async function handleUpdateTask(event) {
  event.preventDefault();

  if (!canManageTasks()) {
    closeEditTaskModal();
    alert("Role kamu hanya bisa melihat, tidak boleh mengedit task.");
    return;
  }

  const form = event.currentTarget;
  const taskId = Number(form.dataset.taskId);
  const updateButton = document.getElementById("updateTaskBtn");
  const formData = new FormData(form);

  const judul_task = String(formData.get("judul_task") || "").trim();
  const deskripsi_task = String(formData.get("deskripsi_task") || "").trim();
  const due_date = String(formData.get("due_date") || "").trim();
  const id_status = Number(formData.get("id_status"));
  const updated_by = getCurrentUserId();

  if (!taskId || !judul_task || !due_date || !id_status || !updated_by) {
    closeEditTaskModal();
    renderEditTaskModal(taskId, "Nama task, due date, status, dan user login wajib tersedia.");
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
        due_date,
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

// Menghapus task
async function handleDeleteTask(taskId) {
  if (!canManageProjects()) {
    alert("Hanya owner yang boleh menghapus task.");
    return;
  }

  const task = findTaskById(taskId);
  const taskName = task?.judul_task || task?.nama_task || "task ini";
  const confirmed = window.confirm(`Hapus task "${taskName}"?`);

  if (!confirmed) return;

  try {
    await apiFetch(`${API.tasks}/${taskId}`, {
      method: "DELETE",
      body: JSON.stringify({ deleted_by: getCurrentUserId() }),
    });

    closeEditTaskModal();
    await loadData();
    renderApp();
  } catch (error) {
    alert(error.message);
  }
}

// Merender seluruh tampilan dashboard
function renderApp() {
  refreshPermissions();
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
        ${renderMain(activeProject, activeTasks, getActiveTaskCount())}
      </div>
    `;
  }

  bindEvents();
}

// Mendaftarkan seluruh event listener tombol dan input
function bindEvents() {
  document.querySelectorAll(".project-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      state.activeProjectId = Number(link.dataset.projectId);
      history.pushState({}, "", `/projects/${state.activeProjectId}`);
      renderApp();
    });
  });
  document.getElementById("taskSearch")?.addEventListener("input", (event) => {
    state.searchQuery = event.target.value;
    renderApp();

    const searchInput = document.getElementById("taskSearch");
    const cursorPosition = state.searchQuery.length;

    if (searchInput) {
      searchInput.focus();
      try {
        searchInput.setSelectionRange(cursorPosition, cursorPosition);
      } catch (error) {
        // Tidak masalah kalau browser tidak mendukung setSelectionRange untuk input search.
      }
    }
  });

  document.getElementById("projectMenuBtn")?.addEventListener("click", (event) => {
    event.stopPropagation();
    const dropdown = document.getElementById("projectMenuDropdown");
    const button = event.currentTarget;

    if (!dropdown) return;

    dropdown.hidden = !dropdown.hidden;
    button.setAttribute("aria-expanded", String(!dropdown.hidden));
  });

  document
    .getElementById("editProjectMenuBtn")
    ?.addEventListener("click", () => renderEditProjectModal(state.activeProjectId));

  document
    .getElementById("deleteProjectMenuBtn")
    ?.addEventListener("click", () => handleDeleteProject(state.activeProjectId));

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

// Inisialisasi aplikasi saat pertama kali dibuka
async function init() {
  requireLogin();
  refreshPermissions();
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

// Menangani tombol back/forward browser
window.addEventListener("popstate", () => {
  state.activeProjectId = getProjectIdFromUrl() || state.projects[0]?.id_project || null;
  renderApp();
});

// Menjalankan aplikasi
init();
