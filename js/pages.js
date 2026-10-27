"use strict";
/* หน้าต่าง ๆ ของเว็บ */

/* ============================================================
   7. PAGES
   ============================================================ */
const Finder = { step: 1, budget: null, lifestyles: [] };

function HomePage() {
  const latest = MONTHLY_PICKS[0];
  return `
    <section class="hero">
      <div class="container">
        <img class="hero-logo" src="images/sadoom-logo.webp" alt="SADOOM">
        <h1><span>Not the Most Expensive.</span><span>Just the Right One.</span></h1>
        <p>เลือกงบและการใช้งาน เราคัดรุ่นที่คุ้มมาให้ เรียงจากถูกไปแพง พร้อมเหตุผล — คุณตัดสินใจเอง</p>
        <div class="cta">
          <a class="btn btn-primary" href="#/finder" data-action="start-finder">Find My Phone</a>
          <a class="btn" href="#/picks">Phones of the Month</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head"><h2>How It Works</h2></div>
        <div class="steps">
          <div class="card"><h3><span class="step-num">STEP 1 —</span> เลือกงบประมาณ</h3><p class="small muted">กำหนดงบที่คุณต้องการ เพื่อค้นหามือถือที่เหมาะกับเงินในกระเป๋า</p></div>
          <div class="card"><h3><span class="step-num">STEP 2 —</span> เลือกสไตล์การใช้งาน</h3><p class="small muted">ไม่ว่าจะเน้นถ่ายภาพ เล่นเกม หรือใช้งานรอบด้าน เราจะช่วยคัดรุ่นที่ตรงกับความต้องการของคุณ</p></div>
          <div class="card"><h3><span class="step-num">STEP 3 —</span> เปรียบเทียบตัวเลือก</h3><p class="small muted">พบกับมือถือที่ผ่านการคัดเลือก พร้อมราคา จุดเด่น และข้อจำกัด เรียงตามราคาเพื่อให้คุณตัดสินใจได้ง่ายขึ้น โดยไม่มีการจัดอันดับหรือชี้นำว่ารุ่นไหนดีที่สุด</p></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head" style="display:flex;justify-content:space-between;align-items:end;gap:12px;flex-wrap:wrap">
          <div><h2>${esc(latest.title)}</h2><p class="muted small">${esc(latest.intro)}</p></div>
          <a class="btn btn-sm" href="#/picks">ดูทั้งหมด</a>
        </div>
        <p class="small" style="font-weight:600;margin-bottom:12px">งบ ${esc(BUDGETS[0].label)}</p>
        <div class="grid">${latest.picks.filter((pk) => pk.budget === BUDGETS[0].id).map(PickCard).join("")}</div>
      </div>
    </section>`;
}

function FinderPage() {
  const s = Finder;
  const stepper = `<div class="stepper" aria-hidden="true"><span class="done"></span><span class="${s.step === 2 ? "done" : ""}"></span></div>`;

  if (s.step === 1) {
    return `
      <div class="container"><div class="finder">
        ${stepper}
        <p class="small muted">ขั้นที่ 1 จาก 2</p>
        <h1>งบประมาณของคุณ</h1>
        <p class="muted" style="margin:6px 0 20px">เลือกช่วงราคาที่ต้องการ เพื่อจำกัดตัวเลือกให้เหมาะสม</p>
        <div class="options" role="group" aria-label="งบประมาณ">
          ${BUDGETS.map((b) => `
            <button class="option" data-action="select-budget" data-id="${b.id}" aria-pressed="${s.budget === b.id}">
              <span class="title num">${esc(b.label)}</span><span class="desc">${esc(b.hint)}</span>
            </button>`).join("")}
        </div>
        <div class="finder-actions">
          <a class="btn" href="#/">ยกเลิก</a>
          <button class="btn btn-primary" data-action="finder-next" ${s.budget ? "" : "disabled"}>ถัดไป</button>
        </div>
      </div></div>`;
  }

  const full = s.lifestyles.length >= MAX_LIFESTYLES;
  return `
    <div class="container"><div class="finder">
      ${stepper}
      <p class="small muted">ขั้นที่ 2 จาก 2 · งบ ${esc(BUDGETS.find((b) => b.id === s.budget).label)}</p>
      <h1>คุณใช้มือถือแบบไหน?</h1>
      <p class="muted" style="margin:6px 0 20px">${MAX_LIFESTYLES === 1 ? "เลือกแบบที่ตรงกับคุณที่สุด" : `เลือกได้ 1–${MAX_LIFESTYLES} แบบ (เลือกแล้ว ${s.lifestyles.length}/${MAX_LIFESTYLES})`}</p>
      <div class="options" role="group" aria-label="ไลฟ์สไตล์">
        ${Object.entries(Engine.PROFILES).map(([id, pr]) => {
          const on = s.lifestyles.includes(id);
          const disabled = MAX_LIFESTYLES > 1 && full && !on;
          return `
            <button class="option" data-action="toggle-lifestyle" data-id="${id}" aria-pressed="${on}" aria-disabled="${disabled}">
              <span class="title">${esc(pr.label)} — ${esc(pr.title)}</span><span class="desc">${esc(pr.desc)}</span>
            </button>`;
        }).join("")}
      </div>
      <div class="finder-actions">
        <button class="btn" data-action="finder-back">ย้อนกลับ</button>
        <button class="btn btn-primary" data-action="finder-submit" ${s.lifestyles.length ? "" : "disabled"}>ดูมือถือที่แนะนำ</button>
      </div>
    </div></div>`;
}

