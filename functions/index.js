// Firebase Functions (v2). פריסה: cd functions && npm install && cd .. && firebase deploy
//  • archive      – דף /archive: רשימת כל הגיליונות עם קישורים רגילים (לסריקה)
//  • share        – דף שיתוף /i/<id> עם תצוגה מקדימה (Open Graph) לכל גיליון
//  • notifyIssue  – שליחת התראת Push למנויים (למנהלים בלבד)
//  • mailIssue    – שליחת גיליון במייל למנויים (SMTP של הדומיין), למנהלים בלבד
//  • mailJobStart / mailJobControl / mailWorker – שליחה ברקע (ממשיכה גם כשהדפדפן סגור)
//  • unsub        – הסרה מרשימת התפוצה (/u/<אסימון>)
//  • backup       – גיבוי שבועי של Firestore ל-Storage (backups/YYYY-MM-DD/), נשמרים 8 אחרונים
import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getStorage } from "firebase-admin/storage";
import { defineSecret } from "firebase-functions/params";
import nodemailer from "nodemailer";
import { randomBytes, createHash } from "node:crypto";
import { pathPart, shareHtml, archiveHtml, sitemapXml, rssXml, backupFolder, oldBackupFolders, isPermanentMailError, listMediaSources, staleBackupMedia, trackToken, verifyTrack, TRACK_GIF, applyTrackEvent, backupReplacer, backupReviver, validBackupDate, validBackupCollection, pushMessage, imageOf, issueTitle, emailHtml, emailSubject, unsubToken, verifyUnsub, unsubPage, confirmToken, verifyConfirm, confirmSubject, confirmHtml, confirmPage, emailText, confirmText, MAIL_MAX_PAGES, cleanDetail, SUB_LIMITS, mailBackoffMs } from "./helpers.js";

initializeApp();
const db = getFirestore();
const REGION = "europe-west1";                                   // חייב להיות זהה ל-firebase.json ול-FUNCTIONS_REGION באתר
const SITE = process.env.SITE_URL || "https://www.toratsfarad.co.il"; // אם יש דומיין משלכם – עדכנו כאן
const SMTP_PASS = defineSecret("SMTP_PASS");                  // firebase functions:secrets:set SMTP_PASS  (סיסמת תיבת המייל)
// שרת הדואר של הדומיין (פרטי תיבת המייל מחברת האחסון). 465 = SSL, 587 = STARTTLS
const LANGS = ["he", "en", "fr", "es"], EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SMTP = { host: "mail02.intervision.co.il", port: 465, secure: true, user: "toratsfarad@toratsfarad.co.il" };
const MAIL_FROM = { address: SMTP.user, name: "גיליון חכמי ספרד" };
const MAIL_DAILY_MAX = 100;                                   // תקרה לקריאה אחת (שרתי אחסון מגבילים לרוב שליחה לשעה)
const cleanId = s => String(s || "").replace(/[^\w-]/g, "").slice(0, 60);

// הגיליון הקודם/הבא (לפי תאריך) ועד 4 גיליונות של אותה פרשה בשנים אחרות. כשל בשאילתה לא מפיל את הדף
async function relatedIssues(id, issue) {
  const one = async q => { try { const r = await q.limit(1).get(); return r.empty ? null : { ...r.docs[0].data(), id: r.docs[0].id }; } catch (e) { console.error("related", e); return null; } };
  const d = /^\d{4}-\d{2}-\d{2}$/.test(String(issue.date || "")) ? issue.date : "";
  const col = db.collection("issues");
  const [prev, next, same] = await Promise.all([
    d ? one(col.where("date", "<", d).orderBy("date", "desc")) : null,
    d ? one(col.where("date", ">", d).orderBy("date", "asc")) : null,
    issue.parasha ? col.where("parasha", "==", issue.parasha).limit(10).get().then(r => r.docs.filter(x => x.id !== id).map(x => ({ ...x.data(), id: x.id })).sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 4)).catch(e => { console.error("related-same", e); return []; }) : []
  ]);
  return { prev, next, same };
}

export const share = onRequest({ region: REGION, memory: "256MiB", maxInstances: 5 }, async (req, res) => {
  const id = cleanId(pathPart(req.path, 2));
  if (id === "_ping") { res.set("Cache-Control", "no-store").status(200).send("ok"); return; }   // האתר בודק איתה אם הפונקציה פרוסה
  let issue = null;
  try { if (id) { const s = await db.doc("issues/" + id).get(); if (s.exists) issue = s.data(); } } catch (e) { console.error("share", e); }
  if (!issue) { res.redirect(302, "/"); return; }
  const rel = await relatedIssues(id, issue);
  res.set("Content-Type", "text/html; charset=utf-8").set("Cache-Control", "public, max-age=300, s-maxage=600").status(200).send(shareHtml(issue, id, SITE, rel));
});

