/* menu.js — Collapsible sidebar + nav rendering (button lives in sidebar) */
(function () {
  const STORAGE_KEY = "sidebarCollapsed";

  // tiny helper
  function $(sel, root = document) { return root.querySelector(sel); }

  // state
  function getCollapsed() {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
  }
  function setCollapsed(v) {
    try { localStorage.setItem(STORAGE_KEY, v ? "1" : "0"); } catch {}
  }

  // layout
  function applyCollapsedClass(collapsed) {
    const app = $(".app");
    if (!app) return;
    app.classList.toggle("sidebar-collapsed", !!collapsed);
    updateToggleLabel();
    // Update nav and dots visibility based on collapsed state
    const nav = $("#nav");
    if (nav) {
      // Let CSS handle visibility/opacity via the .sidebar-collapsed class.
      nav.classList.toggle('sidebar-collapsed', !!collapsed);
      nav.querySelectorAll('.dot').forEach(dot => {
        dot.classList.toggle('hidden-during-collapse', !!collapsed);
      });
    }
  }

  // build / update nav (supports icons and parent/submenu via route.parent)
  function renderNav(routes) {
    const nav = $("#nav");
    if (!nav || !routes?.length) return;
    nav.innerHTML = "";

    // Build parent -> children map for routes that declare a parent
    const childrenMap = {};
    routes.forEach(r => { if (r.parent) { (childrenMap[r.parent] = childrenMap[r.parent] || []).push(r); } });

    // Keep expanded state per parent id
    if (!window.__menuExpandedMap) window.__menuExpandedMap = {};

    // Helper to render a single top-level route (may have children)
    function renderTopRoute(r) {
      const a = document.createElement('a');
      a.href = `#/${r.id}`;
      a.setAttribute('data-route-id', r.id);
      a.classList.add('menu-item');

      const cleanTitle = (r.title || '').replace(/^\d+\)?\s*/, '');

      const iconHtml = r.icon ? `<span class="menu-icon" aria-hidden="true">${r.icon}</span>` : `<span class="dot" style="width:8px;height:8px;border-radius:50%;background:var(--accent)"></span>`;

      const kids = childrenMap[r.id] || [];
      if (kids.length) {
        const expanded = !!window.__menuExpandedMap[r.id] || kids.some(k => location.hash.replace('#/','') === k.id);
        const expand = `<span class="expand-icon" style="margin-right:8px;user-select:none;cursor:pointer;display:inline-block;width:16px;text-align:center;">${expanded ? '\u2212' : '+'}</span>`;
        a.innerHTML = `${expand}${iconHtml}<span class="label">${cleanTitle}</span>`;

        // expand/collapse control
        a.querySelector('.expand-icon').addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation();
          window.__menuExpandedMap[r.id] = !expanded;
          renderNav(routes);
        });

        // if anchor clicked (not expand), collapse others
        a.addEventListener('click', (e) => {
          if (!e.target.classList.contains('expand-icon')) {
            window.__menuExpandedMap[r.id] = false;
            renderNav(routes);
          }
        });

        nav.appendChild(a);

        if (expanded) {
          kids.forEach(k => {
            const subA = document.createElement('a');
            subA.href = `#/${k.id}`;
            subA.setAttribute('data-route-id', k.id);
            subA.className = 'submenu menu-item';
            subA.style.paddingLeft = '32px';
            subA.style.opacity = '0';
            subA.style.transform = 'translateX(-10px)';
            subA.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            requestAnimationFrame(() => { subA.style.opacity = '1'; subA.style.transform = 'translateX(0)'; });
            const subTitle = (k.title||'').replace(/^[0-9]+[a-zA-Z]?\)?\s*/, '');
            const subIconHtml = k.icon ? `<span class="menu-icon" aria-hidden="true">${k.icon}</span>` : `<span class="dot" style="width:8px;height:8px;border-radius:50%;background:var(--accent)"></span>`;
            subA.innerHTML = `${subIconHtml}<span class="label">${subTitle}</span>`;
            nav.appendChild(subA);
          });
        }
        return;
      }

      // no children
      a.innerHTML = `${iconHtml}<span class="label">${cleanTitle}</span>`;
      a.addEventListener('click', () => { /* collapse any open parents when navigating to unrelated top-level */ });
      nav.appendChild(a);
    }

    // Render top-level routes (those without parent)
    routes.filter(r => !r.parent).forEach(r => renderTopRoute(r));

    // update nav visibility based on collapsed state
    const app = document.querySelector('.app');
    const collapsed = app && app.classList.contains('sidebar-collapsed');
    nav.classList.toggle('sidebar-collapsed', !!collapsed);
    nav.querySelectorAll('.dot').forEach(dot => dot.classList.toggle('hidden-during-collapse', !!collapsed));
    setActive(getCurrentRouteId());
  }

  function getCurrentRouteId() {
    return (location.hash.replace("#/", "") || (window.ROUTES?.[0]?.id) || "");
  }

  function setActive(routeId) {
    const nav = $("#nav");
    if (!nav) return;
    [...nav.children].forEach(a => {
      a.classList.toggle("active", a.getAttribute("href") === "#/" + routeId);
    });
  }

  // Sidebar toggle button INSIDE the sidebar
  function ensureSidebarToggle() {
    if ($("#sideToggleBtn")) return;
    const aside = document.querySelector("aside");
    if (!aside) return;

    // Insert a small header row with the button
    const bar = document.createElement("div");
    bar.className = "sidebar-top";
    bar.innerHTML = `
      <button id="sideToggleBtn" class="btn side-toggle" type="button" aria-label="Toggle menu" aria-pressed="false" aria-expanded="false" aria-controls="nav">
        <span class="hamburger" aria-hidden="true">☰</span>
        <span class="btn-label">Menu</span>
      </button>
    `;
    aside.insertBefore(bar, aside.firstChild);

    const handleToggle = (collapsed) => {
      setCollapsed(collapsed);
      applyCollapsedClass(collapsed);
      updateToggleAria();
      updateToggleExpandedAttr();
    };

  // Hover behavior removed: menu toggles only via click on the hamburger
  }

  function updateToggleAria() {
    const btn = $("#sideToggleBtn");
    if (btn) btn.setAttribute("aria-pressed", getCollapsed() ? "true" : "false");
  }

  function updateToggleExpandedAttr(){
    const btn = $("#sideToggleBtn");
    if (!btn) return;
    // aria-expanded = true when menu is expanded (not collapsed)
    btn.setAttribute('aria-expanded', getCollapsed() ? 'false' : 'true');
  }

  // Show "Menu" when expanded; only icon when collapsed
  function updateToggleLabel() {
    // Intentionally empty: CSS handles showing/hiding the .btn-label based on .sidebar-collapsed.
    // Kept for API compatibility if future JS-driven toggling is required.
  }

  function toggle(force) {
    const cur = getCollapsed();
    const next = (typeof force === "boolean") ? force : !cur;
    setCollapsed(next);
    applyCollapsedClass(next);
  updateToggleAria();
  updateToggleExpandedAttr();
  }

  // wire events
  function attachHandlers() {
    ensureSidebarToggle();
    const btn = $("#sideToggleBtn");
    if (btn && !btn._wired) {
      btn._wired = true;
      btn.addEventListener("click", () => toggle());
    }

    // keep active item synced on navigation
    window.addEventListener("hashchange", () => setActive(getCurrentRouteId()));

    // Keyboard shortcut "m" to toggle
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "m" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        toggle();
      }
    });
  }

  // Public API
  window.setupNav = function setupNav() {
    ensureSidebarToggle();
    renderNav(window.ROUTES || []);
    applyCollapsedClass(getCollapsed());
  updateToggleAria();
  updateToggleExpandedAttr();
    attachHandlers();
  };

  window.updateActiveNav = function updateActiveNav() {
    setActive(getCurrentRouteId());
  };
})();
