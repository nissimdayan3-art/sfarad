# משימות פתוחות: SEO, ביצועים ואבטחה

עודכן: 4.11.2026 · גרסה 1.36.2

## כבר בוצע
- [x] קבצי אימות Search Console: `public/google7b2ed75d4274b634.html`, `public/google29428a5551176aae.html`, ותגית meta ב-`index.html`
- [x] `public/robots.txt` (חוסם `/u/` ו-`/c/`; `admin.html` מוגן ב-`noindex`)
- [x] sitemap דינמי: הפונקציה `sitemap` מגישה `/sitemap.xml` עם עמוד הבית וכל הגיליונות (הקובץ הסטטי נמחק)
- [x] כפתור שיתוף מובנה בטלפון (`navigator.share`, מופיע רק במכשירים שתומכים, 4 שפות)
- [x] דף הגיליון: ניווט לגיליון הקודם/הבא ועד 4 גיליונות של אותה פרשה בשנים אחרות
- [x] גיבוי שבועי של Firestore (הפונקציה `backup`, יום א׳ 03:00, נשמרים 8 אחרונים ב-Storage תחת `backups/`)
- [x] RSS: הפונקציה `rss` מגישה `/rss.xml` (50 הגיליונות האחרונים), עם `<link rel="alternate">` ב-`index.html`
- [x] כפתור "דף הגיליון" בכל כרטיס, עם קישור רגיל `<a href="/i/<id>">` (4 שפות)
- [x] קישורי שיתוף נבנים תמיד על `www.toratsfarad.co.il`
- [x] דפי `/i/<id>` עם תוכן אמיתי, canonical, JSON-LD וכפתור "פתח בארכיון" (בלי הפניה אוטומטית)
- [x] `<link rel="canonical">` ב-`index.html`
- [x] `<h1>` עם טקסט ברירת מחדל ב-HTML (ה-JS מחליף אותו לפי השפה) ו-JSON-LD של `Organization` ו-`WebSite`
- [x] כותרות אבטחה ב-`firebase.json`: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`

## לעשות מיד אחרי ההעלאה
- [ ] להריץ `bash deploy.sh` (מלא, כי השתנו גם Functions: `share` ו-`sitemap`)
- [ ] לפתוח `https://www.toratsfarad.co.il/robots.txt` ו-`/sitemap.xml` ולוודא שהם נטענים
- [ ] ב-Search Console: Sitemaps → להוסיף `sitemap.xml`
- [ ] ב-Search Console: להשלים אימות עם המייל הנכון (URL prefix על `https://www.toratsfarad.co.il/`)
- [ ] **לא למחוק** את קבצי האימות ואת התגית. גוגל בודקת אותם מדי פעם
- [ ] ב-DNS: **לא למחוק** את רשומות ה-TXT הקיימות (`google-site-verification=EzBLoo...` ו-SPF `v=spf1 ...`). ה-SPF אחראי על שליחת המיילים

## עדיפות גבוהה
- [ ] **תוכן ב-HTML הראשוני.** הארכיון נטען ב-JavaScript ולכן לא מופיע בקוד המקור. אפשר להוסיף פסקת תיאור ורשימת הגיליונות האחרונים בתוך `<noscript>` או ב-HTML עצמו

## ביצועים
- [ ] **Cache ארוך.** כרגע `firebase.json` נותן `no-cache` לכל JS, HTML ו-PNG. לפני שמשנים:
  - [ ] להוסיף `?v=` לכל קובץ JS ו-CSS שנטען (`app.js`, `lib.js`, `theme.css`)
  - [ ] לתת `max-age=31536000, immutable` לקבצים עם גרסה, ולהשאיר `no-cache` רק ל-HTML ול-`sw.js`
  - [ ] לבדוק שעדכון גרסה מגיע למשתמשים (ה-Service Worker `sefarad-v1.36.2` מתחלף בכל גרסה)