function ResultsPage(query) {
  const budgetId = query.get("budget");
  const ls = (query.get("ls") || "").split(",").filter(Boolean);
  const result = Engine.recommend(PHONES, budgetId, ls);
  if (!result.budget) {
    return `<div class="container section"><div class="notice">ยังไม่ได้เลือกงบหรือไลฟ์สไตล์ <a href="#/finder">เริ่มเลือกมือถือ</a></div></div>`;
  }
  const editHref = `#/finder?budget=${budgetId}&ls=${result.lifestyles.join(",")}`;
  return `
    <section class="section">
      <div class="container">
        <div class="section-head">
          <h1 style="font-size:26px">Phones Recommended for You</h1>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:12px">
            <span class="chip num">${esc(result.budget.label)}</span>
            ${result.lifestyles.map((id) => `<span class="chip">${esc(Engine.PROFILES[id].label)}</span>`).join("")}
            <a class="btn btn-sm btn-ghost" href="${editHref}">แก้ไขตัวเลือก</a>
          </div>
        </div>
        ${result.notes.map((n) => `<div class="notice" style="margin-bottom:12px">${esc(n)}</div>`).join("")}
        ${result.items.length
          ? `<p class="rec-count" style="margin-bottom:12px">แนะนำ ${result.items.length} รุ่น · เลื่อนลงเพื่อดูทีละรุ่น</p>
             <div class="rec-list">${result.items.map((i) => RecommendationCard(i, result.lifestyles)).join("")}</div>`
          : `<div class="notice">ยังไม่มีรุ่นที่เหมาะในงบนี้ ลองเปลี่ยนงบหรือไลฟ์สไตล์ดูนะครับ</div>`}
        <p class="note" style="margin-top:20px">
          แต่ละรุ่นมีจุดเด่นต่างกัน — ลำดับการแสดงไม่ใช่อันดับ และเราไม่ให้คะแนนมือถือ
          ราคาเป็นราคาโดยประมาณ ข้อมูลอัปเดต ${esc(fmtDate(DATA_UPDATED))}
        </p>
      </div>
    </section>`;
}

function PhonesPage(query) {
  const active = query.get("budget") || "all";
  const list = PHONES
    .filter((p) => active === "all" || budgetOf(realPrice(p))?.id === active || lineupHas(active, p.id))
    .sort((a, b) => realPrice(a) - realPrice(b));
  return `
    <section class="section">
      <div class="container">
        <div class="section-head"><h1 style="font-size:30px">Phones</h1><p class="muted">มือถือทั้งหมดในฐานข้อมูล (${PHONES.length} รุ่น)</p></div>
        <div class="filters" role="group" aria-label="กรองตามงบ">
          <button data-action="filter-budget" data-id="all" aria-pressed="${active === "all"}">ทั้งหมด</button>
          ${BUDGETS.map((b) => `<button data-action="filter-budget" data-id="${b.id}" aria-pressed="${active === b.id}">${esc(b.label)}</button>`).join("")}
        </div>
        <div class="grid">${list.map(PhoneTile).join("")}</div>
      </div>
    </section>`;
}