// תאריך יצירה אמיתי של מסמך (createTime של Firestore; לא משתנה בעדכון מוני צפיות), כ-ISO
const createdOf = d => { try { return d.createTime.toDate().toISOString().slice(0, 10); } catch (e) { return ""; } };
const allIssues = async () => { const q = await db.collection("issues").select("date", "parasha", "num").get(); return q.docs.map(d => ({ id: d.id, date: d.get("date"), parasha: d.get("parasha"), num: d.get("num"), created: createdOf(d) })); };

export const sitemap = onRequest({ region: REGION, memory: "256MiB", maxInstances: 2 }, async (req, res) => {
  let issues = [];
  try { issues = await allIssues(); } catch (e) { console.error("sitemap", e); }
  res.set("Content-Type", "application/xml; charset=utf-8").set("Cache-Control", "public, max-age=3600, s-maxage=3600").status(200).send(sitemapXml(SITE, issues));
});

export const archive = onRequest({ region: REGION, memory: "256MiB", maxInstances: 2 }, async (req, res) => {
  let issues = [];
  try { issues = await allIssues(); } catch (e) { console.error("archive", e); }
  res.set("Content-Type", "text/html; charset=utf-8").set("Cache-Control", "public, max-age=900, s-maxage=900").status(200).send(archiveHtml(issues, SITE));
});

export const rss = onRequest({ region: REGION, memory: "256MiB", maxInstances: 2 }, async (req, res) => {
  let issues = [];
  try { const q = await db.collection("issues").orderBy("date", "desc").limit(50).get(); issues = q.docs.map(d => ({ ...d.data(), id: d.id })); } catch (e) { console.error("rss", e); }
  res.set("Content-Type", "application/rss+xml; charset=utf-8").set("Cache-Control", "public, max-age=1800, s-maxage=1800").status(200).send(rssXml(SITE, issues));
});

// גיבוי שבועי (יום א׳ 03:00): אוספי Firestore וקובצי Storage נשמרים ב-backups/<תאריך>/.
// כללי Storage לא מתירים גישה לנתיב הזה, כך שרק Admin SDK (הפונקציה) יכול לקרוא/לכתוב.
// מדלגים על rate (מונים זמניים) ועל private (הגדרות מייל). אוספי משנה עדיין אינם נכללים.
const BACKUP_SKIP = new Set(["rate", "private"]), BACKUP_KEEP = 8;
const BACKUP_COPY_BATCH = 20;
async function inBatches(items, size, fn) {
  for (let i = 0; i < items.length; i += size) await Promise.all(items.slice(i, i + size).map(fn));
}
async function runBackup() {
  const bucket = getStorage().bucket(), folder = backupFolder(), done = [], media = [];
  for (const col of await db.listCollections()) {
    if (BACKUP_SKIP.has(col.id)) continue;
    const snap = await col.get();
    const data = snap.docs.map(d => ({ id: d.id, data: d.data() }));
    await bucket.file(folder + col.id + ".json").save(JSON.stringify(data, backupReplacer(Timestamp)), { contentType: "application/json", resumable: false });
    done.push(col.id + ":" + data.length);
  }
  // גיבוי כל האובייקטים של האתר, למעט תיקיית הגיבויים עצמה. הנתיב המקורי נשמר תחת storage/.
  // לא מוחקים מראש: מעתיקים (דורס) ורק אחרי הצלחה מוחקים מהגיבוי של אותו יום קבצים שכבר אינם באתר,
  // כך שהרצה שנכשלה באמצע לא הורסת את הגיבוי הקיים של אותו יום.
  const sourceFiles = await listMediaSources(bucket), mediaPrefix = folder + "storage/";
  await inBatches(sourceFiles, BACKUP_COPY_BATCH, async file => {
    await file.copy(bucket.file(mediaPrefix + file.name));
    media.push(file.name);
  });
  const [prev] = await bucket.getFiles({ prefix: mediaPrefix });
  for (const name of staleBackupMedia(prev.map(f => f.name), sourceFiles.map(f => f.name), mediaPrefix)) await bucket.file(name).delete({ ignoreNotFound: true });
  console.log("backup", folder, done.join(", "), "storage:", media.length);
  const [files] = await bucket.getFiles({ prefix: "backups/" });
  for (const old of oldBackupFolders(files.map(f => f.name), BACKUP_KEEP)) await bucket.deleteFiles({ prefix: old });
  return { folder, done, mediaCount: media.length };
}
export const backup = onSchedule({ schedule: "0 3 * * 0", timeZone: "Asia/Jerusalem", region: REGION, timeoutSeconds: 540, memory: "512MiB", maxInstances: 1 }, async () => { await runBackup(); });

