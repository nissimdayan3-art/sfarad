import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const { ADMIN_GROUPS, adminGroupOf } = await import("../public/lib.js");

const app = readFileSync("public/app.js", "utf8");
const dispatch = app.split("\n").find(l => l.includes('if (adminTab === "visual") visualBar(c);'));
const dispatched = [...dispatch.matchAll(/adminTab === "(\w+)"/g)].map(m => m[1]).concat("admins");   // admins = הענף האחרון (else)
const grouped = ADMIN_GROUPS.flatMap(g => g.tabs);

test("ניווט ניהול: כל לשונית שמוצגת שייכת לקבוצה אחת בדיוק", () => {
  assert.deepEqual([...grouped].sort(), [...dispatched].sort());
  assert.equal(new Set(grouped).size, grouped.length, "לשונית בשתי קבוצות");
});
test("ניווט ניהול: לכל לשונית יש תווית ב-app.js", () => {
  const labels = app.slice(app.indexOf("const TAB_LABEL = {"), app.indexOf("const grp = adminGroupOf"));
  for (const k of grouped) assert.match(labels, new RegExp("\\b" + k + ":"), k);
});
test("ניווט ניהול: קבוצה לפי לשונית, וברירת מחדל לראשונה", () => {
  assert.equal(adminGroupOf("mailtrack").id, "mail");
  assert.equal(adminGroupOf("sagemgr").id, "sages");
  assert.equal(adminGroupOf("backup").id, "system");
  assert.equal(adminGroupOf("nope").id, ADMIN_GROUPS[0].id);
  assert.ok(ADMIN_GROUPS.every(g => g.label && g.tabs.length));
});
