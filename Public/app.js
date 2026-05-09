const contentEl = document.getElementById("content");

const pageMap = {
  "/": "home",
  "/login": "login",
  "/register": "register",
  "/dashboard": "dashboard",
  "/projects": "projects"
};

// cache supaya halaman yang sudah pernah dibuka tidak fetch ulang
const pageCache = new Map();

async function loadPage(pathname, pushState = true) {
  const page = pageMap[pathname] || "home";
  const url = `/content/${page}.html`;

  try {
    contentEl.innerHTML = "<p>Loading...</p>";

    let html;

    if (pageCache.has(page)) {
      html = pageCache.get(page);
    } else {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Gagal load ${url}`);
      }

      html = await response.text();
      pageCache.set(page, html);
    }

    contentEl.innerHTML = html;

    if (pushState) {
      history.pushState({ page }, "", pathname);
    }

    setActiveNav(pathname);
  } catch (error) {
    contentEl.innerHTML = `
      <section class="card">
        <h2>Halaman gagal dimuat</h2>
        <p>${error.message}</p>
      </section>
    `;
  }
}

function setActiveNav(pathname) {
  document.querySelectorAll("nav a").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === pathname);
  });
}

document.querySelectorAll("nav a").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    const pathname = link.getAttribute("href");
    loadPage(pathname);
  });
});

window.addEventListener("popstate", () => {
  loadPage(location.pathname, false);
});

// load awal
loadPage(location.pathname, false);