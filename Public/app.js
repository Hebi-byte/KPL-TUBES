import { renderSidebar, renderEmptyProject } from './Content/sidebar.js';
import { renderMain } from './Content/main.js';
import { renderTasks } from './Content/task.js';
import { state, appEl } from './Content/shared.js';
import { requireLogin, logout } from './Content/auth.js';
import { normalizeStatus } from './Content/utils.js';

requireLogin();

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      ...(options.headers || {}),
    },
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Request gagal');
  return result.data;
}

function getProjectIdFromPath() {
  const match = location.pathname.match(/^\/projects\/(\d+)/);
  return match ? Number(match[1]) : null;
}

function getFilteredTasks() {
  let tasks = state.tasks.filter((task) => Number(task.id_project) === Number(state.activeProjectId));
  const searchInput = document.getElementById('taskSearch');
  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';

  if (!state.showCompleted) {
    tasks = tasks.filter((task) => normalizeStatus(task.nama_status || task.status) !== 'completed');
  }

  if (keyword) {
    tasks = tasks.filter((task) => {
      return [task.judul_task, task.deskripsi_task, task.assignee, task.nama_status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }

  return tasks;
}

function getActiveProjectTotalTasks() {
  return state.tasks.filter((task) => Number(task.id_project) === Number(state.activeProjectId)).length;
}

function updateProjectTaskCount() {
  const badge = document.getElementById('taskCountBadge');
  if (!badge) return;

  const total = getActiveProjectTotalTasks();
  badge.innerHTML = `
    <span class="icon-task-count" aria-hidden="true"></span>
    ${total} Task${total === 1 ? '' : 's'}
  `;
}

function refreshTaskList() {
  const taskList = document.querySelector('.task-list');
  if (taskList) {
    taskList.innerHTML = renderTasks(getFilteredTasks());
    bindTaskActions();
  }
  updateProjectTaskCount();
}

function bindProjectLinks() {
  document.querySelectorAll('.project-link').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      state.activeProjectId = Number(link.dataset.projectId);
      history.pushState({}, '', `/projects/${state.activeProjectId}`);
      renderDashboard();
    });
  });
}

function bindSearch() {
  const input = document.getElementById('taskSearch');
  input?.addEventListener('input', refreshTaskList);
}

function bindTaskActions() {
  document.querySelectorAll('[data-delete-task]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = Number(button.dataset.deleteTask);
      try {
        await api(`/api/tasks/${id}`, { method: 'DELETE' });
        state.tasks = state.tasks.filter((task) => Number(task.id_task) !== id);
        refreshTaskList();
      } catch (error) {
        alert(error.message);
      }
    });
  });

  document.querySelectorAll('[data-complete-task]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = Number(button.dataset.completeTask);
      const completedStatus = state.statuses.find((status) => normalizeStatus(status.nama_status) === 'completed');
      const currentTask = state.tasks.find((task) => Number(task.id_task) === id);
      if (!currentTask || !completedStatus) return;

      try {
        const updated = await api(`/api/tasks/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...currentTask, id_status: completedStatus.id_status }),
        });
        state.tasks = state.tasks.map((task) => Number(task.id_task) === id ? updated : task);
        refreshTaskList();
      } catch (error) {
        alert(error.message);
      }
    });
  });
}

function openModal(title, bodyHtml) {
  const wrapper = document.createElement('div');
  wrapper.className = 'modal-backdrop';
  wrapper.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>${title}</h3>
        <button type="button" class="modal-close" aria-label="Close">×</button>
      </div>
      ${bodyHtml}
    </div>
  `;

  document.body.appendChild(wrapper);
  wrapper.querySelector('.modal-close').addEventListener('click', () => wrapper.remove());
  wrapper.addEventListener('click', (event) => {
    if (event.target === wrapper) wrapper.remove();
  });

  return wrapper;
}

function bindAddProject() {
  document.getElementById('addProjectBtn')?.addEventListener('click', () => {
    const modal = openModal('Add Project', `
      <form class="modal-form" id="projectForm">
        <label>Project name
          <input name="nama_project" type="text" placeholder="Project baru" required />
        </label>
        <label>Description
          <textarea name="deskripsi_project" rows="3" placeholder="Deskripsi singkat project"></textarea>
        </label>
        <label>Visibility
          <select name="tipe_project">
            <option>Public</option>
            <option>Private</option>
          </select>
        </label>
        <button class="login-btn" type="submit">Save Project</button>
      </form>
    `);

    modal.querySelector('#projectForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      try {
        const project = await api('/api/projects', {
          method: 'POST',
          body: JSON.stringify(Object.fromEntries(formData.entries())),
        });
        state.projects.push(project);
        state.activeProjectId = project.id_project;
        modal.remove();
        history.pushState({}, '', `/projects/${project.id_project}`);
        renderDashboard();
      } catch (error) {
        alert(error.message);
      }
    });
  });
}

