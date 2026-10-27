"use strict";
/* Recommendation Engine — แยกจาก UI และข้อมูล */

/* ============================================================
   3. RECOMMENDATION ENGINE
   - Rule-based + qualitative tiers
   - ไม่มีตัวเลขคะแนนใด ๆ ส่งออกไปที่ UI
   ============================================================ */
const Engine = (() => {
  const rank = (tier) => TIERS.indexOf(tier);
  const atLeast = (tier, min) => rank(tier) >= rank(min);
  const tierFrom = (value, [ex, good, fair]) =>
    value >= ex ? "excellent" : value >= good ? "good" : value >= fair ? "fair" : "weak";

  // 3.1 แปลงสเปก → Traits (editorial assessment override สิ่งที่สเปกบอกไม่ได้)
  function deriveTraits(p) {
    const a = p.assess;
    const hz = p.display.hz;
    return {
      performance: a.performance,
      thermal: a.thermal,
      camera: a.camera,
      video: a.video,
      speakers: a.speakers,
      value: a.value,
      display: hz >= THRESHOLDS.refreshHz.excellent ? "excellent"
             : hz >= THRESHOLDS.refreshHz.good ? (p.display.nits >= THRESHOLDS.brightNits ? "excellent" : "good")
             : "fair",
      battery: a.batteryLife || tierFrom(p.battery.mah, THRESHOLDS.batteryMah),
      charging: tierFrom(p.charging.wired, THRESHOLDS.chargingW),
      software: tierFrom(p.updates.security, THRESHOLDS.securityYears),
      zoom: p.cameras.tele ? (p.cameras.tele.zoom >= THRESHOLDS.zoomExcellent ? "excellent" : "good") : "weak",
      ultrawide: p.cameras.ultrawide ? "good" : "weak",
    };
  }

  // 3.2 ข้อความเหตุผลต่อมิติ (pos = ผ่านเกณฑ์, neg = ไม่ผ่าน)
  const REASONS = {
    performance: { pos: (p) => `ชิป ${p.chipset} แรงพอสำหรับเกมและงานหนัก`, neg: () => "ประสิทธิภาพระดับกลาง เกมหนักอาจต้องลดกราฟิก" },
    thermal:     { pos: () => "ระบายความร้อนดี ใช้งานหนักนาน ๆ ยังลื่น", neg: () => "ใช้งานหนักต่อเนื่องอาจร้อนและช้าลง" },
    display:     { pos: (p) => `จอ ${p.display.size}" ${p.display.panel} ${p.display.hz}Hz ลื่นและสว่าง`, neg: (p) => `จอ ${p.display.hz}Hz ยังไม่ลื่นเท่าจอ 120Hz ขึ้นไป` },
    battery:     {
      pos: (p) => p.assess.batteryLife ? "แบตใช้งานได้ทั้งวันจากการจัดการพลังงานที่ดี" : `แบต ${fmtNum(p.battery.mah)} mAh ใช้งานได้ทั้งวันสบาย ๆ`,
      neg: () => "แบตระดับกลาง ใช้หนักอาจต้องชาร์จระหว่างวัน",
    },
    charging:    { pos: (p) => `ชาร์จเร็ว ${p.charging.wired}W`, neg: (p) => p.charging.wired == null ? `ชาร์จ: ${wiredText(p.charging)}` : `ชาร์จ ${p.charging.wired}W ค่อนข้างช้า` },
    camera:      { pos: (p) => `กล้องหลัก ${p.cameras.main} ให้ภาพดีและประมวลผลเก่ง`, neg: () => "คุณภาพกล้องพอใช้ ไม่ได้โดดเด่นในงบนี้" },
    video:       { pos: (p) => `ถ่ายวิดีโอได้ดี (${p.cameras.video})`, neg: () => "ความสามารถด้านวิดีโอค่อนข้างพื้นฐาน" },
    zoom:        {
      pos: (p) => `มีเลนส์เทเลโฟโต้ ${p.cameras.tele.desc} ซูมได้คมกว่าการครอปภาพ`,
      neg: (p) => p.cameras.tele ? `เลนส์ซูม ${p.cameras.tele.zoom}x ยังซูมไกลได้จำกัด` : "ไม่มีเลนส์ซูม (เทเลโฟโต้)",
    },
    ultrawide:   { pos: (p) => `มีกล้องมุมกว้าง ${p.cameras.ultrawide}`, neg: () => "ไม่มีกล้องมุมกว้าง" },
    software:    { pos: (p) => `อัปเดตความปลอดภัยนาน ${p.updates.security} ปี ใช้ได้ยาว`, neg: (p) => p.updates.security == null ? "ยังไม่พบข้อมูลยืนยันระยะเวลาอัปเดตความปลอดภัย" : `ระยะอัปเดตซอฟต์แวร์ค่อนข้างสั้น (${p.updates.security} ปี)` },
  };

  // 3.3 Lifestyle profiles: essential = ต้องผ่าน, preferred = ควรมี (เรียงตามความสำคัญ)
  const PROFILES = {
    camera: {
      label: "Camera", title: "เน้นกล้อง", desc: "ถ่ายรูป ถ่ายวิดีโอ ซูม มุมกว้าง",
      phrase: "ชอบถ่ายรูปและวิดีโอ",
      essential: { camera: "good" },
      preferred: [["camera", "excellent"], ["video", "good"], ["zoom", "good"], ["ultrawide", "good"], ["software", "good"]],
    },
    gaming: {
      label: "Gaming", title: "เน้นเล่นเกม", desc: "ชิปแรง จอลื่น เครื่องไม่ร้อนง่าย",
      phrase: "เน้นเล่นเกม",
      essential: { performance: "good" },
      preferred: [["performance", "excellent"], ["thermal", "good"], ["display", "good"], ["battery", "good"], ["charging", "good"]],
    },
    balanced: {
      label: "Balanced", title: "ใช้งานรอบด้าน", desc: "ถ่ายรูป เล่นโซเชียล ดูวิดีโอ ทำงาน — ทุกอย่างดีพอ",
      phrase: "ต้องการมือถือที่ใช้งานได้ดีรอบด้าน",
      essential: { performance: "fair", camera: "fair", battery: "fair" },
      preferred: [["performance", "good"], ["camera", "good"], ["battery", "good"], ["display", "good"], ["software", "good"]],
    },
  };

  // มิติที่ใช้ดูภาพรวมสำหรับ slot "สมดุล"
  const CORE_DIMENSIONS = ["performance", "camera", "battery", "display", "charging", "software", "speakers"];

  function combineProfiles(ids) {
    const essential = {};
    const preferred = new Map();
    for (const id of ids) {
      const pr = PROFILES[id];
      for (const [dim, min] of Object.entries(pr.essential)) {
        if (!essential[dim] || rank(min) > rank(essential[dim])) essential[dim] = min;
      }
      for (const [dim, min] of pr.preferred) {
        if (!preferred.has(dim) || rank(min) > rank(preferred.get(dim))) preferred.set(dim, min);
      }
    }
    return { essential, preferred: [...preferred.entries()] };
  }

  function variantInRange(phone, min, max) {
    return phone.variants
      .filter((v) => v.price >= min && v.price <= max)
      .sort((a, b) => a.price - b.price)[0] || null;
  }

  function evaluate(phone, variant, profile, overBudget) {
    const traits = deriveTraits(phone);
    const essentialFails = Object.entries(profile.essential).filter(([d, min]) => !atLeast(traits[d], min));
    const met = [], unmet = [];
    for (const [dim, min] of profile.preferred) (atLeast(traits[dim], min) ? met : unmet).push(dim);
    const coreTiers = CORE_DIMENSIONS.map((d) => traits[d]);
    return {
      phone, variant, traits, met, unmet, overBudget,
      essentialOk: essentialFails.length === 0,
      weakCount: coreTiers.filter((t) => t === "weak").length,
      fairCount: coreTiers.filter((t) => t === "fair").length,
    };
  }

  // 3.4 Slot comparators — เปรียบเทียบทีละเกณฑ์ (lexicographic) ไม่รวมเป็นคะแนน
  const byPrice = (a, b) => a.variant.price - b.variant.price;
  const COMPARATORS = {
    focused: (profile) => (a, b) => {
      if (b.met.length !== a.met.length) return b.met.length - a.met.length;
      for (const [dim] of profile.preferred) {
        const diff = rank(b.traits[dim]) - rank(a.traits[dim]);
        if (diff) return diff;
      }
      return byPrice(a, b);
    },
    balanced: () => (a, b) =>
      a.weakCount - b.weakCount || a.fairCount - b.fairCount || b.met.length - a.met.length || byPrice(a, b),
    value: () => (a, b) => rank(b.traits.value) - rank(a.traits.value) || byPrice(a, b),
  };

  function pick(pool, comparator, chosen) {
    // รุ่นที่ผ่านเกณฑ์หลักต้องมาก่อนรุ่นที่ผ่อนเกณฑ์เสมอ
    const sorted = pool.filter((e) => !chosen.includes(e))
      .sort((x, y) => (y.essentialOk - x.essentialOk) || comparator(x, y));
    if (!sorted.length) return null;
    // Diversity: ถ้าตัวแรกแบรนด์ซ้ำกับที่เลือกแล้ว และตัวถัดไปเท่ากันในเชิงเกณฑ์ ให้เลือกแบรนด์ใหม่
    const brands = chosen.map((e) => e.phone.brand);
    const [first, second] = sorted;
    if (second && brands.includes(first.phone.brand) && !brands.includes(second.phone.brand)) {
      const tie = comparator(first, { ...second, variant: first.variant }) === 0;
      if (tie) return second;
    }
    return first;
  }

  // 3.5 สร้างคำอธิบาย
  function lifestylePhrase(ids) {
    return ids.map((id) => PROFILES[id].phrase).join("และ");
  }

  function explain(ev, slot, ids, profile) {
    const p = ev.phone;
    const names = ids.map((id) => PROFILES[id].label).join(" + ");
    const phrase = lifestylePhrase(ids);
    const headline = {
      focused:  `เหมาะสำหรับคนที่${phrase}เป็นหลัก`,
      balanced: `เหมาะสำหรับคนที่${phrase} แต่ยังต้องการมือถือที่ใช้งานทั่วไปได้ดี เช่น ถ่ายรูป ดูวิดีโอ และโซเชียล`,
      value:    `เหมาะสำหรับคนที่ต้องการความคุ้มค่าในงบนี้ โดยยังตอบโจทย์ ${names}`,
      curated:  `เหมาะสำหรับคนที่${phrase}เป็นหลัก`,
    }[slot];
    const slotReason = {
      focused:  `ตอบโจทย์ ${names} ได้ครบหลายข้อในงบนี้`,
      balanced: "เมื่อดูภาพรวมทั้งกล้อง แบต จอ และประสิทธิภาพ แทบไม่มีจุดอ่อนชัดเจน",
      value:    `ราคาเริ่มต้นประมาณ ฿${fmtNum(ev.variant.price)} ประหยัดกว่าตัวเลือกอื่นที่ผ่านเกณฑ์`,
      curated:  `คัดมาสำหรับสาย ${names} ในงบนี้`,
    }[slot];

    const essentialDims = Object.keys(profile.essential).filter((d) => !ev.met.includes(d));
    const reasonDims = [...ev.met, ...essentialDims.filter((d) => atLeast(ev.traits[d], profile.essential[d]))];
    const why = [slotReason, ...reasonDims.slice(0, 3).map((d) => REASONS[d].pos(p))];

    const considerations = ev.unmet.slice(0, 2).map((d) => REASONS[d].neg(p));
    for (const c of p.cons) {
      if (considerations.length >= 2) break;
      considerations.push(c);
    }
    const flags = [];
    if (ev.overBudget) flags.push("เกินงบเล็กน้อย");
    if (!ev.essentialOk && slot !== "curated") flags.push("ผ่านเกณฑ์บางข้อ");
    return { headline, why, considerations, flags };
  }

  // 3.6 Public API
  function recommend(phones, budgetId, lifestyleIds) {
    const budget = BUDGETS.find((b) => b.id === budgetId);
    const ids = lifestyleIds.filter((id) => PROFILES[id]).slice(0, MAX_LIFESTYLES);
    if (!budget || !ids.length) return { items: [], notes: ["กรุณาเลือกงบและไลฟ์สไตล์"] };

    // รายการที่คัดเอง (data/lineups.js) มาก่อน — ใช้เมื่อเลือกไลฟ์สไตล์เดียว
    const curated = typeof LINEUPS !== "undefined" && ids.length === 1 && LINEUPS[budgetId]?.[ids[0]];
    if (curated) {
      const profile = combineProfiles(ids);
      const items = curated.map((entry) => applyLineupEntry(phones.find((p) => p.id === lineupId(entry)), entry))
        .filter(Boolean).map((p) => {
        const v = [...p.variants].sort((a, b) => a.price - b.price)[0];
        const ev = evaluate(p, v, profile, realPrice(p) > budget.max);
        return { slot: "curated", phone: p, variant: v, ...explain(ev, "curated", ids, profile) };
      }).sort((a, b) => realPrice(a.phone) - realPrice(b.phone)); // ราคาต่ำ → สูง
      return { items, notes: [], lifestyles: ids, budget };
    }

    const profile = combineProfiles(ids);
    const inBudget = [], over = [];
    for (const p of phones) {
      const v = variantInRange(p, budget.min, budget.max);
      if (v) { inBudget.push(evaluate(p, v, profile, false)); continue; }
      const ov = variantInRange(p, budget.max + 1, budget.max * OVER_BUDGET_TOLERANCE);
      if (ov) over.push(evaluate(p, ov, profile, true));
    }

    const notes = [];
    let pool = inBudget.filter((e) => e.essentialOk);
    if (pool.length < 3) {
      const extra = over.filter((e) => e.essentialOk);
      if (extra.length) notes.push("ในงบนี้มีตัวเลือกที่ตรงเกณฑ์ไม่มาก เราจึงรวมรุ่นที่เกินงบไม่เกิน 10% มาให้พิจารณา");
      pool = pool.concat(extra);
    }
    if (pool.length < 3) {
      const relaxed = inBudget.filter((e) => !e.essentialOk);
      if (relaxed.length) notes.push("บางรุ่นผ่านเกณฑ์ไม่ครบทุกข้อ เราระบุจุดที่ควรพิจารณาไว้ในการ์ดแล้ว");
      pool = pool.concat(relaxed);
    }

    const chosen = [], items = [];
    for (const slot of ["focused", "balanced", "value"]) {
      const ev = pick(pool, COMPARATORS[slot](profile), chosen);
      if (!ev) continue;
      chosen.push(ev);
      items.push({ slot, phone: ev.phone, variant: ev.variant, ...explain(ev, slot, ids, profile) });
    }
    if (items.length < 3) notes.push(`ในงบนี้เราพบรุ่นที่เหมาะสม ${items.length} รุ่น — เราเลือกแสดงเท่าที่เหมาะจริง แทนการเติมให้ครบ 3 รุ่น`);
    return { items, notes, lifestyles: ids, budget };
  }

  return { recommend, PROFILES, deriveTraits };
})();

const SLOT_LABELS = {
  focused: (ids) => `ตรงกับ ${ids.map((id) => Engine.PROFILES[id].label).join(" + ")} มากที่สุด`,
  balanced: () => "สมดุลกว่า",
  value: () => "คุ้มค่าในงบนี้",
  curated: (ids) => `ตัวเลือกสาย ${ids.map((id) => Engine.PROFILES[id].label).join(" + ")}`,
};
