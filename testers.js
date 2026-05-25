document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.endsWith("/testers.html")) {
    history.replaceState({}, "", "/testers");
  }

  const testersGrid = document.getElementById("testersGrid");
  const onlineCountEl = document.getElementById("onlineCount");
  const totalCountEl = document.getElementById("totalCount");
  const searchInput = document.getElementById("testerSearchInput");

  const STATUS_CONFIG = {
    online: { label: "Online", className: "online" },
    idle: { label: "Idle", className: "idle" },
    dnd: { label: "Do Not Disturb", className: "dnd" },
    offline: { label: "Offline", className: "offline" }
  };

  let allTesters = [];

  function setupMobileMenu() {
    const toggle = document.getElementById("mobileMenuToggle");
    const drawer = document.getElementById("mobileNav");
    const backdrop = document.getElementById("mobileNavBackdrop");
    const closeBtn = document.getElementById("mobileNavClose");

    if (!toggle || !drawer || !backdrop) return;

    const closeMenu = () => {
      drawer.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
      backdrop.hidden = true;
      document.body.classList.remove("mobile-menu-open");
    };

    const openMenu = () => {
      drawer.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
      backdrop.hidden = false;
      document.body.classList.add("mobile-menu-open");
    };

    toggle.addEventListener("click", () => {
      if (drawer.classList.contains("is-open")) {
        closeMenu();
        return;
      }
      openMenu();
    });

    closeBtn?.addEventListener("click", closeMenu);
    backdrop.addEventListener("click", closeMenu);
    drawer.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function createFallbackAvatar(name) {
    const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'>
<defs>
<linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
<stop offset='0%' stop-color='%23172435'/>
<stop offset='50%' stop-color='%230a111b'/>
<stop offset='100%' stop-color='%232c2142'/>
</linearGradient>
</defs>
<rect width='96' height='96' rx='12' fill='url(%23bg)'/>
<rect x='1' y='1' width='94' height='94' rx='11' fill='none' stroke='%2367dcff' stroke-opacity='.38'/>
<text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' fill='%23f4f7fb' font-family='Inter,Arial,sans-serif' font-size='42' font-weight='800'>${initial}</text>
</svg>`;

    return `data:image/svg+xml;utf8,${svg}`;
  }

  function hydrateAvatarFallbacks() {
    testersGrid.querySelectorAll(".tester-avatar").forEach((avatar) => {
      avatar.addEventListener("error", () => {
        avatar.onerror = null;
        avatar.src = createFallbackAvatar(avatar.dataset.fallbackName || "?");
      }, { once: true });
    });
  }

  function getStatusInfo(status) {
    return STATUS_CONFIG[status] || { label: "Offline", className: "offline" };
  }

  function sortTesters(testers) {
    const order = { online: 0, idle: 1, dnd: 2, offline: 3 };
    return [...testers].sort((a, b) => {
      const statusDiff = (order[a.status] ?? 99) - (order[b.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;
      return a.name.localeCompare(b.name);
    });
  }

  function render(testers) {
    if (!testers.length) {
      testersGrid.innerHTML = '<p class="testers-empty">No testers found.</p>';
      return;
    }

    testersGrid.innerHTML = sortTesters(testers)
      .map((tester) => {
        const status = getStatusInfo(tester.status);
        const name = escapeHtml(tester.name);
        const avatar = escapeHtml(tester.avatar || createFallbackAvatar(tester.name));

        return `
          <article class="tester-card">
            <div class="tester-avatar-wrap">
              <img class="tester-avatar" src="${avatar}" data-fallback-name="${name}" alt="${name} avatar" loading="lazy">
              <span class="status-dot ${status.className}" aria-hidden="true"></span>
            </div>
            <div class="tester-meta">
              <h3 title="${name}">${name}</h3>
              <p class="tester-status ${status.className}">${status.label}</p>
              <p class="tester-updated">Updated: ${new Date().toLocaleTimeString()}</p>
            </div>
          </article>
        `;
      })
      .join("");

    hydrateAvatarFallbacks();
  }

  function updateCounts(testers) {
    const onlineCount = testers.filter((tester) => ["online", "idle", "dnd"].includes(tester.status)).length;
    onlineCountEl.textContent = `${onlineCount} Online`;
    totalCountEl.textContent = String(testers.length);
  }

  function applyFilter() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      render(allTesters);
      return;
    }

    const filtered = allTesters.filter((tester) => tester.name.toLowerCase().includes(query));
    render(filtered);
  }

  setupMobileMenu();

  fetch("/testers_status.json")
    .then((response) => {
      if (!response.ok) throw new Error("Failed to load testers status data.");
      return response.json();
    })
    .then((data) => {
      allTesters = Array.isArray(data.testers) ? data.testers : [];
      updateCounts(allTesters);
      render(allTesters);
    })
    .catch(() => {
      testersGrid.innerHTML = '<p class="testers-empty">Could not load testers right now.</p>';
    });

  searchInput.addEventListener("input", applyFilter);
});