- [ ] **גופנים.** לארח עצמית את Assistant, Frank Ruhl Libre ו-Suez One במקום Google Fonts, ולהוסיף `font-display: swap`
- [ ] **הפניית 301 מ-`toratsfarad.co.il` ל-`www` (לא דחוף).** כרגע ההפניה נעשית ב-JavaScript בתוך הדף. הפניית שרת מהירה יותר וגוגל מבינה אותה מיד, והדירוג מתרכז בכתובת אחת. לא חובה: האתר עובד גם בלי זה.
  - [ ] Firebase Console → פרויקט `sepharad-fe9e8` → Hosting → לשונית Domains
  - [ ] ליד `toratsfarad.co.il` (בלי www): שלוש נקודות → Edit, או Add custom domain אם הוא לא מופיע
  - [ ] לבחור Redirect to an existing website, יעד `www.toratsfarad.co.il`, סוג 301 (Permanent), ולשמור
  - [ ] אם Firebase מבקש רשומות DNS (A או TXT), להוסיף אותן אצל ספק ה-DNS
  - [ ] לחכות לסטטוס Connected (אישור SSL עשוי לקחת עד כמה שעות)
  - [ ] לבדוק ש-`http://` ו-`https://` של `toratsfarad.co.il` מפנים ל-`https://www.toratsfarad.co.il` עם קוד 301 (למשל ב-redirectchecker.org)
  - [ ] רק אחרי שזה עובד: למחוק את שורת ה-JavaScript `if(location.hostname==="toratsfarad.co.il")...` מ-`index.html` ומ-`admin.html` (אפשר גם להשאיר, היא לא מזיקה)

## אבטחה
- [ ] להוסיף `Content-Security-Policy` בהדרגה. להתחיל ב-`Content-Security-Policy-Report-Only`, כי האתר משתמש ב-Firebase, Google Fonts ו-`wa.me`

## בדיקות אחרי כל שינוי
- [ ] `https://www.toratsfarad.co.il/sitemap.xml` מציג רשימת גיליונות, ו-`/i/<id>` מציג דף עם כפתור "פתח בארכיון"
- [ ] `https://www.toratsfarad.co.il/` נטען ללא שגיאות בקונסולה
- [ ] הוספת האתר למסך הבית ו-Push עדיין עובדים
- [ ] קישורי שיתוף `/i/<id>` ב-WhatsApp מציגים תצוגה מקדימה
- [ ] `tests/` עוברים

## רעיונות להוספה (תכונות חדשות)
- [ ] **סטטיסטיקות Search Console בדף הניהול.** היום יש רק צפיות והורדות מ-Firestore. אפשר להציג חיפושים, קליקים ועמודים מובילים דרך Search Console API, או לפחות קישור ישיר מדף הניהול
- [ ] **גרסת הדפסה נקייה** של הגיליון: `@media print` שמסתיר ניווט וכפתורים, ואולי כפתור "הדפס" בכרטיס

## רעיונות שהוצעו ולא נבחרו
- הוספת יום פטירה ליומן (`.ics`), תזכורת במייל להילולות השבוע, כפתור תרומה או הקדשה

## גיבוי: מה חשוב לדעת
- הגיבוי נשמר ב-Firebase Console → Storage → תיקיית `backups/<תאריך>/`, קובץ JSON לכל אוסף (`issues.json`, `subscribers.json`, `admins.json` ועוד).
- לא נכללים: האוספים `rate` ו-`private` (הגדרות מייל), אוספי משנה כמו `issues/<id>/mailed`, וקבצי התמונות וה-PDF עצמם (הם כבר ב-Storage, ומסמכי הגיליונות שומרים רק את הקישורים אליהם).
- הגיבוי הראשון ירוץ ביום א׳ הקרוב, או מיד דרך «גבה עכשיו» בלשונית גיבויים.
- **שחזור מהאתר:** דף הניהול (`admin.html`) → לשונית **גיבויים**. בוחרים תאריך ואוסף ולוחצים «שחזור…». האתר מציג כמה מסמכים בגיבוי, כמה קיימים וכמה חסרים, ואז אפשר: **שחזר רק חסרים** (לא נוגע במה שקיים), או **דרוס את כל האוסף** (מחליף מסמכים קיימים בגרסת הגיבוי; מסמכים שנוספו אחרי הגיבוי לא נמחקים).
- בלשונית יש גם כפתור **גבה עכשיו**, בלי לחכות ליום א׳.
- ערכי תאריך-שעה (Timestamp) נשמרים ומשוחזרים בדיוק (`{__ts:[שניות, ננו]}`).
- הגיבוי הראשון נשמר רק מגרסה 1.36.3 והלאה, ולכן אין מה לשחזר לפני כן.