// מתוך דף הניהול (לשונית «גיבויים»): גיבוי מיידי, רשימת גיבויים ושחזור אוסף (רק חסרים, או דריסה)
export const backupNow = onCall({ region: REGION, timeoutSeconds: 540, memory: "512MiB" }, async request => {
  const email = await adminOnly(request), r = await runBackup();
  console.log("backupNow by", email, r.folder);
  return r;
});
export const backupList = onCall({ region: REGION, timeoutSeconds: 60, memory: "256MiB" }, async request => {
  await adminOnly(request);
  const [files] = await getStorage().bucket().getFiles({ prefix: "backups/" }), by = {};
  for (const f of files) {
    const size = parseInt(f.metadata.size, 10) || 0;
    const m = f.name.match(/^backups\/(\d{4}-\d{2}-\d{2})\/([\w-]+)\.json$/);
    if (m) (by[m[1]] = by[m[1]] || { files: [], mediaCount: 0, mediaBytes: 0 }).files.push({ name: m[2], size });
    const media = f.name.match(/^backups\/(\d{4}-\d{2}-\d{2})\/storage\//);
    if (media) { const b = by[media[1]] = by[media[1]] || { files: [], mediaCount: 0, mediaBytes: 0 }; b.mediaCount++; b.mediaBytes += size; }
  }
  return { backups: Object.keys(by).sort().reverse().map(date => ({ date, files: by[date].files.sort((a, b) => a.name.localeCompare(b.name)), mediaCount: by[date].mediaCount, mediaBytes: by[date].mediaBytes })) };
});

// שחזור קובצי Storage מגיבוי. מצב dry מחזיר ספירה לפני ביצוע; השחזור מעתיק לנתיב המקורי.
export const backupRestoreStorage = onCall({ region: REGION, timeoutSeconds: 540, memory: "512MiB" }, async request => {
  const email = await adminOnly(request), d = request.data || {};
  if (!validBackupDate(d.date)) throw new HttpsError("invalid-argument", "תאריך גיבוי לא תקין");
  const bucket = getStorage().bucket(), prefix = "backups/" + d.date + "/storage/";
  const [files] = await bucket.getFiles({ prefix });
  const entries = files.map(file => ({ file, original: file.name.slice(prefix.length) })).filter(x => {
    const parts = x.original.split("/");
    return x.original && !x.original.startsWith("backups/") && !parts.some(part => part === ".." || part === ".");
  });
  let existing = 0;
  await inBatches(entries, BACKUP_COPY_BATCH, async x => { if ((await bucket.file(x.original).exists())[0]) existing++; });
  if (d.dry) return { total: entries.length, existing, missing: entries.length - existing };
  await inBatches(entries, BACKUP_COPY_BATCH, async x => { await x.file.copy(bucket.file(x.original)); });
  console.log("backupRestoreStorage by", email, d.date, entries.length);
  return { total: entries.length, restored: entries.length, overwritten: existing };
});
export const backupRestore = onCall({ region: REGION, timeoutSeconds: 540, memory: "512MiB" }, async request => {
  const email = await adminOnly(request), d = request.data || {};
  if (!validBackupDate(d.date) || !validBackupCollection(d.collection) || BACKUP_SKIP.has(d.collection)) throw new HttpsError("invalid-argument", "גיבוי או אוסף לא תקינים");
  const mode = d.mode === "overwrite" ? "overwrite" : "missing", dry = !!d.dry;
  const file = getStorage().bucket().file("backups/" + d.date + "/" + d.collection + ".json");
  if (!(await file.exists())[0]) throw new HttpsError("not-found", "הקובץ לא נמצא בגיבוי");
  const docs = JSON.parse((await file.download())[0].toString("utf8"), backupReviver(Timestamp));
  if (!Array.isArray(docs)) throw new HttpsError("data-loss", "קובץ הגיבוי פגום");
  const col = db.collection(d.collection), existing = new Set();
  for (let k = 0; k < docs.length; k += 300) (await db.getAll(...docs.slice(k, k + 300).map(x => col.doc(x.id)))).forEach(s => { if (s.exists) existing.add(s.id); });
  const todo = mode === "overwrite" ? docs : docs.filter(x => !existing.has(x.id));
  if (dry) return { total: docs.length, existing: existing.size, missing: docs.length - existing.size };
  for (let k = 0; k < todo.length; k += 400) { const b = db.batch(); todo.slice(k, k + 400).forEach(x => b.set(col.doc(x.id), x.data)); await b.commit(); }
  console.log("backupRestore by", email, d.date, d.collection, mode, todo.length + "/" + docs.length);
  return { total: docs.length, restored: todo.length, skipped: docs.length - todo.length, mode };
});

const DEAD = new Set(["messaging/registration-token-not-registered", "messaging/invalid-registration-token", "messaging/invalid-argument"]);

export const notifyIssue = onCall({ region: REGION, timeoutSeconds: 180, memory: "256MiB" }, async request => {
  const a = request.auth;
  if (!a || !a.token.email || a.token.email_verified !== true) throw new HttpsError("unauthenticated", "נדרשת התחברות.");
  if (!(await db.doc("admins/" + a.token.email.toLowerCase()).get()).exists) throw new HttpsError("permission-denied", "אין הרשאה.");
  const id = cleanId(request.data && request.data.id), force = !!(request.data && request.data.force);
  const ref = db.doc("issues/" + id), snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "הגיליון לא נמצא.");
  const issue = snap.data();
  if (issue.pushSentAt && !force) return { already: true, sent: 0, failed: 0 };

  const byLang = {};
  (await db.collection("pushTokens").get()).forEach(d => { const l = (d.data().lang || "he"); (byLang[l] = byLang[l] || []).push(d.id); });
  const link = SITE + "/#i=" + id, img = imageOf(issue, SITE);
  let sent = 0, failed = 0; const dead = [];
  for (const lang of Object.keys(byLang)) {
    const m = pushMessage(lang, issue), list = byLang[lang];
    for (let k = 0; k < list.length; k += 500) {
      const tokens = list.slice(k, k + 500);
      const r = await getMessaging().sendEachForMulticast({
        tokens, notification: { title: m.title, body: m.body }, data: { id, url: link },
        webpush: { fcmOptions: { link }, notification: { icon: SITE + "/icon-192.png", badge: SITE + "/favicon-64.png", image: img } }
      });
      r.responses.forEach((x, n) => { if (x.success) sent++; else { failed++; if (x.error && DEAD.has(x.error.code)) dead.push(tokens[n]); } });
    }
  }
  for (let k = 0; k < dead.length; k += 400) { const b = db.batch(); dead.slice(k, k + 400).forEach(t => b.delete(db.doc("pushTokens/" + t))); await b.commit(); }
  await ref.update({ pushSentAt: Date.now() });
  return { sent, failed, removed: dead.length };
});

