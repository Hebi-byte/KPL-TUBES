function renderLogin() {
  return `

  <main class="login-container">

    <div class="login-card">

      <!-- Logo -->
      <div class="login-header">
        <h1>TaskFlow</h1>
        <h2>Login</h2>
        <p>Manage Your Task With Us!</p>
      </div>

      <!-- Form -->
      <form id="loginForm">

        <!-- Username -->
        <div class="input-group">
          <label>Username</label>

          <input
            type="text"
            id="username"
            placeholder="Masukkan Username Anda"
          >
        </div>

        <!-- Password -->
        <div class="input-group">

          <label>Password</label>

          <div class="password-wrapper">

            <input
              type="password"
              id="password"
              placeholder="Masukkan Password Anda"
            >

            <button type="button" id="togglePassword">
              <i class="fa-solid fa-eye-slash"></i>
            </button>

          </div>

        </div>

        <!-- Remember -->
        <div class="form-options">

          <div class="remember-box">
            <input type="checkbox" id="remember">
            <label for="remember">Remember me</label>
          </div>

          <a href="#">Forgot password?</a>

        </div>

        <!-- Login Button -->
        <button type="submit" class="login-btn">
          Log In
        </button>

      </form>

      <p id="message" class="login-message"></p>

    </div>

  </main>
  `;
}

export { renderLogin };