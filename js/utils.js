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
// ราคาจริงหลังโปร (dealPrice) ถ้าไม่มีใช้ราคาต่ำสุดปกติ
function realPrice(p) { return p.dealPrice ?? minPrice(p); }
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
// ตัวเลข = ปี, ข้อความ = แสดงตามนั้น (เช่น "4 เวอร์ชัน"), ว่าง = ยังไม่มีข้อมูล
function updatesText(v) { return v === null || v === undefined || v === "" ? "ไม่พบข้อมูลยืนยัน" : typeof v === "number" ? `${v} ปี` : v; }
function stereoText(v) { return v === true ? "มี" : v === false ? "ไม่มี" : "ไม่พบข้อมูลยืนยัน"; }
// ปุ่มซื้อ (ลิงก์นายหน้า) — แสดงเมื่อมี field buy
function BuyButton(p, size = "btn-sm") {
  if (!p.buy || !p.buy.url) return "";
  return `<a class="btn ${size} btn-buy" href="${esc(p.buy.url)}" target="_blank" rel="sponsored nofollow noopener">ดูราคาที่ ${esc(p.buy.store || "ร้านค้า")} ↗</a>`;
}
// ชาร์จแบบสาย: ตัวเลข = วัตต์, ไม่มีตัวเลขใช้ข้อความ note (เช่น Apple ไม่ระบุวัตต์)
function wiredText(c, short = false) { return c.wired != null ? `${c.wired}W` : short ? "ไม่ระบุวัตต์" : (c.note || "ไม่ระบุ"); }
function nitsText(n) { return n == null ? "ไม่พบข้อมูลยืนยัน" : `${fmtNum(n)} nits`; }
function weightText(w) { return w == null || w === "" ? "ไม่พบข้อมูลยืนยัน" : `${w} g`; }
// กล่องคำเตือน (ไฮไลต์เหลือง) และกล่องเกร็ดความรู้
function WarningBox(p) {
  if (!p.warning) return "";
  return `<div class="warn-box"><strong>⚠️ ${esc(p.warning.title)}</strong><ul>${p.warning.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`;
}
function TipBox(p) { return p.tip ? `<div class="tip-box">💡 ${esc(p.tip)}</div>` : ""; }
function variantLabel(v) { return `${v.ram ? v.ram + "GB / " : ""}${v.storage >= 1024 ? v.storage / 1024 + "TB" : v.storage + "GB"}`; }

let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}
