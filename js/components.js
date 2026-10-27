"use strict";
/* ชิ้นส่วน UI ที่ใช้ซ้ำ */

/* ============================================================
   6. COMPONENTS (ฟังก์ชันคืนค่า HTML string)
   ============================================================ */
function PhoneImage(p, height = 180) {
  // มีรูปจริง (field image) ใช้รูปจริง ไม่มีก็ใช้ภาพจำลองด้านล่าง
  if (p.image) {
    return `<div class="phone-img has-photo"><img src="${esc(p.image)}" alt="" loading="lazy" style="height:${height}px"></div>`;
  }
  // ภาพจำลอง (placeholder) — แทนที่ด้วยรูปจริงได้ภายหลังผ่าน field images
  const w = Math.round(height * 0.5);
  const light = ["#e6e2dc", "#d9dce1", "#b9c7d8"].includes(p.color);
  return `
    <div class="phone-img" aria-hidden="true">
      <svg width="${w}" height="${height}" viewBox="0 0 100 200">
        <rect x="4" y="2" width="92" height="196" rx="16" fill="${esc(p.color)}" stroke="rgba(0,0,0,.12)"/>
        <rect x="12" y="12" width="34" height="${p.cameras.tele ? 48 : 34}" rx="10" fill="rgba(0,0,0,.18)"/>
        <circle cx="29" cy="25" r="7" fill="rgba(0,0,0,.45)"/>
        ${p.cameras.ultrawide ? `<circle cx="29" cy="${p.cameras.tele ? 41 : 38}" r="5" fill="rgba(0,0,0,.4)"/>` : ""}
        ${p.cameras.tele ? '<circle cx="29" cy="54" r="4.5" fill="rgba(0,0,0,.4)"/>' : ""}
        <text x="50" y="176" text-anchor="middle" font-size="11" font-family="Inter, sans-serif" font-weight="600"
              fill="${light ? "rgba(0,0,0,.45)" : "rgba(255,255,255,.55)"}">${esc(p.brand)}</text>
      </svg>
    </div>`;
}

function KeySpecs(p) {
  const c = p.cameras;
  return `
    <ul class="keyspecs">
      <li><span class="k">ชิป</span><span>${esc(p.chipset)}</span></li>
      <li><span class="k">จอ</span><span class="num">${p.display.size}" ${esc(p.display.panel)} ${p.display.hz}Hz</span></li>
      <li><span class="k">แบต</span><span class="num">${fmtNum(p.battery.mah)} mAh · ${wiredText(p.charging, true)}</span></li>
      <li><span class="k">กล้อง</span><span>${esc(c.main)}${c.ultrawide ? " + UW " + esc(c.ultrawide) : ""}${c.tele ? " + Tele " + esc(c.tele.desc) : ""}</span></li>
    </ul>`;
}

function Bullets(items, kind = "") {
  return `<ul class="bullets ${kind}">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
}

function CompareButton(id, size = "btn-sm") {
  const on = CompareStore.has(id);
  return `<button class="btn ${size} ${on ? "is-on" : ""}" data-action="toggle-compare" data-id="${esc(id)}" aria-pressed="${on}">
    ${on ? "✓ อยู่ใน Compare" : "+ Compare"}</button>`;
}

function RecommendationCard(item, lifestyleIds) {
  const p = item.phone;
  return `
    <article class="card rec">
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <span class="badge badge-slot">${esc(SLOT_LABELS[item.slot](lifestyleIds))}</span>
        ${item.flags.map((f) => `<span class="badge badge-caution">${esc(f)}</span>`).join("")}
      </div>
      ${PhoneImage(p)}
      <div>
        <h3>${esc(fullName(p))}</h3>
        <div class="price num">~${fmtPrice(item.variant.price)} <span class="muted small">(${variantLabel(item.variant)})</span></div>
        ${p.priceNote ? `<div class="price-note">${esc(p.priceNote)}</div>` : ""}
      </div>
      ${WarningBox(p)}
      ${KeySpecs(p)}
      <p class="headline">${esc(item.headline)}</p>
      ${TipBox(p)}
      <div>
        <div class="list-title">ทำไมเราแนะนำรุ่นนี้</div>
        ${Bullets(item.why, "why")}
      </div>
      <div class="pc">
        <div><div class="list-title">ข้อดี</div>${Bullets(p.pros.slice(0, 2), "pos")}</div>
        <div><div class="list-title">ควรพิจารณา</div>${Bullets(item.considerations, "neg")}</div>
      </div>
      ${BuyButton(p)}
      <div class="card-actions">
        <a class="btn btn-sm btn-primary" href="#/phones/${esc(p.id)}">View Details</a>
        ${CompareButton(p.id)}
      </div>
    </article>`;
}

function PhoneTile(p) {
  return `
    <div class="card" style="display:flex;flex-direction:column;gap:12px">
      <a class="phone-tile" href="#/phones/${esc(p.id)}">
        ${PhoneImage(p, 110)}
        <div>
          <h3>${esc(fullName(p))}</h3>
          <div class="small muted">เริ่มต้น <span class="num">~${fmtPrice(minPrice(p))}</span></div>
          <div class="xs muted">${esc(p.chipset)}</div>
        </div>
      </a>
      <p class="small">${esc(p.summary)}</p>
      <div class="card-actions" style="margin-top:auto">
        <a class="btn btn-sm" href="#/phones/${esc(p.id)}">รายละเอียด</a>
        ${CompareButton(p.id)}
      </div>
    </div>`;
}

function SpecRows(rows) {
  return `<dl class="spec-rows">${rows
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd class="num">${esc(v)}</dd></div>`).join("")}</dl>`;
}

function CompareTray() {
  const ids = CompareStore.get();
  const onComparePage = location.hash.startsWith("#/compare");
  if (!ids.length || onComparePage) return "";
  const names = ids.map((id) => fullName(getPhone(id))).join(", ");
  return `
    <div class="tray" role="region" aria-label="รายการเปรียบเทียบ">
      <div class="container">
        <div style="min-width:0">
          <div class="small" style="font-weight:600">Compare (${ids.length}/${MAX_COMPARE})</div>
          <div class="tray-names muted">${esc(names)}</div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button class="btn btn-sm btn-ghost" data-action="clear-compare">ล้าง</button>
          <a class="btn btn-sm btn-primary" href="#/compare?phones=${ids.join(",")}">เปรียบเทียบ</a>
        </div>
      </div>
    </div>`;
}
