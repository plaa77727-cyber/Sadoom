"use strict";
/* ค่าตั้งต้นของระบบ: ช่วงงบ, เกณฑ์แปลงสเปก */

/* ============================================================
   1. CONFIG
   ============================================================ */
const DATA_UPDATED = "2026-09-01";

const BUDGETS = [
  { id: "5k-10k",  label: "5,000 – 10,000 บาท",  min: 5000,  max: 10000,    hint: "ใช้งานพื้นฐานครบ เน้นความคุ้มค่า" },
  { id: "10k-20k", label: "10,000 – 20,000 บาท", min: 10001, max: 20000,    hint: "ระดับกลาง ตัวเลือกเยอะที่สุด" },
  { id: "20k-35k", label: "20,000 – 35,000 บาท", min: 20001, max: 35000,    hint: "ระดับกลาง-บน ได้ฟีเจอร์เรือธงบางส่วน" },
  { id: "35k-up",  label: "35,000 บาทขึ้นไป",     min: 35001, max: Infinity, hint: "เรือธงเต็มตัว" },
];

const OVER_BUDGET_TOLERANCE = 1.1; // ยอมเกินงบได้ 10% (ติดป้ายชัดเจน) เมื่อมีตัวเลือกไม่พอ
const MAX_LIFESTYLES = 2;
const MAX_COMPARE = 3;

// Tier ใช้เปรียบเทียบภายในเท่านั้น — ไม่แสดงบน UI
const TIERS = ["weak", "fair", "good", "excellent"];

// เกณฑ์แปลงสเปก → Tier (แก้ตัวเลขตรงนี้ได้โดยไม่ต้องแตะ Engine)
const THRESHOLDS = {
  batteryMah:    [6000, 5000, 4500], // excellent, good, fair
  chargingW:     [80, 45, 25],
  securityYears: [6, 5, 4],
  refreshHz:     { excellent: 144, good: 120 },
  brightNits:    2500,              // 120Hz + สว่างมาก = excellent
  zoomExcellent: 3,                 // เลนส์ซูม ≥ 3x
};
