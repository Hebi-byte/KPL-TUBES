// Import modules from Content folder
import { renderSidebar, renderEmptyProject } from './Content/sidebar.js';
import { renderMain } from './Content/main.js';
import { renderTasks } from './Content/task.js';
import { state, appEl } from './Content/shared.js';
import { escapeHtml } from './Content/utils.js';


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

window.addEventListener("popstate");

