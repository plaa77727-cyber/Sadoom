"use strict";
/* State ของรายการ Compare */

/* ============================================================
   4. STATE — Compare list (localStorage แบบปลอดภัย)
   ============================================================ */
const CompareStore = (() => {
  const KEY = "phone-finder:compare";
  let ids = [];
  try { ids = JSON.parse(localStorage.getItem(KEY) || "[]").filter(getPhone); } catch { ids = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* ignore */ } };
  return {
    get: () => [...ids],
    has: (id) => ids.includes(id),
    toggle(id) {
      if (ids.includes(id)) { ids = ids.filter((x) => x !== id); save(); return "removed"; }
      if (ids.length >= MAX_COMPARE) return "full";
      ids.push(id); save(); return "added";
    },
    set(next) { ids = next.filter(getPhone).slice(0, MAX_COMPARE); save(); },
    clear() { ids = []; save(); },
  };
})();
