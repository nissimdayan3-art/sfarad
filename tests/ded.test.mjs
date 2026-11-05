import test from "node:test"; import assert from "node:assert/strict";
import { parseDedRows, hebYearMap } from "../public/lib.js";
test("hebYearMap 5787", () => { const m = hebYearMap(5787); assert.equal(m["Tishri|1"], "2026-09-12"); assert.equal(Object.keys(m).length, 385); assert.equal(m["Elul|29"], "2027-10-01"); });
test("parseDedRows", () => {
  const rows = [[null,null,null,null,null,"שם","נתרם ע\"י"], [null,null,null,null,null,"הוראות"], ["יום שבת","א'","תשרי","ה'תשפ\"ז",null,"לע\"נ א","נתרם ע\"י ב",null,"לע\"נ ג"], ["יום ראשון","ב'","תשרי","ה'תשפ\"ז"], ["יום שני","ל'","אדר ב'","ה'תשפ\"ז",null,"x"]];
  const r = parseDedRows(rows);
  assert.deepEqual(r.d["2026-09-12"], [["לע\"נ א","נתרם ע\"י ב"],["לע\"נ ג"]]);
  assert.equal(r.days, 2); assert.equal(r.items, 2); assert.equal(r.bad.length, 1);
});
