// Fungsi untuk membuat tampilan HTML halaman login
function renderLogin() {
  return `
    <section class="login-container">
      <div class="login-card">
        <header class="login-header">
          <div class="login-mark">TF</div>
          <h1>TaskFlow</h1>
          <h2>Login</h2>
          <p>Manage your task with us!</p>
        </header>

        <form class="login-form" id="loginForm">
          <div class="input-group">
            <label for="username">Username</label>
            <input id="username" name="username" type="text" placeholder="admin" autocomplete="username" />
          </div>

          <div class="input-group">
            <label for="password">Password</label>
            <div class="password-wrapper">
              <input id="password" name="password" type="password" placeholder="admin" autocomplete="current-password" />
              <button id="togglePassword" type="button" aria-label="Tampilkan password">👁</button>
            </div>
          </div>

          <div class="form-options">
            <label class="remember-box">
              <input type="checkbox" checked />
              <span>Remember me</span>
            </label>
            <a href="#">Forgot password?</a>
          </div>

          <p class="login-message" id="message"></p>
          <button class="login-btn" type="submit">Log In</button>
        </form>
      </div>
    </section>
  `;
}

export { renderLogin };
