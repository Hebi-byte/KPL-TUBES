const appEl = document.getElementById('app');

const state = {
  projects: [],
  tasks: [],
  users: [],
  statuses: [],
  activeProjectId: null,
  showCompleted: true,
  permissions: {
    roleName: 'read',
    canManageProjects: false,
    canManageTasks: false,
    readOnly: true,
  },
};

export { appEl, state };