function PhoneDetailPage(id) {
  const p = getPhone(id);
  if (!p) return `<div class="container section"><div class="notice">ไม่พบมือถือรุ่นนี้ <a href="#/phones">กลับไปหน้ารายการ</a></div></div>`;
  const c = p.cameras;
  return `
    <div class="container">
      <div class="detail">
        <aside class="detail-aside card stack">
          ${PhoneImage(p, 260)}
          <h1 style="font-size:26px">${esc(fullName(p))}</h1>
          <div>
            <div class="list-title">ราคาโดยประมาณ</div>
            <div class="variants">${p.variants.map((v) => `<span class="chip num">${variantLabel(v)} · ${fmtPrice(v.price)}</span>`).join("")}</div>
            ${p.priceNote ? `<p class="price-note">${esc(p.priceNote)}</p>` : ""}
            <p class="note">อัปเดตราคา ${esc(fmtDate(p.updated.price))}</p>
          </div>
          ${WarningBox(p)}
          ${BuyButton(p, "")}
          ${CompareButton(p.id, "")}
        </aside>

        <div class="stack" style="gap:28px;display:flex;flex-direction:column">
          <section class="spec-section">
            <h2>Overview</h2>
            <p>${esc(p.summary)}</p>
            ${TipBox(p) ? `<div style="margin-top:12px">${TipBox(p)}</div>` : ""}
          </section>
          <section class="pc card">
            <div><div class="list-title">ข้อดี</div>${Bullets(p.pros, "pos")}</div>
            <div><div class="list-title">จุดที่ควรพิจารณา</div>${Bullets(p.cons, "neg")}</div>
          </section>
          <section class="pc card">
            <div><div class="list-title">เหมาะกับใคร</div>${Bullets(p.goodFor, "pos")}</div>
            <div><div class="list-title">ไม่เหมาะกับใคร</div>${Bullets(p.notFor, "neg")}</div>
          </section>
          <section class="spec-section"><h2>Performance</h2>
            ${SpecRows([["Chipset", p.chipset], ["RAM / Storage", p.variants.map(variantLabel).join(", ")], ["ฟีเจอร์เกม", p.gameFeatures]])}
          </section>
          <section class="spec-section"><h2>Display</h2>
            ${SpecRows([["ขนาด", `${p.display.size} นิ้ว`], ["ประเภทจอ", p.display.panel], ["ความละเอียด", p.display.res],
                        ["Refresh rate", `${p.display.hz}Hz`], ["ความสว่างสูงสุด", nitsText(p.display.nits)]])}
          </section>
          <section class="spec-section"><h2>Camera</h2>
            ${SpecRows([["กล้องหลัก", c.main], ["มุมกว้าง (Ultrawide)", c.ultrawide || "ไม่มี"],
                        ["เทเลโฟโต้", c.tele ? c.tele.desc : "ไม่มี"], ["กล้องหน้า", c.front], ["วิดีโอ", c.video]])}
          </section>
          <section class="spec-section"><h2>Battery</h2>
            ${SpecRows([["ความจุ", `${fmtNum(p.battery.mah)} mAh`], ["ชาร์จแบบสาย", wiredText(p.charging)],
                        ["ชาร์จไร้สาย", p.charging.wireless ? `${p.charging.wireless}W` : "ไม่รองรับ"]])}
          </section>
          <section class="spec-section"><h2>Software & Build</h2>
            ${SpecRows([["ระบบปฏิบัติการ", p.os], ["อัปเดตระบบ", updatesText(p.updates.os)], ["อัปเดตความปลอดภัย", updatesText(p.updates.security)],
                        ["กันน้ำกันฝุ่น", p.ip], ["น้ำหนัก", weightText(p.weight)], ["ลำโพงสเตอริโอ", stereoText(p.stereo)], ["วางจำหน่าย", p.release]])}
            <p class="note">ข้อมูลสเปกอัปเดต ${esc(fmtDate(p.updated.specs))} · ควรตรวจสอบกับแหล่งทางการอีกครั้ง</p>
          </section>
        </div>
      </div>
    </div>`;
}

function comparePhones(query) {
  const fromUrl = (query.get("phones") || "").split(",").filter(getPhone);
  if (fromUrl.length) CompareStore.set(fromUrl);
  return CompareStore.get().map(getPhone);
}

