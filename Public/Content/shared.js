const appEl = document.getElementById('app');

const state = {
  projects: [],
  tasks: [],
  users: [],
  statuses: [],
  activeProjectId: null,
  showCompleted: true,
};

export { appEl, state };
