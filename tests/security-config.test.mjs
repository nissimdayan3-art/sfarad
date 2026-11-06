import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("firebase.json: כותרת נגד הטמעה ב-iframe", () => {
  const h = JSON.parse(readFileSync("firebase.json", "utf8")).hosting.headers.find(x => x.source === "**").headers;
  assert.equal(h.find(x => x.key === "X-Frame-Options")?.value, "SAMEORIGIN");
});

test("storage.rules: לא מאשר SVG או כל image/*", () => {
  const r = readFileSync("storage.rules", "utf8");
  assert.ok(!r.includes("image/.*"), "אסור לאשר image/.* (כולל SVG)");
  assert.ok(r.includes("image/(jpeg|png|webp)"));
});

test("אין תמיכה בהעלאת SVG בממשק הניהול", () => {
  assert.ok(!/accept = "[^"]*image\/\*/.test(readFileSync("public/app.js", "utf8").split("\n").filter(l => l.includes("application/pdf")).join("\n")));
});

test("גיבוי Storage: פונקציית שחזור מוגנת מנהלים וממשק הניהול מציע שחזור מדיה", () => {
  const fn = readFileSync("functions/index.js", "utf8");
  const app = readFileSync("public/app.js", "utf8");
  assert.match(fn, /export const backupRestoreStorage = onCall/);
  assert.match(fn, /await adminOnly\(request\)/);
  assert.match(fn, /backupRestoreStorage/);
  assert.match(app, /שחזור קובצי PDF ותמונות/);
});
