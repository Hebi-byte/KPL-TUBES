// Fungsi-fungsi untuk handle autentikasi user (login, logout, cek sesi)
// Cek apakah user sudah login dengan melihat token di localStorage
function isLoggedIn() {
  return Boolean(localStorage.getItem('token'));
}

// Kalau belum login, paksa redirect ke halaman login
function requireLogin() {
  if (!isLoggedIn()) {
    window.location.href = '/login';
  }
}

// Kalau sudah login, langsung redirect ke dashboard (biar ga bisa balik ke halaman login)
function redirectIfAlreadyLogin() {
  if (isLoggedIn()) {
    window.location.href = '/dashboard';
  }
}

// Hapus token dan data user dari localStorage, lalu balik ke halaman login
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('taskflow_user');
  window.location.href = '/login';
}

// Setup semua interaksi di halaman form login
async function setupLoginHandler() {
  const form = document.getElementById('loginForm');
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  const message = document.getElementById('message');

  // Tombol show/hide password
  togglePassword?.addEventListener('click', () => {
    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';

    const formData = new FormData(form);
    const username = formData.get('username')?.trim();
    const password = formData.get('password')?.trim();

    if (!username || !password) {
      message.textContent = 'Username dan password wajib diisi.';
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Login gagal');

       // Login berhasil: simpan token & data user, lalu masuk ke dashboard
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('taskflow_user', JSON.stringify(result.data.user));
      window.location.href = '/dashboard';
    } catch (error) {
      message.textContent = error.message;
    }
  });
}

export { isLoggedIn, requireLogin, redirectIfAlreadyLogin, logout, setupLoginHandler };
