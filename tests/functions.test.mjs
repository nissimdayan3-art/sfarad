import test from "node:test";
import assert from "node:assert/strict";
import { esc, gem, parashaTitle, issueTitle, issueDesc, imageOf, shareHtml, sitemapXml, archiveHtml, rssXml, backupFolder, oldBackupFolders, isPermanentMailError, listMediaSources, staleBackupMedia, backupReplacer, backupReviver, validBackupDate, validBackupCollection, pushMessage } from "../functions/helpers.js";

const SITE = "https://example.web.app";
const issue = { parasha: "נח", num: 487, desc: "**שאלה** והתשובה #1\nשורה שנייה", pages: [{ url: "https://x/p1.jpg" }], cover: { url: "https://x/cover.jpg" } };

test("esc: בריחה מ-HTML", () => assert.equal(esc(`<a href="x">&'`), "&lt;a href=&quot;x&quot;&gt;&amp;&#39;"));
test("gem בפונקציות זהה ללוגיקה באתר", () => { assert.equal(gem(487), "תפ״ז"); assert.equal(gem(15), "ט״ו"); });
test("כותרת הגיליון", () => {
  assert.equal(parashaTitle("נח"), "פרשת נח");
  assert.equal(parashaTitle("פרשת נח"), "פרשת נח");
  assert.equal(parashaTitle("שבת חנוכה"), "שבת חנוכה");
  assert.equal(issueTitle(issue), "גיליון תפ״ז · פרשת נח");
  assert.equal(issueTitle({ parasha: "נח" }), "פרשת נח");
  assert.equal(issueTitle({ parasha: "נח", num: 1200 }), "גיליון 1200 · פרשת נח");
});
test("תיאור: ניקוי סימנים וקיצור", () => {
  assert.equal(issueDesc(issue), "שאלה והתשובה 1 שורה שנייה");
  assert.equal(issueDesc({}), "גיליון שבועי לזכות הרבים · מכון חכמי ספרד");
  const long = issueDesc({ desc: "מילה ".repeat(100) });
  assert.ok(long.length <= 201 && long.endsWith("…"), long.length);
});
test("תמונה: כריכה ← עמוד ראשון ← לוגו", () => {
  assert.equal(imageOf(issue, SITE), "https://x/cover.jpg");
  assert.equal(imageOf({ pages: [{ url: "https://x/p1.jpg" }] }, SITE), "https://x/p1.jpg");
  assert.equal(imageOf({}, SITE), SITE + "/logo.jpg");
});
test("shareHtml: תגיות OG, תוכן, קישור לארכיון ובריחה", () => {
  const h = shareHtml({ ...issue, desc: 'ציטוט "מסוכן" <script>alert(1)</script>' }, "i123", SITE);
  assert.match(h, /<meta property="og:title" content="גיליון תפ״ז · פרשת נח">/);
  assert.match(h, /<meta property="og:image" content="https:\/\/x\/cover\.jpg">/);
  assert.match(h, /og:image:width" content="1200"/);
  assert.match(h, /twitter:card" content="summary_large_image"/);
  assert.match(h, /<meta property="og:url" content="https:\/\/example\.web\.app\/i\/i123">/);
  assert.ok(!h.includes("location.replace") && !h.includes('http-equiv="refresh"'), "אין הפניה אוטומטית");
  assert.match(h, /<link rel="canonical" href="https:\/\/example\.web\.app\/i\/i123">/);
  assert.match(h, /href="\/#i=i123">פתח בארכיון</);
  assert.match(h, /application\/ld\+json/);
  assert.ok(!h.includes("<script>alert(1)"), "אסור שתיאור יוזרק כ-HTML");
  const noCover = shareHtml({ parasha: "נח" }, "i1", SITE);
  assert.match(noCover, /summary"/); assert.ok(!noCover.includes("og:image:width"));
});
test("pushMessage: לפי שפה, עם נפילה לעברית", () => {
  assert.equal(pushMessage("he", issue).title, "גיליון חדש · פרשת נח");
  assert.match(pushMessage("he", issue).body, /^גיליון תפ״ז של חכמי ספרד/);
  assert.match(pushMessage("en", issue).title, /^New issue/);
  assert.match(pushMessage("fr", issue).title, /^Nouveau numéro/);
  assert.match(pushMessage("es", issue).title, /^Nuevo número/);
  assert.equal(pushMessage("xx", issue).title, pushMessage("he", issue).title);
});
test("sitemapXml: בית + גיליונות, עם בריחה ו-lastmod", () => {
  const x = sitemapXml("https://s", [{ id: "a1", date: "2026-10-31" }, { id: "b&2", date: "" }]);
  assert.match(x, /<loc>https:\/\/s\/<\/loc>/);
  assert.match(x, /<loc>https:\/\/s\/i\/a1<\/loc><lastmod>2026-10-31<\/lastmod>/);
  assert.match(x, /\/i\/b&amp;2</);
});
test("rssXml: פריטים עם כותרת, קישור, תאריך ובריחה", () => {
  const x = rssXml("https://s", [{ id: "a1", parasha: "נח", num: 487, date: "2026-10-31", desc: "א & ב <b>" }, { id: "b2", parasha: "לך לך" }]);
  assert.match(x, /<rss version="2.0"/);
  assert.match(x, /<link>https:\/\/s\/i\/a1<\/link>/);
  assert.match(x, /<pubDate>Sat, 31 Oct 2026 12:00:00 GMT<\/pubDate>/);
  assert.match(x, /א &amp; ב &lt;b/);
  assert.ok(!/<b>/.test(x), "אסור HTML גולמי מהתיאור");
  assert.equal((x.match(/<item>/g) || []).length, 2);
  assert.equal((x.match(/<pubDate>/g) || []).length, 1, "בלי תאריך – בלי pubDate");
  assert.match(x, /<atom:link href="https:\/\/s\/rss\.xml"/);
});
test("shareHtml: גיליון קודם/הבא וגיליונות של אותה פרשה", () => {
  const h = shareHtml({ parasha: "נח", date: "2026-10-31" }, "i2", "https://s", { prev: { id: "i1", parasha: "בראשית" }, next: { id: "i3", parasha: "לך לך" }, same: [{ id: "o1", parasha: "נח" }] });
  assert.match(h, /href="\/i\/i1"[^>]*><small>הגיליון הקודם<\/small>/);
  assert.match(h, /href="\/i\/i3"[^>]*><small>הגיליון הבא<\/small>/);
  assert.match(h, /אותה פרשה בשנים אחרות/);
  assert.match(h, /href="\/i\/o1"/);
  const none = shareHtml({ parasha: "נח" }, "i2", "https://s");
  assert.ok(!none.includes('class="pn"') && !none.includes("אותה פרשה"), "בלי שכנים – בלי ניווט");
});
test("גיבוי: שם תיקייה ומחיקת ישנים (נשארות keep אחרונות)", () => {
  assert.equal(backupFolder(new Date("2026-11-08T03:00:00Z")), "backups/2026-11-08/");
  const names = ["backups/2026-10-04/issues.json", "backups/2026-10-04/admins.json", "backups/2026-10-11/issues.json", "backups/2026-10-18/issues.json", "backups/2026-10-25/issues.json", "sages/x.jpg"];
  assert.deepEqual(oldBackupFolders(names, 2), ["backups/2026-10-04/", "backups/2026-10-11/"]);
  assert.deepEqual(oldBackupFolders(names, 8), []);
  assert.deepEqual(oldBackupFolders([], 8), []);
});
test("גיבוי: Timestamp נשמר ומשוחזר בדיוק, ובדיקות תקינות", () => {
  class TS { constructor(s, n) { this.seconds = s; this.nanoseconds = n; } toJSON() { return { _seconds: this.seconds, _nanoseconds: this.nanoseconds }; } }
  const src = [{ id: "a", data: { when: new TS(1700000000, 5), nested: { arr: [new TS(1, 2)] }, n: 3, s: "x" } }];
  const txt = JSON.stringify(src, backupReplacer(TS));
  assert.ok(!txt.includes("_seconds"), "נשמר בפורמט __ts");
  const back = JSON.parse(txt, backupReviver(TS));
  assert.ok(back[0].data.when instanceof TS && back[0].data.when.seconds === 1700000000 && back[0].data.when.nanoseconds === 5);
  assert.ok(back[0].data.nested.arr[0] instanceof TS && back[0].data.nested.arr[0].nanoseconds === 2);
  assert.equal(back[0].data.n, 3);
  assert.ok(validBackupDate("2026-11-08") && !validBackupDate("2026-11-8") && !validBackupDate("../x"));
  assert.ok(validBackupCollection("issues") && !validBackupCollection("a/b") && !validBackupCollection("") && !validBackupCollection("a..b"));
});

test("sitemapXml: lastmod מתאריך יצירה, לא בעתיד, כולל /archive", () => {
  const x = sitemapXml("https://s", [{ id: "a", date: "2026-11-07", created: "2026-11-01" }, { id: "b", date: "2026-11-07" }, { id: "c", date: "2025-01-01", created: "2025-01-02" }], "2026-11-05");
  assert.match(x, /<loc>https:\/\/s\/archive<\/loc>/);
  assert.match(x, /\/i\/a<\/loc><lastmod>2026-11-01</);
  assert.match(x, /\/i\/b<\/loc><lastmod>2026-11-05</);
  assert.match(x, /\/i\/c<\/loc><lastmod>2025-01-02</);
});
test("archiveHtml: קישורים רגילים, מהחדש לישן, עם בריחה", () => {
  const h = archiveHtml([{ id: "o", parasha: "נח", date: "2025-10-25" }, { id: "n&1", parasha: "לך לך", date: "2026-10-24" }], "https://s");
  assert.match(h, /<link rel="canonical" href="https:\/\/s\/archive">/);
  assert.ok(h.indexOf('/i/n&amp;1') < h.indexOf('/i/o"'));
  assert.match(h, /<a href="\/i\/o">פרשת נח<\/a>/);
});

test("תיקיית גיבוי לפי שעון ישראל ולא UTC", () => {
  assert.equal(backupFolder(new Date("2026-11-08T22:30:00Z")), "backups/2026-11-09/");   // 00:30 בישראל (חורף)
  assert.equal(backupFolder(new Date("2026-07-05T21:30:00Z")), "backups/2026-07-06/");   // 00:30 בישראל (קיץ)
  assert.equal(backupFolder(new Date("2026-11-08T03:00:00Z")), "backups/2026-11-08/");
});
test("שגיאת מייל קבועה: רק תיבה/כתובת פסולה; לא אימות ולא זמניות", () => {
  for (const c of [501, 550, 551, 553]) assert.equal(isPermanentMailError({ responseCode: c }), true, String(c));
  assert.equal(isPermanentMailError({ code: "EENVELOPE" }), true);
  for (const c of [421, 450, 452, 530, 535, 554]) assert.equal(isPermanentMailError({ responseCode: c }), false, String(c));
  assert.equal(isPermanentMailError(null), false);
  assert.equal(isPermanentMailError({ code: "ETIMEDOUT" }), false);
});
test("גיבוי מדיה: מפרט תיקיות לפי prefix, מדלג על backups/ ועל תיקיות ריקות", async () => {
  const f = n => ({ name: n });
  const calls = [];
  const bucket = { async getFiles(q) {
    calls.push(JSON.stringify(q));
    if (q.delimiter) return q.pageToken ? [[f("root2.txt")], null, { prefixes: ["sages/"] }] : [[f("root.txt")], { delimiter: "/", autoPaginate: false, pageToken: "t" }, { prefixes: ["issues/", "backups/"] }];
    if (q.prefix === "issues/") return [[f("issues/"), f("issues/a.pdf"), f("issues/b.jpg")]];
    if (q.prefix === "sages/") return [[f("sages/x.jpg")]];
    throw new Error("unexpected " + JSON.stringify(q));
  } };
  const names = (await listMediaSources(bucket)).map(x => x.name).sort();
  assert.deepEqual(names, ["issues/a.pdf", "issues/b.jpg", "root.txt", "root2.txt", "sages/x.jpg"]);
  assert.ok(!calls.some(c => c.includes("backups/")), "אסור לפרט את backups/");
});
test("גיבוי מדיה: מוחקים מהגיבוי רק מה שאינו במקור", () => {
  const pre = "backups/2026-11-08/storage/";
  assert.deepEqual(
    staleBackupMedia([pre + "issues/a.pdf", pre + "issues/old.pdf", pre + "sages/x.jpg", "backups/2026-11-08/issues.json"], ["issues/a.pdf", "sages/x.jpg"], pre),
    [pre + "issues/old.pdf"]);
});
