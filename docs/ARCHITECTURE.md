# SADOOM — Project Architecture (Draft v0.1)

> สถานะ: **ข้อเสนอเพื่อพิจารณา** — ยังไม่มีการเขียน Code
> อัปเดตล่าสุด: 2026-09-28

เว็บไซต์ช่วยเลือกสมาร์ตโฟนจาก **งบประมาณ + Lifestyle** แล้วเสนอมือถือ ~3 รุ่นที่มีจุดเด่นต่างกัน
พร้อมเหตุผล — **ไม่มีคะแนน ไม่มี Match % ไม่มี "ผู้ชนะ"** ผู้ใช้เป็นคนตัดสินใจเอง

---

## สารบัญ

1. [Tech Stack — ทางเลือกและข้อแนะนำ](#1-tech-stack)
2. [Frontend / Backend Structure](#2-frontend--backend-structure)
3. [Folder Structure](#3-folder-structure)
4. [Data Structure ของมือถือ](#4-data-structure)
5. [Recommendation Logic](#5-recommendation-logic)
6. [Page Structure](#6-page-structure)
7. [Component Structure](#7-component-structure)
8. [User Flow](#8-user-flow)
9. [แนวทาง UI/UX](#9-uiux)
10. [การจัดการข้อมูลมือถือ](#10-data-management)
11. [Monthly Recommendation](#11-monthly-recommendation)
12. [Roadmap](#12-roadmap)
13. [คำถามที่ต้องตัดสินใจก่อนเริ่ม](#13-open-questions)

---

## 1. Tech Stack

### ทางเลือก A — TypeScript Full Stack (Next.js) ⭐ แนะนำ

| Layer | เครื่องมือ |
|---|---|
| Framework | Next.js (App Router) + React + TypeScript |
| Styling | Tailwind CSS (ใช้ Design Tokens ผ่าน CSS variables) |
| Validation | Zod (ตรวจ Schema ข้อมูลมือถือ + input ของ API) |
| Data (MVP) | ไฟล์ JSON ในโปรเจกต์ ผ่าน Repository layer |
| Data (V2) | PostgreSQL + Drizzle ORM (หรือ Prisma) |
| Testing | Vitest (unit — engine), Playwright (E2E — user flow) |
| Quality | ESLint, Prettier, `tsc --noEmit`, GitHub Actions CI |
| Deploy | Vercel (หรือ Docker บน VPS/Cloud Run) |

**ข้อดี**
- ภาษาเดียวทั้งระบบ → Type ของ `Phone` ใช้ร่วมกันตั้งแต่ Data → Engine → API → UI ไม่ต้อง sync type ข้ามภาษา
- หน้า Phone Detail / Phones of the Month เป็น Static (SSG) ได้ → เร็วมาก และดีต่อ SEO (สำคัญสำหรับเว็บรีวิว/แนะนำ)
- มี API Routes ในตัว (`/api/recommendations`) → แสดงให้เห็นใน Portfolio ว่ามี Backend layer จริง โดยไม่ต้องดูแล 2 service
- Deploy ง่าย ต้นทุนเกือบ 0 ในช่วง MVP
- Ecosystem ใหญ่ หา Component/Library/ตัวอย่างได้ง่าย

**ข้อเสีย**
- ถ้าอนาคตอยากทำ ML / Data pipeline / Scraping หนัก ๆ Python เหมาะกว่า
  → แก้ได้ด้วยการเพิ่ม **Python worker แยก** ใน V3 ที่เขียนข้อมูลลง DB เดียวกัน (ไม่กระทบเว็บ)
- Next.js มี concept เยอะ (Server/Client Components, caching) ต้องวางขอบเขตให้ชัด

### ทางเลือก B — Python Backend (FastAPI) + TypeScript Frontend (Next.js/React)

**ข้อดี**
- แยก Frontend/Backend ชัดเจนแบบ "ตำรา" — โชว์ทักษะ API design ได้ชัด
- Python เหมาะกับงาน Data: Scraping, ทำความสะอาดข้อมูล, ML ในอนาคต
- FastAPI + Pydantic ได้ OpenAPI docs อัตโนมัติ

**ข้อเสีย**
- 2 ภาษา 2 codebase 2 deploy → งานเพิ่มเกือบเท่าตัวสำหรับ MVP ที่ Logic ยังเป็น rule-based ธรรมดา
- Type ข้ามภาษาต้อง generate จาก OpenAPI ไม่อย่างนั้นจะ drift
- ยังต้องใช้ Next.js ฝั่งหน้าเว็บอยู่ดีถ้าต้องการ SEO → ความซับซ้อนสูงสุดในสามทางเลือก

### ทางเลือก C — Static Site ล้วน (Astro หรือ Vite + React SPA)

**ข้อดี** เรียบง่ายที่สุด เร็ว ฟรี
**ข้อเสีย** ไม่มี Backend layer → ขยายไป Database / Admin / API ยาก และ Portfolio ขาดส่วน Backend

### สรุปข้อแนะนำ

**เลือก A** แล้วออกแบบให้ Recommendation Engine เป็น **Pure TypeScript module ที่ไม่ผูกกับ Next.js**
(ไม่ import React/Next เลย) — ถ้าวันหนึ่งอยากย้ายไป Backend แยก หรือแปลงเป็น Python ก็ย้ายได้ทั้งก้อน

---

## 2. Frontend / Backend Structure

ใช้แนวคิด **Layered / Clean Architecture** — แต่ละชั้นรู้จักเฉพาะชั้นที่อยู่ข้างล่าง

```
┌───────────────────────────────────────────────────────────┐
│  Presentation      app/ (routes)  +  components/ (UI)     │  React, Tailwind
├───────────────────────────────────────────────────────────┤
│  API               app/api/*  (Route Handlers, Zod input) │  HTTP boundary
├───────────────────────────────────────────────────────────┤
│  Services          server/services/*                      │  orchestration
│                    phoneService, recommendationService,    │
│                    picksService                            │
├──────────────────────────────┬────────────────────────────┤
│  Core (Domain)               │  Data Access               │
│  core/recommendation/*       │  server/repositories/*     │
│  core/domain/* (types)       │  PhoneRepository (interface)│
│  ไม่มี I/O, ไม่รู้จัก framework │  JsonPhoneRepository (MVP) │
│                              │  SqlPhoneRepository  (V2)  │
├──────────────────────────────┴────────────────────────────┤
│  Data Source       data/phones/*.json, data/picks/*.json   │  → PostgreSQL (V2)
└───────────────────────────────────────────────────────────┘
```

หลักการสำคัญ
- **Core** = ฟังก์ชัน pure รับ `Phone[]` + `UserPreferences` → คืน `Recommendation[]` ทดสอบได้ 100% ด้วย unit test
- **Repository interface** ทำให้เปลี่ยน JSON → Database → External API ได้โดยไม่แก้ Service/UI
- **Server Components** เรียก Service โดยตรง (ไม่ต้องผ่าน HTTP) ส่วน **API Routes** มีไว้สำหรับ client-side
  interaction (เช่น Compare tray) และสำหรับ consumer ภายนอกในอนาคต (Mobile app, LINE bot)
- ทั้งสองทางเรียก Service ตัวเดียวกัน → Logic ไม่ซ้ำซ้อน

---

## 3. Folder Structure

```
sadoom/
├── data/                              # ← ข้อมูลล้วน แยกจาก Logic
│   ├── phones/
│   │   ├── samsung-galaxy-a56.json    # 1 ไฟล์ = 1 รุ่น (แก้/รีวิวใน PR ง่าย)
│   │   ├── poco-f7.json
│   │   └── ...
│   ├── picks/
│   │   ├── 2026-09.json               # Phones of the Month รายเดือน
│   │   └── 2026-10.json
│   └── guides/                        # (V2) บทความ MDX
│
├── public/images/phones/              # รูปมือถือ (WebP, ขนาด/สัดส่วนเดียวกัน)
│
├── src/
│   ├── app/                           # Next.js routes (Pages)
│   │   ├── layout.tsx
│   │   ├── page.tsx                   # Home
│   │   ├── finder/
│   │   │   ├── page.tsx               # Wizard: Budget → Lifestyle
│   │   │   └── results/page.tsx       # ?budget=10k-20k&lifestyle=gaming,battery
│   │   ├── phones/
│   │   │   ├── page.tsx               # รายการมือถือทั้งหมด + filter
│   │   │   └── [slug]/page.tsx        # Phone Detail
│   │   ├── compare/page.tsx           # ?phones=a,b,c
│   │   ├── picks/
│   │   │   ├── page.tsx               # เดือนล่าสุด
│   │   │   └── [month]/page.tsx       # archive เช่น /picks/2026-09
│   │   ├── guides/                    # (MVP = placeholder)
│   │   └── api/
│   │       ├── recommendations/route.ts
│   │       ├── phones/route.ts
│   │       └── phones/[slug]/route.ts
│   │
│   ├── components/
│   │   ├── ui/                        # primitives: Button, Card, Chip, Badge, Container...
│   │   ├── layout/                    # SiteHeader, MobileNav, SiteFooter
│   │   ├── home/                      # Hero, HowItWorks, PicksPreview
│   │   ├── finder/                    # BudgetStep, LifestyleStep, StepIndicator...
│   │   ├── recommendation/            # RecommendationCard, WhyWeRecommend...
│   │   ├── phone/                     # PhoneImage, KeySpecs, SpecSection, ProsCons...
│   │   ├── compare/                   # CompareTable, CompareTray, PhonePicker
│   │   └── picks/                     # PickCategoryCard, MonthSelector
│   │
│   ├── core/                          # ← Domain + Recommendation (ไม่มี React/Next)
│   │   ├── domain/
│   │   │   ├── phone.ts               # types ของ Phone
│   │   │   ├── preferences.ts         # Budget, Lifestyle, UserPreferences
│   │   │   └── picks.ts
│   │   └── recommendation/
│   │       ├── index.ts               # public API: recommend()
│   │       ├── engine.ts              # pipeline หลัก
│   │       ├── traits/                # แปลงสเปก → ระดับคุณสมบัติ (qualitative)
│   │       │   ├── derive-traits.ts
│   │       │   └── thresholds.ts      # เกณฑ์ปรับได้ (config)
│   │       ├── profiles/              # นิยามแต่ละ Lifestyle
│   │       │   ├── balanced.ts
│   │       │   ├── camera.ts
│   │       │   ├── gaming.ts
│   │       │   ├── battery.ts
│   │       │   ├── entertainment.ts
│   │       │   └── value.ts
│   │       ├── selection/             # เลือก 3 รุ่นที่แตกต่างกัน (slot strategies)
│   │       │   ├── slots.ts
│   │       │   └── diversity.ts
│   │       └── explain/               # สร้างข้อความเหตุผล
│   │           ├── reasons.ts
│   │           └── templates.th.ts
│   │
│   ├── server/                        # server-only
│   │   ├── repositories/
│   │   │   ├── phone-repository.ts    # interface
│   │   │   ├── json-phone-repository.ts
│   │   │   └── picks-repository.ts
│   │   └── services/
│   │       ├── phone-service.ts
│   │       ├── recommendation-service.ts
│   │       └── picks-service.ts
│   │
│   ├── schemas/                       # Zod schemas (phone, picks, API input)
│   ├── config/                        # budgets.ts, lifestyles.ts, site.ts, nav.ts
│   ├── hooks/                         # useCompareList, useFinderState
│   ├── lib/                           # utils: format-price, format-date, cn, url-state
│   └── styles/
│       ├── globals.css
│       └── tokens.css                 # สี, spacing, radius, typography
│
├── scripts/
│   ├── validate-data.ts               # ตรวจทุกไฟล์ใน data/ ด้วย Zod + ตรวจ id ซ้ำ/อ้างอิงผิด
│   ├── new-phone.ts                   # สร้างไฟล์มือถือใหม่จาก template
│   └── draft-picks.ts                 # (V2) ให้ engine เสนอ candidate ของเดือนถัดไป
│
├── tests/
│   ├── unit/                          # engine, traits, selection, formatters
│   ├── fixtures/                      # ข้อมูลมือถือจำลองสำหรับ test
│   └── e2e/                           # Playwright: Home → Finder → Results → Compare
│
└── docs/
    ├── ARCHITECTURE.md
    └── ADDING_A_PHONE.md
```

---

## 4. Data Structure

### 4.1 หลักการ
1. **สเปก (fact)** กับ **การประเมิน (editorial)** แยกกัน — สเปกมาจากแหล่งข้อมูล ส่วน "ระบายความร้อนดีไหม / Image processing ดีไหม" เป็นความเห็นของทีม ซึ่งตัวเลขสเปกบอกไม่ได้
2. **ทุกข้อมูลที่เปลี่ยนได้มีวันที่** — ราคาและสเปกมี `updatedAt` แยกกัน + แหล่งที่มา
3. **ราคาเป็นราย Variant** (RAM/Storage) เพราะรุ่นเดียวกันอาจคร่อมงบ 2 ช่วง
4. **การประเมินเป็นระดับเชิงคุณภาพ** (`excellent | good | fair | weak`) ไม่ใช่ตัวเลข — ใช้ภายในเพื่อเลือกและอธิบายเท่านั้น

### 4.2 TypeScript types (ย่อ)

```ts
// src/core/domain/phone.ts
export type Tier = 'excellent' | 'good' | 'fair' | 'weak';

export interface Phone {
  id: string;                    // "samsung-galaxy-a56"  (= slug)
  brand: string;
  model: string;
  releaseDate: string;           // ISO "2026-03-01"
  status: 'active' | 'discontinued';
  images: { main: string; alt?: string; gallery?: string[] };

  variants: PhoneVariant[];      // ราคาอยู่ที่นี่
  specs: PhoneSpecs;
  editorial: Editorial;
  meta: DataMeta;
}

export interface PhoneVariant {
  ramGb: number;
  storageGb: number;
  priceThb: number;              // ราคาโดยประมาณในไทย
}

export interface PhoneSpecs {
  chipset: { name: string; process?: string };
  display: {
    sizeInch: number; panel: string; resolution: string;
    refreshRateHz: number; peakBrightnessNits?: number;
  };
  battery: { capacityMah: number };
  charging: { wiredW: number; wirelessW?: number; chargerInBox?: boolean };
  cameras: {
    main: CameraSpec;
    ultrawide?: CameraSpec;
    telephoto?: CameraSpec & { opticalZoom: number };
    front: CameraSpec;
    video: { maxResolution: '1080p' | '4K' | '8K'; maxFps: number; stabilization?: string };
  };
  audio: { stereoSpeakers: boolean; headphoneJack: boolean };
  build: { ipRating?: string; weightG: number; dimensionsMm?: string };
  software: { os: 'Android' | 'iOS'; skin?: string; osUpdatesYears: number; securityUpdatesYears: number };
  connectivity?: { nfc: boolean; esim: boolean; fiveG: boolean };
  extras?: string[];             // "IR blaster", "S Pen", ...
}

export interface CameraSpec { mp: number; sensor?: string; aperture?: string; ois?: boolean }

export interface Editorial {
  summary: string;               // Overview สั้น ๆ
  highlights: string[];          // จุดเด่น
  pros: string[];
  cons: string[];                // จุดที่ควรพิจารณา
  suitableFor: string[];
  notSuitableFor: string[];
  assessment: Partial<Record<AssessedDimension, { tier: Tier; note?: string }>>;
}

// มิติที่ต้องอาศัยการประเมิน (สเปกอย่างเดียวบอกไม่ได้)
export type AssessedDimension =
  | 'performance' | 'thermal' | 'cameraProcessing' | 'video'
  | 'display' | 'speakers' | 'batteryEfficiency' | 'software';

export interface DataMeta {
  specsUpdatedAt: string;
  priceUpdatedAt: string;
  sources: { label: string; url?: string }[];
}
```

### 4.3 ตัวอย่างไฟล์ `data/phones/example-phone-x.json`

```json
{
  "id": "example-phone-x",
  "brand": "Example",
  "model": "Phone X",
  "releaseDate": "2026-03-01",
  "status": "active",
  "images": { "main": "/images/phones/example-phone-x.webp", "alt": "Example Phone X" },
  "variants": [
    { "ramGb": 8,  "storageGb": 256, "priceThb": 14990 },
    { "ramGb": 12, "storageGb": 512, "priceThb": 17990 }
  ],
  "specs": {
    "chipset": { "name": "Snapdragon 8s Gen 4", "process": "4nm" },
    "display": { "sizeInch": 6.67, "panel": "AMOLED", "resolution": "1220x2712", "refreshRateHz": 120, "peakBrightnessNits": 3200 },
    "battery": { "capacityMah": 6500 },
    "charging": { "wiredW": 90, "chargerInBox": true },
    "cameras": {
      "main": { "mp": 50, "sensor": "1/1.95\"", "ois": true },
      "ultrawide": { "mp": 8 },
      "front": { "mp": 20 },
      "video": { "maxResolution": "4K", "maxFps": 60 }
    },
    "audio": { "stereoSpeakers": true, "headphoneJack": false },
    "build": { "ipRating": "IP68", "weightG": 205 },
    "software": { "os": "Android", "skin": "HyperOS", "osUpdatesYears": 4, "securityUpdatesYears": 6 }
  },
  "editorial": {
    "summary": "มือถือสายเกมในงบกลาง ชิปแรง แบตใหญ่ ชาร์จไว",
    "highlights": ["ชิประดับเรือธงรอง", "แบต 6,500 mAh", "ชาร์จ 90W"],
    "pros": ["เล่นเกมหนักได้ลื่นต่อเนื่อง", "แบตอึดเกิน 1 วัน"],
    "cons": ["กล้องมุมกว้างความละเอียดต่ำ", "ไม่มีเลนส์ซูม"],
    "suitableFor": ["คนเล่นเกมจริงจังในงบไม่เกิน 20,000"],
    "notSuitableFor": ["คนที่ถ่ายรูปซูมบ่อย"],
    "assessment": {
      "performance": { "tier": "excellent" },
      "thermal": { "tier": "good", "note": "ร้อนเล็กน้อยหลังเล่น 30 นาที แต่เฟรมเรตคงที่" },
      "cameraProcessing": { "tier": "fair" }
    }
  },
  "meta": {
    "specsUpdatedAt": "2026-09-20",
    "priceUpdatedAt": "2026-09-25",
    "sources": [{ "label": "Official spec sheet" }]
  }
}
```

### 4.4 Database schema (V2 — PostgreSQL)

```
phones            (id PK, brand, model, release_date, status, image_url, specs JSONB,
                   specs_updated_at, created_at, updated_at)
phone_variants    (id PK, phone_id FK, ram_gb, storage_gb)
prices            (id PK, variant_id FK, price_thb, source, recorded_at)   ← เก็บประวัติราคา
phone_editorial   (phone_id PK/FK, summary, highlights[], pros[], cons[],
                   suitable_for[], not_suitable_for[], updated_at)
phone_assessments (phone_id FK, dimension, tier, note, PRIMARY KEY(phone_id, dimension))
monthly_picks     (id PK, month 'YYYY-MM' UNIQUE, title, intro, published_at, status)
monthly_pick_items(pick_id FK, category, phone_id FK, blurb, sort_order)
```
- `specs` เก็บเป็น JSONB ช่วงแรก (schema ยืดหยุ่น) — ย้ายเป็นคอลัมน์เมื่อต้องการ filter/index
- ตาราง `prices` แยกออกมาเพื่อทำ "ราคาย้อนหลัง" ได้ใน V2/V3
- Zod schema ชุดเดียวกับ MVP ใช้ validate ข้อมูลก่อนเขียนลง DB

---

## 5. Recommendation Logic

### 5.1 แนวคิด: "เลือกด้วยเหตุผล ไม่ใช่ด้วยคะแนน"

ระบบไม่คำนวณคะแนนรวม แต่ทำงานแบบ **Rule-based + Qualitative Tiers**
1. แปลงสเปกแต่ละรุ่นเป็น **Traits** เชิงคุณภาพ (เช่น `battery: excellent`)
2. แต่ละ Lifestyle ระบุว่า **ต้องมี (essential)** และ **ควรมี (preferred)** อะไร
3. เลือก 3 รุ่นโดยให้แต่ละรุ่นเติม **"บทบาท" (slot)** ที่ต่างกัน
4. ทุกการตัดสินใจของ engine ถูกบันทึกเป็น **Reason** → กลายเป็นข้อความอธิบายบน Card โดยตรง

> ผลลัพธ์: ทุกประโยค "ทำไมเราแนะนำ" มาจาก rule ที่ตรวจสอบได้จริง ไม่ได้แต่งขึ้นลอย ๆ

### 5.2 Pipeline

```
Phone[] ──► 1. filterByBudget ──► 2. deriveTraits ──► 3. evaluateAgainstProfiles
                                                               │
Recommendation[] ◄── 5. explain ◄── 4. selectSlots (diversity) ◄┘
```

| ขั้น | หน้าที่ |
|---|---|
| 1. `filterByBudget` | เลือก phone ที่มีอย่างน้อย 1 variant อยู่ในงบ, status = active; จำ variant ที่เข้างบไว้แสดงราคา |
| 2. `deriveTraits` | สเปก → Tier ต่อมิติ ตาม `thresholds.ts` แล้ว **editorial assessment override** มิติที่สเปกบอกไม่ได้ (thermal, image processing) |
| 3. `evaluate` | เทียบ traits กับ profile ที่ผู้ใช้เลือก → `met[]`, `unmet[]`, `strengths[]`, `tradeoffs[]` |
| 4. `selectSlots` | เลือก 3 รุ่นที่ต่างกันตามบทบาท (ดู 5.4) |
| 5. `explain` | แปลง met/unmet/slot → ข้อความ "Why we recommend", "จุดที่ควรพิจารณา" |

### 5.3 Traits & Profiles (Config ล้วน — แก้ได้โดยไม่แตะ engine)

```ts
// core/recommendation/traits/thresholds.ts
export const thresholds = {
  battery:  { excellent: 6000, good: 5000, fair: 4500 },   // mAh
  charging: { excellent: 80,   good: 45,   fair: 25 },     // W
  display:  { refreshExcellent: 144, refreshGood: 120 },
  software: { excellentYears: 6, goodYears: 4, fairYears: 3 },
  // ...
} as const;

// core/recommendation/profiles/gaming.ts
export const gaming: LifestyleProfile = {
  id: 'gaming',
  essential: [
    { dimension: 'performance', minTier: 'good',      reason: 'perf.smooth-gaming' },
  ],
  preferred: [
    { dimension: 'performance', minTier: 'excellent', reason: 'perf.flagship-class' },
    { dimension: 'thermal',     minTier: 'good',      reason: 'thermal.sustained' },
    { dimension: 'display',     minTier: 'good',      reason: 'display.high-refresh' },
    { dimension: 'battery',     minTier: 'good',      reason: 'battery.long-sessions' },
    { dimension: 'charging',    minTier: 'good',      reason: 'charging.quick-topup' },
  ],
};
```

Lifestyle ที่เสนอสำหรับ MVP (ผู้ใช้เลือกได้ 1–2 อย่าง)

| Lifestyle | มิติหลักที่พิจารณา |
|---|---|
| Balanced — ใช้งานรอบด้าน | ไม่มีจุดอ่อน `weak` ในมิติสำคัญ, software support |
| Camera — ถ่ายรูป/วิดีโอ | main camera, ultrawide, telephoto, video, cameraProcessing |
| Gaming — เล่นเกม | performance, thermal, display refresh, battery, charging |
| Battery — แบตอึด | capacity, charging, batteryEfficiency |
| Entertainment — ดูหนัง/โซเชียล | display, speakers, battery |
| Value — คุ้มค่า | ราคาเทียบ hardware ในงบเดียวกัน, software support, อายุการใช้งาน |

> "Performance" ในโจทย์ใช้เป็น **มิติ (dimension)** ที่ Gaming/Balanced ใช้ร่วมกัน แทนที่จะเป็น Lifestyle แยก เพื่อไม่ให้ผู้ใช้สับสนระหว่าง Gaming กับ Performance — ถ้าต้องการแยกก็เพิ่มไฟล์ profile ได้ทันที

**การรวม 2 Lifestyle**: essential = union ของทั้งสอง, preferred = union — ถ้าไม่มีรุ่นใดผ่าน essential ครบ ระบบจะผ่อนเกณฑ์ (ดู 5.5)

### 5.4 การเลือก 3 รุ่นที่ "ต่างกัน" (Slot Strategy)

แทนที่จะเรียง 1-2-3 ระบบเติม **บทบาท** 3 แบบ แต่ละบทบาทมีเกณฑ์เลือกของตัวเอง

| Slot | ป้ายบน Card (ตัวอย่าง) | เกณฑ์ |
|---|---|---|
| `focused` | "ตรงกับ Gaming + Battery ที่สุด" | ผ่าน preferred ของ lifestyle ที่เลือกได้มากที่สุด (เทียบ tier ทีละมิติ ไม่ใช่รวมคะแนน) |
| `balanced` | "สมดุลกว่า ใช้งานรอบด้าน" | ผ่าน essential และมีมิติที่เป็น `weak`/`fair` น้อยที่สุดโดยรวม |
| `value` | "คุ้มค่าในงบนี้" | ราคาต่ำสุดในกลุ่มที่ผ่าน essential ทั้งหมด หรือ `value` tier สูงสุด |

กฎ Diversity
- ห้ามซ้ำรุ่น; ถ้าเสมอกันให้เลือก **ต่างแบรนด์** ก่อน
- ถ้ารุ่นเดียวเหมาะหลายบทบาท ให้อยู่ในบทบาทแรกที่ได้ แล้วหาตัวเลือกถัดไปให้บทบาทอื่น
- ลำดับการแสดงผลคงที่ตาม slot (focused → balanced → value) และ **ไม่แสดงเลขลำดับ** — บทบาทบอกว่า "ต่างกันอย่างไร" ไม่ใช่ "ดีกว่ากันแค่ไหน"

> หมายเหตุความโปร่งใส: ภายใน engine ยังต้อง "เปรียบเทียบ" เพื่อเลือก แต่ใช้การเทียบ tier ตามลำดับความสำคัญ (lexicographic) ไม่มีตัวเลขคะแนนใด ๆ ถูกสร้างหรือส่งไปถึง UI — Type ของ `Recommendation` ไม่มี field ตัวเลขเลย เพื่อกันไม่ให้ใครเผลอแสดงในอนาคต

### 5.5 Fallback เมื่อมีตัวเลือกน้อย
1. ผ่อน preferred → ใช้แค่ essential
2. ขยายงบ +10% โดยติดป้าย "เกินงบเล็กน้อย" ชัดเจน
3. ถ้ายังไม่ถึง 3 รุ่น → แสดงเท่าที่มี พร้อมข้อความอธิบายตรง ๆ (ไม่ยัดรุ่นที่ไม่เหมาะให้ครบ 3)

### 5.6 Output type

```ts
export interface Recommendation {
  phoneId: string;
  slot: 'focused' | 'balanced' | 'value';
  variant: PhoneVariant;              // variant ที่อยู่ในงบ
  headline: string;                   // "เหมาะกับคนที่เน้นเล่นเกมและต้องการแบตอึด"
  whyRecommended: string[];           // จาก met requirements + slot
  considerations: string[];           // จาก unmet preferred + editorial cons
  flags: Array<'slightly-over-budget' | 'relaxed-criteria'>;
}

export function recommend(phones: Phone[], prefs: UserPreferences): RecommendationResult;
```

### 5.7 Testing
- Fixture มือถือจำลอง 10–15 รุ่น + scenario test เช่น "งบ 10–20k + Gaming+Battery ต้องได้ 3 รุ่น ไม่ซ้ำ, ทุกรุ่นผ่าน performance ≥ good"
- Property test: ผลลัพธ์ต้องอยู่ในงบเสมอ (ยกเว้นมี flag), ไม่มี field ตัวเลขคะแนน, deterministic

---

## 6. Page Structure

| Route | หน้า | Rendering |
|---|---|---|
| `/` | Home: Hero, How it works (3 ขั้น), Phones of the Month preview, Guides preview | Static |
| `/finder` | Wizard 2 ขั้น: Budget → Lifestyle | Client (state ใน URL) |
| `/finder/results?budget=…&lifestyle=…` | "Phones Recommended for You" | Server (คำนวณจาก searchParams) |
| `/phones` | รายการมือถือทั้งหมด + filter แบรนด์/งบ | Static + client filter |
| `/phones/[slug]` | Phone Detail | Static (generateStaticParams) |
| `/compare?phones=a,b,c` | ตารางเปรียบเทียบ 2–3 รุ่น | Server + client picker |
| `/picks` → `/picks/2026-09` | Phones of the Month + archive | Static |
| `/guides` | บทความแนะนำ (MVP = หน้าเริ่มต้น/placeholder) | Static |
| `/about` | วิธีการเลือกของเรา + นโยบายข้อมูล (สร้างความน่าเชื่อถือ) | Static |

**State อยู่ใน URL** (finder results, compare) → แชร์ลิงก์ได้, กด Back ได้ถูกต้อง, refresh ไม่หาย

---

## 7. Component Structure

```
layout/     SiteHeader, DesktopNav, MobileNav (bottom sheet/hamburger), SiteFooter
ui/         Button, Card, Chip, SelectableCard, Badge, Tag, Container, Section,
            Skeleton, EmptyState, Tabs, Accordion, DataUpdatedNote
home/       Hero, HowItWorks, PicksPreview, GuidesPreview
finder/     FinderWizard, StepIndicator, BudgetStep, BudgetOption,
            LifestyleStep, LifestyleOption (จำกัดเลือก 2), FinderActionBar (sticky บน mobile)
recommendation/
            RecommendationList, RecommendationCard, SlotLabel,
            WhyWeRecommend, ProsConsList, PreferenceSummary (chips + "แก้ไข")
phone/      PhoneImage, PhonePrice, KeySpecs, SpecSection, SpecRow,
            SuitabilityList (เหมาะกับ/ไม่เหมาะกับ), AddToCompareButton
compare/    CompareTable, CompareMobileView, ComparePhonePicker,
            CompareTray (แถบลอยล่างจอเมื่อมีรุ่นที่เลือกไว้), DiffToggle
picks/      PicksHeader (เดือน), PickCategoryCard, MonthArchiveNav
```

หลักการ
- `ui/` ไม่รู้จัก domain (ไม่มีคำว่า Phone) → นำกลับมาใช้ได้ทุกที่
- Component ที่รู้จัก domain รับ props เป็น type จาก `core/domain` เท่านั้น ไม่ fetch ข้อมูลเอง
- Server Component เป็นค่าเริ่มต้น; ใช้ `'use client'` เฉพาะที่มี interaction (wizard, compare tray, filter)

**RecommendationCard**
```
┌──────────────────────────────┐
│ [SlotLabel: สมดุลกว่า]         │
│        [Phone Image]         │
│ Brand Model                  │
│ ~฿14,990 (8/256GB)           │
│ Chip · 6.67" 120Hz · 6500mAh │  ← KeySpecs
│ · 90W · 50MP                 │
│ Headline (1–2 บรรทัด)          │
│ ▸ ทำไมเราแนะนำ (2–3 ข้อ)        │
│ + ข้อดี   − ควรพิจารณา          │
│ [View Details] [+ Compare]   │
└──────────────────────────────┘
```

---

## 8. User Flow

```
Home ──[Find My Phone]──► Finder: Step 1 Budget (เลือก 1)
                              │
                              ▼
                          Step 2 Lifestyle (เลือก 1–2)  ── [ย้อนกลับ] ──► Step 1
                              │ [ดูมือถือที่แนะนำ]
                              ▼
                          Results (~3 รุ่น, ตาม slot)
                          │  ├─ แก้ไขตัวเลือก (chips) ──► Finder (คงค่าเดิม)
                          │  ├─ [+ Compare] ──► Compare Tray (ลอยล่างจอ)
                          ▼
                          Phone Detail ──[Compare]──► Compare Tray
                              │
                              ▼
                          Compare (2–3 รุ่น) ──► ผู้ใช้ตัดสินใจเอง
```

ทางเข้าอื่น: `/phones` (ค้นเอง), `/picks` (ดูแนะนำประจำเดือน) → Detail → Compare

---

## 9. UI/UX

**Visual**
- พื้นขาว/เทาอ่อนมาก, สีข้อความ neutral (slate/zinc), **Accent สีเดียว** (เช่น น้ำเงิน) ใช้กับปุ่มหลักและ state ที่เลือก
- Card: border 1px + radius กลาง ๆ, ไม่มีเงาหนัก, ไม่มี gradient, ไม่มี badge ลดราคา/"HOT"
- Typography: **Inter** (อังกฤษ/ตัวเลข) + **IBM Plex Sans Thai** หรือ **Noto Sans Thai** (ภาษาไทยอ่านง่าย, line-height ≥ 1.6 สำหรับไทย)
- ตัวเลขสเปกใช้ `tabular-nums` ให้ตารางตรงกัน
- รูปมือถือ: พื้นหลังโปร่ง/สีเดียวกันทุกรุ่น สัดส่วนเดียวกัน → หน้าดูเป็นระเบียบ
- Animation: แค่ transition 150–200ms ตอน hover/select และเปลี่ยน step; เคารพ `prefers-reduced-motion`

**Mobile-first**
- Finder: ตัวเลือกเป็น SelectableCard เต็มความกว้าง แตะง่าย (≥ 44px), ปุ่ม "ถัดไป" sticky ล่างจอ
- Results: Card ซ้อนแนวตั้ง (ไม่ใช้ carousel — carousel ซ่อนตัวเลือกและทำให้รุ่นแรกดูสำคัญกว่า)
- Compare บนมือถือ: คอลัมน์ป้ายสเปกเป็น **แถวหัวข้อ** แล้วค่าของแต่ละรุ่นเรียงข้างกันใต้หัวข้อ (2–3 คอลัมน์แคบ) + หัวตารางชื่อรุ่น sticky ด้านบน + ปุ่ม "แสดงเฉพาะที่ต่างกัน"
- Compare ไม่ไฮไลต์ "ผู้ชนะ" ในแต่ละแถว — แสดงค่าเป็นกลาง ให้ผู้ใช้ตีความเอง

**ความน่าเชื่อถือ**
- ทุกหน้ามี "ข้อมูลอัปเดตเมื่อ …" และ "ราคาโดยประมาณ อาจต่างตามร้าน"
- หน้า `/about` อธิบายวิธีคัดเลือก (ไม่มีคะแนน, ไม่มีสปอนเซอร์กำหนดผล)
- Accessibility: contrast AA, keyboard navigation ครบ, `aria-pressed` บนตัวเลือก, alt text รูป

---

## 10. Data Management

**MVP (JSON ในโปรเจกต์)**
1. `pnpm new-phone "Brand Model"` → สร้างไฟล์จาก template
2. กรอกสเปก + editorial + วันที่อัปเดต + แหล่งที่มา
3. `pnpm validate-data` → Zod ตรวจ schema, id ซ้ำ, รูปภาพมีจริง, picks อ้างถึง phone ที่มีอยู่
4. CI รัน validate ทุก PR → ข้อมูลเสียเข้า production ไม่ได้
5. Build ใหม่ → หน้า static อัปเดตอัตโนมัติ

**เปลี่ยน Data Source ในอนาคต**
```ts
export interface PhoneRepository {
  getAll(): Promise<Phone[]>;
  getBySlug(slug: string): Promise<Phone | null>;
  getByIds(ids: string[]): Promise<Phone[]>;
}
// MVP:  new JsonPhoneRepository('data/phones')
// V2:   new SqlPhoneRepository(db)
// V3:   CachedRepository(new ExternalApiPhoneRepository(...))
```
Service/Engine/UI ไม่ต้องแก้เลย — เปลี่ยนแค่จุดสร้าง repository (dependency injection ง่าย ๆ ใน `server/container.ts`)

**ข้อควรระวังด้านข้อมูล**: ข้อมูลตัวอย่างที่ใส่ใน MVP ต้องตรวจสอบกับแหล่งทางการก่อนเผยแพร่จริง — ราคาในไทยเปลี่ยนเร็ว จึงแยก `priceUpdatedAt` ออกจาก `specsUpdatedAt` และแสดงบนหน้าเว็บ

---

## 11. Monthly Recommendation

**ไฟล์ `data/picks/2026-09.json`**
```json
{
  "month": "2026-09",
  "title": "Recommended Phones — September 2026",
  "intro": "สรุปมือถือที่น่าสนใจประจำเดือนกันยายน",
  "publishedAt": "2026-09-01",
  "status": "published",
  "categories": [
    { "key": "best-overall", "phoneId": "…", "blurb": "…", "alternatives": ["…"] },
    { "key": "best-camera",  "phoneId": "…", "blurb": "…" },
    { "key": "best-gaming",  "phoneId": "…", "blurb": "…" },
    { "key": "best-value",   "phoneId": "…", "blurb": "…" },
    { "key": "best-battery", "phoneId": "…", "blurb": "…" },
    { "key": "best-budget",  "phoneId": "…", "blurb": "…" }
  ]
}
```

- หมวด (`key` → ชื่อ/ไอคอน/คำอธิบาย) อยู่ใน `config/pick-categories.ts` → เพิ่มหมวดใหม่ได้โดยไม่แตะ UI
- `/picks` แสดงเดือนล่าสุดที่ `status = published` อัตโนมัติ, `/picks/[month]` เป็น archive
- เปลี่ยนเดือน = เพิ่มไฟล์ใหม่ 1 ไฟล์ (ไม่ต้องแก้ Code)
- `alternatives` ช่วยสื่อว่า "Best" เป็นหมวดคำแนะนำ ไม่ใช่ผู้ชนะเด็ดขาด
- V2: `pnpm draft-picks 2026-10` ให้ engine เสนอ candidate แต่ละหมวดจากข้อมูลล่าสุด → บรรณาธิการเลือก/เขียน blurb เอง (คนตัดสินใจ ไม่ใช่อัลกอริทึม)

---

## 12. Roadmap

### MVP (v1) — เป้าหมาย: Flow หลักครบ ใช้งานได้จริงบนมือถือ
- [ ] Setup: Next.js + TS + Tailwind + ESLint/Prettier + Vitest + CI
- [ ] Domain types + Zod schema + `validate-data` script
- [ ] ข้อมูลมือถือ ~20–30 รุ่น ครอบคลุม 4 ช่วงงบ (ตรวจสอบข้อมูลก่อนเผยแพร่)
- [ ] Recommendation engine + unit tests
- [ ] Layout + Home
- [ ] Finder wizard + Results
- [ ] Phone Detail
- [ ] Compare (+ Compare Tray, localStorage + URL)
- [ ] Phones of the Month (1 เดือน) + archive route
- [ ] Phones list, About, Guides placeholder
- [ ] Responsive QA (mobile/tablet/desktop), Accessibility pass, E2E test flow หลัก
- [ ] Deploy

### Version 2 — ข้อมูลจริงจังขึ้น + เนื้อหา
- PostgreSQL + Drizzle, migrate JSON → DB (repository สลับตัวเดียว)
- Admin หน้าเพิ่ม/แก้มือถือ (มี auth) หรือ Headless CMS
- ประวัติราคา + แสดง "ราคาเปลี่ยนจากเดือนก่อน"
- คำถามเสริมใน Finder (optional): iOS/Android, ขนาดจอ, แบรนด์ที่ชอบ/ไม่ชอบ
- Guides เป็น MDX, SEO (structured data, OG image ต่อรุ่น), Dark mode
- i18n TH/EN, `draft-picks` script, analytics แบบเคารพความเป็นส่วนตัว

### Version 3 — อัตโนมัติ + ฉลาดขึ้น
- Python worker แยก: ดึงราคา/สเปกจากแหล่งภายนอก → รอตรวจก่อน publish (human-in-the-loop)
- LLM layer (ทางเลือก) เขียนคำอธิบายเฉพาะบุคคล **จาก output ของ rule engine** (grounded, ไม่คิดเหตุผลเอง)
- บันทึกการเปรียบเทียบ/รายการที่สนใจ (บัญชีผู้ใช้), feedback "คำแนะนำนี้ช่วยไหม" เพื่อปรับ rule
- Public API สำหรับ LINE bot / mobile app

---

## 13. Open Questions

ต้องการคำตอบก่อนเริ่มเขียน Code:

1. **Tech Stack** — ยืนยันทางเลือก A (Next.js + TypeScript full stack) หรือต้องการ B (FastAPI + Next.js)?
2. **ภาษาของเนื้อหา** — UI/เนื้อหาเป็นภาษาไทยเป็นหลัก (หัวข้อหลักภาษาอังกฤษตามตัวอย่าง) ใช่ไหม? ต้องการเตรียม i18n ตั้งแต่ MVP หรือไม่?
3. **รายการ Lifestyle** — ใช้ 6 แบบตามข้อ 5.3 (Balanced, Camera, Gaming, Battery, Entertainment, Value) ได้ไหม?
4. **ข้อมูลมือถือเริ่มต้น** — ให้ผมเตรียมชุดข้อมูลตัวอย่าง (ต้องตรวจราคา/สเปกอีกครั้งก่อนเผยแพร่) หรือคุณมีรายชื่อรุ่นที่ต้องการอยู่แล้ว?
5. **Deploy** — Vercel โอเคไหม?
