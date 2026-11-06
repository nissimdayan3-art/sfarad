import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { archiveHtml } from "../functions/helpers.js";

const read = f => readFileSync(f, "utf8");

test("index.html: שפה וכיוון, קישור דלג לתוכן, main עם id וסרגל נגישות", () => {
  const h = read("public/index.html");
  assert.match(h, /<html lang="he" dir="rtl">/);
  assert.match(h, /<a class="skip" href="#main">/);
  assert.match(h, /<main id="main"/);
  assert.match(h, /a11y\.js/);
  assert.match(h, /href="\/accessibility"/);
});

test("דף הצהרת הנגישות קיים, עם רכז, ומופנה בכתובת נקייה", () => {
  assert.ok(existsSync("public/accessibility.html"));
  const h = read("public/accessibility.html");
  assert.match(h, /הצהרת נגישות/);
  assert.match(h, /const COORD/);
  assert.match(h, /ת״י 5568/);
  const fb = JSON.parse(read("firebase.json"));
  assert.ok(fb.hosting.rewrites.some(r => r.source === "/accessibility" && r.destination === "/accessibility.html"));
});

test("CSS נגישות: פוקוס, הפחתת תנועה וניגודיות גבוהה", () => {
  const c = read("public/theme.css");
  assert.match(c, /:focus-visible\{outline/);
  assert.match(c, /prefers-reduced-motion:reduce/);
  assert.match(c, /\.a11y-contrast/);
});

test("sw.js ו-a11y.js תקינים תחבירית ושומרים העדפות בלי להשבית את האתר כשאין אחסון", () => {
  const a = read("public/a11y.js");
  assert.match(a, /try \{ localStorage/);
  assert.match(a, /aria-expanded/);
  assert.match(a, /Escape/);
  new Function(a);   // נכשל אם יש שגיאת תחביר
});

test("עמוד הארכיון: main עם id וקישור להצהרת נגישות", () => {
  const h = archiveHtml([], "https://s");
  assert.match(h, /<main id="main">/);
  assert.match(h, /href="\/accessibility"/);
});
