// פונקציות טהורות (בלי Firebase) – נבדקות ב-tests/functions.test.mjs
export const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// מספר ← אותיות עבריות (13 → י״ג)
export const gem = n => {
  n = n % 1000; let h = Math.floor(n / 100), r = n % 100, g = "";
  while (h > 4) { g += "\u05EA"; h -= 4; } g += ["", "\u05E7", "\u05E8", "\u05E9", "\u05EA"][h];
  g += r === 15 ? "\u05D8\u05D5" : r === 16 ? "\u05D8\u05D6" : ["", "\u05D9", "\u05DB", "\u05DC", "\u05DE", "\u05E0", "\u05E1", "\u05E2", "\u05E4", "\u05E6"][Math.floor(r / 10)] + ["", "\u05D0", "\u05D1", "\u05D2", "\u05D3", "\u05D4", "\u05D5", "\u05D6", "\u05D7", "\u05D8"][r % 10];
  return g.length > 1 ? g.slice(0, -1) + "\u05F4" + g.slice(-1) : g + "\u05F3";
};

export const parashaTitle = n => { n = String(n || ""); return /^שבת/.test(n) ? n : "פרשת " + n.replace(/^פרשת\s+/, ""); };
export const issueTitle = i => (i.num ? "גיליון " + (i.num < 1000 ? gem(+i.num) : i.num) + " · " : "") + parashaTitle(i.parasha);
export const issueDesc = i => {
  const d = String(i.desc || "").replace(/[#*_>`~]/g, " ").replace(/\s+/g, " ").trim();
  if (!d) return "גיליון שבועי לזכות הרבים · מכון חכמי ספרד";
  return d.length > 200 ? d.slice(0, 197).replace(/\s+\S*$/, "") + "…" : d;
};
export const imageOf = (i, site) => (i.cover && i.cover.url) || (i.pages && i.pages[0] && i.pages[0].url) || site + "/logo.jpg";

// דף HTML לקישור שיתוף /i/<id>: תוכן אמיתי לגוגל + Open Graph לתצוגה מקדימה.
// אין הפניה אוטומטית – כפתור "פתח בארכיון" מוביל לאתר (#i=...)
export function shareHtml(i, id, site, rel = {}) {
  const title = issueTitle(i), desc = issueDesc(i), img = imageOf(i, site), hasCover = !!(i.cover && i.cover.url);
  const to = "/#i=" + id, url = site + "/i/" + id;
  const iso = /^\d{4}-\d{2}-\d{2}/.test(String(i.date || "")) ? String(i.date).slice(0, 10) : "";
  const ld = { "@context": "https://schema.org", "@type": "Article", headline: title + " · חכמי ספרד", description: desc, inLanguage: "he", image: img, mainEntityOfPage: url, publisher: { "@type": "Organization", name: "מכון חכמי ספרד", url: site + "/", logo: site + "/logo.jpg" } };
  if (iso) ld.datePublished = iso;
  const ldJson = JSON.stringify(ld).replace(/</g, "\\u003c");
  const lnk = (x, label) => `<a href="/i/${esc(x.id)}">${label ? `<small>${label}</small>` : ""}${esc(issueTitle(x))}</a>`;
  const pn = [rel.prev ? lnk(rel.prev, "הגיליון הקודם") : "", rel.next ? lnk(rel.next, "הגיליון הבא") : ""].filter(Boolean).join("");
  const same = (rel.same || []).map(x => lnk(x, "")).join("");
  const navHtml = (pn ? `<nav class="pn">${pn}</nav>` : "") + (same ? `<section class="sm"><h2>אותה פרשה בשנים אחרות</h2><nav class="pn">${same}</nav></section>` : "");
  return `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8">
<title>${esc(title)} · חכמי ספרד</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="מכון חכמי ספרד">
<meta property="og:locale" content="he_IL">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
${hasCover ? '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n' : ""}<meta property="og:image:alt" content="${esc(title)}">
<meta name="twitter:card" content="${hasCover ? "summary_large_image" : "summary"}">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:image" content="${esc(img)}">
<script type="application/ld+json">${ldJson}</script>
<style>body{margin:0;background:#faf6ee;color:#2a2118;font-family:"Frank Ruhl Libre","David",serif;line-height:1.7}main{max-width:640px;margin:0 auto;padding:28px 18px 48px;text-align:center}img{max-width:100%;height:auto;border-radius:10px}h1{color:#8a5a1f;font-size:1.6rem;margin:14px 0 4px}.d{color:#7a6c5a;margin:0 0 12px}.b{display:inline-block;margin:18px 0 8px;padding:12px 26px;background:#8a5a1f;color:#fff;border-radius:10px;text-decoration:none;font-weight:700}a.h{color:#8a5a1f;display:block;margin-top:10px}.pn{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:22px 0 0}.pn a{flex:1 1 200px;max-width:300px;padding:10px 14px;border:1px solid #d9c9a8;border-radius:10px;color:#8a5a1f;text-decoration:none;font-weight:700}.pn small{display:block;font-weight:400;color:#7a6c5a;font-size:.8rem}h2{font-size:1.05rem;color:#7a6c5a;margin:26px 0 0}@media(prefers-color-scheme:dark){body{background:#17130e;color:#f1e8d8}h1,a.h{color:#d9a35a}.b{background:#d9a35a;color:#1a1209}.pn a{border-color:#3a2f20;color:#d9a35a}.pn small,h2{color:#a8987f}}@media print{.b,.pn,.h,h2{display:none}body{background:#fff;color:#000}}</style>
</head><body><main>
${hasCover ? `<img src="${esc(img)}" alt="${esc(title)}" width="1200" height="630">` : ""}
<h1>${esc(title)}</h1>
${iso ? `<p class="d"><time datetime="${esc(iso)}">${esc(iso)}</time></p>` : ""}
<p>${esc(desc)}</p>
<a class="b" href="${esc(to)}">פתח בארכיון</a>
${navHtml}
<a class="h" href="/">מכון חכמי ספרד · העלון השבועי</a>
</main></body></html>`;
}

// sitemap.xml: עמוד הבית + דף הארכיון + כל גיליון (/i/<id>)
// lastmod: תאריך היצירה האמיתי (created, ISO) אם קיים, אחרת תאריך הגיליון; אף פעם לא בעתיד
const isoDay = v => /^\d{4}-\d{2}-\d{2}/.test(String(v || "")) ? String(v).slice(0, 10) : "";
export function sitemapXml(site, issues, today = new Date().toISOString().slice(0, 10)) {
  const u = (loc, extra) => "<url><loc>" + esc(loc) + "</loc>" + (extra || "") + "</url>";
  const rows = [u(site + "/", "<changefreq>weekly</changefreq><priority>1.0</priority>"), u(site + "/archive", "<changefreq>weekly</changefreq><priority>0.8</priority>")];
  for (const x of issues) {
    let d = isoDay(x.created) || isoDay(x.date);
    if (d && d > today) d = today;
    rows.push(u(site + "/i/" + x.id, d ? "<lastmod>" + d + "</lastmod>" : ""));
  }
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + rows.join("\n") + "\n</urlset>\n";
}

// /archive: דף HTML בלי JavaScript עם קישורים רגילים לכל הגיליונות (לסריקה של מנועי חיפוש)
export function archiveHtml(issues, site) {
  const rows = [...issues].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const li = x => `<li><a href="/i/${esc(x.id)}">${esc(issueTitle(x))}</a>${isoDay(x.date) ? ` <span>${isoDay(x.date)}</span>` : ""}</li>`;
  // קיבוץ לפי שנה (מהחדשה לישנה); גיליונות בלי תאריך בסוף
  const by = new Map();
  for (const x of rows) { const y = (isoDay(x.date) || "").slice(0, 4) || "ללא תאריך"; if (!by.has(y)) by.set(y, []); by.get(y).push(x); }
  const years = [...by.keys()];
  const nav = years.length > 1 ? `<nav class="yrs" aria-label="שנים">${years.map(y => `<a href="#y${esc(y.replace(/\s/g, "-"))}">${esc(y)}</a>`).join(" ")}</nav>` : "";
  const body = years.map(y => `<h2 id="y${esc(y.replace(/\s/g, "-"))}">${esc(y)} <small>(${by.get(y).length})</small></h2>\n<ul>${by.get(y).map(li).join("\n")}</ul>`).join("\n");
  const url = site + "/archive", title = "ארכיון הגיליונות · חכמי ספרד";
  const desc = "ארכיון כל הגיליונות השבועיים של מכון חכמי ספרד – גיליון לזכות הרבים, לפי שבתות ושנים";
  const ld = JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: title, url, inLanguage: "he", description: desc, numberOfItems: rows.length, isPartOf: { "@type": "WebSite", name: "גיליון חכמי ספרד", url: site + "/" } }).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<link rel="alternate" type="application/rss+xml" title="גיליון חכמי ספרד" href="/rss.xml">
<meta property="og:type" content="website">
<meta property="og:site_name" content="מכון חכמי ספרד">
<meta property="og:locale" content="he_IL">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(site + "/logo.jpg")}">
<script type="application/ld+json">${ld}</script>
<style>body{margin:0;font-family:"Frank Ruhl Libre","David",serif;background:#faf6ee;color:#2a2118;line-height:1.7}main{max-width:720px;margin:0 auto;padding:24px 16px}h1{color:#8a5a1f}h2{color:#8a5a1f;margin:1.4em 0 .2em;border-bottom:1px solid #d9c9a8}h2 small{font-weight:400;color:#7a6c5a;font-size:.7em}ul{margin:.3em 0;padding-inline-start:1.2em}li{margin:.3em 0}li span{color:#7a6c5a;font-size:.85em}a{color:#8a5a1f}.yrs{display:flex;flex-wrap:wrap;gap:6px 14px;margin:12px 0}@media(prefers-color-scheme:dark){body{background:#17130e;color:#f1e8d8}a,h1,h2{color:#d9a35a}h2{border-color:#3a2f20}li span,h2 small{color:#a8987f}}@media print{.yrs,.nv{display:none}body{background:#fff;color:#000}a{color:#000;text-decoration:none}}</style></head>
<body><main><h1>ארכיון הגיליונות</h1><p>${esc(desc)}.</p>
${nav}
${body}
<p class="nv"><a href="/">← לאתר הראשי</a> · <a href="/rss.xml">RSS</a></p></main></body></html>
`;
}

// rss.xml: הגיליונות האחרונים (issues – מסמכים עם id, כבר ממוינים מהחדש לישן)
export function rssXml(site, issues) {
  const items = issues.map(x => {
    const iso = /^\d{4}-\d{2}-\d{2}/.test(String(x.date || "")) ? String(x.date).slice(0, 10) : "";
    const link = site + "/i/" + x.id;
    return "<item><title>" + esc(issueTitle(x)) + "</title><link>" + esc(link) + "</link><guid isPermaLink=\"true\">" + esc(link) + "</guid>"
      + (iso ? "<pubDate>" + new Date(iso + "T12:00:00Z").toUTCString() + "</pubDate>" : "")
      + "<description>" + esc(issueDesc(x)) + "</description></item>";
  });
  return '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n'
    + "<title>גיליון חכמי ספרד</title>\n<link>" + esc(site + "/") + "</link>\n<description>העלון השבועי של מכון חכמי ספרד</description>\n<language>he</language>\n"
    + '<atom:link href="' + esc(site + "/rss.xml") + '" rel="self" type="application/rss+xml"/>\n'
    + items.join("\n") + "\n</channel>\n</rss>\n";
}

// גיבוי: שם תיקייה לפי תאריך (backups/YYYY-MM-DD/) ורשימת תיקיות ישנות למחיקה (משאירים את keep האחרונות)
export const backupFolder = (d = new Date()) => "backups/" + d.toISOString().slice(0, 10) + "/";
export function oldBackupFolders(names, keep = 8) {
  const set = [...new Set(names.map(n => (String(n).match(/^backups\/(\d{4}-\d{2}-\d{2})\//) || [])[1]).filter(Boolean))].sort();
  return set.slice(0, Math.max(0, set.length - keep)).map(x => "backups/" + x + "/");
}

// סריאליזציה של גיבוי: Timestamp נשמר כ-{__ts:[שניות, ננו-שניות]} ומשוחזר בדיוק (מקבלים את מחלקת Timestamp כפרמטר)
export const backupReplacer = TS => function (k, v) { const raw = this[k]; return raw instanceof TS ? { __ts: [raw.seconds, raw.nanoseconds] } : v; };
export const backupReviver = TS => (k, v) => (v && typeof v === "object" && Array.isArray(v.__ts) && v.__ts.length === 2 && Object.keys(v).length === 1 ? new TS(v.__ts[0], v.__ts[1]) : v);
export const validBackupDate = d => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ""));
export const validBackupCollection = c => /^[A-Za-z0-9_-]{1,60}$/.test(String(c || ""));

// טקסט ההתראה לפי שפה
export function pushMessage(lang, i) {
  const p = String(i.parasha || "");
  const M = {
    he: { title: "גיליון חדש · " + parashaTitle(p), body: (i.num ? "גיליון " + (i.num < 1000 ? gem(+i.num) : i.num) + " של " : "") + "חכמי ספרד כבר באתר" },
    en: { title: "New issue · " + p, body: "The new Sages of Sepharad bulletin is online." },
    fr: { title: "Nouveau numéro · " + p, body: "Le nouveau bulletin « Sages de Séfarade » est en ligne." },
    es: { title: "Nuevo número · " + p, body: "Ya está en línea el nuevo boletín «Sabios de Sefarad»." }
  };
  return M[lang] || M.he;
}

// ===== שליחת מייל =====
import { createHmac, timingSafeEqual } from "node:crypto";

// אסימונים חתומים: base64url(email).HMAC. ה-label מפריד בין שימושים (הסרה / אישור הרשמה) כדי שאסימון אחד לא יתקבל במקום השני
const sig = (label, e, key) => createHmac("sha256", key).update(label + e).digest("hex").slice(0, 32);
export function unsubToken(email, key, label = "") {
  const e = String(email).trim().toLowerCase();
  return Buffer.from(e, "utf8").toString("base64url") + "." + sig(label, e, key);
}
export function verifyUnsub(token, key, label = "") {
  try {
    const [b, h] = String(token || "").split(".");
    if (!b || !h) return null;
    const e = Buffer.from(b, "base64url").toString("utf8"), want = sig(label, e, key);
    if (h.length !== want.length || !timingSafeEqual(Buffer.from(h), Buffer.from(want))) return null;
    return e;
  } catch { return null; }
}
export const confirmToken = (email, key) => unsubToken(email, key, "confirm|");
export const verifyConfirm = (token, key) => verifyUnsub(token, key, "confirm|");

const EM = {
  he: { hello: "שלום {name},", morePages: "עמודים נוספים באתר", read: "לקריאת הגיליון", unsub: "להסרה מרשימת התפוצה", why: "קיבלת מייל זה כי נרשמת לגיליון חכמי ספרד." },
  en: { hello: "Hello {name},", morePages: "more pages on the website", read: "Read the issue", unsub: "Unsubscribe", why: "You are receiving this because you subscribed to the Sages of Sepharad bulletin." },
  fr: { hello: "Bonjour {name},", morePages: "pages de plus sur le site", read: "Lire le bulletin", unsub: "Se désabonner", why: "Vous recevez ce message car vous êtes abonné au bulletin Sages de Sépharad." },
  es: { hello: "Hola {name},", morePages: "páginas más en el sitio", read: "Leer el boletín", unsub: "Cancelar suscripción", why: "Recibes este mensaje porque te suscribiste al boletín de Sefarad." }
};
export const emailSubject = (lang, i) => pushMessage(lang, i).title;

// ===== הצגת טקסט הגיליון בתוך המייל (אותו פורמט כמו באתר: # כותרת, - רשימה, **הדגשה**, קישורים) =====
// עותק של linkParts מ-public/lib.js (הפונקציות נפרסות בנפרד מהאתר); tests/mail.test.mjs בודק שהם נשארים זהים
const URL_RE = /(https?:\/\/[^\s\u0590-\u05FF<>"'\u05F4]+|(?<![@\w./-])www\.[^\s\u0590-\u05FF<>"'\u05F4]+|(?<![@\w./-])(?:[a-z0-9-]+\.)+(?:com|org|net|info|edu|gov|il|io|tv|me|co|ly|be)(?![a-z0-9-])(?:\/[^\s\u0590-\u05FF<>"'\u05F4]*)?)/gi;
export function linkSplit(text) {
  const s = String(text == null ? "" : text), out = []; let last = 0, m;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(s))) {
    let u = m[0];
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
const linksHtml = t => linkSplit(t).map(p => p.t === "link" ? `<a href="${esc(p.href)}" style="color:#8a5a1f;word-break:break-all">${esc(p.v)}</a>` : esc(p.v)).join("");
const inlHtml = t => String(t).split(/\*\*?([^*\n]+?)\*\*?/).map((part, k) => k % 2 ? `<strong>${linksHtml(part)}</strong>` : linksHtml(part)).join("");
export function richHtml(txt) {
  const out = []; let inUl = false;
  const closeUl = () => { if (inUl) { out.push("</ul>"); inUl = false; } };
  String(txt || "").split("\n").forEach(line => {
    const t = line.trim();
    if (!t) { closeUl(); return; }
    if (/^[-\u2022]\s+/.test(t)) { if (!inUl) { out.push('<ul style="margin:0 0 12px;padding-inline-start:22px">'); inUl = true; } out.push(`<li style="margin:0 0 4px">${inlHtml(t.replace(/^[-\u2022]\s+/, ""))}</li>`); return; }
    closeUl();
    if (t.startsWith("# ")) out.push(`<h2 style="margin:16px 0 6px;font-size:18px;color:#8a5a1f">${inlHtml(t.slice(2))}</h2>`);
    else out.push(`<p style="margin:0 0 12px;font-size:16px;line-height:1.7">${inlHtml(t)}</p>`);
  });
  closeUl(); return out.join("\n");
}
export const plainOf = txt => String(txt || "").replace(/\r/g, "").split("\n").map(l => l.replace(/^\s*#\s+/, "").replace(/\*\*?([^*\n]+?)\*\*?/g, "$1").trimEnd()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
export const MAIL_MAX_PAGES = 12, MAIL_MAX_TEXT = 20000;

// srcs (אופציונלי): מקורות תמונה לפי אינדקס עמוד, למשל "cid:..." להטמעה בתוך המייל; בלעדיו משתמשים בקישור לתמונה באתר
export function emailHtml(lang, i, id, site, unsubUrl, srcs, name) {
  const m = pushMessage(lang, i), L = EM[lang] || EM.he, dir = (EM[lang] ? lang : "he") === "he" ? "rtl" : "ltr", al = dir === "rtl" ? "right" : "left";
  const url = site + "/i/" + id, all = (i.pages || []).filter(p => p && p.url), shown = all.slice(0, MAIL_MAX_PAGES), more = all.length - shown.length;
  const imgs = shown.length ? shown : [{ url: imageOf(i, site) }];
  const body = String(i.desc || "").trim() ? richHtml(String(i.desc).slice(0, MAIL_MAX_TEXT)) : "";
  const imgRows = imgs.map((p, k) => `<tr><td style="padding:0 24px 12px"><a href="${esc(url)}"><img src="${esc((srcs && srcs[k]) || p.url)}" alt="${esc(m.title + (imgs.length > 1 ? " · " + (k + 1) : ""))}" width="512" style="display:block;width:100%;max-width:512px;height:auto;border:0;border-radius:6px"></a></td></tr>`).join("\n");
  return `<!doctype html><html lang="${EM[lang] ? lang : "he"}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#faf6ee;font-family:Arial,Helvetica,sans-serif;color:#2a2118">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf6ee"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e6dcc8;border-radius:12px;overflow:hidden" dir="${dir}">
<tr><td style="padding:22px 24px 8px;text-align:${al}">
${name ? `<p style="margin:0 0 10px;font-size:16px;color:#5b4d3a">${esc((L.hello || EM.he.hello).replace("{name}", cleanDetail(name, 60)))}</p>` : ""}
<h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:#8a5a1f">${esc(m.title)}</h1>
<p style="margin:0 0 14px;font-size:16px;line-height:1.6">${esc(m.body)}</p>
${body}
</td></tr>
${imgRows}
${more > 0 ? `<tr><td style="padding:0 24px 12px;font-size:14px;color:#7a6c5a;text-align:${al}">+${more} ${esc(L.morePages)}</td></tr>` : ""}
<tr><td style="padding:6px 24px 20px;text-align:${al}"><a href="${esc(url)}" style="display:inline-block;background:#8a5a1f;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:16px;font-weight:bold">${esc(L.read)}</a></td></tr>
<tr><td style="padding:14px 24px;background:#f5efe2;font-size:12px;line-height:1.6;color:#7a6c5a;text-align:${al}">${esc(L.why)}<br><a href="${esc(unsubUrl)}" style="color:#7a6c5a">${esc(L.unsub)}</a></td></tr>
</table></td></tr></table></body></html>`;
}

// דף הסרה (אישור בלחיצה — כדי שסורקי מייל לא יסירו בטעות)
export function unsubPage(kind, token, email) {
  const body = kind === "done"
    ? `<h1>הוסרת מרשימת התפוצה</h1><p>לא תקבל עוד מיילים מגיליון חכמי ספרד.</p><p dir="ltr">You have been unsubscribed.</p>`
    : kind === "bad"
      ? `<h1>הקישור אינו תקף</h1><p>אפשר לפנות אלינו להסרה ידנית.</p>`
      : `<h1>הסרה מרשימת התפוצה</h1><p dir="ltr">${esc(email)}</p><form method="POST" action=""><button type="submit">אישור הסרה / Unsubscribe</button></form>`;
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>גיליון חכמי ספרד</title>
<style>body{font-family:Arial,sans-serif;background:#faf6ee;color:#2a2118;display:flex;justify-content:center;padding:40px 16px}main{background:#fff;border:1px solid #e6dcc8;border-radius:12px;padding:28px;max-width:420px;text-align:center}h1{font-size:22px;color:#8a5a1f}button{background:#8a5a1f;color:#fff;border:0;border-radius:8px;padding:12px 22px;font-size:16px;cursor:pointer}</style></head><body><main>${body}</main></body></html>`;
}

