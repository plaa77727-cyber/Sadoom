"use strict";
/* ฟังก์ชันช่วยทั่วไป */

/* ============================================================
   5. UTILS
   ============================================================ */
function getPhone(id) { return PHONES.find((p) => p.id === id) || null; }
function fullName(p) { return `${p.brand} ${p.model}`; }
function fmtNum(n) { return Number(n).toLocaleString("th-TH"); }
function fmtPrice(n) { return `฿${fmtNum(n)}`; }
function minPrice(p) { return Math.min(...p.variants.map((v) => v.price)); }
function fmtDate(iso) {
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}
function fmtMonth(ym) {
  const d = new Date(`${ym}-01`);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function budgetOf(price) { return BUDGETS.find((b) => price >= b.min && price <= b.max); }
function variantLabel(v) { return `${v.ram}GB / ${v.storage >= 1024 ? v.storage / 1024 + "TB" : v.storage + "GB"}`; }

let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}
