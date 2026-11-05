import test from "node:test"; import assert from "node:assert/strict"; import { readFileSync } from "node:fs";
import { layoutList } from "../public/lib.js";
const defs = [["a", "A"], ["b", "B"], ["c", "C"]];
test("layoutList: בלי שמור – סדר ברירת המחדל, הכול מוצג", () => {
  for (const sv of [undefined, null, {}, []]) assert.deepEqual(layoutList(defs, sv), [{ id: "a", label: "A", hide: false }, { id: "b", label: "B", hide: false }, { id: "c", label: "C", hide: false }]);
});
test("layoutList: סדר והסתרה שמורים; חסר נוסף בסוף; לא מוכר נזרק", () => {
  const r = layoutList(defs, [["c", 0], ["zzz", 1], ["a", 1]]);
  assert.deepEqual(r.map(x => [x.id, x.hide]), [["c", false], ["a", true], ["b", false]]);
  assert.equal(r[0].label, "C");
});
test("layoutList: מחזיר אובייקטים חדשים בכל קריאה", () => { const x = layoutList(defs, null); x[0].hide = true; assert.equal(layoutList(defs, null)[0].hide, false); });
test("app.js מייבא את layoutList מ-lib.js (1.36.2: חסרה ההגדרה והאתר לא צויר)", () => {
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app.split("\n").find(l => l.startsWith("import {") && l.includes("./lib.js")), /\blayoutList\b/);
});
