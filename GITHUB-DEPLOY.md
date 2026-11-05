# פריסה אוטומטית מ-GitHub (בלי מחשב)

אחרי ההגדרה: עורכים קובץ ב-GitHub (גם מהטלפון), לוחצים Commit, ותוך כ-2–4 דקות האתר מתעדכן לבד.
לפני כל פריסה רצות הבדיקות (`npm test`). אם הן נכשלות – לא נפרס כלום.

הקובץ שעושה את זה: `.github/workflows/deploy.yml`.

## הגדרה חד-פעמית

### א. מפתח פריסה מ-Google (חשבון שירות)
1. Google Cloud Console → בחר פרויקט `sepharad-fe9e8` → **IAM & Admin** → **Service Accounts** → **Create service account**. שם: `github-deploy`.
2. הענק לו את התפקידים (Roles):
   - Firebase Admin
   - Cloud Functions Admin
   - Cloud Run Admin
   - Cloud Scheduler Admin
   - Service Account User
   - Artifact Registry Writer
   - Secret Manager Viewer
3. פתח את החשבון → לשונית **Keys** → **Add key** → **Create new key** → **JSON**. יורד קובץ למחשב. **זה מפתח סודי: אל תשלח אותו לאף אחד ואל תעלה אותו למאגר.**
4. ב-Google Cloud Console → **APIs & Services** → **Library**: ודא שמופעל `Cloud Resource Manager API` (חיפוש לפי השם → Enable).

### ב. מאגר ב-GitHub
1. צור חשבון ב-github.com (אם אין), ואז **New repository**. שם: `sefarad`. בחר **Private**.
2. פתח את ה-ZIP של הפרויקט, והעלה את **תוכן** תיקיית `sefarad` למאגר (**Add file → Upload files**). `firebase.json` חייב להיות בשורש המאגר, לא בתוך תיקייה.
3. ודא שהתיקייה `.github/workflows/deploy.yml` עלתה. אם לא (תיקיות מוסתרות לפעמים לא נבחרות): **Add file → Create new file**, בשם הקובץ הקלד `.github/workflows/deploy.yml`, והדבק את תוכן הקובץ מהפרויקט.
4. **Settings → Secrets and variables → Actions → New repository secret**:
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Secret: הדבק את **כל** התוכן של קובץ ה-JSON מסעיף א.3.
5. מחק את קובץ ה-JSON מהמחשב (הוא כבר שמור כסוד ב-GitHub).

### ג. פריסה ראשונה
**Actions → Deploy to Firebase → Run workflow → Run**. עוקבים אחרי הריצה: וי ירוק = האתר עודכן.
אם נכשל, פותחים את הריצה ורואים בלוג איזו הרשאה חסרה או איזו בדיקה נכשלה. חסרה הרשאה → מוסיפים את ה-Role הרלוונטי לחשבון השירות ומריצים שוב.

## שימוש יומיומי
1. ב-GitHub נכנסים לקובץ → אייקון העיפרון (Edit) → עורכים → **Commit changes** (על הענף `main`).
2. נכנסים ל-**Actions** ורואים את הפריסה רצה. וי ירוק = באוויר.
3. פריסה של האתר בלבד (מהיר יותר, בלי פונקציות): **Actions → Deploy to Firebase → Run workflow → target: hosting**.

## חשוב לדעת
- **בכל שינוי קוד** כדאי להעלות את מספר הגרסה ולעדכן את `CHANGELOG.md`, כמו עד היום (`VERSION` ב-`public/app.js`, `sw.js`, `?v=` ב-HTML ו-`manifest`).
- **הבדיקות הן רשת ביטחון חלקית.** הן לא תופסות קריאה לפונקציה שלא הוגדרה (ראה `CHANGELOG.md`). אחרי פריסה של שינוי קוד, פתח את האתר ובדוק.
- **חזרה לגרסה קודמת:** ב-GitHub פותחים את ה-Commit הבעייתי → **Revert**. נוצר Commit חדש והפריסה רצה שוב. לאתר בלבד אפשר גם Firebase Console → Hosting → Rollback.
- **מי שיכול לכתוב למאגר יכול לפרוס.** הוסף אליו רק אנשים שאתה סומך עליהם, והפעל אימות דו-שלבי בחשבון GitHub.
- **המפתח:** אם הוא נחשף, מחק אותו ב-Google Cloud (Service Accounts → Keys) וצור חדש. אפשר גם להחליף אותו מדי פעם.
- הפריסה רצה רק על הענף `main`. כדי לנסות שינוי בלי לפרוס, עבוד על ענף אחר ואחד אותו ל-`main` כשמוכן.
- עריכת קבצים גדולים בדפדפן (כמו `public/app.js`) נוחה יותר במחשב. לשינויים גדולים אפשר להמשיך לקבל מכאן ZIP ולהעלות אותו למאגר.
