/* a11y.js · סרגל נגישות (v1.39.0)
   כפתור צף שפותח תפריט: גודל טקסט, ניגודיות גבוהה, גווני אפור, הדגשת קישורים, גופן קריא, עצירת אנימציות.
   ההעדפות נשמרות בדפדפן של הגולש בלבד (localStorage). בלי שירותים חיצוניים ובלי איסוף מידע.
   הסרגל הוא תוספת נוחות; ההנגשה עצמה נעשית בקוד האתר (ראו accessibility.html). */
(() => {
  const KEY = "a11y.v1", DEF = { size: 0, contrast: false, gray: false, links: false, font: false, still: false };
  const load = () => { try { return { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch (e) { return { ...DEF }; } };
  const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
  let S = load();
  const root = document.documentElement;
  const apply = () => {
    root.style.fontSize = S.size ? (100 + S.size * 12.5) + "%" : "";
    root.classList.toggle("a11y-contrast", !!S.contrast);
    root.classList.toggle("a11y-gray", !!S.gray);
    root.classList.toggle("a11y-links", !!S.links);
    root.classList.toggle("a11y-font", !!S.font);
    root.classList.toggle("a11y-still", !!S.still);
  };
  apply();   // מיד, כדי שלא יהיה הבהוב
  const init = () => {
    const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; };
    const btn = el("button", "a11y-fab"); btn.type = "button"; btn.setAttribute("aria-label", "תפריט נגישות"); btn.setAttribute("aria-haspopup", "dialog"); btn.setAttribute("aria-expanded", "false"); btn.title = "נגישות";
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false"><circle cx="12" cy="4.5" r="2.2" fill="currentColor"/><path d="M5 8.5h14M12 8.5v5.5m0 0-3.5 6m3.5-6 3.5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';
    const pan = el("div", "a11y-panel"); pan.id = "a11yPanel"; pan.setAttribute("role", "dialog"); pan.setAttribute("aria-label", "הגדרות נגישות"); pan.hidden = true;
    const head = el("div", "a11y-head"); head.appendChild(el("strong", null, "נגישות"));
    const x = el("button", "a11y-x", "✕"); x.type = "button"; x.setAttribute("aria-label", "סגירת תפריט הנגישות"); head.appendChild(x); pan.appendChild(head);
    const mk = (label, onClick) => { const b = el("button", "a11y-opt", label); b.type = "button"; b.onclick = () => { onClick(); save(S); apply(); sync(); }; pan.appendChild(b); return b; };
    const tog = (label, key) => { const b = mk(label, () => { S[key] = !S[key]; }); b.setAttribute("aria-pressed", "false"); b.dataset.key = key; return b; };
    const row = el("div", "a11y-row");
    const sizeLbl = el("span", "a11y-lbl", "גודל טקסט");
    const minus = el("button", "a11y-opt a11y-sm", "A−"), plus = el("button", "a11y-opt a11y-sm", "A+");
    minus.type = plus.type = "button"; minus.setAttribute("aria-label", "הקטנת טקסט"); plus.setAttribute("aria-label", "הגדלת טקסט");
    minus.onclick = () => { S.size = Math.max(0, S.size - 1); save(S); apply(); sync(); };
    plus.onclick = () => { S.size = Math.min(4, S.size + 1); save(S); apply(); sync(); };
    row.append(sizeLbl, minus, plus); pan.appendChild(row);
    tog("ניגודיות גבוהה", "contrast"); tog("גווני אפור", "gray"); tog("הדגשת קישורים", "links"); tog("גופן קריא", "font"); tog("עצירת אנימציות", "still");
    mk("איפוס הגדרות", () => { S = { ...DEF }; });
    const a = el("a", "a11y-stmt", "הצהרת נגישות"); a.href = "/accessibility"; pan.appendChild(a);
    const sync = () => { pan.querySelectorAll("[data-key]").forEach(b => b.setAttribute("aria-pressed", S[b.dataset.key] ? "true" : "false")); sizeLbl.textContent = "גודל טקסט" + (S.size ? " (" + (100 + S.size * 12.5) + "%)" : ""); };
    const open = o => { pan.hidden = !o; btn.setAttribute("aria-expanded", o ? "true" : "false"); if (o) { sync(); (pan.querySelector("button.a11y-opt") || x).focus(); } else btn.focus(); };
    btn.onclick = () => open(pan.hidden); x.onclick = () => open(false);
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !pan.hidden) open(false); });
    document.body.append(btn, pan); sync();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
