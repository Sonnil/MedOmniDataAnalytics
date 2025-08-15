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
  }

  // build / update nav
  function renderNav(routes) {
    const nav = $("#nav");
    if (!nav || !routes?.length) return;
    nav.innerHTML = "";

    routes.forEach(r => {
      // container for item + optional subnav
      const item = document.createElement('div');
      item.className = 'nav-item';

      // main link
      const a = document.createElement("a");
      a.href = `#/${r.id}`;
      a.setAttribute("data-route-id", r.id);
      a.className = 'nav-link';

      // dot or expander
      const dot = document.createElement('span');
      dot.className = 'dot';
      if (r.children && r.children.length) {
        dot.textContent = '+'; // show plus for expandable items
        dot.classList.add('expander');
        dot.setAttribute('role','button');
        dot.tabIndex = 0;
      } else {
        dot.style.width = '8px'; dot.style.height = '8px'; dot.style.borderRadius = '50%'; dot.style.background = 'var(--accent)';
      }

      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = r.title;

      a.appendChild(dot);
      a.appendChild(label);
      item.appendChild(a);

      // subnav (if any)
      if (r.children && r.children.length) {
        const sub = document.createElement('div');
        sub.className = 'subnav';
        sub.style.display = 'none';
        r.children.forEach(c => {
          const ca = document.createElement('a');
          ca.href = `#/${c.id}`;
          ca.setAttribute('data-route-id', c.id);
          ca.className = 'sub-link';
          ca.innerHTML = `<span class="dot" style="width:6px;height:6px;border-radius:50%;background:var(--muted)"></span><span class="label">${c.title}</span>`;
          sub.appendChild(ca);
        });
        item.appendChild(sub);

        // expander behavior: toggle this subnav and collapse others
        const toggle = (open) => {
          // close other subnavs and reset their expander icons
          [...nav.querySelectorAll('.nav-item')].forEach(it => {
            const s = it.querySelector('.subnav');
            const ex = it.querySelector('.expander');
            if (s && s !== sub) { s.style.display = 'none'; if (ex) ex.textContent = '+'; }
          });
          // toggle this one
          sub.style.display = (typeof open === 'boolean') ? (open ? 'block' : 'none') : (sub.style.display === 'none' ? 'block' : 'none');
          dot.textContent = sub.style.display === 'none' ? '+' : '−';
        };

        if (!dot._wired) {
          dot._wired = true;
          dot.addEventListener('click', (e) => { e.preventDefault(); toggle(); });
          dot.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
        }

        // collapse subnavs when main link is clicked (improve UX)
        if (!a._wired) {
          a._wired = true;
          a.addEventListener('click', () => {
            [...nav.querySelectorAll('.nav-item')].forEach(it => {
              const s = it.querySelector('.subnav');
              const ex = it.querySelector('.expander');
              if (s && s !== sub) { s.style.display = 'none'; if (ex) ex.textContent = '+'; }
            });
          });
        }
      } else {
        // when clicking a leaf, collapse all subnavs
        if (!a._wired) {
          a._wired = true;
          a.addEventListener('click', () => {
            [...nav.querySelectorAll('.nav-item')].forEach(it => {
              const s = it.querySelector('.subnav');
              const ex = it.querySelector('.expander');
              if (s) { s.style.display = 'none'; if (ex) ex.textContent = '+'; }
            });
          });
        }
      }

      nav.appendChild(item);
    });

    // ensure active link updated
    setActive(getCurrentRouteId());
  }

  function getCurrentRouteId() {
    return (location.hash.replace("#/", "") || (window.ROUTES?.[0]?.id) || "");
  }

  function setActive(routeId) {
    const nav = $("#nav");
    if (!nav) return;
    // collapse all and then open parent if needed
    [...nav.querySelectorAll('.subnav')].forEach(s => s.style.display = 'none');
    [...nav.children].forEach(item => {
      const link = item.querySelector('a[data-route-id]');
      const sub = item.querySelector('.subnav');
      // default inactive
      item.classList.remove('active');
      if (link && link.getAttribute('data-route-id') === routeId) {
        item.classList.add('active');
      }
      // check sub-links
      if (sub) {
        const subLinks = [...sub.querySelectorAll('a[data-route-id]')];
        const found = subLinks.find(sl => sl.getAttribute('data-route-id') === routeId);
        if (found) {
          // open this subnav and mark the child active
          sub.style.display = 'block';
          // set expander text to '−'
          const exp = item.querySelector('.expander'); if (exp) exp.textContent = '−';
          subLinks.forEach(sl => sl.classList.toggle('active', sl.getAttribute('data-route-id') === routeId));
        } else {
          // ensure sub-links inactive
          subLinks.forEach(sl => sl.classList.remove('active'));
        }
      }
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
      <button id="sideToggleBtn" class="btn side-toggle" type="button" aria-label="Toggle menu" aria-pressed="false">
        <span class="hamburger" aria-hidden="true">☰</span>
        <span class="btn-label">Menu</span>
      </button>
    `;
    aside.insertBefore(bar, aside.firstChild);
  }

  function updateToggleAria() {
    const btn = $("#sideToggleBtn");
    if (btn) btn.setAttribute("aria-pressed", getCollapsed() ? "true" : "false");
  }

  // Show "Menu" when expanded; only icon when collapsed
  function updateToggleLabel() {
    const app = $(".app");
    const btn = $("#sideToggleBtn");
    if (!btn || !app) return;
    const label = btn.querySelector(".btn-label");
    const collapsed = app.classList.contains("sidebar-collapsed");
    if (label) {
      label.style.display = collapsed ? "none" : "inline";
    }
  }

  function toggle(force) {
    const cur = getCollapsed();
    const next = (typeof force === "boolean") ? force : !cur;
    setCollapsed(next);
    applyCollapsedClass(next);
    updateToggleAria();
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
    attachHandlers();
  };

  window.updateActiveNav = function updateActiveNav() {
    setActive(getCurrentRouteId());
  };
})();