const smtp = pooled => nodemailer.createTransport({ host: SMTP.host, port: SMTP.port, secure: SMTP.secure, auth: { user: SMTP.user, pass: SMTP_PASS.value().trim() }, pool: !!pooled, maxConnections: 3, maxMessages: 50, connectionTimeout: 20000, greetingTimeout: 20000, socketTimeout: 40000 });
// ===== שליחת הגיליון במייל (SMTP של הדומיין, ישירות מהאתר) =====
// מפתח לחתימת קישורי ההסרה: נוצר אוטומטית ונשמר באוסף שהלקוחות לא יכולים לקרוא (ברירת מחדל: חסום)
let _unsubKey = null;
async function unsubKey() {
  if (_unsubKey) return _unsubKey;
  const r = db.doc("private/mail");
  return (_unsubKey = await db.runTransaction(async t => {                 // טרנזקציה: שתי מופעים במקביל לא ייצרו שני מפתחות שונים
    const s = await t.get(r);
    if (s.exists && s.data().unsubKey) return s.data().unsubKey;
    const k = randomBytes(32).toString("hex"); t.set(r, { unsubKey: k }, { merge: true }); return k;
  }));
}

// ליבת השליחה: משמשת גם את הקריאה הידנית (mailIssue) וגם את העובד ברקע (mailWorker)
async function mailCore(d, adminEmail) {
  const id = cleanId(d.id), test = !!d.test, dry = !!d.dry, track = !test && d.track !== false;
  const max = Math.max(1, Math.min(500, parseInt(d.max, 10) || MAIL_DAILY_MAX));
  const ref = db.doc("issues/" + id), snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "הגיליון לא נמצא");
  const issue = snap.data();

  let pending, total = 0;
  if (test) pending = [{ email: adminEmail, lang: "he" }];
  else {
    const subs = await db.collection("subscribers").get(), done = new Set((await db.collection("issues/" + id + "/mailed").select().get()).docs.map(x => x.id));
    const all = subs.docs.map(x => x.data()).filter(x => x && x.email); total = all.length;
    pending = all.filter(x => !done.has(String(x.email).toLowerCase()));
  }
  const ext = String(issue.path || "").split(".").pop().toLowerCase(), file = issue.url && /^(pdf|jpe?g|png|webp)$/.test(ext) ? { ext, size: issue.size || 0 } : null;
  const pageUrls = (issue.pages || []).filter(p => p && p.url).slice(0, MAIL_MAX_PAGES);
  if (dry) return { total, pending: pending.length, alreadyDone: total - pending.length, file, pages: pageUrls.length };

  // קובץ מצורף: מורידים פעם אחת ומשתמשים בו בכל המיילים בקריאה
  let attachment = null;
  if (d.attach && file) {
    if (file.size > 10 * 1024 * 1024) throw new HttpsError("failed-precondition", "הקובץ גדול מדי לצירוף (מעל 10MB). שלח/י עם קישור בלבד.");
    try { const r = await fetch(issue.url); if (!r.ok) throw new Error("HTTP " + r.status); attachment = { filename: ("חכמי ספרד - " + issueTitle(issue)).replace(/[\\/:*?"<>|]/g, " ").trim() + "." + file.ext, content: Buffer.from(await r.arrayBuffer()), contentType: file.ext === "pdf" ? "application/pdf" : "image/" + file.ext.replace("jpg", "jpeg") }; }
    catch (e) { throw new HttpsError("unavailable", "לא ניתן להוריד את קובץ הגיליון לצירוף: " + (e.message || e)); }
  }

  // תמונות העמודים בתוך המייל (CID): מורידים פעם אחת ומשתמשים בהן בכל המיילים; עמוד שנכשל נשאר כקישור לתמונה באתר
  const inlineAtts = [], srcs = [];
  if (d.embed) {
    let bytes = 0;
    for (let k = 0; k < pageUrls.length; k++) {
      try {
        const r = await fetch(pageUrls[k].url); if (!r.ok) throw new Error("HTTP " + r.status);
        const buf = Buffer.from(await r.arrayBuffer()), ct = String((r.headers && r.headers.get && r.headers.get("content-type")) || "image/jpeg").split(";")[0].trim();
        if (buf.length > 3 * 1024 * 1024 || bytes + buf.length > 12 * 1024 * 1024 || !/^image\//.test(ct)) throw new Error("skip");
        bytes += buf.length; const cid = "p" + (k + 1) + "." + randomBytes(6).toString("hex") + "@sefarad";
        inlineAtts.push({ filename: "page-" + (k + 1) + "." + (ct.split("/")[1] || "jpg").replace("jpeg", "jpg"), content: buf, contentType: ct, cid, contentDisposition: "inline" }); srcs[k] = "cid:" + cid;
      } catch (e) { console.error("embed page failed", k, e && e.message); }
    }
  }
  const uk = await unsubKey();
  const tr = smtp(true);
  try { await tr.verify(); }
  catch (e) { tr.close(); throw new HttpsError("failed-precondition", "ההתחברות לשרת הדואר נכשלה (" + (e.responseCode || e.code || "") + "): בדוק שם משתמש, סיסמה, שרת ופורט. [משתמש: " + SMTP.user + ", אורך הסיסמה שהוגדרה: " + SMTP_PASS.value().trim().length + "] " + (e.message || "")); }

  const heavy = (attachment ? 1 : 0) + (inlineAtts.length ? 1 : 0), batch = pending.slice(0, heavy === 2 ? Math.min(max, 40) : heavy === 1 ? Math.min(max, 60) : max), t0 = Date.now(); let sent = 0, failed = 0, permFailed = 0, streak = 0, limited = false, broke = false, firstErr = "";
  for (let k = 0; k < batch.length && !limited && Date.now() - t0 < 230000; k += 3) {   // עוצרים לפני זמן הריצה המרבי של הפונקציה (300 שנ')
    await Promise.all(batch.slice(k, k + 3).map(async x => {
      if (limited) return;
      const email = String(x.email).toLowerCase(), lang = x.lang || "he", unsub = SITE + "/u/" + unsubToken(email, uk), tt = track ? trackToken(id, email, uk) : "", trk = track ? { open: SITE + "/t/o/" + tt + ".gif", click: SITE + "/t/c/" + tt } : null;
      try {
        await tr.sendMail({
          from: MAIL_FROM, to: email, subject: (test ? "[בדיקה] " : "") + emailSubject(lang, issue), html: emailHtml(lang, issue, id, SITE, unsub, srcs, x.name, trk), text: emailText(lang, issue, id, SITE, unsub, x.name, trk), attachments: [...(attachment ? [attachment] : []), ...inlineAtts],
          headers: { "List-Unsubscribe": "<" + unsub + ">", "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }
        });
        sent++; streak = 0; if (!test) await db.doc("issues/" + id + "/mailed/" + email).set({ ts: Date.now() });
      } catch (e) {
        const c = e && e.responseCode;
        if (c >= 400 && c < 500) limited = true;               // הגבלת קצב / שגיאה זמנית — עוצרים וממשיכים בלחיצה הבאה
        else if (!test && isPermanentMailError(e)) {            // תיבה לא קיימת / כתובת פסולה: מסמנים כמטופל כדי שלא ינסו שוב בכל ריצה ולא יחסמו את התור
          failed++; permFailed++; if (!firstErr) firstErr = (c || (e && e.code) || "") + " " + (e && e.message || "");
          await db.doc("issues/" + id + "/mailed/" + email).set({ ts: Date.now(), failed: true, err: String(c || (e && e.code) || "").slice(0, 20) });
        }
        else { failed++; streak++; if (!firstErr) firstErr = (c || (e && e.code) || "") + " " + (e && e.message || ""); }
      }
    }));
    if (streak >= 5 || (sent === 0 && failed - permFailed >= 3)) { broke = true; break; }   // תקלת רשת/שרת מתמשכת: לא ממשיכים להמתין על כל נמען
  }
  tr.close();
  if (sent === 0 && firstErr && permFailed < failed) throw new HttpsError("failed-precondition", "השרת דחה את השליחה: " + firstErr);
  if (!test && (sent || permFailed)) await db.doc("mailStats/" + id).set({ sent: FieldValue.increment(sent), bounced: FieldValue.increment(permFailed), lastSendAt: Date.now(), track }, { merge: true }).catch(e => console.error("mailStats", e && e.message));
  const remaining = test ? 0 : pending.length - sent - permFailed;
  if (!test) await ref.update({ mailSentAt: remaining === 0 ? Date.now() : null, mailCount: (issue.mailCount || 0) + sent });
  return { sent, failed, permFailed, remaining, limited, broke, test };
}
async function adminOnly(request) {
  const a = request.auth;
  if (!a || !a.token.email || a.token.email_verified !== true) throw new HttpsError("unauthenticated", "נדרשת כניסה");
  if (!(await db.doc("admins/" + a.token.email.toLowerCase()).get()).exists) throw new HttpsError("permission-denied", "למנהלים בלבד");
  return a.token.email.toLowerCase();
}
export const mailIssue = onCall({ region: REGION, timeoutSeconds: 300, memory: "256MiB", secrets: [SMTP_PASS] }, async request => mailCore(request.data || {}, await adminOnly(request)));

// ===== שליחה ברקע: משימה ב-Firestore (mailJobs/<id>) שהעובד מטפל בה כל דקה – ממשיכה גם כשהדפדפן סגור =====
export const mailJobStart = onCall({ region: REGION, timeoutSeconds: 120, memory: "256MiB" }, async request => {
  const email = await adminOnly(request), d = request.data || {}, id = cleanId(d.id);
  const q = await mailCore({ id, dry: true }, email);
  if (!q.pending) return { status: "done", remaining: 0, total: q.total };
  const track = d.track !== false, attach = !!d.attach && !!q.file, embed = !!d.embed && q.pages > 0, per = Math.max(1, Math.min(100, parseInt(d.per, 10) || 25));
  const heavy = (attach ? 1 : 0) + (embed ? 1 : 0);   // אותן תקרות כמו בשליחה ידנית: 60 עם קובץ או תמונות מוטמעות, 40 עם שניהם
  await db.doc("mailJobs/" + id).set({ status: "running", track, per: heavy === 2 ? Math.min(per, 40) : heavy === 1 ? Math.min(per, 60) : per, attach, embed, sent: 0, failed: 0, slow: 0, remaining: q.pending, total: q.total, startedAt: Date.now(), nextAt: 0, lockUntil: 0, by: email, msg: "" });
  return { status: "running", remaining: q.pending };
});
export const mailJobControl = onCall({ region: REGION, timeoutSeconds: 30, memory: "256MiB" }, async request => {
  await adminOnly(request);
  const d = request.data || {}, ref = db.doc("mailJobs/" + cleanId(d.id));
  if (!(await ref.get()).exists) throw new HttpsError("not-found", "אין משימת שליחה לגיליון הזה");
  const act = String(d.action);
  if (act === "pause") await ref.update({ status: "paused" });
  else if (act === "resume") await ref.update({ status: "running", slow: 0, nextAt: 0, lockUntil: 0, msg: "" });
  else if (act === "cancel") await ref.update({ status: "stopped" });
  else throw new HttpsError("invalid-argument", "פעולה לא מוכרת");
  return { ok: true };
});
export const mailWorker = onSchedule({ schedule: "every 1 minutes", region: REGION, timeoutSeconds: 300, memory: "256MiB", secrets: [SMTP_PASS], maxInstances: 1 }, async () => {
  const snap = await db.collection("mailJobs").where("status", "==", "running").get();
  for (const ds of snap.docs) {
    const id = ds.id, ref = ds.ref, now = Date.now();
    const job = await db.runTransaction(async t => {                       // "נעילה": ריצה חופפת לא תשלח את אותה קבוצה פעמיים
      const j = (await t.get(ref)).data();
      if (!j || j.status !== "running" || (j.nextAt || 0) > now || (j.lockUntil || 0) > now) return null;
      t.update(ref, { lockUntil: now + 290000 }); return j;
    });
    if (!job) continue;
    if (now - (job.startedAt || now) > 72 * 3600 * 1000) { await ref.update({ status: "expired", msg: "חלפו 72 שעות – לחץ \"נסה שוב\" להמשך", lockUntil: 0 }); continue; }
    let upd;
    try {
      const r = await mailCore({ id, max: job.per, attach: job.attach, embed: job.embed, track: job.track !== false }, job.by), throttled = r.limited || r.broke, slow = throttled ? (job.slow || 0) + 1 : 0;
      upd = cur => ({ sent: (cur.sent || 0) + r.sent, failed: (cur.failed || 0) + r.failed, remaining: r.remaining, slow, nextAt: throttled ? Date.now() + mailBackoffMs(slow) : 0, lockUntil: 0, lastAt: Date.now(), msg: r.limited ? "השרת האט את הקצב – ממשיך אוטומטית" : r.broke ? "תקלה בשליחה – ממשיך אוטומטית" : "", ...(r.remaining === 0 ? { status: "done", doneAt: Date.now(), msg: "" } : {}) });
    } catch (e) { upd = () => ({ status: "error", msg: String((e && e.message) || e).slice(0, 300), lockUntil: 0 }); }
    await db.runTransaction(async t => {                                    // לא דורסים השהיה/ביטול שהמנהל ביקש בזמן הריצה
      const cur = (await t.get(ref)).data() || {}, u = upd(cur);
      if (cur.status !== "running") delete u.status;
      t.update(ref, u);
    });
  }
});

// ===== מעקב דיוור (1.38.0) =====
// פיקסל פתיחה /t/o/<אסימון>.gif והקלקה /t/c/<אסימון> (מפנה תמיד לדף הגיליון באתר). נרשמים רק GET עם חתימה תקפה.
// נשמרים רק מונים וחותמות זמן ברשומת הנמען (issues/<id>/mailed/<email>) ובסיכום mailStats/<id>; בלי IP ובלי User-Agent.
async function recordTrack(id, email, kind) {
  const ref = db.doc("issues/" + id + "/mailed/" + email), st = db.doc("mailStats/" + id);
  await db.runTransaction(async t => {
    const snap = await t.get(ref); if (!snap.exists) return;
    const r = applyTrackEvent(snap.data(), kind, Date.now()); if (!r) return;
    t.update(ref, r.update);
    const inc = {}; for (const k of Object.keys(r.d)) if (r.d[k]) inc[k] = FieldValue.increment(r.d[k]);
    if (Object.keys(inc).length) t.set(st, inc, { merge: true });
  });
}
export const track = onRequest({ region: REGION, memory: "256MiB", maxInstances: 5 }, async (req, res) => {
  const kind = pathPart(req.path, 2) === "c" ? "c" : "o", tok = pathPart(req.path, 3).replace(/\.gif$/i, "");
  let t = null;
  try { t = verifyTrack(tok, await unsubKey()); } catch (e) { console.error("track", e && e.message); }
  if (t) { t.id = cleanId(t.id); if (!t.id || !EMAIL_RE.test(t.email)) t = null; }
  if (t && req.method === "GET") { try { await recordTrack(t.id, t.email, kind); } catch (e) { console.error("track record", e && e.message); } }
  res.set("Cache-Control", "no-store, max-age=0");
  if (kind === "c") { res.redirect(302, SITE + (t ? "/i/" + t.id : "/")); return; }
  res.set("Content-Type", "image/gif").status(200).send(TRACK_GIF);
});

// ניקוי סימוני כשל של גיליון, כדי שניסיון שליחה נוסף יכלול שוב את הנמענים שנכשלו (למשל אחרי תיקון כתובת)
export const mailRetryFailed = onCall({ region: REGION, timeoutSeconds: 120, memory: "256MiB" }, async request => {
  const email = await adminOnly(request), id = cleanId((request.data || {}).id);
  if (!id) throw new HttpsError("invalid-argument", "חסר מזהה גיליון");
  const snap = await db.collection("issues/" + id + "/mailed").where("failed", "==", true).get();
  for (let k = 0; k < snap.docs.length; k += 400) { const b = db.batch(); snap.docs.slice(k, k + 400).forEach(d => b.delete(d.ref)); await b.commit(); }
  if (snap.size) await db.doc("mailStats/" + id).set({ bounced: FieldValue.increment(-snap.size) }, { merge: true });
  console.log("mailRetryFailed by", email, id, snap.size);
  return { cleared: snap.size };
});

// קישור הסרה: GET מציג אישור, POST (לחיצה / "הסרה בלחיצה אחת" של Gmail) מסיר בפועל
export const unsub = onRequest({ region: REGION, memory: "256MiB", maxInstances: 5, }, async (req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8").set("Cache-Control", "no-store");
  const token = pathPart(req.path, 2), email = verifyUnsub(token, await unsubKey());
  if (!email) { res.status(400).send(unsubPage("bad")); return; }
  if (req.method === "POST") {
    try { await db.doc("subscribers/" + email).delete(); } catch (e) { console.error("unsub", e); }
    try { await db.doc("unsubs/" + email).set({ ts: Date.now() }); } catch (e) { console.error("unsub log", e); }   // תיעוד להסרות במעקב הדיוור (מנהלים בלבד)
    res.status(200).send(unsubPage("done")); return;
  }
  res.status(200).send(unsubPage("ask", token, email));
});

// ===== הרשמה עם אישור במייל (double opt-in) =====
// הלקוח לא כותב ל-subscribers ישירות: הבקשה יוצרת רשומה זמנית ושולחת קישור אישור; רק הקלקה על הקישור מוסיפה לרשימה.
const PENDING_TTL = 7 * 24 * 3600 * 1000, RESEND_MS = 10 * 60 * 1000, IP_MAX = 8, IP_WINDOW = 3600 * 1000;
export const subscribeRequest = onCall({ region: REGION, timeoutSeconds: 60, memory: "256MiB", maxInstances: 5, secrets: [SMTP_PASS] }, async request => {
  const d = request.data || {}, email = String(d.email || "").trim().toLowerCase(), lang = LANGS.includes(d.lang) ? d.lang : "he";
  if (d.hp) return { ok: true };                                               // פיתיון נגד בוטים
  if (!EMAIL_RE.test(email) || email.length > 120) throw new HttpsError("invalid-argument", "כתובת מייל לא תקינה");
  // הגבלת קצב לפי כתובת IP (נשמרת כ-hash בלבד)
  const raw = request.rawRequest, ip = String((raw && raw.headers && raw.headers["x-forwarded-for"]) || (raw && raw.ip) || "?").split(",")[0].trim();
  const rr = db.doc("rate/ip_" + createHash("sha256").update(ip).digest("hex").slice(0, 24)), now = Date.now();
  const allowed = await db.runTransaction(async t => {
    const s = await t.get(rr), v = s.exists ? s.data() : null;
    if (!v || now > v.resetAt) { t.set(rr, { n: 1, resetAt: now + IP_WINDOW }); return true; }
    if (v.n >= IP_MAX) return false; t.set(rr, { n: v.n + 1, resetAt: v.resetAt }); return true;
  });
  if (!allowed) throw new HttpsError("resource-exhausted", "יותר מדי ניסיונות");
  // לא שולחים שוב לאותה כתובת בתוך 10 דקות (מונע הצפת תיבה של אחרים)
  const pr = db.doc("pendingSubs/" + email), ps = await pr.get();
  if (ps.exists && now - (ps.data().sentAt || 0) < RESEND_MS) return { ok: true };
  const det = { name: cleanDetail(d.name, SUB_LIMITS.name), phone: cleanDetail(d.phone, SUB_LIMITS.phone), city: cleanDetail(d.city, SUB_LIMITS.city) };
  await pr.set({ email, lang, ts: now, sentAt: now, ...det });
  const tr = smtp(false), uk = await unsubKey();
  try {
    await tr.sendMail({ from: MAIL_FROM, to: email, subject: confirmSubject(lang), html: confirmHtml(lang, SITE + "/c/" + confirmToken(email, uk)), text: confirmText(lang, SITE + "/c/" + confirmToken(email, uk)) });
  } catch (e) { await pr.delete().catch(() => {}); console.error("confirm mail failed", e && e.message); throw new HttpsError("unavailable", "שליחת מייל האישור נכשלה"); }
  finally { tr.close(); }
  return { ok: true };
});

// קישור האישור: GET מציג כפתור (סורקי מייל לא מאשרים בטעות), POST מאשר ומוסיף לרשימת המנויים
export const confirmSub = onRequest({ region: REGION, memory: "256MiB", maxInstances: 5 }, async (req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8").set("Cache-Control", "no-store");
  const token = pathPart(req.path, 2), email = verifyConfirm(token, await unsubKey());
  if (!email) { res.status(400).send(confirmPage("bad")); return; }
  if (req.method !== "POST") { res.status(200).send(confirmPage("ask", email)); return; }
  const pr = db.doc("pendingSubs/" + email), ps = await pr.get(), sr = db.doc("subscribers/" + email);
  if (ps.exists && Date.now() - (ps.data().ts || 0) <= PENDING_TTL) {
    const p = ps.data(), keep = {}; for (const k of ["name", "phone", "city"]) if (p[k]) keep[k] = cleanDetail(p[k], SUB_LIMITS[k]);      // לא דורסים פרטים שהמנהל כבר הזין
    const cur = await sr.get(), had = cur.exists ? cur.data() : {}; for (const k of Object.keys(keep)) if (had[k]) delete keep[k];
    await sr.set({ email, lang: LANGS.includes(p.lang) ? p.lang : "he", ts: had.ts || Date.now(), ...keep }, { merge: true });
    await pr.delete().catch(() => {}); await db.doc("unsubs/" + email).delete().catch(() => {}); res.status(200).send(confirmPage("done")); return;
  }
  res.status(200).send((await sr.get()).exists ? confirmPage("done") : confirmPage("bad"));    // לחיצה כפולה על קישור שכבר אושר
});
