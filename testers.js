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

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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

        return `
          <article class="tester-card">
            <div class="tester-avatar-wrap">
              <img class="tester-avatar" src="${tester.avatar}" alt="${name} avatar" loading="lazy">
              <span class="status-dot ${status.className}" aria-hidden="true"></span>
            </div>
            <div class="tester-meta">
              <h3 title="${name}">${name}</h3>
              <p class="tester-status ${status.className}">${status.label}</p>
              <p class="tester-updated">ID: ${tester.id}</p>
            </div>
          </article>
        `;
      })
      .join("");
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