let showDiffOnly = false;
function ComparePage(query) {
  const phones = comparePhones(query);
  const available = PHONES.filter((p) => !phones.includes(p));
  const picker = phones.length < MAX_COMPARE ? `
    <label class="small" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <span class="muted">เพิ่มรุ่น</span>
      <select data-action="add-compare">
        <option value="">— เลือกมือถือ —</option>
        ${available.map((p) => `<option value="${esc(p.id)}">${esc(fullName(p))}</option>`).join("")}
      </select>
    </label>` : `<span class="small muted">เปรียบเทียบได้สูงสุด ${MAX_COMPARE} รุ่น</span>`;

  if (phones.length < 2) {
    return `
      <section class="section"><div class="container">
        <div class="section-head"><h1 style="font-size:30px">Compare</h1><p class="muted">เลือกมือถือ 2–3 รุ่นเพื่อเปรียบเทียบแบบตาราง</p></div>
        ${phones.length ? `<div class="notice" style="margin-bottom:16px">เลือกแล้ว: ${esc(fullName(phones[0]))} — เพิ่มอีกอย่างน้อย 1 รุ่น</div>` : ""}
        ${picker}
      </div></section>`;
  }

  const rows = [
    ["ราคาเริ่มต้น", (p) => `~${fmtPrice(minPrice(p))}`],
    ["Chipset", (p) => p.chipset],
    ["RAM / Storage", (p) => p.variants.map(variantLabel).join(", ")],
    ["จอ", (p) => `${p.display.size}" ${p.display.panel}`],
    ["Refresh rate", (p) => `${p.display.hz}Hz`],
    ["ความสว่าง", (p) => nitsText(p.display.nits)],
    ["แบตเตอรี่", (p) => `${fmtNum(p.battery.mah)} mAh`],
    ["ชาร์จ", (p) => `${wiredText(p.charging, true)}${p.charging.wireless ? ` · ไร้สาย ${p.charging.wireless}W` : ""}`],
    ["กล้องหลัก", (p) => p.cameras.main],
    ["มุมกว้าง", (p) => p.cameras.ultrawide || "—"],
    ["เทเลโฟโต้", (p) => (p.cameras.tele ? p.cameras.tele.desc : "—")],
    ["กล้องหน้า", (p) => p.cameras.front],
    ["วิดีโอ", (p) => p.cameras.video],
    ["ระบบ", (p) => p.os],
    ["อัปเดตความปลอดภัย", (p) => updatesText(p.updates.security)],
    ["กันน้ำ", (p) => p.ip],
    ["น้ำหนัก", (p) => weightText(p.weight)],
  ];
  const cols = `grid-template-columns: ${"minmax(0,1fr) ".repeat(phones.length)}`;

  const body = rows.map(([label, fn]) => {
    const values = phones.map(fn);
    const same = values.every((v) => v === values[0]);
    if (showDiffOnly && same) return "";
    return `<div class="cmp-row" data-cols>
      <div class="label">${esc(label)}</div>
      ${values.map((v) => `<div class="val num">${esc(v)}</div>`).join("")}
    </div>`;
  }).join("");

  return `
    <style>
      .cmp-row, .compare-head { ${cols}; }
    </style>
    <section class="section"><div class="container">
      <div class="section-head"><h1 style="font-size:30px">Compare</h1>
        <p class="muted">เปรียบเทียบข้อมูลแบบเป็นกลาง — เราไม่ตัดสินว่ารุ่นไหนชนะ</p></div>
      <div class="compare-tools">
        ${picker}
        <label class="small" style="display:flex;gap:8px;align-items:center;cursor:pointer">
          <input type="checkbox" data-action="diff-toggle" ${showDiffOnly ? "checked" : ""}> แสดงเฉพาะที่ต่างกัน
        </label>
      </div>
      <div class="compare-head">
        <div class="spacer"></div>
        ${phones.map((p) => `
          <div class="ph">
            ${PhoneImage(p, 90)}
            <a href="#/phones/${esc(p.id)}">${esc(fullName(p))}</a>
            <div><button class="btn btn-sm btn-ghost xs" data-action="toggle-compare" data-id="${esc(p.id)}">ลบออก</button></div>
          </div>`).join("")}
      </div>
      ${body || `<div class="notice" style="margin-top:12px">ทุกหัวข้อมีค่าเหมือนกัน</div>`}
      <p class="note" style="margin-top:16px">ราคาโดยประมาณ ข้อมูลอัปเดต ${esc(fmtDate(DATA_UPDATED))}</p>
    </div></section>`;
}

