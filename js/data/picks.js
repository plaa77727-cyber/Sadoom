"use strict";
/* Phones of the Month — เพิ่มเดือนใหม่ที่นี่
   - เพิ่มเดือนใหม่ = เพิ่ม object ใหม่ไว้บนสุดของ MONTHLY_PICKS
   - แต่ละรุ่นใส่: budget (ช่วงงบ), key (camera / gaming / balanced), phoneId (รหัสรุ่นใน phones.js)
   - ราคา ไฮไลต์ และลิงก์นายหน้า ดึงจาก lineups.js ของงบและสายนั้นให้อัตโนมัติ
   - "ตัวเลือกอื่นในหมวดนี้" คือรุ่นอื่นในสายเดียวกันของงบนั้น */
const MONTHLY_PICKS = [
  {
    month: "2026-09",
    title: "Recommended Phones — September 2026",
    intro: "มือถือแนะนำประจำเดือน คัดตามหมวดการใช้งาน พร้อมตัวเลือกเพิ่มเติมสำหรับเปรียบเทียบและประกอบการตัดสินใจ",
    picks: [
      { budget: "5k-10k",  key: "camera",   phoneId: "nothing-phone-3a" },
      { budget: "5k-10k",  key: "gaming",   phoneId: "iqoo-z11x-5g" },
      { budget: "5k-10k",  key: "balanced", phoneId: "samsung-galaxy-a17-5g" },
      { budget: "10k-20k", key: "camera",   phoneId: "xiaomi-17t" },
      { budget: "10k-20k", key: "gaming",   phoneId: "iqoo-neo-10" },
      { budget: "10k-20k", key: "balanced", phoneId: "samsung-galaxy-s25-fe" },
      { budget: "20k-35k", key: "camera",   phoneId: "vivo-x300-pro" },
      { budget: "20k-35k", key: "gaming",   phoneId: "iqoo-15" },
      { budget: "20k-35k", key: "balanced", phoneId: "xiaomi-17t-pro" },
      { budget: "35k-up",  key: "camera",   phoneId: "xiaomi-17-ultra" },
      { budget: "35k-up",  key: "gaming",   phoneId: "redmagic-11s-pro" },
      { budget: "35k-up",  key: "balanced", phoneId: "samsung-galaxy-s26-ultra" },
    ],
  },
];
