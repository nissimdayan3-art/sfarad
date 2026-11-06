import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { trackToken, verifyTrack, applyTrackEvent, emailHtml, emailText, TRACK_GIF, unsubToken, verifyUnsub } from "../functions/helpers.js";
const L = await import("../public/lib.js");

const KEY = "k".repeat(64), SITE = "https://example.web.app", issue = { parasha: "נח", num: 487, pages: [{ url: "https://x/p1.jpg" }] };

test("אסימון מעקב: מחזיר מזהה ונמען, ודוחה שינוי, חתימה זרה ואסימון הסרה", () => {
  const tok = trackToken("i123", "Me@Example.com", KEY), v = verifyTrack(tok, KEY);
  assert.deepEqual(v, { id: "i123", email: "me@example.com" });
  assert.equal(verifyTrack(tok, "x".repeat(64)), null);
  const [b, h] = tok.split(".");
  assert.equal(verifyTrack(Buffer.from("i999|me@example.com").toString("base64url") + "." + h, KEY), null);
  assert.equal(verifyTrack("", KEY), null);
  assert.equal(verifyTrack("garbage", KEY), null);
  assert.equal(verifyTrack(unsubToken("me@example.com", KEY), KEY), null, "אסימון הסרה אינו אסימון מעקב");
  assert.equal(verifyUnsub(tok, KEY), null, "אסימון מעקב אינו מסיר מהרשימה");
});
test("פיקסל: GIF תקין", () => assert.equal(TRACK_GIF.subarray(0, 6).toString("latin1"), "GIF89a"));

test("אירוע פתיחה: ראשונה נספרת כייחודית, שנייה רק במונה, כפילות מיידית נדחית", () => {
  let r = applyTrackEvent({ ts: 1 }, "o", 10000);
  assert.deepEqual(r.update, { opens: 1, lastOpen: 10000, firstOpen: 10000 });
  assert.deepEqual(r.d, { opens: 1, clicks: 0, opened: 1, clicked: 0 });
  const cur = { ts: 1, ...r.update };
  assert.equal(applyTrackEvent(cur, "o", 11000), null);
  r = applyTrackEvent(cur, "o", 20000);
  assert.deepEqual(r.update, { opens: 2, lastOpen: 20000 });
  assert.equal(r.d.opened, 0);
});
test("אירוע הקלקה: נחשב גם כפתיחה אם טרם נפתח; לא נספר פעמיים כייחודי", () => {
  let r = applyTrackEvent({ ts: 1 }, "c", 10000);
  assert.deepEqual(r.d, { opens: 1, clicks: 1, opened: 1, clicked: 1 });
  assert.equal(r.update.firstOpen, 10000); assert.equal(r.update.firstClick, 10000);
  const cur = { ts: 1, ...r.update };
  r = applyTrackEvent(cur, "c", 30000);
  assert.deepEqual(r.d, { opens: 0, clicks: 1, opened: 0, clicked: 0 });
  assert.equal(r.update.clicks, 2);
});
test("אירוע על נמען שנכשל או שאינו קיים: מתעלמים", () => {
  assert.equal(applyTrackEvent({ failed: true }, "o", 1e6), null);
  assert.equal(applyTrackEvent(undefined, "o", 1e6), null);
});

test("מייל עם מעקב: פיקסל, קישור הקלקה והודעה; בלי מעקב – כמו קודם", () => {
  const trk = { open: SITE + "/t/o/T.gif", click: SITE + "/t/c/T" };
  const h = emailHtml("he", issue, "i1", SITE, SITE + "/u/U", null, "", trk);
  assert.ok(h.includes(SITE + "/t/o/T.gif") && h.includes('width="1" height="1"'));
  assert.ok(h.includes('href="' + SITE + '/t/c/T"') && !h.includes('href="' + SITE + '/i/i1"'));
  assert.ok(h.includes("מדידת פתיחה והקלקה"));
  for (const lang of ["en", "fr", "es"]) assert.ok(emailHtml(lang, issue, "i1", SITE, SITE + "/u/U", null, "", trk).includes(SITE + "/t/o/T.gif"));
  const plain = emailHtml("he", issue, "i1", SITE, SITE + "/u/U");
  assert.ok(!plain.includes("/t/o/") && !plain.includes("מדידת פתיחה") && plain.includes('href="' + SITE + '/i/i1"'));
  assert.ok(emailText("he", issue, "i1", SITE, SITE + "/u/U", "", trk).includes(SITE + "/t/c/T"));
  assert.ok(emailText("he", issue, "i1", SITE, SITE + "/u/U").includes(SITE + "/i/i1"));
});

test("lib: אחוזים, מצב נמען וסינון", () => {
  assert.deepEqual(L.mailRates({ sent: 200, bounced: 10, opened: 50, clicked: 5, opens: 90, clicks: 7 }), { sent: 200, bounced: 10, opened: 50, clicked: 5, opens: 90, clicks: 7, openPct: 25, clickPct: 2.5, bouncePct: 4.8 });
  assert.equal(L.mailRates(undefined).openPct, 0);
  assert.equal(L.mailState({ failed: true, firstOpen: 5 }), "failed");
  assert.equal(L.mailState({ ts: 100, firstOpen: 200 }, 300), "unsub");
  assert.equal(L.mailState({ ts: 100 }, 50), "sent", "הסרה לפני השליחה אינה נחשבת");
  assert.equal(L.mailState({ ts: 100, firstClick: 5, firstOpen: 5 }), "clicked");
  assert.equal(L.mailState({ ts: 100, firstOpen: 5 }), "opened");
  const rows = [{ email: "a", ts: 1 }, { email: "b", ts: 1, firstOpen: 2 }, { email: "c", ts: 1, firstOpen: 2, firstClick: 3 }, { email: "d", failed: true }, { email: "e", ts: 1, firstOpen: 2 }];
  const names = f => L.mailFilter(rows, { e: 9 }, f).map(x => x.email).join("");
  assert.equal(names("all"), "abcde"); assert.equal(names("failed"), "d"); assert.equal(names("unopened"), "a");
  assert.equal(names("opened"), "bce"); assert.equal(names("clicked"), "c"); assert.equal(names("unsub"), "e");
});

test("תצורה: חוקי Firestore סוגרים את נתוני המעקב למנהלים, ויש ניתוב והגנה ב-SW", () => {
  const r = readFileSync("firestore.rules", "utf8");
  for (const m of ["/issues/{id}/mailed/{email}", "/mailStats/{id}", "/unsubs/{email}"]) {
    const line = r.split("\n").find(l => l.includes("match " + m)); assert.ok(line, m);
    assert.match(line, /allow read: if isAdmin\(\)/); assert.match(line, /allow write: if false/);
  }
  const rw = JSON.parse(readFileSync("firebase.json", "utf8")).hosting.rewrites.find(x => x.source === "/t/**");
  assert.equal(rw.function.functionId, "track");
  assert.match(readFileSync("public/sw.js", "utf8"), /\(i\|u\|c\|t\|__\)/);
  const fn = readFileSync("functions/index.js", "utf8");
  assert.match(fn, /export const track = onRequest/); assert.match(fn, /export const mailRetryFailed = onCall/);
  assert.match(fn, /mailRetryFailed[\s\S]{0,200}adminOnly|adminOnly\(request\)[\s\S]{0,400}mailed"\)\.where/);
  assert.ok(!/res\.redirect\([^)]*req\.(query|body)/.test(fn), "אסור להפנות לפי קלט המשתמש");
});
