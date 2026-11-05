import test from "node:test";
import assert from "node:assert/strict";
import { linkParts } from "../public/lib.js";
const links = t => linkParts(t).filter(p => p.t === "link").map(p => p.href);
test("linkParts: http, www and bare domains", () => {
  assert.deepEqual(links("ראו https://www.sefaria.org/Shabbat.12a?lang=he ושם"), ["https://www.sefaria.org/Shabbat.12a?lang=he"]);
  assert.deepEqual(links("באתר www.hebrewbooks.org/123"), ["https://www.hebrewbooks.org/123"]);
  assert.deepEqual(links("youtube.com/watch?v=abc"), ["https://youtube.com/watch?v=abc"]);
});
test("linkParts: trailing punctuation and parens trimmed", () => {
  assert.deepEqual(links("(https://example.com/a)."), ["https://example.com/a"]);
  assert.deepEqual(links("https://example.com/wiki_(x)."), ["https://example.com/wiki_(x)"]);
  assert.deepEqual(links("ראו https://example.com, ואז"), ["https://example.com"]);
});
test("linkParts: no false positives, no unsafe schemes, emails untouched", () => {
  assert.deepEqual(links("שלום עולם. סוף משפט.אחרת 3.5 וגם a@b.com"), []);
  assert.deepEqual(links("javascript:alert(1) ו-ftp://x.com"), []);
});
test("linkParts: round-trips original text", () => {
  const s = "א https://a.com/x ב www.b.org ג";
  assert.equal(linkParts(s).map(p => p.v).join(""), s);
});
