// הרצה: npm test   (Node 20+, בלי התקנות – משתמש ב-node:test המובנה)
process.env.TZ = "Asia/Jerusalem";
import test from "node:test";
import assert from "node:assert/strict";
const L = await import("../public/lib.js");

const at = iso => new Date(iso + "T12:00:00");
const mk = (n, t, day, m, extra = {}) => ({ id: n, n, c: "", city: "", d: "", y: "", t, day, m, ...extra });

test("gem: מספר ← אותיות", () => {
  assert.equal(L.gem(13), "י״ג");
  assert.equal(L.gem(15), "ט״ו");   // לא י״ה
  assert.equal(L.gem(16), "ט״ז");
  assert.equal(L.gem(5), "ה׳");
  assert.equal(L.gem(5787), "תשפ״ז"); // מודולו 1000
});
test("gday: אותיות ← יום בחודש", () => {
  assert.equal(L.gday("יג"), 13);
  assert.equal(L.gday("טו"), 15);
  assert.equal(L.gday("ל"), 30);
});
test("dayDiff / halIdx / addDays", () => {
  assert.equal(L.dayDiff("2026-10-01", "2026-10-25"), 24);
  assert.equal(L.dayDiff("2026-03-28", "2026-03-30"), 2);   // מעבר שעון קיץ לא משפיע
  assert.equal(L.halIdx({ start: "2026-10-01", count: 7 }, "2026-10-01"), 0);
  assert.equal(L.halIdx({ start: "2026-10-01", count: 7 }, "2026-09-30"), 6); // לפני ההתחלה – מודולו חיובי
  assert.equal(L.halIdx({ start: "2026-10-01", count: 7 }, "2026-10-09"), 1);
  assert.equal(L.addDays("2026-02-28", 1), "2026-03-01");
  assert.equal(L.addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(L.addDays("2026-03-01", -1), "2026-02-28");
});
test("isoOf / pad2 / D", () => {
  assert.equal(L.pad2(5), "05");
  assert.equal(L.isoOf(new Date(2026, 0, 9)), "2026-01-09");
  assert.equal(L.isoOf(L.D("2026-10-24")), "2026-10-24");
});
test("hebOf / heLetters", () => {
  assert.deepEqual(L.hebOf(at("2026-10-24")), { day: 13, month: "Heshvan" });
  const s = L.heLetters("2026-10-24");
  assert.ok(s.startsWith("י״ג"), s);
  assert.ok(s.endsWith("תשפ״ז"), s);
});
test("dayKeys: יום רגיל וכלל ל׳ בחודש חסר", () => {
  assert.ok(L.dayKeys(at("2026-10-24")).has("13|חשון"));
  // מוצא א׳ בחודש שהקודם לו התחיל ב-29 (כלומר חסר) ← חייב לכלול גם «30|חודש קודם»
  let found = 0;
  for (let k = 0; k < 800 && !found; k++) {
    const d = at("2026-01-01"); d.setDate(d.getDate() + k);
    const h = L.hebOf(d); if (h.day !== 1) continue;
    const pv = new Date(d); pv.setDate(d.getDate() - 1); const hp = L.hebOf(pv);
    if (hp.day === 29) { found++; const keys = L.dayKeys(d); assert.ok([...L.HM[hp.month]].some(m => keys.has("30|" + m)), String(hp.month)); }
  }
  assert.ok(found > 0, "לא נמצא חודש חסר בטווח");
});
test("weekKeys: שבעה ימים ללא כפילויות ריקות", () => {
  const k = L.weekKeys("2026-10-24", 0);   // שבת
  assert.ok(k.size >= 7);
  assert.ok(k.has("13|חשון") && k.has("7|חשון"));
  assert.ok(!k.has("14|חשון"));
  assert.ok(L.weekKeys("2026-10-24", 1).has("20|חשון"));
});
test("halKeysFor: סדר עדיפויות", () => {
  const k = L.halKeysFor(at("2026-10-24"));
  assert.equal(k[0], "g:2026-10-24");
  assert.ok(k.includes("hy:5787|13|חשון"));
  assert.ok(k.includes("gm:10-24"));
  assert.ok(k.includes("hr:13|חשון"));
  assert.ok(k.indexOf("hy:5787|13|חשון") < k.indexOf("gm:10-24"));
});
test("halTextKeys: תאריכים בטקסט", () => {
  assert.deepEqual(L.halTextKeys("13/10/2026"), ["g:2026-10-13", "gm:10-13"]);
  assert.deepEqual(L.halTextKeys("2026-10-05"), ["g:2026-10-05", "gm:10-05"]);
  const a = L.halTextKeys("י״ג חשוון תשפ״ז");
  assert.ok(a.includes("hy:5787|13|חשון") && a.includes("hr:13|חשון"), a.join());
  assert.ok(L.halTextKeys("ט״ו בשבט").includes("hr:15|שבט"));
  assert.ok(L.halTextKeys("ל׳ אדר ב׳").includes("hr:30|אדר ב'"));
  assert.ok(L.halTextKeys("ג׳ תשרי").includes("hr:3|תשרי"));
  assert.deepEqual(L.halTextKeys("בלי תאריך"), []);
  assert.deepEqual(L.halTextKeys(""), []);
});
test("halRowKeys: תא תאריך וטקסט", () => {
  assert.ok(L.halRowKeys({ "תאריך": new Date(Date.UTC(2026, 9, 24)) }).includes("g:2026-10-24"));
  assert.ok(L.halRowKeys({ "תאריך עברי": "י״ג חשון", "תוכן": "x" }).includes("hr:13|חשון"));
  assert.deepEqual(L.halRowKeys({ "תוכן": "טקסט בלבד" }), []);
});
test("nrm: ניקוד, גרשיים ומקפים", () => {
  assert.equal(L.nrm("הָרַב  י\"ג-חשון"), "הרב יג חשון");
  assert.equal(L.nrm(null), "");
  assert.equal(L.nrm("רבי' יוסף, קארו."), "רבי יוסף קארו");
});
test("sortKey: בלי תואר", () => {
  assert.equal(L.sortKey("רבי יוסף קארו"), "יוסף קארו");
  assert.equal(L.sortKey("הרב דוד"), "דוד");
  assert.equal(L.sortKey("דוד"), "דוד");
});
test("זיהוי חכמים בטקסט חופשי", () => {
  const all = [mk("רבי יוסף קארו", "י״ג חשון", 13, "חשון"), mk("הרב דוד", "י״ג כסלו", 13, "כסלו")];
  assert.equal(L.findSagesInText("כך כתב רבינו יוסף קארו בשולחן ערוך", all).length, 1);
  assert.equal(L.findSagesInText("ביוסף קארו נאמר", all).length, 1);       // תחילית ב׳
  assert.equal(L.findSagesInText("יוסף קארוטי", all).length, 0);          // לא מתאים באמצע מילה
  assert.equal(L.findSagesInText("", all).length, 0);
  assert.ok(L.hasPhrase("שלום יוסף קארו", "יוסף קארו"));
  assert.ok(!L.hasPhrase("שלום יוסף קארוטי", "יוסף קארו"));
  assert.ok(L.sageCands({ n: "רבי יוסף קארו (המחבר)" }).includes("יוסף קארו"));
});
test("sageSearch: שם, יום בחודש, חודש וכינויים", () => {
  const arr = [mk("רבי יוסף קארו", "י״ג חשון", 13, "חשון"), mk("רבי אברהם", "ט״ו שבט", 15, "שבט"), mk("הרב דוד", "י״ג כסלו", 13, "כסלו"), mk("הרב שמעון", "ל׳ אדר א׳", 30, "אדר א'"), mk("רבי יהודה", "ג׳ תשרי", 3, "תשרי")];
  const q = x => L.sageSearch(arr, x).list.map(g => g.n);
  assert.deepEqual(q("13").sort(), ["הרב דוד", "רבי יוסף קארו"].sort());
  assert.deepEqual(q("י״ג").sort(), q("13").sort());
  assert.deepEqual(q("יג").sort(), q("13").sort());
  assert.deepEqual(q("13 חשון"), ["רבי יוסף קארו"]);
  assert.deepEqual(q("י״ג בחשוון"), ["רבי יוסף קארו"]);
  assert.deepEqual(q("15"), ["רבי אברהם"]);
  assert.deepEqual(q("טו"), ["רבי אברהם"]);
  assert.deepEqual(q("30"), ["הרב שמעון"]);
  assert.deepEqual(q("3"), ["רבי יהודה"]);     // לא תופס 13 / 30
  assert.deepEqual(q("בכסליו"), ["הרב דוד"]);
  assert.deepEqual(q("קארו 13"), ["רבי יוסף קארו"]);
  assert.deepEqual(q("קארו 15"), []);
  assert.equal(L.sageSearch(arr, "").list.length, arr.length);
  assert.deepEqual(L.sageSearch(arr, "יוסף").toks, ["יוסף"]);
});
test("sunsetMs: ערכים ידועים (סטייה עד 3 דקות)", () => {
  const near = (ms, h, m, tol = 3) => { const d = new Date(ms), got = d.getUTCHours() * 60 + d.getUTCMinutes(), want = h * 60 + m; assert.ok(Math.abs(got - want) <= tol, `got ${d.toISOString()} want ~${h}:${m} UTC`); };
  near(L.sunsetMs(2026, 12, 21, 31.778, 35.235), 14, 39);   // ירושלים 16:39 (שעון חורף)
  near(L.sunsetMs(2026, 6, 21, 31.778, 35.235), 16, 47);    // ירושלים 19:47 (שעון קיץ)
  near(L.sunsetMs(2026, 6, 21, 40.713, -74.006), 0, 30);    // ניו יורק 20:30 EDT = 00:30 UTC
  near(L.sunsetMs(2026, 6, 21, -33.869, 151.209), 6, 53);   // סידני 16:53 AEST
  assert.equal(L.sunsetMs(2026, 6, 21, 80, 0), null);       // שמש חצות – אין שקיעה
});
test("hereLoc / isAfterSunset לפי אזור הזמן", () => {
  assert.deepEqual(L.hereLoc(), [31.778, 35.235]);
  assert.equal(L.isAfterSunset(new Date("2026-12-21T14:00:00Z")), false); // 16:00 בירושלים
  assert.equal(L.isAfterSunset(new Date("2026-12-21T15:30:00Z")), true);  // 17:30
  process.env.TZ = "America/New_York";
  assert.deepEqual(L.hereLoc(), [40.713, -74.006]);
  process.env.TZ = "Asia/Jerusalem";
  assert.match(L.todayStr(), /^\d{4}-\d{2}-\d{2}$/);
});

test("carryPhotos: ייבוא מחדש שומר תמונות לפי מזהה", () => {
  const old = [["a", "א"].concat(Array(7).fill("")).concat(["https://x/a.jpg"]), ["b", "ב", "", "", "", "", "", 1, "תשרי"]];
  const rows = [["a", "א", "", "", "", "", "t", 1, "תשרי"], ["b", "ב", "", "", "", "", "t", 2, "תשרי"], ["c", "ג", "", "", "", "", "t", 3, "תשרי"]];
  assert.equal(L.carryPhotos(rows, old), 1);
  assert.equal(rows[0][L.PHOTO_IDX], "https://x/a.jpg");
  assert.equal(rows[1].length, 9);          // בלי תמונה – השורה לא מורחבת
  assert.equal(rows[2].length, 9);
  assert.equal(L.carryPhotos(rows, null), 0);
});

test("cleanBooks: מסנן כתובות לא תקינות, חותך פירוט ומגביל כמות", () => {
  assert.deepEqual(L.cleanBooks(null), []);
  assert.deepEqual(L.cleanBooks([["https://x/a.jpg", "  עטיפה  "], ["http://x/b.jpg", "x"], ["https://x/c.jpg"], "bad", [5, "x"]]), [["https://x/a.jpg", "עטיפה"], ["https://x/c.jpg", ""]]);
  assert.equal(L.cleanBooks([["https://x/a.jpg", "ש".repeat(500)]])[0][1].length, L.BOOK_CAP_MAX);
  assert.equal(L.cleanBooks(Array.from({ length: 20 }, (_, i) => ["https://x/" + i, ""])).length, L.BOOKS_MAX);
});
test("carryPhotos: שומר גם תמונות ספר (גם בלי תמונה ראשית)", () => {
  const old = [["a", "א", "", "", "", "", "", 1, "x", "https://x/a.jpg", [["https://x/b.jpg", "שער הספר"]]], ["b", "ב", "", "", "", "", "", 1, "x", null, [["https://x/c.jpg", "עטיפה"]]], ["c", "ג"]];
  const rows = [["a", "א"], ["b", "ב"], ["c", "ג"], ["d", "ד"]];
  assert.equal(L.carryPhotos(rows, old), 2);
  assert.equal(rows[0][L.PHOTO_IDX], "https://x/a.jpg");
  assert.deepEqual(rows[0][L.BOOKS_IDX], [["https://x/b.jpg", "שער הספר"]]);
  assert.deepEqual(rows[1][L.BOOKS_IDX], [["https://x/c.jpg", "עטיפה"]]);
  assert.equal(rows[2][L.BOOKS_IDX], undefined);
});

test("זמני היום: ניתוח גיליון עיר", () => {
  const raw = [
    ["יום בשבוע", "תאריך", "זריחה", "שקיעה", "הדלקת הנר", "ציצית"],
    ["ראשון", "06/09/2026", "6:24", "18:59", null, null],
    ["שישי", "11/09/2026", "6:27", "18:53", "18:33", ""],
    ["שבת", "12/09/2026", "6:27", "18:52", "", "5:08-13"],
    ["", "הערה", "", "", "", ""],
  ];
  const r = L.parseZmanimRows(raw);
  assert.deepEqual(r.h, ["זריחה", "שקיעה", "הדלקת הנר", "ציצית"]);
  assert.equal(r.n, 3); assert.equal(r.from, "2026-09-06"); assert.equal(r.to, "2026-09-12");
  assert.deepEqual(r.d["2026-09-06"], ["6:24", "18:59"]);      // ערכים ריקים בסוף נחתכים
  assert.deepEqual(r.d["2026-09-11"], ["6:27", "18:53", "18:33"]);
  assert.deepEqual(r.d["2026-09-12"], ["6:27", "18:52", "", "5:08-13"]); // טווחים נשמרים כמות שהם
});
test("זמני היום: כותרות לא בשורה הראשונה, תאריך כמספר אקסל ושעה כשבר יום", () => {
  const raw = [["זמני היום – חיפה"], [], ["יום", "תאריך", "שקיעה"], ["ג", 46273, 0.75]]; // 46273 = 08/09/2026
  const r = L.parseZmanimRows(raw);
  assert.deepEqual(r.h, ["שקיעה"]);
  assert.deepEqual(r.d["2026-09-08"], ["18:00"]);
});
test("זמני היום: בלי עמודת תאריך ← null; שמות ערים", () => {
  assert.equal(L.parseZmanimRows([["א", "ב"], [1, 2]]), null);
  assert.equal(L.parseZmanimRows([]), null);
  assert.equal(L.zmIso("31/02/2026"), "2026-02-31"); // אין בדיקת ימי חודש מדויקת – מספיק טווח 1–31
  assert.equal(L.zmIso("בדיקה"), null);
  assert.equal(L.zmCityName("תל_אביב.xlsx"), "תל אביב");
  assert.equal(L.zmCityId("בני ברק/1"), "בני_ברק1");
});