function PickCard(pick) {
  const list = lineupPhones(pick.budget, pick.key);
  const p = list.find((x) => x.id === pick.phoneId);
  const profile = Engine.PROFILES[pick.key];
  if (!p || !profile) return "";
  const v = [...p.variants].sort((x, y) => x.price - y.price)[0];
  const alts = list.filter((x) => x.id !== p.id);
  return `
    <article class="card pick">
      <div><div class="cat">${esc(profile.label)}</div><div class="xs muted">${esc(profile.title)} · ${esc(profile.desc)}</div></div>
      ${PhoneImage(p, 150)}
      <div>
        <h3 style="font-size:18px">${esc(fullName(p))}</h3>
        <div class="price num">~${fmtPrice(v.price)} <span class="muted small">(${variantLabel(v)})</span></div>
        ${p.priceNote ? `<div class="price-note">${esc(p.priceNote)}</div>` : ""}
      </div>
      ${WarningBox(p)}
      <p class="small">${esc(p.summary)}</p>
      ${alts.length ? `<p class="xs muted">ตัวเลือกเพิ่มเติมในหมวดนี้: ${alts.map((a) => `<a href="#/phones/${esc(a.id)}">${esc(fullName(a))}</a> (~${fmtPrice(realPrice(a))})`).join(", ")}</p>` : ""}
      ${BuyButton(p)}
      <div class="card-actions"><a class="btn btn-sm" href="#/phones/${esc(p.id)}">View Details</a>${CompareButton(p.id)}</div>
    </article>`;
}

function PicksPage(month) {
  const sorted = [...MONTHLY_PICKS].sort((a, b) => b.month.localeCompare(a.month));
  const current = month ? sorted.find((m) => m.month === month) : sorted[0];
  if (!current) return `<div class="container section"><div class="notice">ไม่พบข้อมูลเดือนนี้ <a href="#/picks">ดูเดือนล่าสุด</a></div></div>`;
  return `
    <section class="section"><div class="container">
      <div class="section-head">
        <p class="small muted">Phones of the Month</p>
        <h1 style="font-size:30px">${esc(current.title)}</h1>
        <p class="muted" style="margin-top:6px">${esc(current.intro)}</p>
        <p class="note">เป็นคำแนะนำตามหมวดการใช้งาน ไม่ใช่การให้คะแนนหรือจัดอันดับ — ราคาเป็นราคาโดยประมาณ ตรวจสอบกับร้านค้าก่อนซื้อ</p>
      </div>
      ${sorted.length > 1 ? `<div class="filters">${sorted.map((m) =>
        `<a class="chip" href="#/picks/${m.month}" ${m === current ? 'aria-current="page"' : ""}>${esc(fmtMonth(m.month))}</a>`).join("")}</div>` : ""}
      ${BUDGETS.map((b) => {
        const cards = current.picks.filter((pk) => pk.budget === b.id).map(PickCard).join("");
        return cards ? `<h2 style="font-size:20px;margin:28px 0 12px">งบ ${esc(b.label)}</h2><div class="grid">${cards}</div>` : "";
      }).join("")}
    </div></section>`;
}

function GuidesPage() {
  const guides = [
    ["RAM เท่าไหร่ถึงพอ?", "สำหรับ Android ปี 2026 RAM 8GB เพียงพอสำหรับคนทั่วไป ถ้าเล่นเกมหนักหรือเปิดแอปพร้อมกันเยอะ 12GB จะสบายกว่า ส่วน iPhone จัดการ RAM ได้ดีจึงไม่ต้องดูตัวเลขมาก"],
    ["mAh มากกว่า = แบตอึดกว่าเสมอไหม?", "ไม่เสมอไป ประสิทธิภาพของชิปและซอฟต์แวร์มีผลมาก มือถือที่แบตเล็กกว่าอาจใช้งานได้นานพอ ๆ กันถ้าจัดการพลังงานดี"],
    ["ทำไมระยะเวลาอัปเดตซอฟต์แวร์สำคัญ?", "อัปเดตความปลอดภัยช่วยปกป้องข้อมูลของคุณ ถ้าวางแผนใช้เครื่องนาน 4–6 ปี ควรเลือกรุ่นที่ได้อัปเดตนานพอ"],
  ];
  return `
    <section class="section"><div class="container" style="max-width:760px">
      <div class="section-head"><h1 style="font-size:30px">Guides</h1><p class="muted">ความรู้พื้นฐานช่วยตัดสินใจ (กำลังเพิ่มบทความ)</p></div>
      <div class="stack">${guides.map(([t, body]) => `
        <details class="card guide"><summary>${esc(t)}</summary><p class="muted">${esc(body)}</p></details>`).join("")}</div>
    </div></section>`;
}

function NotFoundPage() {
  return `<div class="container section"><div class="notice">ไม่พบหน้านี้ <a href="#/">กลับหน้าแรก</a></div></div>`;
}