// חלק מנתיב בקשה (אחרי פענוח %XX), ריק אם הקידוד שגוי — כדי שכתובת פגומה לא תפיל את הפונקציה
export function pathPart(path, i) {
  try { return decodeURIComponent(String(path || "").split("/")[i] || ""); } catch { return ""; }
}

// ===== אישור הרשמה (double opt-in) =====
const CF = {
  he: { subj: "אישור הרשמה לגיליון חכמי ספרד", body: "קיבלנו בקשה להרשמה לגיליון חכמי ספרד במייל. כדי להשלים את ההרשמה לחצו על הכפתור.", btn: "אישור הרשמה", ignore: "אם לא ביקשתם להירשם, אפשר להתעלם מהמייל ולא יישלחו אליכם הודעות." },
  en: { subj: "Confirm your subscription – Sages of Sepharad", body: "We received a request to subscribe this address to the Sages of Sepharad bulletin. Click the button to complete your subscription.", btn: "Confirm subscription", ignore: "If you did not ask for this, simply ignore this email and you will not receive anything." },
  fr: { subj: "Confirmez votre inscription – Sages de Sépharad", body: "Nous avons reçu une demande d’inscription de cette adresse au bulletin Sages de Sépharad. Cliquez sur le bouton pour confirmer.", btn: "Confirmer l’inscription", ignore: "Si vous n’êtes pas à l’origine de cette demande, ignorez simplement ce message." },
  es: { subj: "Confirme su suscripción – Sabios de Sefarad", body: "Recibimos una solicitud para suscribir esta dirección al boletín Sabios de Sefarad. Haga clic en el botón para confirmar.", btn: "Confirmar suscripción", ignore: "Si usted no lo solicitó, ignore este correo y no recibirá nada." }
};
export const confirmSubject = lang => (CF[lang] || CF.he).subj;
export function confirmHtml(lang, url) {
  const L = CF[lang] || CF.he, dir = CF[lang] ? (lang === "he" ? "rtl" : "ltr") : "rtl", al = dir === "rtl" ? "right" : "left";
  return `<!doctype html><html lang="${CF[lang] ? lang : "he"}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#faf6ee;font-family:Arial,Helvetica,sans-serif;color:#2a2118"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e6dcc8;border-radius:12px" dir="${dir}"><tr><td style="padding:24px;text-align:${al}">
<h1 style="margin:0 0 12px;font-size:20px;color:#8a5a1f">${esc(L.subj)}</h1><p style="margin:0 0 16px;font-size:16px;line-height:1.6">${esc(L.body)}</p>
<p style="margin:0 0 16px"><a href="${esc(url)}" style="display:inline-block;background:#8a5a1f;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:16px;font-weight:bold">${esc(L.btn)}</a></p>
<p style="margin:0;font-size:12px;line-height:1.6;color:#7a6c5a">${esc(L.ignore)}</p></td></tr></table></td></tr></table></body></html>`;
}
export function confirmPage(kind, email) {
  const body = kind === "done" ? `<h1>ההרשמה אושרה ✓</h1><p>מעכשיו תקבלו את גיליון חכמי ספרד במייל.</p><p dir="ltr">Your subscription is confirmed.</p>`
    : kind === "ask" ? `<h1>אישור הרשמה לגיליון</h1><p dir="ltr">${esc(email)}</p><form method="POST" action=""><button type="submit">אישור הרשמה / Confirm</button></form>`
    : `<h1>הקישור אינו תקף או שפג תוקפו</h1><p>אפשר להירשם שוב מהאתר.</p>`;
  return unsubPage("custom", "", "").replace(/<main>[\s\S]*<\/main>/, "<main>" + body + "</main>");
}

