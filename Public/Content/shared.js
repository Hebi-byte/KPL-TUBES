// Elemen utama tempat semua halaman di-render
const appEl = document.getElementById('app');

// State global aplikasi — menyimpan semua data yang dipakai di seluruh halaman
const state = {
  projects: [],          // Daftar semua project
  tasks: [],             // Daftar task dari project yang aktif
  users: [],             // Daftar user/anggota
  statuses: [],        // Daftar status task (misal: todo, in progress, done)
  activeProjectId: null, // ID project yang sedang dibuka
  showCompleted: true,   // Filter: tampilkan task yang sudah selesai atau tidak

   // Hak akses user yang sedang login
   permissions: {
    roleName: 'read',         // Nama role user
    canManageProjects: false,  // Boleh edit/hapus project?
    canManageTasks: false,     // Boleh tambah/edit/hapus task?
    readOnly: true,            // Mode read-only (tidak bisa ubah apapun)
  },
  showCompleted: true, // Filter: tampilkan task yang sudah selesai atau tidak
  searchQuery: '', // Kata kunci pencarian task
};

export { appEl, state };
