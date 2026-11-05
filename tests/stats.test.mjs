import test from "node:test";
import assert from "node:assert/strict";
import { onlyCountersChanged } from "../public/lib.js";
const a = [{ id: "1", parasha: "x", views: 1, downloads: 0, pages: [{ url: "u" }] }, { id: "2", parasha: "y" }];
test("onlyCountersChanged: counters only", () => {
  const b = JSON.parse(JSON.stringify(a)); b[0].views = 5; b[1].downloads = 3;
  assert.equal(onlyCountersChanged(a, b), true);
});
test("onlyCountersChanged: real changes, adds, removes", () => {
  const b = JSON.parse(JSON.stringify(a)); b[0].parasha = "z"; assert.equal(onlyCountersChanged(a, b), false);
  assert.equal(onlyCountersChanged(a, a.slice(0, 1)), false);
  assert.equal(onlyCountersChanged(a, [...a, { id: "3" }]), false);
  const c = JSON.parse(JSON.stringify(a)); c[0].cover = { url: "c" }; assert.equal(onlyCountersChanged(a, c), false);
  assert.equal(onlyCountersChanged([], []), true);
  assert.equal(onlyCountersChanged(null, a), false);
});
