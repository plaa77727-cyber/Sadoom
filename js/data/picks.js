"use strict";
/* Phones of the Month — เพิ่มเดือนใหม่ที่นี่ */

// เพิ่มเดือนใหม่ = เพิ่ม object ใหม่ใน MONTHLY_PICKS
const PICK_CATEGORIES = [
  { key: "best-overall", label: "Best Overall", desc: "ใช้งานได้ดีรอบด้าน" },
  { key: "best-camera",  label: "Best Camera",  desc: "สายถ่ายรูปและวิดีโอ" },
  { key: "best-gaming",  label: "Best Gaming",  desc: "เล่นเกมลื่น เครื่องไม่ร้อนง่าย" },
  { key: "best-value",   label: "Best Value",   desc: "ได้มากเกินราคา" },
  { key: "best-battery", label: "Best Battery", desc: "แบตอึด ชาร์จไว" },
  { key: "best-budget",  label: "Best Budget",  desc: "งบไม่เกิน 10,000 บาท" },
];

const MONTHLY_PICKS = [
  {
    month: "2026-09",
    title: "Recommended Phones — September 2026",
    intro: "มือถือที่เราแนะนำประจำเดือนนี้ แบ่งตามหมวดการใช้งาน แต่ละหมวดมีตัวเลือกสำรองให้พิจารณาด้วย",
    picks: [
      { key: "best-overall", phoneId: "samsung-galaxy-a56-5g", blurb: "สมดุลที่สุดในงบกลาง ไม่มีจุดอ่อนชัด และอัปเดตยาว 6 ปี", alternatives: ["iphone-17"] },
      { key: "best-camera",  phoneId: "xiaomi-15t-pro", blurb: "ได้ซูม 5x periscope ในราคาไม่ถึงครึ่งของเรือธง", alternatives: ["vivo-x200-pro", "vivo-v60"] },
      { key: "best-gaming",  phoneId: "poco-f7", blurb: "ชิปแรง แบต 6,500 mAh เล่นเกมได้นานในราคาหมื่นกลาง ๆ", alternatives: ["asus-rog-phone-9"] },
      { key: "best-value",   phoneId: "poco-f7-ultra", blurb: "ชิปเรือธงตัวท็อปในราคาระดับกลาง-บน", alternatives: ["poco-x7"] },
      { key: "best-battery", phoneId: "vivo-v60", blurb: "แบต 6,500 mAh ชาร์จ 90W ในตัวเครื่องบาง", alternatives: ["poco-f7"] },
      { key: "best-budget",  phoneId: "poco-x7", blurb: "จอ 1.5K กันน้ำ IP68 ลำโพงสเตอริโอ ในงบไม่ถึงหมื่น", alternatives: ["redmi-note-14"] },
    ],
  },
];
