function redirectIfAlreadyLogin() {
  if (localStorage.getItem("token")) {
    window.location.replace("/dashboard");
  }
}

function requireLogin() {
  if (!localStorage.getItem("token")) {
    window.location.replace("/login");
  }
}

function setupLoginHandler() {
  const form = document.getElementById("loginForm");
  const message = document.getElementById("message");

  if (!form) return;

  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      togglePassword.innerHTML = isPassword
        ? '<i class="fa-solid fa-eye"></i>'
        : '<i class="fa-solid fa-eye-slash"></i>';
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username")?.value.trim();
    const password = document.getElementById("password")?.value;

    if (!username || !password) {
      if (message) message.textContent = "Username dan password wajib diisi";
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (!response.ok) {
        if (message) message.textContent = result.message || "Login gagal";
        return;
      }

      localStorage.setItem("token", result.data.token);
      localStorage.setItem("user", JSON.stringify(result.data.user));

      window.location.replace("/dashboard");
    } catch (error) {
      if (message) message.textContent = "Terjadi kesalahan saat login";
    }
  });
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.replace("/login");
}

export {
  redirectIfAlreadyLogin,
  requireLogin,
  setupLoginHandler,
  logout
};