function bindAddTask() {
  const openAddTask = () => {
    const userOptions = state.users.map((user) => `
      <option value="${user.id_user}">${user.nama_user || user.username}</option>
    `).join('');

    const statusOptions = state.statuses.map((status) => `
      <option value="${status.id_status}">${status.nama_status}</option>
    `).join('');

    const modal = openModal('Add Task', `
      <form class="modal-form" id="taskForm">
        <label>Task name
          <input name="judul_task" type="text" placeholder="Task baru" required />
        </label>
        <label>Description
          <textarea name="deskripsi_task" rows="3" placeholder="Deskripsi singkat"></textarea>
        </label>
        <label>Assignee
          <select name="id_user">${userOptions}</select>
        </label>
        <label>Status
          <select name="id_status">${statusOptions}</select>
        </label>
        <button class="login-btn" type="submit">Save Task</button>
      </form>
    `);

    modal.querySelector('#taskForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const payload = Object.fromEntries(formData.entries());
      payload.id_project = state.activeProjectId;

      try {
        const task = await api('/api/tasks', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        state.tasks.push(task);
        modal.remove();
        refreshTaskList();
      } catch (error) {
        alert(error.message);
      }
    });
  };

  document.getElementById('addTaskBtn')?.addEventListener('click', openAddTask);
  document.getElementById('mobileAddTaskBtn')?.addEventListener('click', openAddTask);
}

function bindToolbar() {
  document.getElementById('toggleCompletedBtn')?.addEventListener('click', () => {
    state.showCompleted = !state.showCompleted;
    document.getElementById('toggleCompletedBtn').classList.toggle('active', !state.showCompleted);
    refreshTaskList();
  });

  document.getElementById('sortTaskBtn')?.addEventListener('click', () => {
    state.tasks.sort((a, b) => String(a.judul_task || '').localeCompare(String(b.judul_task || '')));
    refreshTaskList();
  });
}

function bindButtons() {
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
  document.getElementById('mobileLogoutBtn')?.addEventListener('click', logout);
  bindAddProject();
  bindAddTask();
  bindToolbar();
}

async function loadData() {
  const [projects, tasks, users, statuses] = await Promise.all([
    api('/api/projects'),
    api('/api/tasks'),
    api('/api/users'),
    api('/api/statuses'),
  ]);

  state.projects = projects;
  state.tasks = tasks;
  state.users = users;
  state.statuses = statuses;
}

async function renderDashboard() {
  try {
    await loadData();

    if (state.projects.length === 0) {
      appEl.innerHTML = renderEmptyProject();
      bindButtons();
      return;
    }

    const pathProjectId = getProjectIdFromPath();
    const hasPathProject = state.projects.some((project) => Number(project.id_project) === Number(pathProjectId));
    state.activeProjectId = hasPathProject ? pathProjectId : (state.activeProjectId || state.projects[0].id_project);

    const activeProject = state.projects.find((project) => Number(project.id_project) === Number(state.activeProjectId));
    const activeTasks = getFilteredTasks();
    const totalTaskCount = getActiveProjectTotalTasks();

    appEl.innerHTML = `
      <div class="dashboard-shell">
        ${renderSidebar()}
        ${renderMain(activeProject, activeTasks, totalTaskCount)}
      </div>
    `;

    bindButtons();
    bindProjectLinks();
    bindSearch();
    bindTaskActions();
  } catch (error) {
    appEl.innerHTML = `
      <main class="main-content standalone-error">
        <div class="error-state">
          <h2>Gagal memuat dashboard</h2>
          <p>${error.message}</p>
          <button class="logout-btn" id="logoutBtn" type="button">Logout</button>
        </div>
      </main>
    `;
    bindButtons();
  }
}

window.addEventListener('popstate', renderDashboard);
renderDashboard();
