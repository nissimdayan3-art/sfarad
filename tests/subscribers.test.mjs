import test from "node:test";
import assert from "node:assert/strict";
import { parseSubRows, subDoc, cleanField, langOf, SUB_LIM } from "../public/lib.js";
import { cleanDetail, emailHtml, emailText } from "../functions/helpers.js";

test("parseSubRows: Hebrew header maps name/phone/city/note/lang", () => {
  const m = parseSubRows('אימייל,שם,טלפון,עיר,הערה,שפה\ny@x.com,"כהן, יוסי",050-1234567,ירושלים,תורם,עברית\nj@x.com,John,,Paris,,French');
  assert.equal(m.size, 2);
  assert.deepEqual(m.get("y@x.com"), { email: "y@x.com", name: "כהן, יוסי", phone: "050-1234567", city: "ירושלים", note: "תורם", lang: "he" });
  assert.deepEqual(m.get("j@x.com"), { email: "j@x.com", name: "John", city: "Paris", lang: "fr" });
});
test("parseSubRows: English header, tabs/semicolons, other column order, duplicate rows merge", () => {
  const m = parseSubRows("Name;Email;Phone\nDavid;d@x.com;0501\nDavid;D@X.COM;");
  assert.equal(m.size, 1); assert.deepEqual(m.get("d@x.com"), { email: "d@x.com", name: "David", phone: "0501" });
  assert.equal(parseSubRows("name\temail\nSara\ts@x.com").get("s@x.com").name, "Sara");
});
test("parseSubRows: plain lists, two-cell rows, multiple emails per line, noise", () => {
  const m = parseSubRows("a@x.com, b@x.com c@x.com\nרבקה לוי, r@x.com\n12345, n@x.com\nסתם טקסט בלי כתובת\nbad@@x, ok@y.co.il.");
  assert.deepEqual([...m.keys()].sort(), ["a@x.com", "b@x.com", "c@x.com", "n@x.com", "ok@y.co.il", "r@x.com"]);
  assert.equal(m.get("r@x.com").name, "רבקה לוי");
  assert.equal(m.get("n@x.com").name, undefined, "a number alone is not a name");
  assert.equal(m.get("a@x.com").name, undefined);
});
test("parseSubRows: header repeated for a second sheet, sanitising and length limits", () => {
  const long = "א".repeat(200);
  const m = parseSubRows(`שם,מייל\nאבי,a@x.com\n\nשם,מייל\n"${long}",b@x.com\n=cmd|' /C calc'!A0,c@x.com`);
  assert.equal(m.get("b@x.com").name.length, SUB_LIM.name);
  assert.equal(m.get("a@x.com").name, "אבי");
  assert.equal(cleanField("a\u202eb\nc\u0000d", 50), "a b c d");
});
test("subDoc, langOf, cleanDetail", () => {
  assert.deepEqual(subDoc({ email: "a@x.com", name: "N" }), { email: "a@x.com", lang: "he", ts: 1, name: "N" });
  assert.deepEqual(subDoc({ email: "a@x.com", lang: "en", phone: "1", city: "C", note: "n" }), { email: "a@x.com", lang: "en", ts: 1, phone: "1", city: "C", note: "n" });
  assert.deepEqual(["Français", "ספרדית", "EN", "xx", ""].map(langOf), ["fr", "es", "en", "", ""]);
  assert.equal(cleanDetail("  יוסי\n\t  כהן\u200f ", 60), "יוסי כהן");
  assert.equal(cleanDetail(null, 5), ""); assert.equal(cleanDetail("abcdefgh", 5), "abcde");
});
test("email greets by name in every language, escapes it, and omits the greeting without a name", () => {
  const issue = { parasha: "נח", num: 5, date: "2026-10-17" };
  assert.match(emailHtml("he", issue, "i", "https://s", "u", undefined, "יוסי"), /שלום יוסי,/);
  assert.match(emailHtml("en", issue, "i", "https://s", "u", undefined, "Joe"), /Hello Joe,/);
  assert.match(emailHtml("fr", issue, "i", "https://s", "u", undefined, "Luc"), /Bonjour Luc,/);
  assert.match(emailHtml("es", issue, "i", "https://s", "u", undefined, "Ana"), /Hola Ana,/);
  const bad = emailHtml("he", issue, "i", "https://s", "u", undefined, '<img src=x onerror=alert(1)>');
  assert.ok(!bad.includes("<img src=x") && bad.includes("&lt;img"));
  assert.ok(!emailHtml("he", issue, "i", "https://s", "u").includes("שלום "));
  assert.match(emailText("he", issue, "i", "https://s", "u", "יוסי"), /^שלום יוסי,\n/);
  assert.ok(!/^שלום/.test(emailText("he", issue, "i", "https://s", "u")));
});

import { SUB_LIMITS } from "../functions/helpers.js";
test("field limits and sanitising agree between the website and the functions", () => {
  assert.deepEqual(SUB_LIM, SUB_LIMITS);
  for (const s of ["  a\u202eb\u200f\n\tc  ", "\u0000x\u007fy", "א".repeat(300)]) for (const k of Object.keys(SUB_LIM)) assert.equal(cleanField(s, SUB_LIM[k]), cleanDetail(s, SUB_LIMITS[k]));
});
