// =========================
// LOGIN PAGE
// =========================

const togglePassword = document.getElementById("togglePassword");

const password = document.getElementById("password");

if (togglePassword && password) {
  togglePassword.addEventListener("click", () => {
    const icon = togglePassword.querySelector("i");

    if (password.type === "password") {
      password.type = "text";

      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    } else {
      password.type = "password";

      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    }
  });
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    window.location.href = "dashboard.html";
  });
}

// =========================
// DASHBOARD PAGE
// =========================

const toolbarButtons = document.querySelectorAll(".toolbar-btn");

toolbarButtons.forEach((button) => {
  button.addEventListener("click", () => {
    button.style.transform = "scale(0.96)";

    setTimeout(() => {
      button.style.transform = "scale(1)";
    }, 150);
  });
});

const taskRows = document.querySelectorAll(".task-row");

taskRows.forEach((row) => {
  row.addEventListener("mouseenter", () => {
    row.style.transform = "translateY(-2px)";
  });

  row.addEventListener("mouseleave", () => {
    row.style.transform = "translateY(0)";
  });
});

// =========================
// STATUS BADGE SWITCHER
// =========================

const statusBadges =
  document.querySelectorAll('.status-badge');

statusBadges.forEach(badge => {

  badge.addEventListener('click', () => {

    // Completed → Pending
    if (badge.classList.contains('completed')) {

      badge.classList.remove('completed');

      badge.classList.add('pending');

      badge.textContent = 'Pending';

    }

    // Pending → In Progress
    else if (badge.classList.contains('pending')) {

      badge.classList.remove('pending');

      badge.classList.add('in-progress');

      badge.textContent = 'In Progress';

    }

    // In Progress → Completed
    else if (badge.classList.contains('in-progress')) {

      badge.classList.remove('in-progress');

      badge.classList.add('completed');

      badge.textContent = 'Completed';

    }

  });

});