# מה נמזג בגרסה 1.24.0

שני הקבצים שהועלו (`sefarad-v1_22_0` ו-`sefarad-v1_23_0`) התפצלו מאותה נקודה (1.21.0), ולכן **לא** היה אחד מהם מעודכן יותר מהשני. כאן הם אוחדו.

| מקור | מה נכנס |
|---|---|
| 1.23.0 (בסיס) | הטמעת תמונות במייל (CID), שם/טלפון/עיר לנרשמים (טופס, ניהול, ייבוא/ייצוא), פנייה בשם במייל, `lib.js`, `subscribers.test.mjs` |
| 1.22.0 | שליחה ברקע: `mailJobStart`, `mailJobControl`, `mailWorker`, `mailBackoffMs`, כלל `mailJobs`, ממשק התקדמות חיה בכפתור השליחה |

## נקודות החיבור (היחידות ששונו מעבר לבחירת צד)
- `functions/index.js`: `mailIssue` → `mailCore` (עם `embed` ושם); `mailJobStart` שומר `embed`; `mailWorker` מעביר `embed`.
- `public/app.js`: `mailBtn` של 1.22.0 + השאלה «להטמיע תמונות?» שנשלחת ל-`mailJobStart`.
- `functions/helpers.js`, `firestore.rules`, `tests/mail.test.mjs`: תוספות קטנות מ-1.22.0.
- מחרוזות גרסה → 1.24.0 (`app.js`, `sw.js`, `manifest`, `index.html`, `admin.html`, README).

## בדיקות
`npm test`: 49 עוברות (48 של 1.23.0 + `mailBackoffMs`). לא נבדק מול Firebase או בדפדפן.

## פריסה
מלאה: `bash deploy.sh` (פונקציות חדשות + כלל `mailJobs`; `mailWorker` דורש Blaze).
