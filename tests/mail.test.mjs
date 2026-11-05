import test from "node:test";
import assert from "node:assert/strict";
import { unsubToken, verifyUnsub, emailHtml, emailSubject, unsubPage, mailBackoffMs } from "../functions/helpers.js";
const SITE = "https://example.web.app", issue = { parasha: "ויקרא", num: 150, desc: "תיאור <b>מסוכן</b>", cover: { url: "https://x/c.jpg" } };

test("unsub token: round trip, wrong key, tampering", () => {
  const t = unsubToken("  A@B.com ", "k");
  assert.equal(verifyUnsub(t, "k"), "a@b.com");
  assert.equal(verifyUnsub(t, "other"), null);
  const bad = t.slice(0, -1) + (t.endsWith("0") ? "1" : "0");
  assert.equal(verifyUnsub(bad, "k"), null);
  assert.equal(verifyUnsub("garbage", "k"), null);
  assert.equal(verifyUnsub("", "k"), null);
});
test("emailHtml: link, cover, unsubscribe, escaping, direction", () => {
  const h = emailHtml("he", issue, "abc", SITE, SITE + "/u/tok");
  assert.match(h, /href="https:\/\/example\.web\.app\/i\/abc"/);
  assert.match(h, /src="https:\/\/x\/c\.jpg"/);
  assert.match(h, /href="https:\/\/example\.web\.app\/u\/tok"/);
  assert.match(h, /dir="rtl"/);
  assert.ok(!h.includes("<b>מסוכן</b>"), "description must be escaped");
  assert.match(emailHtml("en", issue, "abc", SITE, "u"), /dir="ltr"/);
  assert.match(emailHtml("xx", issue, "abc", SITE, "u"), /dir="rtl"/);     // שפה לא מוכרת -> עברית
});
test("emailSubject per language, unsubPage kinds", () => {
  assert.match(emailSubject("en", issue), /New issue/);
  assert.ok(emailSubject("he", issue).includes("ויקרא"));
  assert.match(unsubPage("ask", "t", "a@b.com"), /method="POST"/);
  assert.match(unsubPage("done"), /הוסרת/);
  assert.ok(!unsubPage("ask", "t", "<x>").includes("<x>"));
});

import { pathPart } from "../functions/helpers.js";
test("pathPart: decodes, indexes, survives malformed encoding", () => {
  assert.equal(pathPart("/i/abc", 2), "abc");
  assert.equal(pathPart("/u/a%20b", 2), "a b");
  assert.equal(pathPart("/i/%E0%A4%A", 2), "");      // קידוד פגום — לא זורק
  assert.equal(pathPart("", 2), "");
  assert.equal(pathPart(undefined, 1), "");
});

import { confirmToken, verifyConfirm, confirmHtml, confirmSubject, confirmPage } from "../functions/helpers.js";
test("confirm token: domain-separated from unsubscribe token, tamper-proof", () => {
  const t = confirmToken(" A@B.com ", "k");
  assert.equal(verifyConfirm(t, "k"), "a@b.com");
  assert.equal(verifyConfirm(t, "other"), null);
  assert.equal(verifyUnsub(t, "k"), null, "a confirm token must not unsubscribe");
  assert.equal(verifyConfirm(unsubToken("a@b.com", "k"), "k"), null, "an unsubscribe token must not confirm");
  assert.equal(verifyConfirm("x.y", "k"), null);
});
test("confirm mail and pages: languages, escaping", () => {
  assert.match(confirmHtml("en", "https://s/c/tok?a=1&b=2"), /dir="ltr"/);
  assert.match(confirmHtml("he", "u"), /dir="rtl"/);
  assert.match(confirmHtml("he", 'https://x/"><script>'), /&quot;&gt;&lt;script&gt;/);
  assert.match(confirmSubject("fr"), /Confirmez/); assert.match(confirmSubject("zz"), /אישור/);
  assert.match(confirmPage("ask", "<x>@y.com"), /method="POST"/); assert.ok(!confirmPage("ask", "<x>@y.com").includes("<x>"));
  assert.match(confirmPage("done"), /אושרה/); assert.match(confirmPage("bad"), /אינו תקף/);
});

