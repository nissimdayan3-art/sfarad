// lib.js – לוגיקה טהורה (בלי DOM ובלי Firebase), ניתנת לבדיקה אוטומטית: node --test tests/

// ===== תאריכים וגימטריה =====
export const D = d => new Date(d + "T12:00:00");

export function heLetters(d) {   // למשל: י״ג חשוון תשפ״ז
  const e = new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric", year: "numeric" }).formatToParts(D(d));
  const m = new Intl.DateTimeFormat("he-u-ca-hebrew", { month: "long" }).formatToParts(D(d)).find(v => v.type === "month").value;
  return gem(+e.find(v => v.type === "day").value) + " " + m + " " + gem(+e.find(v => v.type === "year").value % 1000);
}

export const HM = { Tishri: ["תשרי"], Heshvan: ["חשון"], Kislev: ["כסלו"], Tevet: ["טבת"], Shevat: ["שבט"], Adar: ["אדר א'", "אדר ב'"], "Adar I": ["אדר א'"], "Adar II": ["אדר ב'"], Nisan: ["ניסן"], Iyar: ["אייר"], Sivan: ["סיון"], Tamuz: ["תמוז"], Av: ["אב"], Elul: ["אלול"] };
export const MONTHS = ["תשרי", "חשון", "כסלו", "טבת", "שבט", "אדר א'", "אדר ב'", "ניסן", "אייר", "סיון", "תמוז", "אב", "אלול"];
export const hebOf = dt => { const p = new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric", month: "long" }).formatToParts(dt); return { day: +p.find(x => x.type === "day").value, month: p.find(x => x.type === "month").value }; };
// ימי השבוע (א׳–שבת) שמסתיים בשבת הנתונה (offset 0) או בשבת שאחריה (offset 1) → קבוצת מפתחות "יום|חודש"
export function weekKeys(shabbat, offset) {
  const end = new Date(shabbat + "T12:00:00"); end.setDate(end.getDate() + offset * 7);
  const keys = [];
  for (let k = 6; k >= 0; k--) {
    const d = new Date(end); d.setDate(end.getDate() - k);
    const h = hebOf(d);
    (HM[h.month] || []).forEach(m => keys.push(h.day + "|" + m));
    if (h.day === 1) { const pv = new Date(d); pv.setDate(d.getDate() - 1); const hp = hebOf(pv); if (hp.day === 29) (HM[hp.month] || []).forEach(m => keys.push("30|" + m)); }
  }
  return new Set(keys);
}
// מפתחות "יום|חודש" ליום בודד (כולל ל׳ בחודש חסר ← א׳ בחודש שאחריו)
export function dayKeys(d) {
  const h = hebOf(d), keys = [];
  (HM[h.month] || []).forEach(m => keys.push(h.day + "|" + m));
  if (h.day === 1) { const pv = new Date(d); pv.setDate(d.getDate() - 1); const hp = hebOf(pv); if (hp.day === 29) (HM[hp.month] || []).forEach(m => keys.push("30|" + m)); }
  return new Set(keys);
}

const GEM = { "א": 1, "ב": 2, "ג": 3, "ד": 4, "ה": 5, "ו": 6, "ז": 7, "ח": 8, "ט": 9, "י": 10, "כ": 20, "ל": 30 };
export const gday = tok => [...tok].reduce((a, ch) => a + (GEM[ch] || 0), 0);

// שנה עברית: מספר ← אותיות (5787 → תשפ״ז), והמרת תאריך לאותו יום־וחודש בשנה אחרת
export const gem = n => {
  n = n % 1000; let h = Math.floor(n / 100), r = n % 100, g = "";
  while (h > 4) { g += "\u05EA"; h -= 4; } g += ["", "\u05E7", "\u05E8", "\u05E9", "\u05EA"][h];
  g += r === 15 ? "\u05D8\u05D5" : r === 16 ? "\u05D8\u05D6" : ["", "\u05D9", "\u05DB", "\u05DC", "\u05DE", "\u05E0", "\u05E1", "\u05E2", "\u05E4", "\u05E6"][Math.floor(r / 10)] + ["", "\u05D0", "\u05D1", "\u05D2", "\u05D3", "\u05D4", "\u05D5", "\u05D6", "\u05D7", "\u05D8"][r % 10];
  return g.length > 1 ? g.slice(0, -1) + "\u05F4" + g.slice(-1) : g + "\u05F3";
};

// ===== טקסט עברי וחיפוש גאונים =====
// זיהוי שמות גאונים בתוך טקסט חופשי (עברית): התעלמות מניקוד/גרשיים/תארים, ותחיליות כמו ב־ל־ה־ו־מ־ש־כ
export const nrm = x => String(x || "").replace(/[\u0591-\u05C7]/g, "").replace(/["'\u05F4\u05F3\u201C\u201D\u2018\u2019`]/g, "").replace(/[-\u2013\u05BE,.:;!?*#]/g, " ").replace(/\s+/g, " ").trim();
const HONOR = /^(?:(?:\u05E8\u05D1\u05D9\u05E0\u05D5|\u05E8\u05D1\u05E0\u05D5|\u05E8\u05D1\u05D9|\u05E8\u05D1|\u05D4\u05E8\u05D1|\u05DE\u05E8\u05DF|\u05D4\u05D2\u05D0\u05D5\u05DF|\u05D4\u05E6\u05D3\u05D9\u05E7|\u05D4\u05D7\u05DB\u05DD|\u05D7\u05DB\u05DD|\u05D4\u05E8\u05D4\u05D2)\s+)+/;
export const sageCands = g => {
  const out = new Set();
  String(g.n || "").split(/[()\[\]]/).forEach(part => {
    const full = nrm(part); if (!full) return;
    [full, full.replace(HONOR, "")].forEach(c => { if (c.length >= 4 && (c.includes(" ") || c.length >= 5)) out.add(c); });
  });
  return [...out];
};
export const hasPhrase = (text, cand) => {
  for (let at = text.indexOf(cand); at !== -1; at = text.indexOf(cand, at + 1)) {
    const before = at === 0 || text[at - 1] === " " || ((at === 1 || (at >= 2 && text[at - 2] === " ")) && "\u05D1\u05DC\u05D4\u05D5\u05DE\u05E9\u05DB".includes(text[at - 1]));
    const end = at + cand.length, after = end === text.length || text[end] === " ";
    if (before && after) return true;
  }
  return false;
};
export const findSagesInText = (txt, all) => { const t = nrm(txt); if (!t) return []; return all.filter(g => sageCands(g).some(c => hasPhrase(t, c))); };

const HONSET = new Set(["רבי", "רב", "הרב", "מרן", "רבינו", "רבנו", "הגאון", "החכם", "חכם", "הצדיק", "ר"]);
// כינויי חודשים (חשוון/מרחשוון/כסליו/סיוון…) וקידומת ב/ל לפני חודש (בחשון, לניסן)
const sageTok = x => { if (/^[בל]/.test(x) && MAL[x.slice(1)]) x = x.slice(1); return MAL[x] || x; };
// חיפוש לפי יום בחודש: מספר (13) או אותיות (יג / י״ג / טו) – מתאים ליום בחודש של הגאון
const DAYLET = /^(?:טו|טז|[יכל]?[א-ט]|[יכל])$/;
const tokDay = x => { const n = /^\d{1,2}$/.test(x) ? +x : DAYLET.test(x) ? gday(x) : 0; return n >= 1 && n <= 30 ? n : 0; };
export const sageQuery = q => { let tk = nrm(q).toLowerCase().split(" ").filter(Boolean).map(sageTok); if (tk.length > 1) { const k = tk.filter(x => !HONSET.has(x)); if (k.length) tk = k; } return tk; };
const sageHay = g => g._h || (g._h = " " + nrm([g.n, g.c, g.city, g.d, g.t, g.m, g.y].join(" ")).toLowerCase());
const sageNameHay = g => g._nh || (g._nh = " " + nrm(g.n).toLowerCase());
const sageScore = (g, tk, loose) => {
  const h = sageHay(g);
  for (const x of tk) {
    const dn = tokDay(x), digits = /^\d{1,2}$/.test(x);
    if (digits ? +g.day !== dn : !h.includes((loose ? "" : " ") + x) && !(dn && +g.day === dn)) return 0;
  }
  const nn = sageNameHay(g); let sc = 1;
  if (tk.every(x => nn.includes(" " + x))) sc += 10;
  if (nn.includes(" " + tk.join(" "))) sc += 5;
  return sc;
};
export function sageSearch(arr, q) {
  const toks = sageQuery(q); if (!toks.length) return { list: arr, toks: [], loose: false };
  let r = arr.map(g => [g, sageScore(g, toks, false)]).filter(x => x[1] > 0), loose = false;
  if (!r.length) { r = arr.map(g => [g, sageScore(g, toks, true)]).filter(x => x[1] > 0); loose = r.length > 0; }
  r.sort((a, b) => b[1] - a[1]);
  return { list: r.map(x => x[0]), toks, loose };
}

export const sortKey = n => n.replace(/^(רבי|הרב|מרן|רבינו|ר')\s+/, "");

// ===== לוח הלכה יומית, שקיעה ויום עברי =====
export const pad2 = n => String(n).padStart(2, "0");
export const isoOf = d => d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
// ===== היום העברי מתחלף בשקיעה (חישוב מקומי לפי אזור הזמן של המכשיר; בלי הרשאות מיקום) =====
const SUNSET_OFFSET_MIN = 0; // 0 = שקיעה; אפשר להגדיל (למשל 20–40) כדי להחליף ביציאת הכוכבים
const TZLOC = {
  "Asia/Jerusalem": [31.778, 35.235], "Asia/Tel_Aviv": [31.778, 35.235],
  "America/New_York": [40.713, -74.006], "America/Toronto": [43.651, -79.383], "America/Montreal": [45.502, -73.567], "America/Chicago": [41.878, -87.63], "America/Denver": [39.739, -104.99], "America/Los_Angeles": [34.052, -118.244], "America/Mexico_City": [19.433, -99.133], "America/Bogota": [4.711, -74.072], "America/Caracas": [10.48, -66.904], "America/Lima": [-12.046, -77.043], "America/Santiago": [-33.449, -70.669], "America/Argentina/Buenos_Aires": [-34.604, -58.382], "America/Buenos_Aires": [-34.604, -58.382], "America/Sao_Paulo": [-23.55, -46.633],
  "Europe/London": [51.507, -0.128], "Europe/Paris": [48.857, 2.352], "Europe/Brussels": [50.85, 4.352], "Europe/Amsterdam": [52.368, 4.904], "Europe/Zurich": [47.377, 8.541], "Europe/Madrid": [40.417, -3.704], "Europe/Rome": [41.903, 12.496], "Europe/Berlin": [52.52, 13.405], "Europe/Moscow": [55.756, 37.617], "Africa/Casablanca": [33.573, -7.59], "Africa/Johannesburg": [-26.204, 28.047],
  "Australia/Sydney": [-33.869, 151.209], "Australia/Melbourne": [-37.814, 144.963]
};
export const hereLoc = () => {
  let tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch {}
  if (TZLOC[tz]) return TZLOC[tz];
  const off = -new Date().getTimezoneOffset() / 60; // שעות מזרחה מ-UTC
  return Math.abs(off - 2) < 1.1 ? TZLOC["Asia/Jerusalem"] : [40, off * 15];
};
// שקיעה (מילישניות UTC) ביום לועזי נתון במיקום נתון – אלגוריתם almanac, דיוק של כדקה–שתיים
export function sunsetMs(y, mo, d, lat, lon) {
  const R = Math.PI / 180, N = Math.floor(275 * mo / 9) - Math.floor((mo + 9) / 12) * (1 + Math.floor((y - 4 * Math.floor(y / 4) + 2) / 3)) + d - 30;
  const lh = lon / 15, tt = N + (18 - lh) / 24, M = 0.9856 * tt - 3.289;
  const L = (((M + 1.916 * Math.sin(M * R) + 0.02 * Math.sin(2 * M * R) + 282.634) % 360) + 360) % 360;
  let RA = (((Math.atan(0.91764 * Math.tan(L * R)) / R) % 360) + 360) % 360;
  RA = (RA + (Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90)) / 15;
  const sd = 0.39782 * Math.sin(L * R), cd = Math.cos(Math.asin(sd));
  const ch = (Math.cos(90.833 * R) - sd * Math.sin(lat * R)) / (cd * Math.cos(lat * R));
  if (ch > 1 || ch < -1) return null;
  const T = Math.acos(ch) / R / 15 + RA - 0.06571 * tt - 6.622, ut = (((T - lh) % 24) + 24) % 24;
  const noon = Date.UTC(y, mo - 1, d, 12) - lh * 3600e3; let best = null;
  for (const k of [-1, 0, 1]) { const c = Date.UTC(y, mo - 1, d) + (ut + 24 * k) * 3600e3; if (best === null || Math.abs(c - (noon + 6 * 3600e3)) < Math.abs(best - (noon + 6 * 3600e3))) best = c; }
  return best;
}
export const isAfterSunset = (now = new Date()) => { try { const [la, lo] = hereLoc(), s = sunsetMs(now.getFullYear(), now.getMonth() + 1, now.getDate(), la, lo); return s != null && now.getTime() >= s + SUNSET_OFFSET_MIN * 60e3; } catch { return false; } };
export const todayStr = () => { const n = new Date(); if (isAfterSunset(n)) n.setDate(n.getDate() + 1); return isoOf(n); };
export const dayDiff = (a, b) => { const p = x => { const [y, m, d] = x.split("-").map(Number); return Date.UTC(y, m - 1, d); }; return Math.round((p(b) - p(a)) / 864e5); };
export const halIdx = (m, day) => ((dayDiff(m.start, day) % m.count) + m.count) % m.count;
const HHM = { Tishri: ["תשרי"], Heshvan: ["חשון"], Kislev: ["כסלו"], Tevet: ["טבת"], Shevat: ["שבט"], Adar: ["אדר", "אדר ב'", "אדר א'"], "Adar I": ["אדר א'"], "Adar II": ["אדר ב'", "אדר"], Nisan: ["ניסן"], Iyar: ["אייר"], Sivan: ["סיון"], Tamuz: ["תמוז"], Av: ["אב"], Elul: ["אלול"] };
// מפתחות חיפוש ליום נתון, לפי סדר עדיפות: תאריך לועזי מדויק, עברי עם שנה, לועזי חוזר, עברי חוזר
export function halKeysFor(d) {
  const iso = isoOf(d), p = new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric", month: "long", year: "numeric" }).formatToParts(d);
  const day = +p.find(x => x.type === "day").value, mo = p.find(x => x.type === "month").value, yr = +p.find(x => x.type === "year").value, mn = HHM[mo] || [];
  return ["g:" + iso, ...mn.map(m => "hy:" + yr + "|" + day + "|" + m), "gm:" + iso.slice(5), ...mn.map(m => "hr:" + day + "|" + m)];
}
const HG = { "א": 1, "ב": 2, "ג": 3, "ד": 4, "ה": 5, "ו": 6, "ז": 7, "ח": 8, "ט": 9, "י": 10, "כ": 20, "ל": 30, "מ": 40, "נ": 50, "ס": 60, "ע": 70, "פ": 80, "צ": 90, "ק": 100, "ר": 200, "ש": 300, "ת": 400 };
const MAL = { "תשרי": "תשרי", "חשון": "חשון", "חשוון": "חשון", "מרחשון": "חשון", "מרחשוון": "חשון", "כסלו": "כסלו", "כסליו": "כסלו", "טבת": "טבת", "שבט": "שבט", "אדר": "אדר", "ניסן": "ניסן", "אייר": "אייר", "סיון": "סיון", "סיוון": "סיון", "תמוז": "תמוז", "אב": "אב", "מנחם": "אב", "אלול": "אלול" };
const gsum = w => [...w].reduce((a, ch) => a + (HG[ch] || 0), 0);
// מחלץ מפתחות מתאריך שנכתב בטקסט (לועזי או עברי)
export function halTextKeys(txt) {
  const keys = []; txt = String(txt || "");
  let m = txt.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) keys.push("g:" + m[1] + "-" + pad2(+m[2]) + "-" + pad2(+m[3]));
  else if ((m = txt.match(/(\d{1,2})[./\-](\d{1,2})[./\-](\d{2,4})/))) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; keys.push("g:" + y + "-" + pad2(+m[2]) + "-" + pad2(+m[1])); }
  if (keys.length) { keys.push("gm:" + keys[0].slice(7)); return keys; }
  const w = txt.replace(/["'׳״’‘“”`]/g, "").replace(/[,.()\[\]]/g, " ").split(/\s+/).filter(Boolean);
  let mi = -1, mon = "";
  for (let i = 0; i < w.length && mi < 0; i++) { const c = MAL[w[i]] || (w[i][0] === "ב" || w[i][0] === "ל" ? MAL[w[i].slice(1)] : null); if (c) { mi = i; mon = c; } }
  if (mi < 0) return keys;
  if (mon === "אדר" && (w[mi + 1] === "א" || w[mi + 1] === "ב")) mon = "אדר " + w[mi + 1] + "'";
  let day = 0;
  for (let i = mi - 1; i >= 0 && !day; i--) { const x = w[i]; if (/^(\d{1,2})$/.test(x) && +x >= 1 && +x <= 30) day = +x; else if (/^(טו|טז|[יכ]?[א-ט]|[יכל])$/.test(x)) day = gsum(x); }
  if (!day) for (let i = mi + 1; i < w.length && !day; i++) { const x = w[i]; if (/^(\d{1,2})$/.test(x) && +x >= 1 && +x <= 30) day = +x; }
  if (!day) return keys;
  let yr = 0;
  for (const x of w) { if (/^5\d{3}$/.test(x)) yr = +x; else if (/^ה?ת[א-ת]{1,4}$/.test(x)) { const v = 5000 + gsum(x.replace(/^ה(?=ת)/, "")); if (v >= 5700 && v <= 5900) yr = v; } }
  if (yr) keys.push("hy:" + yr + "|" + day + "|" + mon);
  keys.push("hr:" + day + "|" + mon);
  return keys;
}
// מפתחות לשורה בקובץ: מכל העמודות ששמן כולל "יום" או "תאריך"
export function halRowKeys(row, dateCols) {
  const cols = dateCols || Object.keys(row).filter(k => /תאריך|^\s*יום(\s|$)/.test(k)), out = [];
  let txt = "";
  cols.forEach(k => { const v = row[k]; if (v instanceof Date) { const d = new Date(v.getTime() + 12 * 3600e3); out.push("g:" + d.getUTCFullYear() + "-" + pad2(d.getUTCMonth() + 1) + "-" + pad2(d.getUTCDate())); out.push("gm:" + pad2(d.getUTCMonth() + 1) + "-" + pad2(d.getUTCDate())); } else txt += " " + String(v); });
  return out.length ? out : halTextKeys(txt);
}
export const addDays = (iso, n) => { const dt = new Date(iso + "T12:00:00"); dt.setDate(dt.getDate() + n); return isoOf(dt); };


// ===== קישורים בתוך טקסט חופשי =====
// מפצל טקסט לחלקים: {t:"text",v} או {t:"link",v,href}. רק http/https (www. ודומיינים גלויים מקבלים https://).
const URL_RE = /(https?:\/\/[^\s\u0590-\u05FF<>"'\u05F4]+|(?<![@\w./-])www\.[^\s\u0590-\u05FF<>"'\u05F4]+|(?<![@\w./-])(?:[a-z0-9-]+\.)+(?:com|org|net|info|edu|gov|il|io|tv|me|co|ly|be)(?![a-z0-9-])(?:\/[^\s\u0590-\u05FF<>"'\u05F4]*)?)/gi;
export function linkParts(text) {
  const s = String(text == null ? "" : text), out = []; let last = 0, m;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(s))) {
    let u = m[0];
    // גזירת סימני פיסוק בסוף הכתובת (נקודה, פסיק, סוגר ללא פותח וכו')
    for (;;) {
      const c = u[u.length - 1];
      if (/[.,;:!?'"\u05F3\u05F4\u2026]/.test(c)) u = u.slice(0, -1);
      else if (c === ")" && (u.match(/\(/g) || []).length < (u.match(/\)/g) || []).length) u = u.slice(0, -1);
      else break;
    }
    if (!/[a-z0-9]\.[a-z]|:\/\//i.test(u)) continue;
    if (m.index > last) out.push({ t: "text", v: s.slice(last, m.index) });
    out.push({ t: "link", v: u, href: /^https?:\/\//i.test(u) ? u : "https://" + u });
    last = m.index + u.length; URL_RE.lastIndex = last;
  }
  if (last < s.length) out.push({ t: "text", v: s.slice(last) });
  return out;
}

// האם בין שתי רשימות גיליונות השתנו רק מוני הצפיות/הורדות? (אז אין צורך לצייר מחדש את האתר)
export function onlyCountersChanged(prev, next) {
  if (!prev || !next || prev.length !== next.length) return false;
  const strip = x => { const { views, downloads, ...r } = x; return JSON.stringify(Object.keys(r).sort().map(k => [k, r[k]])); };
  const m = new Map(prev.map(x => [x.id, strip(x)]));
  return next.every(x => m.has(x.id) && m.get(x.id) === strip(x));
}

// ===== ייבוא נרשמים עם פרטים (CSV/Excel/טקסט חופשי) =====
export const SUB_LIM = { name: 60, phone: 30, city: 60, note: 300 };
export const cleanField = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const SUB_HDR = { name: /^(שם|שם מלא|שם פרטי|name|full ?name|first ?name)$/i, phone: /^(טלפון|נייד|פלאפון|טל|phone|mobile|tel)$/i, city: /^(עיר|ישוב|יישוב|מדינה|city|country|town)$/i, note: /^(הערה|הערות|note|notes|comment|comments)$/i, lang: /^(שפה|language|lang)$/i };
export const langOf = v => { const x = String(v || "").trim().toLowerCase(); return /^(he|עברית|hebrew|עב)$/.test(x) ? "he" : /^(en|english|אנגלית)$/.test(x) ? "en" : /^(fr|fran[cç]ais|french|צרפתית)$/.test(x) ? "fr" : /^(es|espa[nñ]ol|spanish|ספרדית)$/.test(x) ? "es" : ""; };
const EMAIL_G = /[^\s,;<>"'()]+@[^\s,;<>"'()]+\.[^\s,;<>"'()]+/g;
function splitCells(line) {
  const cells = []; let cur = "", q = false;
  for (let k = 0; k < line.length; k++) {
    const ch = line[k];
    if (ch === '"') { if (q && line[k + 1] === '"') { cur += '"'; k++; } else q = !q; }
    else if (!q && (ch === "," || ch === ";" || ch === "\t")) { cells.push(cur); cur = ""; }
    else cur += ch;
  }
  cells.push(cur); return cells.map(c => c.trim());
}
// מחזיר Map: כתובת -> {email, name?, phone?, city?, note?, lang?}. כותרות בעברית/אנגלית ממפות עמודות; בלעדיהן, שורה עם כתובת + תא טקסט אחד = שם
export function parseSubRows(txt) {
  const out = new Map(); let map = null;
  for (const line of String(txt || "").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = splitCells(line);
    if (!/@/.test(line)) {
      const m = {}; cells.forEach((c, k) => { for (const key in SUB_HDR) if (SUB_HDR[key].test(c)) m[key] = k; });
      if (Object.keys(m).length) map = m;
      continue;
    }
    const emails = [...new Set((line.toLowerCase().match(EMAIL_G) || []).map(x => x.replace(/[.,]+$/, "")).filter(x => x.length < 120 && /^[^@ ]+@[^@ ]+\.[^@ ]+$/.test(x)))];
    if (!emails.length) continue;
    const rec = {};
    if (emails.length === 1) {
      const ek = cells.findIndex(c => c.toLowerCase().includes(emails[0]));
      if (map) {
        for (const key of ["name", "phone", "city", "note"]) if (map[key] != null && map[key] !== ek && cells[map[key]]) rec[key] = cleanField(cells[map[key]], SUB_LIM[key]);
        if (map.lang != null && langOf(cells[map.lang])) rec.lang = langOf(cells[map.lang]);
      } else {
        const others = cells.filter((c, k) => k !== ek && c);
        if (others.length === 1 && !/@/.test(others[0]) && /[A-Za-z\u0590-\u05ff]{2}/.test(others[0])) rec.name = cleanField(others[0], SUB_LIM.name);
      }
    }
    for (const e of emails) { const prev = out.get(e) || { email: e }; out.set(e, { ...prev, ...Object.fromEntries(Object.entries(emails.length === 1 ? rec : {}).filter(([, v]) => v)) }); }
  }
  return out;
}
export const subDoc = r => { const d = { email: r.email, lang: r.lang || "he", ts: 1 }; for (const k of ["name", "phone", "city", "note"]) if (r[k]) d[k] = r[k]; return d; };

// ===== תמונות חכמים (1.28.0) =====
// שורת חכם: [id, שם, מדינה, עיר, פרטים, שנה, תאריך, יום, חודש, כתובת-תמונה]. התמונה (אינדקס 9) אופציונלית.
export const PHOTO_IDX = 9;
// תמונות נוספות (1.29.0): אינדקס 10 = מערך של [כתובת, פירוט] – למשל תמונות הספר שחיבר החכם
export const BOOKS_IDX = 10, BOOKS_MAX = 12, BOOK_CAP_MAX = 300;
export const cleanBooks = a => Array.isArray(a)
  ? a.filter(x => Array.isArray(x) && typeof x[0] === "string" && /^https:\/\//.test(x[0])).slice(0, BOOKS_MAX)
      .map(x => [x[0], typeof x[1] === "string" ? x[1].trim().slice(0, BOOK_CAP_MAX) : ""])
  : [];
// ייבוא מאקסל מחליף את כל הרשימה – מעבירים לשורות החדשות את כתובות התמונות הקיימות (לפי מזהה החכם).
export function carryPhotos(rows, oldRows) {
  const m = new Map();
  for (const r of oldRows || []) if (r && (r[PHOTO_IDX] || cleanBooks(r[BOOKS_IDX]).length)) m.set(r[0], r);
  let n = 0;
  for (const r of rows) { const o = m.get(r[0]); if (!o) continue; if (o[PHOTO_IDX]) r[PHOTO_IDX] = o[PHOTO_IDX]; const b = cleanBooks(o[BOOKS_IDX]); if (b.length) r[BOOKS_IDX] = b; n++; }
  return n;
}

// ===== זמני היום (1.31.0): ניתוח גיליון אקסל של עיר אחת =====
// קלט: שורות גולמיות (מערך מערכים, כמו XLSX.utils.sheet_to_json עם header:1). מחפש שורת כותרות שמכילה «תאריך».
// פלט: { h: [תוויות העמודות (בלי יום ותאריך)], d: { "YYYY-MM-DD": [ערכים בסדר העמודות] }, from, to, n } או null אם אין כותרת תאריך.
const zmPad = n => String(n).padStart(2, "0");
export function zmIso(v) {
  if (v instanceof Date && !isNaN(v)) return v.getFullYear() + "-" + zmPad(v.getMonth() + 1) + "-" + zmPad(v.getDate());
  if (typeof v === "number" && v > 30000 && v < 80000) { const dt = new Date(Math.round((v - 25569) * 86400000)); return dt.getUTCFullYear() + "-" + zmPad(dt.getUTCMonth() + 1) + "-" + zmPad(dt.getUTCDate()); } // מספר סידורי של אקסל
  const m = String(v == null ? "" : v).trim().match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2}|\d{4})$/);
  if (!m) return null;
  const y = m[3].length === 2 ? 2000 + +m[3] : +m[3], mo = +m[2], d = +m[1];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return y + "-" + zmPad(mo) + "-" + zmPad(d);
}
const zmCell = v => {
  if (v == null) return "";
  if (typeof v === "number" && v > 0 && v < 1) { const mins = Math.round(v * 1440); return Math.floor(mins / 60) + ":" + zmPad(mins % 60); } // תא שעה של אקסל
  if (v instanceof Date && !isNaN(v)) return v.getHours() + ":" + zmPad(v.getMinutes());
  return String(v).trim();
};
export function parseZmanimRows(raw) {
  const rows = Array.isArray(raw) ? raw : [];
  const hi = rows.slice(0, 15).findIndex(r => Array.isArray(r) && r.some(c => String(c == null ? "" : c).trim() === "תאריך"));
  if (hi < 0) return null;
  const hdr = rows[hi].map(c => String(c == null ? "" : c).replace(/\s+/g, " ").trim()), di = hdr.indexOf("תאריך");
  const cols = []; // אינדקסי עמודות שמוצגות: כל מה שיש לו כותרת, חוץ מ«תאריך» ו«יום בשבוע»
  hdr.forEach((h, i) => { if (h && i !== di && !/^יום( בשבוע)?$/.test(h)) cols.push(i); });
  const d = {}; let n = 0;
  for (const r of rows.slice(hi + 1)) {
    if (!Array.isArray(r)) continue;
    const iso = zmIso(r[di]); if (!iso) continue;
    const vals = cols.map(i => zmCell(r[i]));
    while (vals.length && !vals[vals.length - 1]) vals.pop();
    if (!d[iso]) n++;
    d[iso] = vals;
  }
  const keys = Object.keys(d).sort(); if (!keys.length) return null;
  return { h: cols.map(i => hdr[i]), d, from: keys[0], to: keys[keys.length - 1], n };
}
// שם עיר משם הגיליון/הקובץ: קו תחתון ← רווח, בלי סיומת
export const zmCityName = s => String(s || "").replace(/\.(xlsx?|csv)$/i, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
// מזהה מסמך ב-Firestore (בלי «/» ובלי «.» בתחילה)
export const zmCityId = name => zmCityName(name).replace(/[\/\\#?\[\]]/g, "").replace(/^\.+/, "").replace(/\s/g, "_").slice(0, 60);
// ===== הקדשות (1.32.0): אקסל «הקדשות» – שורה לכל יום עברי; עמודות א-ד = יום בשבוע, יום (אותיות), חודש, שנה; אחר כך עד 5 זוגות «שם» (גדול) / «נתרם ע"י» (קטן) =====
const DED_MON = { "תשרי": "Tishri", "חשון": "Heshvan", "כסלו": "Kislev", "טבת": "Tevet", "שבט": "Shevat", "אדר": "Adar", "אדר א": "Adar I", "אדר ב": "Adar II", "ניסן": "Nisan", "אייר": "Iyar", "סיון": "Sivan", "תמוז": "Tamuz", "אב": "Av", "אלול": "Elul" };
const dedMonth = s => { const k = nrm(s).replace(/\s+/g, " "); return DED_MON[k] || DED_MON[(MAL[k] || "")] || (k === "חשוון" ? "Heshvan" : k === "סיוון" ? "Sivan" : k === "כסליו" ? "Kislev" : null); };
const dedYear = s => { const t = nrm(s).replace(/^ה/, "").replace(/ /g, ""); const v = gsum(t); return v >= 100 ? 5000 + v : 0; };
const dedHebKey = dt => { const p = new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric", month: "long", year: "numeric" }).formatToParts(dt); const g = k => { const x = p.find(z => z.type === k); return x ? x.value : ""; }; return { d: +g("day"), m: g("month"), y: +String(g("relatedYear") || g("year")).replace(/\D/g, "") }; };
// מפה «שנה|חודש|יום» ← תאריך לועזי (ISO) לשנה עברית אחת (נבנית מסריקת הלוח הלועזי)
export function hebYearMap(y) {
  const map = {}, base = new Date(Date.UTC(y - 3761, 7, 1, 12));
  for (let i = 0; i < 460; i++) { const dt = new Date(base.getTime() + i * 864e5); let k; try { k = dedHebKey(dt); } catch { continue; } if (k.y === y) map[k.m + "|" + k.d] = dt.getUTCFullYear() + "-" + pad2(dt.getUTCMonth() + 1) + "-" + pad2(dt.getUTCDate()); }
  return map;
}
export function parseDedRows(raw) {
  const rows = Array.isArray(raw) ? raw : [], maps = {}, d = {}, bad = []; let n = 0, items = 0, lo = "", hi = "";
  for (const r of rows) {
    if (!Array.isArray(r)) continue;
    const dayTok = nrm(r[1]), mon = dedMonth(r[2]), y = dedYear(r[3]);
    if (!dayTok || !mon || !y) continue; // שורות כותרת / הוראות / דוגמה – בלי תאריך עברי
    const day = tokDay(dayTok); if (!day) { bad.push(String(r[1]) + " " + String(r[2])); continue; }
    const iso = (maps[y] || (maps[y] = hebYearMap(y)))[mon + "|" + day]; if (!iso) { bad.push(String(r[1]) + " " + String(r[2]) + " " + String(r[3])); continue; }
    const list = [];
    for (let c = 5; c + 1 < r.length + 1; c += 3) {
      const a = cleanField(r[c], 300), b = cleanField(r[c + 1], 300);
      if (a) list.push(b ? [a, b] : [a]); else if (b) bad.push(iso + ": «נתרם ע״י» בלי שם");
    }
    n++; if (!lo || iso < lo) lo = iso; if (iso > hi) hi = iso; if (list.length) { d[iso] = list; items += list.length; }
  }
  const keys = Object.keys(d).sort(); if (!n) return null;
  return { d, days: n, items, lo, hi, from: keys[0] || "", to: keys[keys.length - 1] || "", bad };
}

// פריסת האתר (1.33.0; הוגדרה מחדש ב-1.36.2): defs = [[id, תווית], …], saved = [[id, מוסתר?], …] מ-meta/layout.
// מחזיר [{id,label,hide}] לפי סדר השמור; פריט חדש/חסר נוסף בסוף (מוצג); מזהה לא מוכר נזרק. בכל קריאה – אובייקטים חדשים (הקוראים משנים hide).
export function layoutList(defs, saved) {
  const rest = (defs || []).map(d => ({ id: d[0], label: d[1], hide: false })), out = [];
  (Array.isArray(saved) ? saved : []).forEach(s => {
    const id = Array.isArray(s) ? s[0] : s && s.id, i = rest.findIndex(x => x.id === id);
    if (i < 0) return;
    const x = rest.splice(i, 1)[0]; x.hide = Array.isArray(s) ? !!s[1] : !!(s && s.hide); out.push(x);
  });
  return out.concat(rest);
}
