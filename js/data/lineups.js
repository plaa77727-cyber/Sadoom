"use strict";
/* รายการมือถือที่คัดเองต่อ งบ × ไลฟ์สไตล์ ← แก้/เพิ่มที่นี่
   - ใส่รหัสรุ่น (id ใน phones.js) เรียงตามลำดับที่อยากให้แสดง จะกี่รุ่นก็ได้
   - ถ้ารุ่นเดียวกันอยู่หลายสาย แต่อยากใช้ลิงก์นายหน้าหรือรูปคนละอัน
     ให้เขียนแบบ { id: "...", buy: "ลิงก์", image: "images/ไฟล์.webp", dealPrice: 12345, priceNote: "..." }
     (ใส่เฉพาะช่องที่ต่างจากใน phones.js)
   - ในหน้าผลลัพธ์จะเรียงจากราคาต่ำไปสูงให้อัตโนมัติ (ตาม dealPrice)
   - งบหรือไลฟ์สไตล์ไหนยังไม่ได้ใส่ ระบบจะเลือกให้อัตโนมัติจากสเปกแทน
   - รุ่นที่ราคาเกินงบใส่ได้ ระบบจะติดป้าย "เกินงบเล็กน้อย" ให้ */
const LINEUPS = {
  "5k-10k": {
    camera:   ["redmi-note-15-4g", "samsung-galaxy-a17-5g", "nothing-phone-3a"],
    gaming:   ["poco-m8-5g", "infinix-note-edge-5g", "iqoo-z11x-5g"],
    balanced: [
      "honor-600-lite-5g",
      { id: "samsung-galaxy-a17-5g", buy: "https://s.shopee.co.th/60RyRUWjt7" },
      { id: "redmi-note-15-4g", buy: "https://s.shopee.co.th/30oMsYvK2Z" },
    ],
  },
  "10k-20k": {
    camera:   ["realme-16-pro", "vivo-v70", "xiaomi-17t", "samsung-galaxy-a56-5g"],
    gaming:   ["iqoo-z11-5g", "iqoo-neo-10", "poco-x8-pro-max", "infinix-gt-50-pro"],
    balanced: [
      { id: "xiaomi-17t", buy: "https://s.shopee.co.th/8AWURIyfjQ", image: "images/xiaomi-17t-lineup.webp" },
      "samsung-galaxy-s25-fe", "nothing-phone-4a", "vivo-v70-fe",
    ],
  },
  "20k-35k": {
    camera: [
      "vivo-x300", "vivo-x300-pro",
      { id: "xiaomi-17t-pro", image: "images/xiaomi-17t-pro-camera.webp" },
      "oppo-find-x9s", "honor-600-pro",
      "samsung-galaxy-s25-ultra", "honor-magic-8-pro",
    ],
    gaming: ["redmagic-11-air", "redmagic-11s-pro", "asus-rog-phone-9", "iqoo-15r", "iqoo-15"],
    balanced: [
      "samsung-galaxy-s26", "iphone-17", "iphone-15",
      { id: "vivo-x300", buy: "https://s.shopee.co.th/qjvHoNwHE", image: "images/vivo-x300-balanced.webp",
        dealPrice: 25329, priceNote: "ราคาหลังโค้ดส่วนลดมักเหลือ ฿25,329" },
      "nothing-phone-3",
      { id: "xiaomi-17t-pro", buy: "https://s.shopee.co.th/BUEV7gQrw", image: "images/xiaomi-17t-pro-balanced.webp",
        dealPrice: 24223, priceNote: "ราคาหลังโค้ดส่วนลดมักเหลือ ฿24,223" },
    ],
  },
  "35k-up": {
    camera: [
      "vivo-x300-ultra", "oppo-find-x9-ultra", "samsung-galaxy-s26-ultra",
      "iphone-18-pro-max", "xiaomi-17-ultra",
    ],
    gaming: [
      "asus-rog-phone-9-pro",
      { id: "redmagic-11s-pro", variants: [{ ram: 16, storage: 512, price: 40990 }], dealPrice: 34899,
        priceNote: "ราคาหลังส่วนลดมักเหลือ ฿34,899", buy: "https://s.shopee.co.th/3Vkh3Ddt5s",
        image: "images/redmagic-11s-pro-16-512.webp" },
      "xiaomi-17-ultra",
      { id: "iphone-18-pro-max", image: "images/iphone-18-pro-max-gaming.webp" },
      { id: "samsung-galaxy-s26-ultra", image: "images/samsung-galaxy-s26-ultra-gaming.webp" },
    ],
    balanced: [
      "iphone-18-pro", "xiaomi-17-ultra",
      { id: "samsung-galaxy-s26-ultra", image: "images/samsung-galaxy-s26-ultra-balanced.webp" },
    ],
  },
};

const lineupId = (entry) => (typeof entry === "string" ? entry : entry.id);
// รวมข้อมูลเฉพาะสาย (ลิงก์ รูป ราคา ข้อความโปร) เข้ากับข้อมูลหลักของรุ่น
function applyLineupEntry(base, entry) {
  if (!base || typeof entry === "string") return base;
  const { id, buy, ...rest } = entry;
  return { ...base, ...rest, ...(buy && { buy: { store: base.buy?.store || "Shopee", url: buy } }) };
}
// รายการรุ่นของงบ+สาย (รวมข้อมูลเฉพาะสายแล้ว) เรียงราคาจริงจากต่ำไปสูง
function lineupPhones(budgetId, lifestyle) {
  return (LINEUPS[budgetId]?.[lifestyle] || [])
    .map((e) => applyLineupEntry(getPhone(lineupId(e)), e)).filter(Boolean)
    .sort((a, b) => realPrice(a) - realPrice(b));
}
function lineupHas(budgetId, phoneId) {
  const l = LINEUPS[budgetId];
  return !!l && Object.values(l).some((list) => list.some((e) => lineupId(e) === phoneId));
}