import { emailText, confirmText } from "../functions/helpers.js";
test("plain-text alternatives carry the links in every language", () => {
  for (const lang of ["he", "en", "fr", "es", "zz"]) {
    const t = emailText(lang, { ...issue, desc: "תיאור" }, "abc", SITE, SITE + "/u/tok");
    assert.ok(t.includes(SITE + "/i/abc") && t.includes(SITE + "/u/tok") && !/<[a-z]/i.test(t), lang);
    const c = confirmText(lang, SITE + "/c/tok"); assert.ok(c.includes(SITE + "/c/tok") && !/<[a-z]/i.test(c), lang);
  }
  assert.ok(!emailText("he", { ...issue, desc: "" }, "abc", SITE, "u").includes("\n\n\n"));
});

import { linkSplit, richHtml, plainOf, MAIL_MAX_PAGES } from "../functions/helpers.js";
import { linkParts } from "../public/lib.js";
const four = [1, 2, 3, 4].map(k => ({ url: "https://f/p" + k + ".jpg?alt=media&token=t" }));
test("email contains ALL the text (not truncated) and ALL page images", () => {
  const long = Array.from({ length: 60 }, (_, k) => "משפט מספר " + k + " של ההלכה.").join(" ");
  const h = emailHtml("he", { ...issue, cover: undefined, desc: long, pages: four }, "abc", SITE, "u");
  assert.ok(h.includes("משפט מספר 59 של ההלכה."), "full text, not the 200-char summary");
  assert.equal((h.match(/<img /g) || []).length, 4);
  for (const p of four) assert.ok(h.includes(p.url.replace(/&/g, "&amp;")));
  assert.ok(emailText("he", { ...issue, desc: long }, "abc", SITE, "u").includes("משפט מספר 59 של ההלכה."));
});
test("email image cap, fallback and 'more pages' note", () => {
  const many = Array.from({ length: 20 }, (_, k) => ({ url: "https://f/p" + k + ".jpg" }));
  const h = emailHtml("en", { ...issue, pages: many }, "abc", SITE, "u");
  assert.equal((h.match(/<img /g) || []).length, MAIL_MAX_PAGES); assert.match(h, /\+8 more pages/);
  assert.equal((emailHtml("he", { parasha: "x" }, "abc", SITE, "u").match(/<img /g) || []).length, 1);   // בלי עמודים: תמונת ברירת מחדל
});
test("richHtml: headings, lists, bold, links and escaping (same format as the site)", () => {
  const h = richHtml("# כותרת\n**מודגש** וגם https://sefaria.org/x.\n- א\n- ב\n\n<script>alert(1)</script>");
  assert.match(h, /<h2[^>]*>כותרת<\/h2>/); assert.match(h, /<strong>מודגש<\/strong>/); assert.match(h, /href="https:\/\/sefaria\.org\/x"/);
  assert.equal((h.match(/<li /g) || []).length, 2); assert.ok(!h.includes("<script>")); assert.match(h, /&lt;script&gt;/);
  assert.ok(!/javascript:/i.test(richHtml("javascript:alert(1) [x](javascript:alert(1))")) || !/href="javascript:/i.test(richHtml("javascript:alert(1)")));
  assert.equal(plainOf("# כותרת\n**מודגש** טקסט\n\n\n\nסוף"), "כותרת\nמודגש טקסט\n\nסוף");
});
test("link splitter in functions stays identical to the site's linkParts", () => {
  for (const s of ["ראו https://www.sefaria.org/Shabbat.12a, ושם", "www.hebrewbooks.org/123.", "youtube.com/watch?v=abc", "(https://example.com/a).", "a@b.com ו-ftp://x.com", "שלום עולם. 3.5", "https://example.com/wiki_(x)."])
    assert.deepEqual(linkSplit(s), linkParts(s), s);
});

test("emailHtml: embedded sources (cid) are used per page, remote URL is the fallback", () => {
  const h = emailHtml("he", { ...issue, cover: undefined, pages: four }, "abc", SITE, "u", ["cid:p1@x", undefined, "cid:p3@x", undefined]);
  assert.ok(h.includes('src="cid:p1@x"') && h.includes('src="cid:p3@x"'));
  assert.ok(h.includes(four[1].url.replace(/&/g, "&amp;")) && h.includes(four[3].url.replace(/&/g, "&amp;")), "pages without cid keep the website URL");
  assert.equal((h.match(/<img /g) || []).length, 4);
  assert.ok(!emailHtml("he", { ...issue, pages: four }, "abc", SITE, "u").includes("cid:"));
});

test("mailBackoffMs: 5,10,20,40 minutes, capped at 60", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 9].map(n => mailBackoffMs(n) / 60000), [5, 10, 20, 40, 60, 60]);
});
