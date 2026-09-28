"use strict";
/* Router + การจัดการคลิก — จุดเริ่มทำงานของเว็บ */

/* ============================================================
   8. ROUTER + EVENTS
   ============================================================ */
function parseRoute() {
  const raw = location.hash.replace(/^#/, "") || "/";
  const [path, qs] = raw.split("?");
  return { parts: path.split("/").filter(Boolean), query: new URLSearchParams(qs || "") };
}

function render({ keepScroll = false } = {}) {
  const { parts, query } = parseRoute();
  const [section, param] = parts;
  let html;
  switch (section) {
    case undefined: html = HomePage(); break;
    case "finder":
      if (query.get("budget")) {
        Finder.budget = BUDGETS.some((b) => b.id === query.get("budget")) ? query.get("budget") : null;
        Finder.lifestyles = (query.get("ls") || "").split(",").filter((id) => Engine.PROFILES[id]).slice(0, MAX_LIFESTYLES);
        Finder.step = Finder.budget ? 2 : 1;
        history.replaceState(null, "", "#/finder");
      }
      html = FinderPage();
      break;
    case "results": html = ResultsPage(query); break;
    case "phones": html = param ? PhoneDetailPage(param) : PhonesPage(query); break;
    case "compare": html = ComparePage(query); break;
    case "picks": html = PicksPage(param); break;
    case "guides": html = GuidesPage(); break;
    default: html = NotFoundPage();
  }
  document.getElementById("app").innerHTML = html;

  const trayHtml = CompareTray();
  document.getElementById("tray-root").innerHTML = trayHtml;
  document.body.classList.toggle("has-tray", !!trayHtml);

  const navKey = section || "";
  document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === navKey));
  document.getElementById("nav").classList.remove("open");
  if (!keepScroll) window.scrollTo(0, 0);
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const { action, id } = el.dataset;

  switch (action) {
    case "toggle-menu": {
      const nav = document.getElementById("nav");
      nav.classList.toggle("open");
      el.setAttribute("aria-expanded", nav.classList.contains("open"));
      return;
    }
    case "start-finder":
      Finder.step = 1; Finder.budget = null; Finder.lifestyles = [];
      return; // ปล่อยให้ลิงก์พาไป #/finder
    case "select-budget":
      Finder.budget = id; render({ keepScroll: true }); return;
    case "finder-next":
      if (Finder.budget) { Finder.step = 2; render(); } return;
    case "finder-back":
      Finder.step = 1; render(); return;
    case "toggle-lifestyle": {
      const on = Finder.lifestyles.includes(id);
      if (on) Finder.lifestyles = Finder.lifestyles.filter((x) => x !== id);
      else if (Finder.lifestyles.length >= MAX_LIFESTYLES) { toast(`เลือกได้สูงสุด ${MAX_LIFESTYLES} แบบ`); return; }
      else Finder.lifestyles.push(id);
      render({ keepScroll: true }); return;
    }
    case "finder-submit":
      if (Finder.budget && Finder.lifestyles.length) {
        location.hash = `#/results?budget=${Finder.budget}&ls=${Finder.lifestyles.join(",")}`;
      }
      return;
    case "toggle-compare": {
      const result = CompareStore.toggle(id);
      if (result === "full") toast(`เปรียบเทียบได้สูงสุด ${MAX_COMPARE} รุ่น`);
      else toast(result === "added" ? "เพิ่มเข้า Compare แล้ว" : "นำออกจาก Compare แล้ว");
      if (location.hash.startsWith("#/compare")) {
        history.replaceState(null, "", `#/compare?phones=${CompareStore.get().join(",")}`);
      }
      render({ keepScroll: true }); return;
    }
    case "clear-compare":
      CompareStore.clear(); render({ keepScroll: true }); return;
    case "filter-budget":
      location.hash = id === "all" ? "#/phones" : `#/phones?budget=${id}`; return;
  }
});

document.addEventListener("change", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  if (el.dataset.action === "add-compare" && el.value) {
    CompareStore.toggle(el.value);
    history.replaceState(null, "", `#/compare?phones=${CompareStore.get().join(",")}`);
    render({ keepScroll: true });
  }
  if (el.dataset.action === "diff-toggle") {
    showDiffOnly = el.checked;
    render({ keepScroll: true });
  }
});

window.addEventListener("hashchange", () => render());
document.getElementById("data-note").textContent =
  `ข้อมูลตัวอย่างเพื่อการพัฒนา · ราคาโดยประมาณ · อัปเดต ${fmtDate(DATA_UPDATED)} · กรุณาตรวจสอบกับแหล่งทางการก่อนซื้อ`;
render();