// גרסת טקסט רגיל של המיילים (מסנני ספאם מעדיפים הודעה שיש לה גם חלק טקסט)
export function emailText(lang, i, id, site, unsubUrl, name) {
  const m = pushMessage(lang, i), L = EM[lang] || EM.he, body = plainOf(String(i.desc || "").slice(0, MAIL_MAX_TEXT));
  const lines = name ? [(L.hello || EM.he.hello).replace("{name}", cleanDetail(name, 60)), "", m.title, "", m.body] : [m.title, "", m.body];
  if (body) lines.push("", body);
  lines.push("", L.read + ": " + site + "/i/" + id, "", "--", L.why, L.unsub + ": " + unsubUrl);
  return lines.join("\n");
}
export function confirmText(lang, url) {
  const L = CF[lang] || CF.he;
  return [L.subj, "", L.body, "", L.btn + ": " + url, "", L.ignore].join("\n");
}

// ניקוי פרטי נרשם (שם/טלפון/עיר): בלי תווי בקרה ותווי כיווניות נסתרים, רווחים מכווצים, אורך מוגבל
export const cleanDetail = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
export const SUB_LIMITS = { name: 60, phone: 30, city: 60, note: 300 };

// המתנה לפני ניסיון נוסף כשהשרת מגביל קצב שליחה (בדקות: 5, 10, 20, 40, ועד תקרה של 60)
export const mailBackoffMs = slow => Math.min(60, 5 * 2 ** Math.max(0, (slow || 1) - 1)) * 60000;
