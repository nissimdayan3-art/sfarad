import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot, doc, getDoc, getDocs, setDoc, updateDoc, increment, writeBatch, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { getAuth, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { cleanSiteCfg, bannerFor, layoutList, parseDedRows, parseSubRows, subDoc, SUB_LIM, cleanField, onlyCountersChanged, linkParts, D, heLetters, MONTHS, hebOf, weekKeys, dayKeys, gday, gem, findSagesInText, sageQuery, sageSearch, sortKey, isoOf, todayStr, halIdx, halKeysFor, halRowKeys, addDays, carryPhotos, cleanBooks, parseZmanimRows, zmCityName, zmCityId } from "./lib.js";

// ⬇️ הדבק כאן את ה-config של הפרויקט שלך
const FALLBACK_CONFIG = {
  apiKey: "AIzaSyA9usCbAUqkTNL2oxOaS-3OsuXepLA-mqw",
  authDomain: "sepharad-fe9e8.firebaseapp.com",
  projectId: "sepharad-fe9e8",
  storageBucket: "sepharad-fe9e8.firebasestorage.app",
  messagingSenderId: "1044412046657",
  appId: "1:1044412046657:web:2aff5c40e05fde276cd5c0"
};
// ב-Firebase Hosting ה-config המדויק מוגש אוטומטית – אין צורך להקליד מפתחות
let firebaseConfig = FALLBACK_CONFIG;
try { const r = await fetch("/__/firebase/init.json"); if (r.ok) firebaseConfig = { ...FALLBACK_CONFIG, ...(await r.json()) }; } catch {}
// כניסה עם Google דרך הדומיין של המכון. דורש שהכתובת https://www.toratsfarad.co.il/__/auth/handler תירשם ב-Google Cloud ←
// APIs & Services ← Credentials ← OAuth 2.0 Web client ← Authorized redirect URIs. מכתובת אחרת (למשל firebaseapp.com)
// נשארים עם ברירת המחדל, כך שתמיד יש דרך כניסה גם אם ההגדרה ב-Google Cloud עוד לא בוצעה. לביטול: false.
const AUTH_ON_CUSTOM_DOMAIN = true;
if (AUTH_ON_CUSTOM_DOMAIN && location.hostname === "www.toratsfarad.co.il") firebaseConfig = { ...firebaseConfig, authDomain: location.hostname };


// ⬇️ פרטי יצירת קשר – השאר ריק ("") כדי להסתיר שדה
const VERSION = "1.36.6";
const MAX_UPLOAD = 2 * 1024 * 1024; // 2MB
const VAPID_KEY = "BA9OIury_RZV-RbHVTaVKhCAgYD207H6XqBBAnXXZy0-y6OZDyeVRGKQNfoJ-YBgqeyqWRYJ6yMFcZ3e8p4wC0Y";              // ⬅️ מפתח Web Push: Firebase Console ← Project settings ← Cloud Messaging ← Web Push certificates. ריק = כפתור ההתראות מוסתר
const FUNCTIONS_REGION = "europe-west1"; // חייב להיות זהה ל-REGION ב-functions/index.js
const CONTACT = {
  email: "toratsfarad@gmail.com",
  phone: "",                   // להוספה: "+972-..."
  whatsapp: "",                // מספר בינלאומי בלי + ובלי מקפים
  site: "www.toratsfarad.co.il",
  address: ""
};

const T = {
  he:{name:"עברית",title:"גיליון חכמי ספרד",sub:"העלון השבועי · ארכיון לפי שבתות ושנים",search:"חיפוש לפי פרשה או נושא…",year:"שנת {y}",latest:"הגיליון האחרון",shabbat:"שבת",parasha:"פרשת ",about:"על גיליון זה",download:"⬇ הורדת הגיליון",preview:"👁 צפייה בגיליון",inSection:"במדור",inList:"ברשימת הגאונים בגיליון",died:"נלב״ע",issueNo:"גיליון {n}",subTitle:"📬 קבלת הגיליון למייל",subPlaceholder:"כתובת המייל שלך",subBtn:"הרשמה",subConfirm:"📧 שלחנו אליך מייל לאישור. לחצו על הקישור שבו כדי להשלים את ההרשמה (בדקו גם בספאם).",subBad:"כתובת מייל לא תקינה.",subMany:"יותר מדי ניסיונות. נסו שוב מאוחר יותר.", subMore: "פרטים נוספים (לא חובה)", subName: "שם", subPhone: "טלפון", subCity: "עיר / מדינה", subMoreHint: "הפרטים אופציונליים ויישמרו רק אצל המכון.",subNote:"הכתובת תשמש רק לשליחת הגיליון. להסרה – כתבו לנו ל-{mail}.",navAbout:"אודות המכון",aboutSoon:"הדף יתמלא בקרוב.",shareWa:"💬 שיתוף בוואטסאפ",copyLink:"🔗 העתקת קישור",perma:"📄 דף הגיליון",shareNative:"📤 שיתוף",copied:"הקישור הועתק ✓",yzTitle:"🕯 הילולות בשבוע זה",showAll:"הצג את כולם",art1:"מאוצרותיהם של חכמי התורה",art2:"וכה עשו חכמינו",empty:"עדיין לא הועלו גיליונות.",none:"לא נמצאו גיליונות.",loading:"טוען…",err:"שגיאה בטעינת הארכיון.",manage:"ניהול",contact:"צור קשר",wa:"וואטסאפ",navWeekly:"הגיליון השבועי",navIssues:"ארכיון הגיליונות",navSages:"חכמי ספרד",sName:"חיפוש לפי שם, פרטים או תאריך (13 / י״ג חשון)…",allCountries:"כל המדינות",allMonths:"כל חודשי ההילולא",results:"{n} חכמים",more:"הצג עוד",appearedIn:"הופיע בגיליון",noSages:"רשימת החכמים תתפרסם בקרוב.",install:"📲 התקנת האפליקציה",iosHint:"להתקנה באייפון: לחצו על כפתור השיתוף ⎙ ואז «הוסף למסך הבית».",otherC:"אחר / לא מסווג",sages:"גאונים בגיליון",byYear:"לפי שנים",byParasha:"לפי פרשות",parSearch:"חיפוש פרשה…",halTitle:"💡 הלכה יומית",halSages:"חכמי ספרד שהילולתם ביום זה",halAfterSet:"היום העברי החל בשקיעה",pushOn:"🔔 התראה על גיליון חדש",pushOff:"🔕 ביטול התראות",pushOk:"✓ ההתראות הופעלו. נודיע על כל גיליון חדש.",pushOffOk:"ההתראות בוטלו.",pushDenied:"ההרשאה להתראות חסומה בדפדפן. אפשר לאשר אותה בהגדרות האתר.",pushUnsup:"הדפדפן הזה לא תומך בהתראות. באייפון יש להוסיף את האתר למסך הבית.",halSrc:"מקורות:",navHal:"הלכה ומידע יומי",halPrev:"היום הקודם",halNext:"היום הבא",halToday:"היום",zmTitle:"🕐 זמני היום",zmCity:"עיר",zmNone:"אין זמנים לתאריך זה בעיר שנבחרה.",dedTitle:"🕯 הקדשות",halNone:"אין הלכה לתאריך זה.",pickPar:"בחרו פרשה כדי לראות את הגיליונות שלה.",books:["בראשית","שמות","ויקרא","במדבר","דברים","שבתות מיוחדות"]},
  en:{name:"English",title:"Sages of Sepharad Bulletin",sub:"The weekly bulletin · Archive by Shabbat and year",search:"Search by parasha or topic…",year:"Year {y}",latest:"Latest issue",shabbat:"Shabbat",parasha:"Parashat ",about:"About this issue",download:"⬇ Download issue",preview:"👁 View the issue",inSection:"in the section",inList:"in the issue’s list of sages",died:"Died",issueNo:"Issue {n}",subTitle:"📬 Get the bulletin by email",subPlaceholder:"Your email address",subBtn:"Subscribe",subConfirm:"📧 We sent you an email. Click the link in it to complete your subscription (check spam too).",subBad:"Invalid email address.",subMany:"Too many attempts. Please try again later.", subMore: "More details (optional)", subName: "Name", subPhone: "Phone", subCity: "City / country", subMoreHint: "Optional. Kept only by the institute.",subNote:"Your address is used only to send the bulletin. To unsubscribe, write to {mail}.",navAbout:"About us",aboutSoon:"This page will be filled in soon.",shareWa:"💬 Share on WhatsApp",copyLink:"🔗 Copy link",perma:"📄 Issue page",shareNative:"📤 Share",copied:"Link copied ✓",yzTitle:"🕯 Yahrzeits this week",showAll:"Show all",art1:"From the Treasures of the Torah Sages",art2:"Thus Did Our Sages Do",empty:"No issues have been uploaded yet.",none:"No issues found.",loading:"Loading…",err:"Error loading the archive.",manage:"Admin",contact:"Contact",wa:"WhatsApp",navWeekly:"This week’s issue",navIssues:"Issue archive",navSages:"Sages",sName:"Search by name, details or date (13 / 13 Cheshvan)…",allCountries:"All countries",allMonths:"All months of passing",results:"{n} sages",more:"Show more",appearedIn:"Featured in",noSages:"The list of sages will be published soon.",install:"📲 Install the app",iosHint:"To install on iPhone: tap the Share button ⎙, then “Add to Home Screen”.",otherC:"Other / unclassified",sages:"Sages in this issue",byYear:"By year",byParasha:"By parasha",parSearch:"Search a parasha…",halTitle:"💡 Daily halacha",halSages:"Sages whose yahrzeit falls on this day",halAfterSet:"The Hebrew day began at sunset",pushOn:"🔔 Notify me of new issues",pushOff:"🔕 Turn off notifications",pushOk:"✓ Notifications on. We'll tell you about every new issue.",pushOffOk:"Notifications turned off.",pushDenied:"Notification permission is blocked. Allow it in your browser's site settings.",pushUnsup:"This browser doesn't support notifications. On iPhone, add the site to your Home Screen first.",halSrc:"Sources:",navHal:"Daily halacha",halPrev:"Previous day",halNext:"Next day",halToday:"Today",zmTitle:"🕐 Daily times",zmCity:"City",zmNone:"No times available for this date in the selected city.",dedTitle:"🕯 Dedications",halNone:"No halacha for this date.",pickPar:"Choose a parasha to see its issues.",books:["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Special Shabbatot"]},
  fr:{name:"Français",title:"Bulletin des Sages de Séfarad",sub:"Le bulletin hebdomadaire · Archives par Chabbat et par année",search:"Rechercher par paracha ou sujet…",year:"Année {y}",latest:"Dernier numéro",shabbat:"Chabbat",parasha:"Paracha ",about:"À propos de ce numéro",download:"⬇ Télécharger le numéro",preview:"👁 Voir le numéro",inSection:"dans la rubrique",inList:"dans la liste des sages du numéro",died:"Décédé",issueNo:"Numéro {n}",subTitle:"📬 Recevoir le bulletin par e-mail",subPlaceholder:"Votre adresse e-mail",subBtn:"S’abonner",subConfirm:"📧 Nous vous avons envoyé un e-mail. Cliquez sur le lien qu’il contient pour confirmer votre inscription (vérifiez aussi les indésirables).",subBad:"Adresse e-mail invalide.",subMany:"Trop de tentatives. Réessayez plus tard.", subMore: "Plus de détails (facultatif)", subName: "Nom", subPhone: "Téléphone", subCity: "Ville / pays", subMoreHint: "Facultatif. Conservé uniquement par l’institut.",subNote:"Votre adresse sert uniquement à l’envoi du bulletin. Pour vous désabonner, écrivez à {mail}.",navAbout:"À propos",aboutSoon:"Cette page sera bientôt complétée.",shareWa:"💬 Partager sur WhatsApp",copyLink:"🔗 Copier le lien",perma:"📄 Page du numéro",shareNative:"📤 Partager",copied:"Lien copié ✓",yzTitle:"🕯 Yahrzeits de la semaine",showAll:"Voir tous",art1:"Des trésors des sages de la Torah",art2:"Ainsi ont agi nos sages",empty:"Aucun numéro n’a encore été publié.",none:"Aucun numéro trouvé.",loading:"Chargement…",err:"Erreur de chargement des archives.",manage:"Gestion",contact:"Contact",wa:"WhatsApp",navWeekly:"Le numéro de la semaine",navIssues:"Archives",navSages:"Sages",sName:"Rechercher par nom, détails ou date (13 / י״ג חשון)…",allCountries:"Tous les pays",allMonths:"Tous les mois de décès",results:"{n} sages",more:"Voir plus",appearedIn:"Présent dans",noSages:"La liste des sages sera bientôt publiée.",install:"📲 Installer l’application",iosHint:"Sur iPhone : touchez Partager ⎙ puis « Sur l’écran d’accueil ».",otherC:"Autre / non classé",sages:"Sages de ce numéro",byYear:"Par année",byParasha:"Par paracha",parSearch:"Rechercher une paracha…",halTitle:"💡 Halacha du jour",halSages:"Sages dont la hilloula tombe ce jour",halAfterSet:"Le jour hébraïque a commencé au coucher du soleil",pushOn:"🔔 Être averti des nouveaux numéros",pushOff:"🔕 Désactiver les notifications",pushOk:"✓ Notifications activées. Nous vous préviendrons à chaque nouveau numéro.",pushOffOk:"Notifications désactivées.",pushDenied:"L'autorisation des notifications est bloquée. Autorisez-la dans les réglages du site.",pushUnsup:"Ce navigateur ne prend pas en charge les notifications. Sur iPhone, ajoutez d'abord le site à l'écran d'accueil.",halSrc:"Sources :",navHal:"Halacha du jour",halPrev:"Jour précédent",halNext:"Jour suivant",halToday:"Aujourd’hui",zmTitle:"🕐 Horaires du jour",zmCity:"Ville",zmNone:"Aucun horaire pour cette date dans la ville choisie.",dedTitle:"🕯 Dédicaces",halNone:"Aucune halacha pour cette date.",pickPar:"Choisissez une paracha pour voir ses numéros.",books:["Genèse","Exode","Lévitique","Nombres","Deutéronome","Chabbatot spéciaux"]},
  es:{name:"Español",title:"Boletín Sabios de Sefarad",sub:"El boletín semanal · Archivo por Shabat y año",search:"Buscar por parashá o tema…",year:"Año {y}",latest:"Último boletín",shabbat:"Shabat",parasha:"Parashá ",about:"Sobre este boletín",download:"⬇ Descargar el boletín",preview:"👁 Ver el boletín",inSection:"en la sección",inList:"en la lista de sabios del boletín",died:"Falleció",issueNo:"Boletín n.º {n}",subTitle:"📬 Recibir el boletín por correo",subPlaceholder:"Su correo electrónico",subBtn:"Suscribirse",subConfirm:"📧 Le enviamos un correo. Haga clic en el enlace para confirmar su suscripción (revise también el spam).",subBad:"Correo electrónico no válido.",subMany:"Demasiados intentos. Inténtelo más tarde.", subMore: "Más datos (opcional)", subName: "Nombre", subPhone: "Teléfono", subCity: "Ciudad / país", subMoreHint: "Opcional. Solo lo conserva el instituto.",subNote:"Su correo se usa solo para enviar el boletín. Para darse de baja, escriba a {mail}.",navAbout:"Acerca de",aboutSoon:"Esta página se completará pronto.",shareWa:"💬 Compartir en WhatsApp",copyLink:"🔗 Copiar enlace",perma:"📄 Página del número",shareNative:"📤 Compartir",copied:"Enlace copiado ✓",yzTitle:"🕯 Yahrzeits de esta semana",showAll:"Ver todos",art1:"De los tesoros de los sabios de la Torá",art2:"Así actuaron nuestros sabios",empty:"Aún no se han subido boletines.",none:"No se encontraron boletines.",loading:"Cargando…",err:"Error al cargar el archivo.",manage:"Admin",contact:"Contacto",wa:"WhatsApp",navWeekly:"El boletín de la semana",navIssues:"Archivo",navSages:"Sabios",sName:"Buscar por nombre, detalles o fecha (13 / י״ג חשון)…",allCountries:"Todos los países",allMonths:"Todos los meses de fallecimiento",results:"{n} sabios",more:"Ver más",appearedIn:"Aparece en",noSages:"La lista de sabios se publicará pronto.",install:"📲 Instalar la aplicación",iosHint:"En iPhone: toque Compartir ⎙ y luego «Añadir a pantalla de inicio».",otherC:"Otro / sin clasificar",sages:"Sabios de este boletín",byYear:"Por año",byParasha:"Por parashá",parSearch:"Buscar una parashá…",halTitle:"💡 Halajá diaria",halSages:"Sabios cuyo aniversario luctuoso cae en este día",halAfterSet:"El día hebreo comenzó al atardecer",pushOn:"🔔 Avisarme de nuevos números",pushOff:"🔕 Desactivar notificaciones",pushOk:"✓ Notificaciones activadas. Te avisaremos de cada número nuevo.",pushOffOk:"Notificaciones desactivadas.",pushDenied:"El permiso de notificaciones está bloqueado. Permítelo en los ajustes del sitio.",pushUnsup:"Este navegador no admite notificaciones. En iPhone, primero añade el sitio a la pantalla de inicio.",halSrc:"Fuentes:",navHal:"Halajá diaria",halPrev:"Día anterior",halNext:"Día siguiente",halToday:"Hoy",zmTitle:"🕐 Horarios del día",zmCity:"Ciudad",zmNone:"No hay horarios para esta fecha en la ciudad elegida.",dedTitle:"🕯 Dedicatorias",halNone:"No hay halajá para esta fecha.",pickPar:"Elija una parashá para ver sus boletines.",books:["Génesis","Éxodo","Levítico","Números","Deuteronomio","Shabatot especiales"]}
};
const LANGS = ["he","en","fr","es"];
let lang = (() => { try { const s = localStorage.getItem("lang"); if (LANGS.includes(s)) return s; } catch {} const n = (navigator.language || "he").slice(0, 2); return LANGS.includes(n) ? n : "he"; })();
// ===== עריכת טקסטים על המסך (1.36.0): meta/texts = {version, json: {שפה: {מפתח: טקסט}}} – דריסה של T. =====
// במצב עריכה t() עוטפת כל מחרוזת בסימנים בלתי נראים (מפתח בקידוד בינארי), ו-edTexts() הופכת אותם ל-<span class="ed-txt"> שאפשר ללחוץ עליו.
let TXT_ON = false, TXT = null, TXT_DRAFT = null, txtLoading = false;
const TXK = Object.keys(T.he).filter(k => typeof T.he[k] === "string"), TXI = {};
TXK.forEach((k, i) => { TXI[k] = i.toString(2).replace(/0/g, "\u200b").replace(/1/g, "\u200c"); });
const t = k => {
  const o = ((TXT_ON && TXT_DRAFT) ? TXT_DRAFT : (TXT || {}))[lang];
  let v = (o && o[k]) || (T[lang] && T[lang][k]) || T.he[k];
  if (TXT_ON && TXI[k] !== undefined && typeof v === "string") v = "\u2063" + TXI[k] + "\u2064" + v + "\u2060";
  return v;
};

const BOOKS = [
  "בראשית|Bereshit,נח|Noach,לך לך|Lech Lecha,וירא|Vayera,חיי שרה|Chayei Sarah,תולדות|Toldot,ויצא|Vayetze,וישלח|Vayishlach,וישב|Vayeshev,מקץ|Miketz,ויגש|Vayigash,ויחי|Vayechi",
  "שמות|Shemot,וארא|Vaera,בא|Bo,בשלח|Beshalach,יתרו|Yitro,משפטים|Mishpatim,תרומה|Terumah,תצוה|Tetzaveh,כי תשא|Ki Tisa,ויקהל|Vayakhel,פקודי|Pekudei",
  "ויקרא|Vayikra,צו|Tzav,שמיני|Shemini,תזריע|Tazria,מצורע|Metzora,אחרי מות|Acharei Mot,קדושים|Kedoshim,אמור|Emor,בהר|Behar,בחוקותי|Bechukotai",
  "במדבר|Bamidbar,נשא|Naso,בהעלותך|Behaalotecha,שלח|Shelach,קורח|Korach,חקת|Chukat,בלק|Balak,פינחס|Pinchas,מטות|Matot,מסעי|Masei",
  "דברים|Devarim,ואתחנן|Vaetchanan,עקב|Ekev,ראה|Reeh,שפטים|Shoftim,כי תצא|Ki Teitzei,כי תבוא|Ki Tavo,נצבים|Nitzavim,וילך|Vayelech,האזינו|Haazinu,וזאת הברכה|Vezot Haberacha",
  "שבת חול המועד|Shabbat Chol HaMoed,שבת הגדול|Shabbat HaGadol,שבת שובה|Shabbat Shuva,שבת חזון|Shabbat Chazon,שבת נחמו|Shabbat Nachamu,שבת שירה|Shabbat Shira,שבת זכור|Shabbat Zachor,שבת שקלים|Shabbat Shekalim,שבת פרה|Shabbat Parah,שבת החודש|Shabbat HaChodesh"
].map(g => g.split(",").map(x => { const [he, en] = x.split("|"); return { he, en }; }));
const COMBINED = "ויקהל-פקודי|Vayakhel-Pekudei,תזריע-מצורע|Tazria-Metzora,אחרי מות-קדושים|Acharei Mot-Kedoshim,בהר-בחוקותי|Behar-Bechukotai,חקת-בלק|Chukat-Balak,מטות-מסעי|Matot-Masei,נצבים-וילך|Nitzavim-Vayelech".split(",").map(x => { const [he, en] = x.split("|"); return { he, en }; });
const TR = {}; [...BOOKS.flat(), ...COMBINED].forEach(x => TR[x.he] = x.en);
const trName = n => lang === "he" ? n : (TR[n] || n);
const partsOf = n => n.replace(/^פרשת\s+/, "").split(/\s*[-–]\s*/);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app), storage = getStorage(app), auth = getAuth(app);
const ADMIN_PAGE = document.body.dataset.page === "admin";
let aboutOpen = null, subTimer = 0, subEl = null; let focusId = null, pendingScroll = null, lastPub = null, yzOpen = false, ABOUT = null; let adminTab = ADMIN_PAGE ? "list" : "issue"; let view = "weekly"; let parQ = "", parOpen = false, parBook = null; let issues = [], admins = [], user = null, isAdmin = false, showAdmin = ADMIN_PAGE, selYear = null, mode = "year", selPar = null, filter = "", editing = null, unsubAdmins = null;

const $ = id => document.getElementById(id);
if (ADMIN_PAGE) lang = "he";
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const hyIn = (d, loc) => { try { return new Intl.DateTimeFormat(loc + "-u-ca-hebrew", { year: "numeric" }).formatToParts(D(d)).find(p => p.type === "year").value; } catch { return ""; } };
const yearOf = i => hyIn(i.date, "en") || String(D(i.date).getFullYear());
const yLabel = n => lang === "he" ? gem(+n) : String(n);
const heDate = d => { try { return lang === "he" ? heLetters(d) : D(d).toLocaleDateString(lang + "-u-ca-hebrew", { day: "numeric", month: "long" }); } catch { return ""; } };
const grDate = d => D(d).toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric" });
const mb = b => b ? (b / 1048576).toFixed(1) + " MB" : "";
const hy = d => hyIn(d, "he");
const descOf = i => i.desc || ""; // מלל מסביר – בעברית בלבד
const parashaTitle = n => /^שבת/.test(n) ? trName(n) : t("parasha") + trName(n.replace(/^פרשת\s+/, ""));

const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/", MAX_PAGES = 30;
let pdfjsP = null;
const loadPdfJs = () => pdfjsP || (pdfjsP = new Promise((res, rej) => {
  const sc = document.createElement("script"); sc.src = PDFJS + "pdf.min.js";
  sc.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js"; res(window.pdfjsLib); };
  sc.onerror = () => { pdfjsP = null; rej(new Error("pdf.js")); }; document.head.appendChild(sc);
}));
// ממיר PDF לתמונות JPEG (בדפדפן של המנהל, לפני ההעלאה)
async function pdfToJpegs(file, onProg) {
  const lib = await loadPdfJs();
  const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  const n = Math.min(pdf.numPages, MAX_PAGES), out = [];
  for (let p = 1; p <= n; p++) {
    onProg && onProg(p, n);
    const page = await pdf.getPage(p), w0 = page.getViewport({ scale: 1 }).width;
    const vp = page.getViewport({ scale: Math.min(2, 1200 / w0) });
    const cv = document.createElement("canvas"); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
    const cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height);
    await page.render({ canvasContext: cx, viewport: vp }).promise;
    let blob = null;
    for (const q of [0.82, 0.65, 0.5]) { blob = await new Promise(r => cv.toBlob(r, "image/jpeg", q)); if (blob && blob.size < MAX_UPLOAD) break; }
    if (blob && blob.size < MAX_UPLOAD) out.push(blob);
    cv.width = cv.height = 0; page.cleanup();
  }
  return out;
}
// תמונת שיתוף 1200×630: החלק העליון של העמוד הראשון (כותרת הגיליון, שם הפרשה וזמני הדלקת נרות)
async function makeCover(blob) {
  const bm = await createImageBitmap(blob), W = 1200, H = 630, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, W, H);
  const sh = Math.min(bm.height, bm.width * H / W); cx.drawImage(bm, 0, 0, bm.width, sh, 0, 0, W, Math.round(sh * W / bm.width));
  if (bm.close) bm.close();
  return await new Promise(r => cv.toBlob(r, "image/jpeg", 0.85));
}
// תמונת חכם (1.28.0): מקטינים בדפדפן ל-480px ושומרים כ-JPEG; הכתובת נשמרת בשורת החכם (אינדקס 9)
async function makePhoto(blob) {
  const bm = await createImageBitmap(blob), k = Math.min(1, 480 / Math.max(bm.width, bm.height)), W = Math.max(1, Math.round(bm.width * k)), H = Math.max(1, Math.round(bm.height * k)), cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, W, H); cx.drawImage(bm, 0, 0, W, H);
  if (bm.close) bm.close();
  return await new Promise(r => cv.toBlob(r, "image/jpeg", 0.85));
}
// תמונה נוספת (1.29.0, למשל הספר של החכם): מקטינים ל-1200px (קריאה נוחה) ושומרים כ-JPEG עד ~900KB
async function makeBookImage(blob) {
  const bm = await createImageBitmap(blob), k = Math.min(1, 1200 / Math.max(bm.width, bm.height)), W = Math.max(1, Math.round(bm.width * k)), H = Math.max(1, Math.round(bm.height * k)), cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, W, H); cx.drawImage(bm, 0, 0, W, H);
  if (bm.close) bm.close();
  let out = null;
  for (const q of [0.85, 0.72, 0.6, 0.5]) { out = await new Promise(r => cv.toBlob(r, "image/jpeg", q)); if (out && out.size < 900 * 1024) break; }
  if (!out) throw new Error("toBlob");
  return out;
}
const sageBooks = g => {
  const bs = g && g.b; if (!bs || !bs.length) return null;
  const w = el("div", "sbooks");
  bs.forEach(x => { const f = el("figure", "sbk"), a = el("a"), im = el("img"); a.href = x[0]; a.target = "_blank"; a.rel = "noopener"; im.src = x[0]; im.alt = x[1] || g.n; im.loading = "lazy"; im.decoding = "async"; a.appendChild(im); f.appendChild(a); if (x[1]) f.appendChild(el("figcaption", null, x[1])); w.appendChild(f); });
  return w;
};
const photoOk = g => !!(g && g.p && /^https:\/\//.test(g.p));
const sagePhoto = (g, cls) => { if (!photoOk(g)) return null; const im = el("img", cls || "sav"); im.src = g.p; im.alt = ""; im.loading = "lazy"; im.decoding = "async"; return im; };
const sagePhotoBig = g => { if (!photoOk(g)) return null; const a = el("a"); a.href = g.p; a.target = "_blank"; a.rel = "noopener"; const im = el("img", "sphoto-lg"); im.src = g.p; im.alt = g.n; im.loading = "lazy"; im.decoding = "async"; a.appendChild(im); return a; };
const pagesOf = i => (i.pages && i.pages.length) ? i.pages : (i.path && !/\.pdf$/i.test(i.path) && i.url ? [{ url: i.url }] : []);


// מונה צפיות: פעם אחת לכל גיליון בכל ביקור (sessionStorage), לא נספר בדף הניהול
function countView(i) {
  if (ADMIN_PAGE) return;
  try { const k = "v:" + i.id; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); } catch (e) {}
  updateDoc(doc(db, "issues", i.id), { views: increment(1) }).catch(() => {});
}
// טקסט עם קישורים לחיצים (בטוח: textContent בלבד, רק http/https)
function linkInto(node, text) {
  linkParts(text).forEach(p => {
    if (p.t === "link") { const a = el("a", "lnk", p.v); a.href = p.href; a.target = "_blank"; a.rel = "noopener noreferrer"; a.style.cssText = "word-break:break-all;direction:ltr;unicode-bidi:plaintext"; node.appendChild(a); }
    else node.appendChild(document.createTextNode(p.v));
  });
  return node;
}
function inl(node, text) {
  String(text).split(/\*\*?([^*\n]+?)\*\*?/).forEach((part, k) => { if (k % 2) linkInto(node.appendChild(el("b")), part); else if (part) linkInto(node, part); });
  return node;
}

function renderText(box, txt) {
  let ul = null;
  (txt || "").split("\n").forEach(line => {
    const t = line.trim();
    if (!t) { ul = null; return; }
    if (/^[-•]\s+/.test(t)) { if (!ul) { ul = el("ul"); box.appendChild(ul); } ul.appendChild(inl(el("li"), t.replace(/^[-•]\s+/, ""))); return; }
    ul = null;
    if (t.startsWith("# ")) box.appendChild(inl(el("h4"), t.slice(2)));
    else box.appendChild(inl(el("p"), t));
  });
}

const hashId = () => (location.hash.match(/^#i=([\w-]+)/) || [])[1] || null;
// קישור שיתוף עם תצוגה מקדימה (דורש את הפונקציה share). אם היא לא פרוסה – חוזרים לקישור הרגיל
let SHARE_OK = false; try { SHARE_OK = localStorage.getItem("share_ok") === "1"; } catch {}
fetch("/i/_ping", { cache: "no-store" }).then(r => r.ok, () => false).then(ok => { const ch = ok !== SHARE_OK; SHARE_OK = ok; try { localStorage.setItem("share_ok", ok ? "1" : "0"); } catch {} if (ch) try { render(); } catch {} });
const SITE_ORIGIN = "https://" + CONTACT.site;   // קישורים תמיד על הדומיין של המכון, גם אם נכנסים מכתובת אחרת
const issueLink = i => SHARE_OK ? SITE_ORIGIN + "/i/" + i.id : SITE_ORIGIN + "/#i=" + i.id;
const issueNo = n => lang === "he" && n < 1000 ? "גיליון " + gem(n) : t("issueNo").replace("{n}", n);

async function copyText(x) { try { await navigator.clipboard.writeText(x); } catch { const ta = el("textarea"); ta.value = x; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch {} ta.remove(); } }
function distMsg(i) {
  const lines = (i.desc || "").split("\n").map(x => x.trim()).filter(x => x && !x.startsWith("#")).map(x => x.replace(/^[-•]\s+/, ""));
  let sum = lines.slice(0, 3).join(" · "); if (sum.length > 240) sum = sum.slice(0, 237) + "…";
  let heD = ""; try { heD = heLetters(i.date); } catch {}
  const g = i.sages || [], names = g.slice(0, 6).map(x => x.n).join(", ") + (g.length > 6 ? " ועוד" : "");
  const pn = /^שבת/.test(i.parasha) ? i.parasha : "פרשת " + i.parasha.replace(/^פרשת\s+/, "");
  const artLines = [i.art1 ? "📖 מאוצרותיהם של חכמי התורה: " + i.art1.n : "", i.art2 ? "🌟 וכה עשו חכמינו: " + i.art2.n : ""].filter(Boolean).join("\n");
  return ["📜 *גיליון חכמי ספרד" + (i.num ? " – מס׳ " + (i.num < 1000 ? gem(i.num) : i.num) : "") + "*\n*" + pn + "* · שבת " + heD, artLines, sum, g.length ? "🕯 גאונים בגיליון: " + names : "", "⬇ להורדה: " + issueLink(i)].filter(Boolean).join("\n\n");
}


function renderYz() {
  const Z = $("yz"); Z.innerHTML = "";
  if (view !== "sages" || !SAGES || !SAGES.length) return;
  const now = new Date(), sh = new Date(now); sh.setDate(now.getDate() + (6 - now.getDay()));
  const key = sh.getFullYear() + "-" + String(sh.getMonth() + 1).padStart(2, "0") + "-" + String(sh.getDate()).padStart(2, "0");
  const keys = weekKeys(key, 0), arr = uniqSages(SAGES.filter(g => keys.has(g.day + "|" + g.m)).sort((a, b) => sortKey(a.n).localeCompare(sortKey(b.n), "he")));
  if (!arr.length) return;
  const d = accD("card acc", "w", yzOpen); d.ontoggle = () => { yzOpen = d.open; };
  d.appendChild(el("summary", null, t("yzTitle") + " (" + arr.length + ")"));
  const w = el("div", "accbody"); w.style.cssText = "max-height:340px;overflow:auto"; let lim = 12;
  const draw = () => {
    w.innerHTML = "";
    arr.slice(0, lim).forEach(g => { const p = accD("yzp", "yzi"), sm = el("summary"); { const av = sagePhoto(g, "sav"); if (av) sm.appendChild(av); } sm.appendChild(el("b", null, g.n)); const mt = sageMeta(g).join(" · "); if (mt) sm.appendChild(el("span", "meta", " · " + mt)); p.appendChild(sm); { const big = sagePhotoBig(g); if (big) p.appendChild(big); } if (g.d) { const dd = el("div", null, g.d); dd.style.cssText = "font-size:.95rem;padding:4px 0 8px"; p.appendChild(dd); } w.appendChild(p); });
    if (arr.length > lim) { const b = el("button", "btn sm ghost", t("showAll")); b.onclick = () => { lim = 9999; draw(); }; w.appendChild(b); }
  };
  draw(); d.appendChild(w); Z.appendChild(d);
}

async function loadAbout(force) {
  if (ABOUT && !force) return ABOUT;
  try { const d = await getDoc(doc(db, "meta", "about")); ABOUT = d.exists() ? d.data() : {}; } catch { ABOUT = {}; }
  return ABOUT;
}

async function renderAbout() {
  const V = $("aboutView"); V.innerHTML = "";
  const a = await loadAbout(); if (view !== "about") return;
  V.innerHTML = "";
  const txt = a.he || "";
  if (!txt) { const c = el("div", "card"); c.appendChild(el("div", "empty", t("aboutSoon"))); V.appendChild(c); return; }
  const secs = txt.split(/\n(?=#\s)/).map(x => x.trim()).filter(Boolean);
  if (secs.length > 1 || /^#\s/.test(txt)) {
    secs.forEach(sx => {
      const m = sx.match(/^#\s+([^\n]*)\n?([\s\S]*)$/);
      if (!m) { const c0 = el("div", "card"), d0 = el("div", "desc"); renderText(d0, sx); c0.appendChild(d0); V.appendChild(c0); return; }
      const d = accD("card acc", "ab"); d.appendChild(el("summary", null, m[1]));
      const b = el("div", "accbody desc"); renderText(b, m[2]); d.appendChild(b); V.appendChild(d);
    });
    if (aboutOpen != null) { const d = V.querySelectorAll('details[data-g="ab"]')[aboutOpen]; aboutOpen = null; if (d) { d.open = true; d.scrollIntoView({ block: "start" }); } }
  } else { const c = el("div", "card"), d = el("div", "desc"); renderText(d, txt); c.appendChild(d); V.appendChild(c); }
}

// ===== התראות Push (FCM): הרשמה של הגולש, ושליחה ע"י מנהל דרך הפונקציה notifyIssue =====
const FB_V = "10.12.2";
async function pushOn() {
  const { getMessaging, getToken, isSupported } = await import("https://www.gstatic.com/firebasejs/" + FB_V + "/firebase-messaging.js");
  if (!(await isSupported())) throw new Error("unsupported");
  if ((await Notification.requestPermission()) !== "granted") throw new Error("denied");
  const reg = await navigator.serviceWorker.ready;
  const token = await getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
  if (!token) throw new Error("notoken");
  await setDoc(doc(db, "pushTokens", token), { token, lang, ts: Date.now() });
  try { localStorage.setItem("push_token", token); } catch {}
}
async function pushOff() {
  let token = null; try { token = localStorage.getItem("push_token"); } catch {}
  try { const { getMessaging, deleteToken } = await import("https://www.gstatic.com/firebasejs/" + FB_V + "/firebase-messaging.js"); await deleteToken(getMessaging(app)); } catch {}
  if (token) await deleteDoc(doc(db, "pushTokens", token)).catch(() => {});
  try { localStorage.removeItem("push_token"); } catch {}
}
function pushRow() {
  const w = el("div"); w.style.marginTop = "12px"; const b = el("button", "btn ghost", ""), m = el("div", "msg");
  const on = () => { try { return !!localStorage.getItem("push_token") && Notification.permission === "granted"; } catch { return false; } };
  const paint = () => { b.textContent = on() ? t("pushOff") : t("pushOn"); };
  b.onclick = async () => {
    b.disabled = true; m.textContent = "";
    try { if (on()) { await pushOff(); m.textContent = t("pushOffOk"); } else { await pushOn(); m.textContent = t("pushOk"); } }
    catch (e) { m.textContent = e && e.message === "denied" ? t("pushDenied") : e && e.message === "unsupported" ? t("pushUnsup") : t("err"); }
    b.disabled = false; paint();
  };
  paint(); w.append(b, m); return w;
}
async function sendPush(id, force) {
  const { getFunctions, httpsCallable } = await import("https://www.gstatic.com/firebasejs/" + FB_V + "/firebase-functions.js");
  return (await httpsCallable(getFunctions(app, FUNCTIONS_REGION), "notifyIssue")({ id, force })).data;
}
function pushBtn(id, short) {
  const lab = short ? "📣 התראה" : "📣 שליחת התראה למנויים", b = el("button", "btn sm ghost", lab);
  b.onclick = async () => {
    b.disabled = true;
    try {
      let r = await sendPush(id, false);
      if (r.already) { if (!confirm("כבר נשלחה התראה על הגיליון הזה. לשלוח שוב?")) { b.disabled = false; return; } r = await sendPush(id, true); }
      b.textContent = "✓ נשלח ל-" + r.sent + (r.failed ? " (" + r.failed + " נכשלו)" : "");
    } catch (e) { b.textContent = "שגיאה: " + (e && e.message || e); b.disabled = false; setTimeout(() => b.textContent = lab, 4000); }
  };
  return b;
}
async function callFn(name, data) {
  const { getFunctions, httpsCallable } = await import("https://www.gstatic.com/firebasejs/" + FB_V + "/firebase-functions.js");
  return (await httpsCallable(getFunctions(app, FUNCTIONS_REGION), name)(data)).data;
}
const callMail = data => callFn("mailIssue", data);
// ===== שליחת הגיליון במייל למנויים =====
// test=true: מייל בדיקה אליך בלבד (מיידי). אחרת: משימה בשרת (mailJobs) שה-mailWorker מטפל בה כל דקה, ולכן היא ממשיכה גם כשהלשונית סגורה.
let JOBS = {}, jobsListening = false; const jobUI = {};
function listenJobs() {
  if (jobsListening) return; jobsListening = true;
  onSnapshot(collection(db, "mailJobs"), s => { JOBS = {}; s.docs.forEach(d => JOBS[d.id] = d.data()); Object.values(jobUI).forEach(f => f()); }, () => { jobsListening = false; });
}
function mailBtn(id, short, test) {
  const lab = test ? "\u{1F9EA} בדיקה" : short ? "\u2709\ufe0f מייל" : "\u2709\ufe0f שליחה במייל למנויים", b = el("button", "btn sm ghost", lab);
  b.title = test ? "שליחת מייל בדיקה לכתובת שלך בלבד" : "שליחת הגיליון במייל לכל המנויים – ברקע, גם אם הלשונית נסגרת";
  const box = el("span"); box.style.cssText = "display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap"; box.appendChild(b);
  if (test) {
    b.onclick = async () => {
      b.disabled = true;
      try { const r = await callMail({ id, test: true }); b.textContent = "\u2713 נשלח אליך (" + r.sent + ")"; }
      catch (e) { b.textContent = "שגיאה: " + (e && e.message || e); }
      setTimeout(() => { b.textContent = lab; b.disabled = false; }, 8000);
    };
    return box;
  }
  listenJobs();
  const ctl = el("button", "btn sm ghost", ""); ctl.hidden = true; box.appendChild(ctl);
  const jobCall = action => callFn("mailJobControl", { id, action }).catch(e => alert("שגיאה: " + (e && e.message || e)));
  const upd = () => {
    const j = JOBS[id]; ctl.hidden = true;
    if (!j || j.status === "stopped") { b.textContent = lab; b.disabled = false; return; }
    const st = "נשלחו " + (j.sent || 0) + " \u00b7 נותרו " + (j.remaining == null ? "?" : j.remaining);
    if (j.status === "running") {
      const wait = j.nextAt > Date.now() ? " \u00b7 השרת האט, ממשיך ב-" + new Date(j.nextAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }) : "";
      b.disabled = true; b.textContent = "\u23f3 שולח ברקע \u00b7 " + st + wait; ctl.hidden = false; ctl.textContent = "\u23f8 השהה"; ctl.onclick = () => jobCall("pause");
    } else if (j.status === "paused") {
      b.disabled = true; b.textContent = "\u23f8 מושהה \u00b7 " + st; ctl.hidden = false; ctl.textContent = "\u25b6 המשך"; ctl.onclick = () => jobCall("resume");
    } else if (j.status === "done") {
      b.disabled = false; b.textContent = "\u2713 נשלח ל-" + (j.sent || 0) + (j.failed ? " (" + j.failed + " נכשלו)" : "") + " \u00b7 לחץ לשליחה למנויים חדשים";
    } else {
      b.disabled = false; b.textContent = "\u26a0 " + (j.msg || j.status) + " \u00b7 " + st; ctl.hidden = false; ctl.textContent = "\u25b6 נסה שוב"; ctl.onclick = () => jobCall("resume");
    }
  };
  jobUI[id] = upd; upd();
  b.onclick = async () => {
    b.disabled = true;
    try {
      const q = await callMail({ id, dry: true, test: false });
      if (!q.pending) { alert("הגיליון כבר נשלח לכל " + q.total + " המנויים."); upd(); return; }
      const ans = prompt("לשלוח את הגיליון במייל ל-" + q.pending + " מנויים" + (q.alreadyDone ? " (" + q.alreadyDone + " כבר קיבלו)" : "") + ".\n\nכמה מיילים לשלוח בכל דקה? (השליחה רצה בשרת וממשיכה גם אם תסגור את הלשונית; מומלץ לשלוח קודם מייל בדיקה)", "25");
      if (ans === null) { upd(); return; }
      let per = Math.max(1, Math.min(100, parseInt(ans, 10) || 25)), attach = false, embed = false;
      if (q.pages) embed = confirm("להטמיע את " + q.pages + " תמונות העמודים בתוך המייל?\n\nאישור = להטמיע (מוצג גם בלי לאשר תמונות; המייל כבד יותר)\nביטול = קישורים לתמונות באתר (מייל קל)");
      if (q.file) attach = confirm("לצרף למייל גם את קובץ הגיליון (" + (q.file.size ? (q.file.size / 1048576).toFixed(1) + " MB" : q.file.ext.toUpperCase()) + ")?\n\nאישור = לצרף את הקובץ\nביטול = לשלוח רק קישור לקריאה");
      if (attach && embed) per = Math.min(per, 40); else if (attach || embed) per = Math.min(per, 60);
      await callFn("mailJobStart", { id, per, attach, embed });
      alert("\u2713 השליחה הועברה לשרת ותמשיך ברקע גם אם תסגור את הלשונית.\nההתקדמות מוצגת על הכפתור; אפשר להשהות ולהמשיך.");
    } catch (e) { b.textContent = "שגיאה: " + (e && e.message || e); setTimeout(upd, 8000); }
  };
  return box;
}
function renderSubscribe() {
  const B = $("subscribe"); B.innerHTML = "";
  const c = el("div", "card"); c.style.textAlign = "center"; c.appendChild(el("b", null, t("subTitle")));
  const row = el("div"); row.style.cssText = "display:flex;gap:8px;margin-top:8px";
  const e = el("input"); e.type = "email"; e.placeholder = t("subPlaceholder"); e.autocomplete = "email"; e.style.cssText = "direction:ltr;margin:0;flex:1";
  const hp = el("input"); hp.type = "text"; hp.tabIndex = -1; hp.autocomplete = "off"; hp.setAttribute("aria-hidden", "true"); hp.style.cssText = "position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0,0,0,0);opacity:0;pointer-events:none";
  const b = el("button", "btn", t("subBtn")); b.style.marginTop = "0"; const m = el("div", "msg");
  const more = el("details"); more.style.cssText = "margin-top:10px;text-align:start"; more.appendChild(el("summary", null, t("subMore")));
  const dg = el("div"); dg.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-top:8px";
  const mk = (ph, ac, max, type) => { const i = el("input"); i.type = type || "text"; i.placeholder = ph; i.autocomplete = ac; i.maxLength = max; i.style.margin = "0"; dg.appendChild(i); return i; };
  const nm = mk(t("subName"), "name", 60), ph = mk(t("subPhone"), "tel", 30, "tel"), ct = mk(t("subCity"), "address-level2", 60);
  more.append(dg, el("div", "hint", t("subMoreHint")));
  row.append(e, b); c.append(row, more, hp, m);
  if (CONTACT.email) c.appendChild(el("div", "hint", t("subNote").replace("{mail}", CONTACT.email)));
  b.onclick = async () => {
    const v = e.value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || v.length > 120) { m.textContent = t("subBad"); return; }
    if (hp.value) { m.textContent = t("subConfirm"); return; }
    b.disabled = true;
    try { await callFn("subscribeRequest", { email: v, lang, name: nm.value.trim(), phone: ph.value.trim(), city: ct.value.trim() }); m.textContent = t("subConfirm"); e.value = ""; nm.value = ph.value = ct.value = ""; }
    catch (err) { m.textContent = err && err.code === "functions/resource-exhausted" ? t("subMany") : t("err"); }
    b.disabled = false;
  };
  if (VAPID_KEY && "Notification" in window && "serviceWorker" in navigator) c.appendChild(pushRow());
  B.appendChild(c);
}

async function aboutEditor(c) {
  c.appendChild(el("h3", null, "עריכת דף «אודות המכון»"));
  c.appendChild(el("div", "hint", "אפשר להשתמש ב-# לכותרת וב-‎-‎ לנקודות ברשימה; שורה ריקה מפרידה בין פסקאות. הטקסט הוא בעברית בלבד ומוצג כך בכל שפות האתר."));
  const a = await loadAbout(true), F = {}, N = { he: "עברית" };
  Object.keys(N).forEach(k => { c.appendChild(el("label", null, "הטקסט")); const x = el("textarea"); x.style.minHeight = "260px"; x.value = a[k] || ""; F[k] = x; c.appendChild(x); });
  const b = el("button", "btn", "שמירה"), m = el("div", "msg"); c.append(b, m);
  b.onclick = async () => {
    b.disabled = true;
    try { const d = {}; Object.keys(F).forEach(k => d[k] = F[k].value.trim()); await setDoc(doc(db, "meta", "about"), d, { merge: true }); ABOUT = { ...a, ...d }; m.textContent = "✓ נשמר"; }
    catch (e) { m.textContent = "שגיאה: " + e.message; }
    b.disabled = false;
  };
}

// 1.36.6: לשונית «הגדרות אתר» – פרטי קשר (כותרת תחתית) והודעה בראש האתר. נשמר ב-meta/site ומופיע מיד לכל המבקרים, בלי פריסה
async function siteAdmin(c) {
  c.appendChild(el("h3", null, "הגדרות האתר"));
  c.appendChild(el("div", "hint", "השינויים מופיעים באתר מיד, בלי העלאה. את שאר האתר (טקסטים ועיצוב) עורכים ב«עורך חזותי» ו«פריסה». שינויי קוד עדיין דורשים פריסה."));
  let cur = {}; try { const d = await getDoc(doc(db, "meta", "site")); if (d.exists()) cur = cleanSiteCfg(d.data()); } catch (e) { c.appendChild(el("div", "msg", "שגיאה בטעינה: " + e.message)); return; }
  const C = cur.contact || {}, B = cur.banner || { text: {} };
  const F = {}, field = (box, key, label, val, mk) => { box.appendChild(el("label", null, label)); const x = mk ? mk() : el("input"); if (!mk) x.type = "text"; x.value = val || ""; F[key] = x; box.appendChild(x); return x; };
  const cc = el("div", "card"); cc.style.marginTop = "12px"; c.appendChild(cc);
  cc.appendChild(el("h4", null, "פרטי קשר (מוצגים בתחתית האתר)"));
  field(cc, "email", "מייל", C.email ?? CONTACT.email); F.email.dir = "ltr";
  field(cc, "phone", "טלפון", C.phone ?? CONTACT.phone); F.phone.dir = "ltr";
  field(cc, "whatsapp", "וואטסאפ (מספר בינלאומי, בלי + ומקפים, למשל 972501234567)", C.whatsapp ?? CONTACT.whatsapp); F.whatsapp.dir = "ltr";
  field(cc, "address", "כתובת", C.address ?? CONTACT.address);
  cc.appendChild(el("div", "hint", "שדה ריק = לא מוצג. כתובת האתר (" + CONTACT.site + ") קבועה ולא נערכת מכאן."));
  const bb = el("div", "card"); bb.style.marginTop = "12px"; c.appendChild(bb);
  bb.appendChild(el("h4", null, "הודעה בראש האתר"));
  const lab = el("label"); const on = el("input"); on.type = "checkbox"; on.checked = !!B.on; lab.append(on, " הצג הודעה"); bb.appendChild(lab);
  const area = () => { const x = el("textarea"); x.style.minHeight = "60px"; return x; };
  [["he", "עברית (חובה כדי שההודעה תוצג)"], ["en", "English (אופציונלי)"], ["fr", "Français (אופציונלי)"], ["es", "Español (אופציונלי)"]].forEach(([k, l]) => field(bb, "t_" + k, l, (B.text || {})[k], area));
  field(bb, "url", "קישור (אופציונלי: https://… או /archive)", B.url); F.url.dir = "ltr";
  field(bb, "until", "מוצגת עד (אופציונלי, כולל התאריך הזה)", B.until); F.until.type = "date";
  bb.appendChild(el("div", "hint", "שפה בלי תרגום מציגה את הטקסט בעברית. מי שסגר את ההודעה לא יראה אותה שוב עד סגירת הדפדפן."));
  const b = el("button", "btn", "שמירה"), m = el("div", "msg"); c.append(b, m);
  b.onclick = async () => {
    b.disabled = true; m.textContent = "שומר…";
    try {
      const d = cleanSiteCfg({ contact: { email: F.email.value, phone: F.phone.value, whatsapp: F.whatsapp.value, address: F.address.value }, banner: { on: on.checked, text: { he: F.t_he.value, en: F.t_en.value, fr: F.t_fr.value, es: F.t_es.value }, url: F.url.value, until: F.until.value } });
      const bad = []; if (F.email.value.trim() && !d.contact.email) bad.push("מייל לא תקין"); if (F.url.value.trim() && !d.banner.url) bad.push("קישור לא תקין (חייב להתחיל ב-https:// או /)");
      if (bad.length) { m.textContent = "⚠ " + bad.join(" · "); b.disabled = false; return; }
      await setDoc(doc(db, "meta", "site"), { version: Date.now(), ...d });
      SITE_CFG = d; applySiteContact(); m.textContent = "✓ נשמר" + (d.banner.on && !d.banner.text.he ? " (ההודעה לא תוצג: חסר טקסט בעברית)" : "");
    } catch (e) { m.textContent = "שגיאה: " + e.message; }
    b.disabled = false;
  };
}

async function subsView(c0) {
  const c = el("div"); c0.appendChild(c);            // מכל, כדי שהכפתורים שמתחת (יציאה) לא יקפצו לאמצע בזמן הטעינה
  c.appendChild(el("h3", null, "נרשמים לקבלת הגיליון במייל"));
  const info = el("div", "msg", "טוען…"); c.appendChild(info);
  let list, lastExp = 0;
  try {
    list = (await getDocs(collection(db, "subscribers"))).docs.map(d => d.data()).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const ex = await getDoc(doc(db, "meta", "subsExport")); if (ex.exists()) lastExp = ex.data().ts || 0;
  } catch (e) { info.textContent = "שגיאה בטעינה: " + e.message; return; }
  const fresh = list.filter(x => (x.ts || 0) > lastExp), emails = list.map(x => x.email);
  info.textContent = list.length + " נרשמים · " + fresh.length + " חדשים מאז הייצוא האחרון" + (lastExp > 1 ? " (" + new Date(lastExp).toLocaleDateString("he-IL") + ")" : "");
  const csv = (arr, name) => {
    const lines = ["email,language,date"].concat(arr.map(x => [x.email, x.lang || "", x.ts > 1 ? new Date(x.ts).toISOString().slice(0, 10) : ""].join(",")));
    const lk = document.createElement("a"); lk.href = URL.createObjectURL(new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" })); lk.download = name; lk.click();
  };
  const tools = el("details"); tools.style.marginTop = "16px"; tools.appendChild(el("summary", null, "\u{1F6E0} כלים: ייצוא, ייבוא ושליחה ידנית"));
  const act = el("div", "actions");
  const b1 = el("button", "btn sm", "⬇ ייצוא כל הנרשמים (CSV)"); b1.onclick = () => csv(list, "נרשמים-הכול.csv");
  const b2 = el("button", "btn sm", "⬇ ייצוא חדשים בלבד (" + fresh.length + ")");
  b2.onclick = () => { if (!fresh.length) { alert("אין נרשמים חדשים מאז הייצוא האחרון."); return; } csv(fresh, "נרשמים-חדשים.csv"); setDoc(doc(db, "meta", "subsExport"), { ts: Date.now() }).catch(() => {}); b2.textContent = "✓ יוצא. הנרשמים הבאים יסומנו כחדשים"; };
  const b3 = el("button", "btn sm ghost", "📋 העתקת כל הכתובות"); b3.onclick = async () => { await copyText(emails.join(", ")); b3.textContent = "הועתק ✓"; };
  const cq = v => { v = String(v == null ? "" : v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };   // מרכאות + הגנה מנוסחאות באקסל
  const b4 = el("button", "btn sm", "⬇ ייצוא מלא עם שם ופרטים (CSV)"); b4.onclick = () => {
    const lines = ["email,name,phone,city,language,date,note"].concat(list.map(x => [x.email, x.name, x.phone, x.city, x.lang || "", x.ts > 1 ? new Date(x.ts).toISOString().slice(0, 10) : "", x.note].map(cq).join(",")));
    const lk = document.createElement("a"); lk.href = URL.createObjectURL(new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" })); lk.download = "נרשמים-מלא.csv"; lk.click();
  };
  act.append(b1, b2, b4, b3); tools.appendChild(act);
  tools.appendChild(el("div", "hint", "כך עובדים עם «מסר 10»: אחרי שנרשמים חדשים מצטרפים – «ייצוא חדשים בלבד», והעלאת הקובץ לרשימת התפוצה שם. הייצוא מסמן את הרגע, וההרשמות הבאות ייספרו מחדש."));

  const imp = el("details"); imp.appendChild(el("summary", null, "⬆ ייבוא רשימה קיימת (למשל מ«מסר 10»)"));
  imp.appendChild(el("div", "hint", "הדביקו כתובות או בחרו קובץ CSV/Excel. המערכת מחלצת את כל כתובות המייל, מסננת כפילויות ומוסיפה רק את החדשות. אם יש שורת כותרת (שם, טלפון, עיר, הערה, שפה) הפרטים נקלטים גם הם, ולמנויים קיימים מושלמים רק שדות ריקים. כתובות מיובאות לא נספרות כ«חדשות» לייצוא."));
  const ta = el("textarea"); ta.placeholder = "הדביקו כאן כתובות (מופרדות בפסיק, שורה או רווח)…"; ta.style.minHeight = "90px";
  const fi = el("input"); fi.type = "file"; fi.accept = ".csv,.txt,.xlsx,.xls";
  const bi = el("button", "btn sm", "הוספה לרשימה"), mi = el("div", "msg");
  bi.onclick = async () => {
    bi.disabled = true; mi.textContent = "קורא…";
    try {
      let txt = ta.value; const f = fi.files[0];
      if (f) {
        if (/\.xlsx?$/i.test(f.name)) { const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs"); const wb = XLSX.read(await f.arrayBuffer()); wb.SheetNames.forEach(n => txt += "\n" + XLSX.utils.sheet_to_csv(wb.Sheets[n])); }
        else txt += "\n" + await f.text();
      }
      const recs = parseSubRows(txt), have = new Set(emails), byMail = new Map(list.map(x => [x.email, x]));
      const add = [...recs.values()].filter(r => !have.has(r.email)), enrich = [];
      for (const r of recs.values()) if (have.has(r.email)) { const cur = byMail.get(r.email), patch = {}; for (const k of ["name", "phone", "city", "note"]) if (r[k] && !cur[k]) patch[k] = r[k]; if (Object.keys(patch).length) enrich.push([r.email, patch]); }
      const ops = [...add.map(r => ["set", r]), ...enrich.map(([em, p]) => ["upd", em, p])];
      for (let k = 0; k < ops.length; k += 400) {
        const wb2 = writeBatch(db);
        ops.slice(k, k + 400).forEach(o => o[0] === "set" ? wb2.set(doc(db, "subscribers", o[1].email), subDoc(o[1])) : wb2.update(doc(db, "subscribers", o[1]), o[2]));
        await wb2.commit(); mi.textContent = "מוסיף " + Math.min(k + 400, ops.length) + " מתוך " + ops.length + "…";
      }
      mi.textContent = "✓ נמצאו " + recs.size + " כתובות, נוספו " + add.length + " חדשות" + (enrich.length ? ", עודכנו פרטים ל-" + enrich.length + " קיימות" : "") + " (" + (recs.size - add.length) + " כבר היו ברשימה).";
      if (add.length || enrich.length) setTimeout(adminPanel, 1500);
    } catch (e) { mi.textContent = "שגיאה: " + e.message; }
    bi.disabled = false;
  };
  imp.append(ta, fi, bi, mi); tools.appendChild(imp);

  const L = issues[0], pn = L ? (/^שבת/.test(L.parasha) ? L.parasha : "פרשת " + L.parasha.replace(/^פרשת\s+/, "")) : "";
  const subj = "גיליון חכמי ספרד" + (pn ? " – " + pn : ""), body = L ? distMsg(L).replace(/\*/g, "") : "";
  const man = el("details"); man.appendChild(el("summary", null, "✉ שליחה ידנית מהמייל (לרשימות קטנות)"));
  const ch = el("div", "actions");
  for (let k = 0; k < emails.length; k += 30) {
    const grp = emails.slice(k, k + 30), a = el("a", "btn sm ghost", "✉ קבוצה " + (k / 30 + 1) + " (" + grp.length + ")");
    a.href = "mailto:" + (CONTACT.email || "") + "?bcc=" + encodeURIComponent(grp.join(",")) + "&subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
    ch.appendChild(a);
  }
  man.appendChild(ch); tools.appendChild(man);

  const LN = { he: "עברית", en: "English", fr: "Français", es: "Español" }, cnt = {};
  list.forEach(x => { const k = LN[x.lang] ? x.lang : "he"; cnt[k] = (cnt[k] || 0) + 1; });
  c.appendChild(el("div", "hint", Object.keys(LN).filter(k => cnt[k]).map(k => LN[k] + " " + cnt[k]).join("  ·  ")));
  const FIELDS = [["name", "שם", SUB_LIM.name], ["phone", "טלפון", SUB_LIM.phone], ["city", "עיר / מדינה", SUB_LIM.city], ["note", "הערה (למנהלים בלבד)", SUB_LIM.note]];
  let editing = null, drawRef = () => {};
  // טופס הוספה/עריכה של מנוי (x = מנוי קיים לעריכה, או null להוספה)
  const editor = (x, done) => {
    const f = el("div"); f.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:8px 0";
    const em = el("input"); em.type = "email"; em.placeholder = "אימייל *"; em.style.cssText = "direction:ltr;margin:0"; if (x) { em.value = x.email; em.readOnly = true; } f.appendChild(em);
    const ins = {}; FIELDS.forEach(([k, ph, max]) => { const i = el("input"); i.type = "text"; i.placeholder = ph; i.maxLength = max; i.style.margin = "0"; i.value = (x && x[k]) || ""; ins[k] = i; f.appendChild(i); });
    const ls = el("select"); ls.style.margin = "0"; [["he", "עברית"], ["en", "English"], ["fr", "Français"], ["es", "Español"]].forEach(([v, l]) => { const o = el("option", null, l); o.value = v; ls.appendChild(o); }); ls.value = (x && x.lang) || "he"; f.appendChild(ls);
    const sv = el("button", "btn sm", x ? "שמירה" : "הוספה"), msg = el("div", "msg");
    sv.onclick = async () => {
      const mail = em.value.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail) || mail.length > 120) { msg.textContent = "כתובת מייל לא תקינה"; return; }
      if (!x && list.some(y => y.email === mail)) { msg.textContent = "הכתובת כבר ברשימה"; return; }
      const data = { email: mail, lang: ls.value }; FIELDS.forEach(([k, , max]) => { data[k] = cleanField(ins[k].value, max); });
      sv.disabled = true;
      try { if (x) await updateDoc(doc(db, "subscribers", mail), data); else { data.ts = Date.now(); await setDoc(doc(db, "subscribers", mail), data); } done({ ...(x || {}), ...data }); }
      catch (err) { msg.textContent = "השמירה נכשלה"; }
      sv.disabled = false;
    };
    f.append(sv, msg); return f;
  };
  const addBox = el("details"); addBox.style.marginTop = "12px"; addBox.appendChild(el("summary", null, "➕ הוספת מנוי ידנית (עם שם ופרטים)"));
  addBox.appendChild(el("div", "hint", "מנוי שמוסיפים כאן מתווסף מיד, בלי מייל אישור. הוסיפו רק מי שנתן הסכמה."));
  const mountAdd = () => { addBox.querySelectorAll("div.grid-ed").forEach(n => n.remove()); const ed = editor(null, it => { list.unshift(it); emails.push(it.email); mountAdd(); drawRef(); }); ed.className = "grid-ed"; addBox.appendChild(ed); };
  mountAdd(); c.appendChild(addBox);
  const bar = el("div"); bar.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin-top:12px";
  const q = el("input"); q.type = "text"; q.placeholder = "חיפוש לפי מייל, שם, טלפון או עיר…"; q.style.cssText = "flex:1 1 180px;margin:0";
  const so = el("select"); so.style.cssText = "margin:0;flex:0 0 auto";
  [["new", "חדשים קודם"], ["old", "ישנים קודם"], ["az", "לפי כתובת (א-ת)"], ["name", "לפי שם"], ["lang", "לפי שפה"]].forEach(([v, l]) => { const o = el("option", null, l); o.value = v; so.appendChild(o); });
  bar.append(q, so); c.appendChild(bar);
  const box = el("div"); c.appendChild(box); let shown = 50;
  const fmt = ts => ts > 1 ? new Date(ts).toLocaleDateString("he-IL") : "מיובא";
  const SRT = { new: (a, b) => (b.ts || 0) - (a.ts || 0), old: (a, b) => (a.ts || 0) - (b.ts || 0), az: (a, b) => a.email.localeCompare(b.email), name: (a, b) => (!a.name - !b.name) || String(a.name || "").localeCompare(String(b.name || ""), "he") || a.email.localeCompare(b.email), lang: (a, b) => String(a.lang || "he").localeCompare(String(b.lang || "he")) || a.email.localeCompare(b.email) };
  const draw = () => {
    box.innerHTML = ""; const f = q.value.trim().toLowerCase(), arr = list.filter(x => !f || [x.email, x.name, x.phone, x.city, x.note].join(" ").toLowerCase().includes(f)).sort(SRT[so.value]);
    const tb = el("table"); tb.style.cssText = "width:100%;border-collapse:collapse;margin-top:8px;font-size:.92rem";
    const hd = el("tr"); ["#", "מנוי", "שפה", "נרשם", ""].forEach(h => { const th = el("th", null, h); th.style.cssText = "text-align:right;padding:6px 4px;border-bottom:2px solid var(--line);color:var(--mute);font-weight:600"; hd.appendChild(th); }); tb.appendChild(hd);
    arr.slice(0, shown).forEach((x, n) => {
      const r = el("tr"), td = (txt, st) => { const d = el("td", null, txt); d.style.cssText = "padding:6px 4px;border-bottom:1px solid var(--line);" + (st || ""); r.appendChild(d); return d; };
      td(String(n + 1), "color:var(--mute)");
      const cell = td("", "word-break:break-all");
      if (x.name) { const nm = el("div", null, x.name); nm.style.cssText = "font-weight:600;text-align:right"; cell.appendChild(nm); }
      const main = el("div", null, x.email); main.style.cssText = "direction:ltr;text-align:right"; cell.appendChild(main);
      if ((x.ts || 0) > Math.max(lastExp, 1)) { const nb = el("span", null, " חדש"); nb.style.cssText = "color:var(--acc);font-size:.75rem;font-weight:700"; main.appendChild(nb); }
      const det = [x.phone, x.city, x.note].filter(Boolean).join(" · "); if (det) { const dd = el("div", null, det); dd.style.cssText = "color:var(--mute);font-size:.82rem;text-align:right"; cell.appendChild(dd); }
      td(LN[x.lang] || "עברית", "white-space:nowrap"); td(fmt(x.ts), "white-space:nowrap;color:var(--mute)");
      const dc = td("", "white-space:nowrap"), ed = el("button", "del", "✎"); ed.title = "עריכת פרטים"; ed.style.color = "var(--acc)"; ed.onclick = () => { editing = editing === x.email ? null : x.email; draw(); };
      const d = el("button", "del", "\u2715"); d.title = "הסרה";
      d.onclick = async () => { if (!confirm("להסיר את " + x.email + "?")) return; try { await deleteDoc(doc(db, "subscribers", x.email)); list = list.filter(y => y.email !== x.email); draw(); } catch (err) { alert("המחיקה נכשלה"); } };
      dc.append(ed, d); tb.appendChild(r);
      if (editing === x.email) { const er = el("tr"), ec = el("td"); ec.colSpan = 5; ec.style.cssText = "padding:4px;border-bottom:1px solid var(--line);background:var(--card)"; ec.appendChild(editor(x, it => { const k = list.findIndex(y => y.email === it.email); if (k >= 0) list[k] = it; editing = null; draw(); })); er.appendChild(ec); tb.appendChild(er); }
    });
    box.appendChild(tb);
    if (!arr.length) box.appendChild(el("div", "hint", "אין תוצאות."));
    if (arr.length > shown) { const more = el("button", "btn sm ghost", "הצג עוד " + Math.min(50, arr.length - shown) + " (נותרו " + (arr.length - shown) + ")"); more.onclick = () => { shown += 50; draw(); }; box.appendChild(more); }
  };
  drawRef = draw; q.oninput = () => { shown = 50; draw(); }; so.onchange = () => { shown = 50; draw(); }; draw();

  // בקשות הרשמה שעדיין לא אושרו במייל
  let pend = []; try { pend = (await getDocs(collection(db, "pendingSubs"))).docs.map(d => d.data()).sort((a, b) => (b.ts || 0) - (a.ts || 0)); } catch (e) {}
  const pd = el("details"); pd.style.marginTop = "14px"; pd.appendChild(el("summary", null, "\u23f3 ממתינים לאישור במייל (" + pend.length + ")"));
  if (!pend.length) pd.appendChild(el("div", "hint", "אין כרגע בקשות שממתינות לאישור."));
  pend.forEach(x => {
    const r = el("div", "arow"); r.appendChild(el("span", null, x.email + " · " + fmt(x.ts) + (Date.now() - (x.ts || 0) > 7 * 864e5 ? " · פג תוקף" : "")));
    const d = el("button", "del", "\u2715"); d.title = "מחיקת הבקשה"; d.onclick = async () => { try { await deleteDoc(doc(db, "pendingSubs", x.email)); r.remove(); } catch (e) { alert("המחיקה נכשלה"); } };
    r.appendChild(d); pd.appendChild(r);
  });
  c.appendChild(pd); c.appendChild(tools);
}

// ===== צופה גיליון במסך מלא (זום בצביטה, החלקה בין עמודים, הורדה) =====
let VW = null;
function openViewer(pages, start, title, dlUrl, onDl) {
  if (VW || !pages.length) return;
  if (!document.getElementById("vwcss")) {
    const st = document.createElement("style"); st.id = "vwcss";
    st.textContent = ".vw{position:fixed;inset:0;z-index:1000;background:#0d0a07;display:flex;flex-direction:column;direction:ltr;font-family:var(--ui)}"
      + ".vwbar{display:flex;align-items:center;gap:6px;padding:calc(8px + env(safe-area-inset-top)) 10px 8px;background:#1b1510;color:#f1e8d8;flex:none}"
      + ".vwbar button,.vwbar a{background:#2e251b;color:#f1e8d8;border:0;border-radius:10px;min-width:40px;height:40px;font-size:1.25rem;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;padding:0 10px}"
      + ".vwbar button:disabled{opacity:.35}.vwbar .vwdl{background:#d9a35a;color:#1a1209;font-weight:700;font-size:.95rem}"
      + ".vwttl{flex:1;min-width:0;text-align:center;font-size:.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"
      + ".vwst{flex:1;overflow:auto;display:flex;touch-action:pan-x pan-y;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}"
      + ".vwst img{margin:auto;flex:none;max-width:none;display:block;background:#fff;user-select:none;-webkit-user-drag:none}"
      + ".vwld{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#a89a84;pointer-events:none}";
    document.head.appendChild(st);
  }
  let i = Math.min(Math.max(start || 0, 0), pages.length - 1), z = 1, closed = false;
  const ov = el("div", "vw"); ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
  const bar = el("div", "vwbar"), mk = (txt, lab, fn) => { const b = el("button", null, txt); b.type = "button"; b.setAttribute("aria-label", lab); b.onclick = fn; return b; };
  const bClose = mk("✕", "Close", () => close()), bPrev = mk("‹", "Previous", () => go(-1)), bNext = mk("›", "Next", () => go(1));
  const bOut = mk("−", "Zoom out", () => zoomTo(z / 1.4)), bIn = mk("+", "Zoom in", () => zoomTo(z * 1.4));
  const ttl = el("div", "vwttl", (title || "") + (pages.length > 1 ? "  ·  1/" + pages.length : ""));
  const dl = el("a", "vwdl", "⬇ " + t("download")); dl.href = dlUrl || pages[0].url; dl.setAttribute("download", ""); dl.onclick = () => { if (onDl) onDl(); };
  bar.append(bClose, bOut, bIn, ttl, ...(pages.length > 1 ? [bPrev, bNext] : []), dl);
  const stage = el("div", "vwst"), img = el("img"), ld = el("div", "vwld", "…");
  stage.appendChild(img); ov.append(bar, stage, ld);

  const baseW = () => { const ar = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 0.7; return Math.min(stage.clientWidth, stage.clientHeight * ar) || stage.clientWidth; };
  const apply = () => { img.style.width = Math.round(baseW() * z) + "px"; };
  function zoomTo(nz, cx, cy) {
    nz = Math.min(6, Math.max(1, nz)); if (nz === z) return;
    const r = stage.getBoundingClientRect(); cx = cx == null ? r.width / 2 : cx - r.left; cy = cy == null ? r.height / 2 : cy - r.top;
    const fx = (stage.scrollLeft + cx) / stage.scrollWidth, fy = (stage.scrollTop + cy) / stage.scrollHeight;
    z = nz; apply();
    stage.scrollLeft = fx * stage.scrollWidth - cx; stage.scrollTop = fy * stage.scrollHeight - cy;
  }
  function show() {
    z = 1; ld.hidden = false; img.style.opacity = ".35";
    img.onload = () => { ld.hidden = true; img.style.opacity = "1"; apply(); stage.scrollLeft = 0; stage.scrollTop = 0; };
    img.alt = (title || "") + " " + (i + 1); img.src = pages[i].url; if (img.complete && img.naturalWidth) img.onload();
    bPrev.disabled = i === 0; bNext.disabled = i === pages.length - 1;
    if (pages.length > 1) { ttl.textContent = (title || "") + "  ·  " + (i + 1) + "/" + pages.length; const nx = pages[i + 1]; if (nx) new Image().src = nx.url; }
  }
  function go(d) { const n = i + d; if (n < 0 || n >= pages.length) return; i = n; show(); }

  // צביטה בשתי אצבעות, הקשה כפולה, החלקה להחלפת עמוד
  let pd = 0, pz = 1, lastTap = 0, sx = 0, sy = 0, multi = false;
  const dist = e => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  stage.addEventListener("touchstart", e => { if (e.touches.length === 2) { pd = dist(e); pz = z; multi = true; } else if (e.touches.length === 1) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; multi = false; } }, { passive: true });
  stage.addEventListener("touchmove", e => { if (e.touches.length === 2 && pd) { e.preventDefault(); zoomTo(pz * dist(e) / pd, (e.touches[0].clientX + e.touches[1].clientX) / 2, (e.touches[0].clientY + e.touches[1].clientY) / 2); } }, { passive: false });
  stage.addEventListener("touchend", e => {
    if (e.touches.length) return; pd = 0;
    if (multi) { multi = false; return; }
    const c = e.changedTouches[0], dx = c.clientX - sx, dy = c.clientY - sy;
    if (z === 1 && Math.abs(dx) > 60 && Math.abs(dy) < 50) { go(dx < 0 ? 1 : -1); return; }
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) { const now = Date.now(); if (now - lastTap < 300) { if (e.cancelable) e.preventDefault(); zoomTo(z > 1 ? 1 : 2.5, c.clientX, c.clientY); lastTap = 0; } else lastTap = now; }
  });
  img.addEventListener("dblclick", e => zoomTo(z > 1 ? 1 : 2.5, e.clientX, e.clientY));
  stage.addEventListener("wheel", e => { if (e.ctrlKey) { e.preventDefault(); zoomTo(z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY); } }, { passive: false });
  const onKey = e => { if (e.key === "Escape") close(); else if (e.key === "ArrowLeft") go(1); else if (e.key === "ArrowRight") go(-1); else if (e.key === "+" || e.key === "=") zoomTo(z * 1.4); else if (e.key === "-") zoomTo(z / 1.4); };
  const onResize = () => apply();
  const onPop = () => cleanup();
  function cleanup() {
    if (closed) return; closed = true;
    document.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); window.removeEventListener("popstate", onPop);
    ov.remove(); document.body.style.overflow = prevOv; VW = null;
  }
  function close() { if (history.state && history.state.vw) history.back(); else cleanup(); }

  const prevOv = document.body.style.overflow; document.body.style.overflow = "hidden";
  try { history.pushState({ vw: 1 }, ""); } catch {}
  document.addEventListener("keydown", onKey); window.addEventListener("resize", onResize); window.addEventListener("popstate", onPop);
  document.body.appendChild(ov); VW = ov; show(); bClose.focus();
}

// אקורדיון: פתיחת פריט אחד סוגרת את שאר הפריטים באותה קבוצה (data-g)
document.addEventListener("toggle", e => {
  const d = e.target; if (!(d instanceof HTMLDetailsElement) || !d.open || !d.dataset.g) return;
  document.querySelectorAll('details[data-g="' + d.dataset.g + '"][open]').forEach(x => { if (x !== d) x.open = false; });
}, true);
const accD = (cls, g, open) => { const d = el("details", cls); d.dataset.g = g; if (open) d.open = true; return d; };
const sumWrap = nodes => { const sm = el("summary"), w = el("div", "sh"); nodes.forEach(x => w.appendChild(x)); sm.appendChild(w); return sm; };

// סרגל סינון וחיפוש: נאסף לתוך aside אחד, ועם הרשימה לתוך עטיפה אחת – כדי שאפשר יהיה להציב אותו בצד במסך רחב
(function () { if ($("issuesWrap") || !$("modes") || !$("list")) return; const a = el("aside"); a.id = "filters"; const w = el("div"); w.id = "issuesWrap"; const par = $("list").parentNode; par.insertBefore(w, $("modes")); ["q", "modes", "years", "pars"].forEach(id => a.appendChild($(id))); w.append(a, $("list")); })();
const narrow = () => !window.matchMedia("(min-width:900px)").matches;

// תתי-לשוניות: נפתחות בריחוף (או ב-↓ במקלדת) מתחת ללשונית הראשית. הלוח צף (position:fixed) כי סרגל הלשוניות גולל אופקית וחותך תוכן שיוצא ממנו.
const canHover = () => window.matchMedia("(hover:hover)").matches;
function subItems(v) {
  const go = (m) => () => { view = "issues"; mode = m; filter = ""; $("q").value = ""; render(); };
  if (v === "issues") return [[t("byYear"), go("year"), view === "issues" && mode === "year" && !filter], [t("byParasha"), go("par"), view === "issues" && mode === "par" && !filter]];
  if (v === "about") {
    const txt = (ABOUT && ABOUT.he) || ""; if (!/^#\s/m.test(txt)) return [];
    const heads = txt.split(/\n(?=#\s)/).map(x => x.trim()).filter(Boolean).map(x => x.match(/^#\s+([^\n]*)/)).filter(Boolean).map(m => m[1]);
    return heads.length > 1 ? heads.map((h, k) => [h, () => { aboutOpen = k; view = "about"; render(); }, false]) : [];
  }
  return [];
}
function halDateHe(iso) { try { return iso ? heLetters(iso) : ""; } catch { return iso || ""; } } // 1.36.2: הייתה בשימוש בלי הגדרה
function hideSub() { clearTimeout(subTimer); if (subEl) subEl.hidden = true; }
function holdSub() { clearTimeout(subTimer); }
function leaveSub() { clearTimeout(subTimer); subTimer = setTimeout(hideSub, 220); }
function showSub(btn, v) {
  const items = subItems(v); if (!items.length) { hideSub(); return; }
  if (!subEl) { subEl = el("div", "subnav"); subEl.setAttribute("role", "menu"); subEl.onmouseenter = holdSub; subEl.onmouseleave = leaveSub; subEl.addEventListener("keydown", e => { if (e.key === "Escape") { hideSub(); const b = document.querySelector("#nav .chip.on"); if (b) b.focus(); } }); document.body.appendChild(subEl); window.addEventListener("scroll", hideSub, { passive: true }); window.addEventListener("resize", hideSub); }
  clearTimeout(subTimer); subEl.innerHTML = "";
  items.forEach(([label, fn, on]) => { const b = el("button", on ? "on" : "", label); b.setAttribute("role", "menuitem"); b.onclick = () => { hideSub(); fn(); }; subEl.appendChild(b); });
  subEl.hidden = false;
  const r = btn.getBoundingClientRect(), w = subEl.offsetWidth, rtl = getComputedStyle(document.documentElement).direction === "rtl";
  let x = rtl ? r.right - w : r.left; x = Math.max(8, Math.min(x, window.innerWidth - w - 8));
  subEl.style.top = r.bottom + "px"; subEl.style.left = x + "px";
}

function render() {
  $("status").textContent = "";
  if (focusId && issues.length) { const f0 = issues.find(x => x.id === focusId); if (f0) { view = "issues"; mode = "year"; selYear = yearOf(f0); filter = ""; $("q").value = ""; pendingScroll = focusId; } focusId = null; }
  if (!TXT && !txtLoading) loadTexts(); if (!SITE_CFG && !siteLoading) loadSite();
  applyBottom(); hideSub(); const N = $("nav"); N.innerHTML = "";
  (() => { if (!LAYOUT && !layoutLoading) loadLayout(); const l = layoutList(NAV_IDS.map(x => [x[0], x[1]]), LY().nav).filter(x => editMode || !x.hide); const ok = l.length ? l : layoutList(NAV_IDS, null); if (!ok.some(x => x.id === view)) view = ok[0].id; return ok.map(x => [x.id, x.label, x.hide]); })().forEach(([v, k, hd]) => {
    const b = el("button", "chip" + (view === v ? " on" : ""), t(k)); b.onclick = () => { view = v; render(); }; if (editMode) { b.classList.add("edit-blk"); b.dataset.edG = "nav"; b.dataset.edId = v; if (hd) b.classList.add("ed-off"); b.appendChild(edBar("nav", v, hd, true)); } N.appendChild(b);
    if (subItems(v).length) b.dataset.sub = "1";
    b.addEventListener("mouseenter", () => { if (!canHover()) return; holdSub(); showSub(b, v); if (v === "about" && !ABOUT) loadAbout().then(() => { if (b.isConnected && b.matches(":hover")) { showSub(b, v); if (subItems(v).length) b.dataset.sub = "1"; } }); });
    b.addEventListener("mouseleave", () => { if (canHover()) leaveSub(); });
    b.addEventListener("keydown", e => { if (e.key === "ArrowDown" && subItems(v).length) { e.preventDefault(); showSub(b, v); const f = subEl.querySelector("button"); if (f) f.focus(); } });
  });
  const isS = view === "sages", isA = view === "about", isH = view === "halacha", other = isS || isA || isH;
  if ($("issuesWrap")) $("issuesWrap").classList.toggle("side", view === "issues");
  $("sagesView").hidden = !isS; $("aboutView").hidden = !isA; $("halView").hidden = !isH; if ($("subscribe")) $("subscribe").hidden = isH || isS || (!!$("subscribe").dataset.lhide && !editMode); $("list").hidden = other; $("q").hidden = other || view === "weekly";
  if (other) { $("modes").hidden = true; $("years").hidden = true; $("pars").innerHTML = ""; $("yz").innerHTML = ""; if (isS) renderSages(); else if (isA) renderAbout(); else renderHalacha(); return; }
  $("yz").innerHTML = "";
  const years = [...new Set(issues.map(yearOf))];
  if (!years.includes(selYear)) selYear = years[0] || null;
  const M = $("modes"); M.innerHTML = ""; M.hidden = !issues.length;
  [["year", "byYear"], ["par", "byParasha"]].forEach(([m, k]) => { const b = el("button", "chip" + (mode === m && !filter ? " on" : ""), t(k)); b.onclick = () => { mode = m; filter = ""; $("q").value = ""; render(); }; M.appendChild(b); });
  const P = $("pars"); P.innerHTML = "";
  if (mode === "par" && !filter && issues.length) {
    const cnt = {}; issues.forEach(i => partsOf(i.parasha).forEach(x => cnt[x] = (cnt[x] || 0) + 1));
    if (selPar) { const sc = el("button", "chip on", t("parasha") + trName(selPar) + " ✕"); sc.style.marginBottom = "6px"; sc.onclick = () => { selPar = null; parQ = ""; render(); }; P.appendChild(sc); }
    const inp = el("input"); inp.type = "text"; inp.className = "ui"; inp.placeholder = t("parSearch"); inp.value = parQ; inp.autocomplete = "off";
    const res = el("div", "pres");
    const drawRes = () => {
      res.innerHTML = ""; res.hidden = false; const q = parQ.trim().replace(/^פרשת\s+/, "").toLowerCase();
      BOOKS.forEach((g, gi) => {
        const m = g.filter(x => !q || x.he.includes(q) || x.en.toLowerCase().includes(q)); if (!m.length) return;
        const names = new Set(g.map(x => x.he)), n = issues.filter(i => partsOf(i.parasha).some(x => names.has(x))).length;
        const d = accD("bk", "bk", !!q || parBook === gi);
        d.appendChild(el("summary", null, t("books")[gi] + (n ? " (" + n + ")" : "")));
        d.ontoggle = () => { if (d.open) parBook = gi; else if (parBook === gi) parBook = null; };
        const w = el("div", "pchips");
        m.forEach(x => { const b = el("button", "chip" + (selPar === x.he ? " on" : "") + (cnt[x.he] ? "" : " dim"), trName(x.he) + (cnt[x.he] ? " (" + cnt[x.he] + ")" : "")); b.onclick = () => { selPar = x.he; parQ = ""; parBook = narrow() ? null : gi; render(); }; w.appendChild(b); });
        d.appendChild(w); res.appendChild(d);
      });
      if (!res.children.length) res.appendChild(el("div", "msg", t("none")));
    };
    inp.oninput = () => { parQ = inp.value; drawRes(); };
    drawRes(); P.append(inp, res);
  }
  const Y = $("years"); Y.innerHTML = ""; Y.hidden = !years.length || mode !== "year";
  years.forEach(y => { const smp = issues.find(i => yearOf(i) === y); const b = el("button", "chip" + (y === selYear && !filter ? " on" : ""), t("year").replace("{y}", yLabel(hyIn(smp.date, "en")) || y)); b.onclick = () => { selYear = y; filter = ""; $("q").value = ""; render(); }; Y.appendChild(b); });
  const isW = view === "weekly"; if (isW) { M.hidden = true; Y.hidden = true; P.innerHTML = ""; }
  const L = $("list"); L.innerHTML = "";
  if (!issues.length) { L.appendChild(el("div", "card empty", t("empty"))); return; }
  const latestId = issues[0].id, f = filter.trim();
  const shown = isW ? issues.slice(0, 1) : issues.filter(i => f ? (i.parasha + " " + trName(i.parasha) + " " + [i.num ? issueNo(i.num) + " " + i.num : "", gem(hNum(D(i.date))), gem(hNum(D(i.date))).replace(/[\u05F4\u05F3]/g, ""), i.desc, ...(i.sages || []).map(x => x.n + " " + x.c)].join(" ")).toLowerCase().includes(f.toLowerCase()) : mode === "par" ? (selPar && partsOf(i.parasha).includes(selPar)) : yearOf(i) === selYear);
  if (!shown.length) L.appendChild(el("div", "card empty", mode === "par" && !f && !selPar ? t("pickPar") : t("none")));
  shown.forEach(i => {
    const c = el("div", "card"); c.id = "c-" + i.id;
    if (i.id === latestId) { c.classList.add("latest"); const lt = el("span", "tag", t("latest")); lt.style.marginInlineEnd = "6px"; c.appendChild(lt); }
    if (i.num) c.appendChild(el("span", "tag", issueNo(i.num)));
    c.appendChild(el("h2", null, parashaTitle(i.parasha) + (!isW && (mode === "par" || f) ? " · " + t("year").replace("{y}", yLabel(hyIn(i.date, "en"))) : "")));
    c.appendChild(el("div", "meta", t("shabbat") + " " + heDate(i.date) + " · " + grDate(i.date) + (i.size ? " · " + mb(i.size) : "")));
    const head = [...c.children], gg = isW ? "w" : "i" + i.id;
    const arts = [[i.art1, "art1", "📖"], [i.art2, "art2", "🌟"]].filter(x => x[0]);
    if (arts.length) {
      const ab = el("div", "art");
      arts.forEach(([g, k, ic]) => { const p = el("div"); p.appendChild(el("b", null, ic + " " + t(k) + ": ")); p.appendChild(el("span", null, g.n)); const mt = sageMeta(g).join(" · "); if (mt) p.appendChild(el("span", "meta", " · " + mt)); ab.appendChild(p); });
      ab.dataset.part = "art"; c.appendChild(ab);
    }
    const ds = descOf(i);
    if (ds) {
      const d = accD("", gg);
      d.appendChild(el("summary", null, t("about")));
      const tx = el("div", "desc"); renderText(tx, ds); d.appendChild(tx); d.dataset.part = "desc"; c.appendChild(d);
    }
    if (i.sages && i.sages.length) {
      const d2 = accD("", gg);
      d2.appendChild(el("summary", null, t("sages") + " (" + i.sages.length + ")"));
      const w = el("div", "desc");
      i.sages.forEach(g => { const pp = el("p"); pp.appendChild(el("b", null, ((i.art1 && i.art1.id === g.id) || (i.art2 && i.art2.id === g.id) ? "⭐ " : "") + g.n)); { const mt = sageMeta(g).join(" · "); if (mt) pp.appendChild(el("div", "meta", mt)); } if (g.d) { const dd = linkInto(el("div"), g.d); dd.style.cssText = "font-size:.95rem;margin-top:2px"; pp.appendChild(dd); }
      { const ks = secKeys(i, g.id); if (ks.length) pp.appendChild(el("div", "used", t("inSection") + " " + ks.map(k => "«" + t(k) + "»").join(" & "))); } w.appendChild(pp); });
      d2.appendChild(w); d2.dataset.part = "sages"; c.appendChild(d2);
    }
    const pg = pagesOf(i);
    if (pg.length) {
      const d3 = accD("pv", gg);
      d3.appendChild(el("summary", null, t("preview") + (pg.length > 1 ? " (" + pg.length + ")" : "")));
      let built = false;
      d3.addEventListener("toggle", () => {
        if (!d3.open) return; countView(i); if (built) return; built = true;
        pg.forEach((x, k) => { const a1 = el("a"); a1.href = x.url; a1.target = "_blank"; a1.rel = "noopener"; a1.style.cursor = "zoom-in"; a1.onclick = ev => { if (ev.ctrlKey || ev.metaKey || ev.shiftKey) return; ev.preventDefault(); countView(i); openViewer(pg, k, parashaTitle(i.parasha), i.url, () => { if (!ADMIN_PAGE) updateDoc(doc(db, "issues", i.id), { downloads: increment(1) }).catch(() => {}); }); }; const im = el("img"); im.loading = "lazy"; im.alt = parashaTitle(i.parasha) + " " + (k + 1); im.src = x.url; a1.appendChild(im); d3.appendChild(a1); });
      });
      d3.dataset.part = "pv"; c.appendChild(d3);
    }
    const a = el("div", "actions");
    const dl = el("a", "btn", t("download")); dl.href = i.url; dl.setAttribute("download", "");
    dl.addEventListener("click", () => { if (!ADMIN_PAGE) updateDoc(doc(db, "issues", i.id), { downloads: increment(1) }).catch(() => {}); });
    a.appendChild(dl);
    const link = issueLink(i), sh = el("a", "btn sm ghost", t("shareWa"));
    sh.href = "https://wa.me/?text=" + encodeURIComponent(parashaTitle(i.parasha) + " – " + t("title") + "\n" + link); sh.target = "_blank"; sh.rel = "noopener";
    const cp = el("button", "btn sm ghost", t("copyLink")); cp.onclick = async () => { await copyText(link); cp.textContent = t("copied"); setTimeout(() => cp.textContent = t("copyLink"), 1800); };
    const pm = el("a", "btn sm ghost", t("perma")); pm.href = SITE_ORIGIN + "/i/" + i.id;   // קישור רגיל (גם לגוגל) לדף הגיליון
    if (typeof navigator.share === "function") {   // תפריט השיתוף של המכשיר (טלפון)
      const ns = el("button", "btn sm", t("shareNative"));
      ns.onclick = () => navigator.share({ title: parashaTitle(i.parasha) + " – " + t("title"), url: link }).catch(() => {});
      a.appendChild(ns);
    }
    a.append(sh, cp, pm);
    a.dataset.part = "act"; c.appendChild(a);
    applyParts(c, CARD_PARTS, LY().card, "card");
    if (isW) L.appendChild(c);
    else {
      const wrap = accD("card acc", "arch"); wrap.id = c.id; wrap.open = pendingScroll === i.id;
      const body = el("div", "accbody"); [...c.children].forEach(x => { if (!head.includes(x)) body.appendChild(x); });
      wrap.append(sumWrap(head), body); L.appendChild(wrap);
    }
  });
  if (pendingScroll) { const e = $("c-" + pendingScroll); if (e) { e.scrollIntoView({ block: "start" }); e.style.outline = "2px solid var(--acc)"; } pendingScroll = null; }
}

async function remove(i) {
  if (!confirm("למחוק את פרשת " + i.parasha + " לצמיתות?")) return;
  try { await deleteDoc(doc(db, "issues", i.id)); if (i.path) await deleteObject(ref(storage, i.path)).catch(() => {}); for (const x of (i.pages || [])) if (x.path) await deleteObject(ref(storage, x.path)).catch(() => {}); if (i.cover && i.cover.path) await deleteObject(ref(storage, i.cover.path)).catch(() => {}); }
  catch (e) { alert("המחיקה נכשלה: " + e.message); }
}

let SAGES = null;
async function loadSages() {
  if (SAGES) return SAGES;
  const m = await getDoc(doc(db, "meta", "sages"));
  if (!m.exists()) { SAGES = []; return SAGES; }
  const version = String(m.data().version); let raw = null;
  try { if (localStorage.getItem("sages_v") === version) raw = JSON.parse(localStorage.getItem("sages_d")); } catch {}
  if (!raw) {
    const snap = await getDocs(collection(db, "sagesData"));
    raw = []; snap.docs.map(d => d.data()).sort((x, y) => x.i - y.i).forEach(x => raw.push(...JSON.parse(x.json)));
    try { localStorage.setItem("sages_v", version); localStorage.setItem("sages_d", JSON.stringify(raw)); } catch {}
  }
  SAGES = raw.map(x => ({ id: x[0], n: x[1], c: x[2], city: x[3], d: x[4], y: x[5], t: x[6], day: x[7], m: x[8], p: x[9] || "", b: cleanBooks(x[10]) }));
  return SAGES;
}
const usedMap = skip => { const m = {}; issues.forEach(i => { if (skip && i.id === skip.id) return; (i.sages || []).forEach(g => (m[g.id] = m[g.id] || []).push(i)); }); return m; };
// ===== חיפוש גאונים: חכם, מדלג על ניקוד/גרשיים/תארים, כל המילים צריכות להופיע (בשם, עיר, מדינה, פרטים, תאריך או שנה) =====
const yFix = new Map(); // שנות פטירה שהושלמו מהרשימה המלאה לגאונים ששמורים בגיליון בלי שנה
const sageY = g => g.y || yFix.get(g.id) || "";
const sageMetaAdmin = g => [ctName(g.c), g.city, [g.t, sageY(g)].filter(Boolean).join(" ") ? t("died") + " " + [g.t, sageY(g)].filter(Boolean).join(" ") : ""].filter(Boolean);
// תצוגה לקוראים: רק מתי נפטר (בלי מדינה/עיר); המלל המלא מוצג מתחתיו
const sageMeta = g => { const d = [g.t, sageY(g)].filter(Boolean).join(" "); return d ? [t("died") + " " + d] : []; };
function markName(node, text, toks) {
  if (!toks || !toks.length) { node.textContent = text; return node; }
  const low = text.toLowerCase(); let buf = "";
  for (let i = 0; i < text.length;) {
    let hit = 0;
    if (i === 0 || /[\s("'\u05F4\u05BE-]/.test(text[i - 1])) for (const x of toks) if (low.startsWith(x, i) && x.length > hit) hit = x.length;
    if (hit) { if (buf) { node.appendChild(document.createTextNode(buf)); buf = ""; } node.appendChild(el("mark", null, text.slice(i, i + hit))); i += hit; }
    else buf += text[i++];
  }
  if (buf) node.appendChild(document.createTextNode(buf));
  return node;
}
let enrichTried = false;
async function enrichYears() {
  if (enrichTried || !issues.some(i => (i.sages || []).some(g => !g.y && !yFix.has(g.id)))) return;
  enrichTried = true;
  try { const all = await loadSages(); const m = new Map(all.map(g => [g.id, g])); let ch = false; issues.forEach(i => (i.sages || []).forEach(g => { const f = m.get(g.id); if (f && f.y && !g.y) { yFix.set(g.id, f.y); ch = true; } })); if (ch) { render(); if (ADMIN_PAGE && adminTab === "list") adminPanel(); } } catch {}
}

const secKeys = (i, id) => { const k = []; if (i.art1 && i.art1.id === id) k.push("art1"); if (i.art2 && i.art2.id === id) k.push("art2"); return k; };
const appearHe = (i, id) => { const k = secKeys(i, id); return i.parasha + " (" + i.date + ") – " + (k.length ? "במדור " + k.map(x => "«" + T.he[x] + "»").join(" ו") : "ברשימת הגאונים בגיליון"); };
const appearT = (i, id) => { const k = secKeys(i, id); return parashaTitle(i.parasha) + " (" + grDate(i.date) + ") – " + (k.length ? t("inSection") + " " + k.map(x => "«" + t(x) + "»").join(" & ") : t("inList")); };
function sageRow(g, used, label, onClick, toks) {
  const r = el("div", "srow"), x = el("div", "st");
  { const av = sagePhoto(g, "sav"); if (av) x.appendChild(av); }
  x.appendChild(markName(el("b"), g.n, toks)); x.appendChild(el("span", "meta", " · " + sageMetaAdmin(g).join(" · ")));
  if (!sageY(g)) x.appendChild(el("div", "warn", "⚠ חסרה שנת פטירה בקובץ"));
  x.appendChild(el("div", "hint", g.d.length > 120 ? g.d.slice(0, 120) + "…" : g.d));
  if (used && used.length) x.appendChild(el("div", "used", "✓ הופיע: " + used.map(i => appearHe(i, g.id)).join("; ")));
  r.appendChild(x);
  if (onClick) { const b = el("button", "btn sm", label); b.onclick = onClick; r.appendChild(b); }
  return r;
}

const CT = {}; "מרוקו|Morocco|Maroc|Marruecos;תוניסיה|Tunisia|Tunisie|Túnez;תימן|Yemen|Yémen|Yemen;ארץ ישראל|Land of Israel|Terre d’Israël|Tierra de Israel;יון|Greece|Grèce|Grecia;טורקיה|Turkey|Turquie|Turquía;סוריה|Syria|Syrie|Siria;עיראק|Iraq|Irak|Irak;איטליה|Italy|Italie|Italia;לוב|Libya|Libye|Libia;אלג'יריה|Algeria|Algérie|Argelia;איראן|Iran|Iran|Irán;מצרים|Egypt|Égypte|Egipto;אוזבקיסטן|Uzbekistan|Ouzbékistan|Uzbekistán;גאורגיה|Georgia|Géorgie|Georgia;ספרד|Spain|Espagne|España;ישראל|Israel|Israël|Israel;אפגניסטאן|Afghanistan|Afghanistan|Afganistán;בולגריה|Bulgaria|Bulgarie|Bulgaria;בוסניה|Bosnia|Bosnie|Bosnia;צרפת|France|France|Francia;ארה\"ב|USA|États-Unis|EE. UU.;לבנון|Lebanon|Liban|Líbano;הולנד|Netherlands|Pays-Bas|Países Bajos;כורדיסטאן|Kurdistan|Kurdistan|Kurdistán;פורטוגל|Portugal|Portugal|Portugal;אנגליה|England|Angleterre|Inglaterra".split(";").forEach(x => { const [he, en, fr, es] = x.split("|"); CT[he] = { en, fr, es }; });
const ctName = c => lang === "he" ? c : ((CT[c] && CT[c][lang]) || c);
let MAINC = null;
const mainCountries = all => { if (!MAINC) { const cc = {}; all.forEach(g => cc[g.c] = (cc[g.c] || 0) + 1); MAINC = Object.entries(cc).filter(([, n]) => n >= 5).sort((a, b) => b[1] - a[1]); } return MAINC; };
const countryOk = (g, v) => !v || (v === "__other" ? !MAINC.some(([k]) => k === g.c) : g.c === v);

const sv = { q: "", country: "", month: "", limit: 50 };
async function renderSages() {
  const V = $("sagesView"); V.innerHTML = "";
  const msg = el("p", "msg", t("loading")); V.appendChild(msg);
  let all; try { all = await loadSages(); } catch { msg.textContent = t("err"); return; }
  if (view !== "sages") return;
  renderYz();
  V.innerHTML = "";
  if (!all.length) { V.appendChild(el("div", "card empty", t("noSages"))); return; }
  const used = usedMap(null), main = mainCountries(all);
  const mk = (opts, cur, fn) => { const sl = el("select"); opts.forEach(([v, l]) => { const o = el("option", null, l); o.value = v; sl.appendChild(o); }); sl.value = cur; sl.onchange = () => { fn(sl.value); sv.limit = 50; draw(); }; return sl; };
  const q = el("input"); q.type = "text"; q.placeholder = t("sName"); q.value = sv.q; q.oninput = () => { sv.q = q.value; sv.limit = 50; draw(); };
  const cnt = el("div", "msg"), list = el("div"), more = el("button", "btn ghost", t("more")); more.onclick = () => { sv.limit += 50; draw(); };
  V.append(q,
    mk([["", t("allCountries")], ...main.slice().sort((x, y) => ctName(x[0]).localeCompare(ctName(y[0]), lang)).map(([k, n]) => [k, ctName(k) + " (" + n + ")"]), ["__other", t("otherC")]], sv.country, v => sv.country = v),
    mk([["", t("allMonths")], ...MONTHS.map(m => [m, m])], sv.month, v => sv.month = v), cnt, list, more);
  function draw() {
    const base = all.filter(g => countryOk(g, sv.country) && (!sv.month || g.m === sv.month)).sort((a, b) => sortKey(a.n).localeCompare(sortKey(b.n), "he"));
    const sr = sageSearch(base, sv.q), arr = sr.list;
    cnt.textContent = t("results").replace("{n}", arr.length); list.innerHTML = "";
    arr.slice(0, sv.limit).forEach(g => {
      const c = accD("card acc", "sg"), h = markName(el("b"), g.n, sr.toks), mt = sageMeta(g).join(" · "), sh = [h]; if (mt) sh.push(el("span", "meta", " · " + mt));
      { const av = sagePhoto(g, "sav"); if (av) sh.unshift(av); }
      c.appendChild(sumWrap(sh));
      const bd = el("div", "accbody"); { const big = sagePhotoBig(g); if (big) bd.appendChild(big); } if (g.d) { const p = el("div", null, g.d); p.style.cssText = "font-size:.95rem;margin-top:6px"; bd.appendChild(p); }
      { const bk = sageBooks(g); if (bk) bd.appendChild(bk); }
      if (used[g.id]) bd.appendChild(el("div", "used", "✓ " + t("appearedIn") + ": " + used[g.id].map(i => appearT(i, g.id)).join(" · ")));
      c.appendChild(bd);
      list.appendChild(c);
    });
    more.hidden = arr.length <= sv.limit;
  }
  draw();
}

async function sha8(x) { const b = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(x)); return [...new Uint8Array(b)].map(v => v.toString(16).padStart(2, "0")).join("").slice(0, 8); }
function importView(c) {
  c.appendChild(el("h3", null, "ייבוא רשימת הגאונים מאקסל"));
  c.appendChild(el("div", "hint", "עמודות נדרשות (בשורה הראשונה): שם, מדינה, עיר, פרטים, שנת פטירה, תאריך – למשל «י״ג חשון». הייבוא מחליף את כל הרשימה הקיימת; סימונים שכבר נעשו בגיליונות נשארים, וכך גם תמונות החכמים שהועלו."));
  const fi = el("input"); fi.type = "file"; fi.accept = ".xlsx,.xls,.csv";
  const b = el("button", "btn", "קריאה ופרסום"), m = el("div", "msg");
  c.append(fi, b, m);
  b.onclick = async () => {
    const f = fi.files[0]; if (!f) { m.textContent = "בחר קובץ."; return; }
    b.disabled = true;
    try {
      m.textContent = "קורא את הקובץ…";
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
      const wb = XLSX.read(await f.arrayBuffer()), rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      const need = ["שם", "מדינה", "עיר", "פרטים", "שנת פטירה", "תאריך"];
      if (!rows.length || need.some(k => !(k in rows[0]))) throw new Error("חסרות עמודות. נדרש: " + need.join(", "));
      const seen = new Set(), out = [];
      for (const r of rows) {
        const [n, ci, cy, d, y, t] = need.map(k => String(r[k]).trim());
        if (!n) continue;
        const [tok, ...rest] = t.split(/\s+/);
        let id = await sha8(n + "|" + t); while (seen.has(id)) id = await sha8(id + n);
        seen.add(id); out.push([id, n, ci, cy, d, y, t, gday(tok), rest.join(" ")]);
      }
      let kept = 0; try { kept = carryPhotos(out, (await readChunks()).flatMap(ch => ch.rows)); } catch {}
      const size = 300, chunks = Math.ceil(out.length / size), nm = i => "c" + String(i).padStart(3, "0");
      const old = await getDoc(doc(db, "meta", "sages")), oldN = old.exists() ? old.data().chunks : 0;
      for (let i = 0; i < chunks; i++) { m.textContent = "מעלה " + (i + 1) + " מתוך " + chunks + "…"; await setDoc(doc(db, "sagesData", nm(i)), { i, json: JSON.stringify(out.slice(i * size, (i + 1) * size)) }); }
      for (let i = chunks; i < oldN; i++) await deleteDoc(doc(db, "sagesData", nm(i)));
      await setDoc(doc(db, "meta", "sages"), { version: Date.now(), count: out.length, chunks });
      SAGES = null; MAINC = null; try { localStorage.removeItem("sages_v"); } catch {}
      m.textContent = "✓ נטענו " + out.length + " גאונים." + (kept ? " (נשמרו " + kept + " תמונות)" : "");
    } catch (e) { m.textContent = "שגיאה: " + e.message; }
    b.disabled = false;
  };
}

let trk = { status: "none", country: "", month: "", q: "", limit: 40, noYear: false };
async function trackView(c) {
  c.appendChild(el("h3", null, "מעקב גאונים"));
  const info = el("div", "msg", "טוען רשימה…"); c.appendChild(info);
  let all; try { all = await loadSages(); } catch { info.textContent = "לא ניתן לטעון את רשימת הגאונים"; return; }
  if (!all.length) { info.textContent = "הרשימה ריקה. ייבא קובץ אקסל בלשונית «ייבוא מאקסל»."; return; }
  const used = usedMap(null), done = all.filter(g => used[g.id]).length, noY = all.filter(g => !g.y).length;
  info.textContent = "הופיעו " + done + " מתוך " + all.length + " (" + (done / all.length * 100).toFixed(1) + "%)" + (noY ? " · " + noY + " ללא שנת פטירה" : "");
  const bar = el("div", "bar"), fill = el("i"); fill.style.width = (done / all.length * 100) + "%"; bar.appendChild(fill); c.appendChild(bar);
  const mk = (opts, cur, fn) => { const sl = el("select"); opts.forEach(([v, l]) => { const o = el("option", null, l); o.value = v; sl.appendChild(o); }); sl.value = cur; sl.onchange = () => { fn(sl.value); trk.limit = 40; draw(); }; return sl; };
  const countries = [["", "כל המדינות"], ...mainCountries(all).slice().sort((x, y) => x[0].localeCompare(y[0], "he")).map(([k, v]) => [k, k + " (" + v + ")"]), ["__other", "אחר / לא מסווג"]];
  // שורת חיפוש אחת, בולטת
  const q = el("input"); q.type = "search"; q.placeholder = "חיפוש: שם, עיר, מדינה, שנה או פרטים…"; q.value = trk.q; q.style.margin = "10px 0 4px";
  let tm; q.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { trk.q = q.value; trk.limit = 40; draw(); }, 150); };
  // סטטוס כצ'יפים
  const chipsRow = el("div", "chips"); chipsRow.style.padding = "4px 0";
  const drawChips = () => {
    chipsRow.innerHTML = "";
    [["none", "טרם הופיעו"], ["yes", "הופיעו"], ["all", "הכול"]].forEach(([v, l]) => { const b = el("button", "chip" + (trk.status === v ? " on" : ""), l); b.onclick = () => { trk.status = v; trk.limit = 40; drawChips(); draw(); }; chipsRow.appendChild(b); });
    const ny = el("button", "chip" + (trk.noYear ? " on" : ""), "ללא שנת פטירה"); ny.onclick = () => { trk.noYear = !trk.noYear; trk.limit = 40; drawChips(); draw(); }; chipsRow.appendChild(ny);
  };
  drawChips();
  const filters = el("div"); filters.append(mk(countries, trk.country, v => trk.country = v), mk([["", "כל חודשי ההילולא"], ...MONTHS.map(m => [m, m])], trk.month, v => trk.month = v));
  filters.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
  c.append(q, chipsRow, filters);
  const cnt = el("div", "msg"), widen = el("div"), list = el("div"), more = el("button", "btn sm ghost", "הצג עוד"); more.onclick = () => { trk.limit += 40; draw(); };
  const ex = el("button", "btn sm ghost", "⬇ ייצוא לאקסל (CSV)"); ex.style.margin = "8px 0";
  ex.onclick = () => {
    const q2 = v => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const lines = [["שם", "מדינה", "עיר", "פרטים", "שנת פטירה", "תאריך", "הופיע", "גיליונות"].map(q2).join(",")].concat(all.map(g => [g.n, g.c, g.city, g.d, g.y, g.t, used[g.id] ? "כן" : "לא", (used[g.id] || []).map(i => appearHe(i, g.id)).join("; ")].map(q2).join(",")));
    const lk = document.createElement("a"); lk.href = URL.createObjectURL(new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" })); lk.download = "מעקב-גאונים.csv"; lk.click();
  };
  c.append(ex, cnt, widen, list, more);
  function draw() {
    const passes = g => (trk.status === "all" || (trk.status === "yes") === !!used[g.id]) && countryOk(g, trk.country) && (!trk.month || g.m === trk.month) && (!trk.noYear || !g.y);
    const byDate = (a, b) => MONTHS.indexOf(a.m) - MONTHS.indexOf(b.m) || a.day - b.day;
    const sr = sageSearch(all.filter(passes).sort(byDate), trk.q), arr = sr.list;
    cnt.textContent = arr.length + " תוצאות" + (sr.loose ? " (התאמה חלקית)" : ""); list.innerHTML = ""; widen.innerHTML = "";
    if (!arr.length && sageQuery(trk.q).length) {
      const wide = sageSearch(all, trk.q).list;
      if (wide.length) { const wb = el("button", "btn sm", "נמצאו " + wide.length + " בכל הרשימה – הצג"); wb.onclick = () => { trk.status = "all"; trk.country = ""; trk.month = ""; trk.noYear = false; adminPanel(); }; widen.appendChild(el("div", "hint", "אין תוצאות בסינון הנוכחי.")); widen.appendChild(wb); }
    }
    arr.slice(0, trk.limit).forEach(g => list.appendChild(sageRow(g, used[g.id], "עריכה", () => { editSage = g; adminTab = "sagemgr"; adminPanel(); }, sr.toks)));
    more.hidden = arr.length <= trk.limit;
  }
  draw();
}

const hNum = dt => +new Intl.DateTimeFormat("en-u-ca-hebrew", { year: "numeric" }).formatToParts(dt).find(x => x.type === "year").value;
function issueForm(c) {
  const old = editing;
  if (lastPub && !old) {
    const bx = el("div", "card"); bx.style.marginTop = "0";
    bx.appendChild(el("b", null, "✓ הגיליון נשמר. הודעה מוכנה להפצה:"));
    const ta = el("textarea"); ta.value = distMsg(lastPub); ta.readOnly = true; bx.appendChild(ta);
    const b1 = el("button", "btn sm", "העתקה"); b1.onclick = async () => { await copyText(ta.value); b1.textContent = "הועתק ✓"; };
    const b2 = el("a", "btn sm ghost", "💬 שליחה בוואטסאפ"); b2.href = "https://wa.me/?text=" + encodeURIComponent(ta.value); b2.target = "_blank"; b2.rel = "noopener";
    const b3 = el("button", "btn sm ghost", "סגירה"); b3.onclick = () => { lastPub = null; adminPanel(); };
    const row = el("div", "actions"); row.append(b1, b2, pushBtn(lastPub.id), mailBtn(lastPub.id, false, true), mailBtn(lastPub.id), b3); bx.appendChild(row); c.appendChild(bx);
  }
  const pa = el("select"), po = el("input"); po.type = "text"; po.placeholder = "הקלד שם פרשה / שבת"; po.hidden = true;
  const o0 = el("option", null, "— בחר פרשה / שבת —"); o0.value = ""; pa.appendChild(o0);
  const bn = ["ספר בראשית", "ספר שמות", "ספר ויקרא", "ספר במדבר", "ספר דברים", "שבתות מיוחדות"];
  const addG = (lab, arr) => { const g = el("optgroup"); g.label = lab; arr.forEach(x => { const o = el("option", null, x.he); o.value = x.he; g.appendChild(o); }); pa.appendChild(g); };
  BOOKS.forEach((g, gi) => addG(bn[gi], g)); addG("פרשות מחוברות", COMBINED);
  const oo = el("option", null, "אחר (הקלדה חופשית)"); oo.value = "__other"; pa.appendChild(oo);
  const oldName = old ? old.parasha.replace(/^פרשת\s+/, "") : "";
  if (oldName) { if (TR[oldName]) pa.value = oldName; else { pa.value = "__other"; po.value = oldName; po.hidden = false; } }
  pa.onchange = () => { po.hidden = pa.value !== "__other"; };
  const da = el("input"); da.type = "hidden";
  const pad = n => String(n).padStart(2, "0"), iso = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const nextShabbat = () => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7); return iso(d); };
  const shiftWeek = n => { const d = new Date(da.value + "T12:00:00"); d.setDate(d.getDate() + 7 * n); return iso(d); };
  const dateTxt = el("div", "ui"); dateTxt.style.cssText = "font-weight:600;margin:6px 0";
  let onDate = () => {};
  const setD = v => { da.value = v; try { if (typeof yearSel !== "undefined") { const yy = hNum(D(v)); addYearOpt(yy); yearSel.value = yy; } } catch {} dateTxt.textContent = "\u05E9\u05D1\u05EA " + heDate(v) + " \u00B7 " + grDate(v); onDate(); };
  const nsBtn = el("button", "btn sm", "\u05D4\u05E9\u05D1\u05EA \u05D4\u05E7\u05E8\u05D5\u05D1\u05D4"), pvBtn = el("button", "btn sm ghost", "\u25B6 \u05E9\u05D1\u05EA \u05E7\u05D5\u05D3\u05DE\u05EA"), nxBtn = el("button", "btn sm ghost", "\u05E9\u05D1\u05EA \u05D4\u05D1\u05D0\u05D4 \u25C0");
  [nsBtn, pvBtn, nxBtn].forEach(b => { b.type = "button"; b.style.marginInlineEnd = "6px"; });
  nsBtn.onclick = () => setD(nextShabbat()); pvBtn.onclick = () => setD(shiftWeek(-1)); nxBtn.onclick = () => setD(shiftWeek(1));
  // בחירת שנה עברית: מזיזה את התאריך לאותו יום וחודש בשנה שנבחרה (ואז לשבת הקרובה לו)
  const yearSel = el("select"); yearSel.style.cssText = "margin:6px 0 6px 8px;font-weight:600";
  const addYearOpt = y => { if ([...yearSel.options].some(o => +o.value === y)) return; const o = el("option", null, gem(y) + " (" + y + ")"); o.value = y; let at = null; [...yearSel.options].forEach(x => { if (!at && +x.value < y) at = x; }); yearSel.insertBefore(o, at); };
  const y0 = hNum(D(nextShabbat())); for (let y = y0 + 1; y >= y0 - 12; y--) addYearOpt(y);
  const shabbatOnOrAfter = d => { const x = new Date(d); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() + (6 - x.getDay() + 7) % 7); return x; };
  const toYear = (v, y) => {
    const cur = D(v), h0 = hebOf(cur), est = new Date(cur); est.setDate(est.getDate() + Math.round((y - hNum(cur)) * 365.2468));
    let best = est;
    search: for (let k = 0; k <= 45; k++) for (const sg of (k ? [1, -1] : [1])) { const d = new Date(est); d.setDate(est.getDate() + sg * k); const h = hebOf(d); if (h.day === h0.day && h.month === h0.month && hNum(d) === y) { best = d; break search; } }
    let sh = shabbatOnOrAfter(best); if (hNum(sh) !== y) sh.setDate(sh.getDate() - 7);
    return iso(sh);
  };
  yearSel.onchange = () => { const y = +yearSel.value; setD(y === hNum(D(nextShabbat())) ? nextShabbat() : toYear(da.value, y)); };
  const dateRow = el("div"); dateRow.append(el("label", null, "שנה"), yearSel, dateTxt, nsBtn, pvBtn, nxBtn);
  setD(old ? old.date : nextShabbat());
  const nextNum = () => { const ns = issues.map(i => +i.num).filter(n => n > 0); return ns.length ? Math.max(...ns) + 1 : issues.length + 1; };
  const nu = el("input"); nu.type = "number"; nu.min = "1"; nu.step = "1"; nu.inputMode = "numeric"; nu.style.width = "140px";
  nu.value = old ? (old.num || "") : String(nextNum());
  const dsF = {}, dsN = { desc: "" };
  Object.keys(dsN).forEach(k => { const x = el("textarea"); x.value = old ? (old[k] || "") : ""; if (k === "desc") x.placeholder = "# מה בגיליון\nפסקה רגילה…\n\n# תוכן הגיליון\n- מאמר ראשי\n- הלכה ומנהג\n- סיפור"; else { x.style.minHeight = "110px"; x.placeholder = "(אופציונלי – אם ריק יוצג הטקסט בעברית)"; } dsF[k] = x; });
  const picked = new Map(((old && old.sages) || []).map(g => [g.id, g]));
  const used = usedMap(old);
  const chipsBox = el("div", "pchips"), sgq = el("input"), sugSel = el("select"), sugBtn = el("button", "btn sm ghost", "הצע לפי הילולא"), stat = el("div", "msg"), resBox = el("div"), txtBtn = el("button", "btn sm ghost", "זהה גאונים מהמלל");
  sgq.type = "text"; sgq.placeholder = "חיפוש גאון לפי שם, מדינה או פרטים…";
  [["0", "בשבוע שמסתיים בשבת זו"], ["1", "בשבוע שאחרי השבת הזו"]].forEach(([v, l]) => { const o = el("option", null, l); o.value = v; sugSel.appendChild(o); });
  sugBtn.style.margin = "6px 0"; txtBtn.style.margin = "6px 6px 6px 0"; txtBtn.type = sugBtn.type = "button";
  let cur = () => {};
  // הגאון של המאמר הראשי – נבחר מתוך הגאונים שבגיליון
  const art = { 1: (old && old.art1) || null, 2: (old && old.art2) || null };
  const ART_LABEL = { 1: "מאוצרותיהם של חכמי התורה", 2: "וכה עשו חכמינו" }, artBox = el("div");
  const drawArt = () => {
    artBox.innerHTML = "";
    [1, 2].forEach(k => {
      if (art[k] && !picked.has(art[k].id)) art[k] = null;   // גאון שהוסר מהגיליון
      const sl = el("select"); const o0 = el("option", null, "— ללא —"); o0.value = ""; sl.appendChild(o0);
      picked.forEach(g => { const o = el("option", null, g.n); o.value = g.id; sl.appendChild(o); });
      sl.value = art[k] ? art[k].id : "";
      sl.onchange = () => { art[k] = sl.value ? { ...picked.get(sl.value) } : null; };
      artBox.append(el("label", null, "⭐ " + ART_LABEL[k] + " – הגאון של השבוע"), sl);
    });
    if (!picked.size) artBox.appendChild(el("div", "hint", "הוסיפו קודם גאונים לגיליון, ואז בחרו מביניהם את הגאון של המאמר."));
  };
  const redraw = () => {
    chipsBox.innerHTML = ""; drawArt();
    picked.forEach(g => { const b = el("button", "chip on", g.n + " ✕"); b.onclick = () => { picked.delete(g.id); redraw(); }; chipsBox.appendChild(b); });
    cur();
  };
  const addSage = g => { picked.set(g.id, { id: g.id, n: g.n, c: g.c, city: g.city || "", d: g.d, y: g.y || "", t: g.t }); redraw(); };
  const showList = (arr, label, allBtn) => {
    stat.textContent = label; resBox.innerHTML = "";
    if (allBtn) { const todo = arr.filter(g => !used[g.id] && !picked.has(g.id)); if (todo.length) { const ab = el("button", "btn sm", "הוסף את כל " + todo.length + " שטרם הופיעו"); ab.onclick = () => { todo.forEach(g => picked.set(g.id, { id: g.id, n: g.n, c: g.c, city: g.city || "", d: g.d, y: g.y || "", t: g.t })); redraw(); }; resBox.appendChild(ab); } }
    arr.filter(g => !picked.has(g.id)).slice(0, 120).forEach(g => resBox.appendChild(sageRow(g, used[g.id], "הוסף", () => addSage(g))));
  };
  let tmr; sgq.oninput = () => { clearTimeout(tmr); tmr = setTimeout(async () => {
    const f = sgq.value.trim(); if (f.length < 2) { cur = () => {}; stat.textContent = ""; resBox.innerHTML = ""; return; }
    try { await loadSages(); } catch { stat.textContent = "לא ניתן לטעון את רשימת הגאונים"; return; }
    const arr = sageSearch(SAGES, f).list;
    cur = () => showList(arr.slice(0, 40), "נמצאו " + arr.length + (arr.length > 40 ? " (מוצגים 40 הראשונים – דייקו את החיפוש)" : ""), false); cur();
  }, 250); };
  const runSug = async quiet => {
    if (quiet && sgq.value.trim()) return;           // לא מחליפים חיפוש ידני שמוצג כרגע
    if (!da.value) { if (!quiet) stat.textContent = "בחר קודם את תאריך השבת."; return; }
    try { await loadSages(); } catch { if (!quiet) stat.textContent = "לא ניתן לטעון את רשימת הגאונים"; return; }
    if (quiet && sgq.value.trim()) return;
    const keys = weekKeys(da.value, +sugSel.value), arr = SAGES.filter(g => keys.has(g.day + "|" + g.m)).sort((a, b) => (!!used[a.id]) - (!!used[b.id]));
    cur = () => showList(arr, "הילולא בשבוע שנבחר: " + arr.length + " גאונים (" + arr.filter(g => !used[g.id]).length + " שטרם הופיעו)", true); cur();
  };
  sugBtn.onclick = () => runSug(false);
  sugSel.onchange = () => runSug(true);
  if (!old) { onDate = () => runSug(true); runSug(true); }   // בגיליון חדש: הצעה אוטומטית לפי השבת שנבחרה
  txtBtn.onclick = async () => {
    const all = Object.keys(dsN).map(k => dsF[k].value).join("\n");
    if (!all.trim()) { stat.textContent = "אין עדיין מלל מסביר לסרוק."; resBox.innerHTML = ""; return; }
    try { await loadSages(); } catch { stat.textContent = "לא ניתן לטעון את רשימת הגאונים"; return; }
    const arr = findSagesInText(all, SAGES);
    cur = () => {
      showList(arr, arr.length ? "זוהו במלל " + arr.length + " גאונים – בדקו והוסיפו:" : "לא זוהו שמות גאונים מהרשימה במלל.", false);
      const todo = arr.filter(g => !picked.has(g.id));
      if (todo.length > 1) { const ab = el("button", "btn sm", "הוסף את כל " + todo.length + " שזוהו"); ab.onclick = () => { todo.forEach(g => picked.set(g.id, { id: g.id, n: g.n, c: g.c, city: g.city || "", d: g.d, y: g.y || "", t: g.t })); redraw(); }; resBox.insertBefore(ab, resBox.firstChild); }
    }; cur();
  };
  const sgBox = el("div"); sgBox.append(el("label", null, "גאונים בגיליון"), chipsBox, artBox, el("div", "hint", "חפשו ידנית, הציעו לפי תאריך ההילולא, או לחצו «זהה גאונים מהמלל» כדי שהאתר יחפש במלל המסביר שמות של גאונים מהרשימה."), sgq, sugSel, sugBtn, txtBtn, stat, resBox);
  redraw();
  const fi = el("input"); fi.type = "file"; fi.accept = "application/pdf,image/*";
  fi.onchange = () => { const f0 = fi.files[0]; if (f0 && f0.size > MAX_UPLOAD) { m.textContent = "הקובץ גדול מדי (" + mb(f0.size) + "). המקסימום הוא 2 MB."; fi.value = ""; } else m.textContent = ""; };
  const b = el("button", "btn", old ? "שמירת שינויים" : "העלאה ופרסום"), m = el("div", "msg");
  c.append(el("h3", null, old ? "עריכת גיליון" : "העלאת גיליון חדש"), el("label", null, "פרשה / שבת"), pa, po, el("label", null, "תאריך השבת"), dateRow, da, el("label", null, "מספר גיליון (יוצג באותיות, למשל רט״ו)"), nu,
    ...Object.keys(dsN).flatMap(k => { const bb = el("button", "btn sm ghost", "B הדגשה"); bb.type = "button"; bb.style.fontWeight = "700"; bb.onclick = () => { const x = dsF[k], a = x.selectionStart, b = x.selectionEnd; if (a === b) { x.focus(); return; } x.value = x.value.slice(0, a) + "*" + x.value.slice(a, b) + "*" + x.value.slice(b); x.focus(); x.setSelectionRange(a, b + 2); }; return [el("label", null, "מלל מסביר (בעברית)"), bb, dsF[k]]; }), el("div", "hint", "שורה שמתחילה ב-# היא כותרת, ושורה שמתחילה ב-‎-‎ היא נקודה ברשימה. שורה ריקה מפרידה בין פסקאות. להדגשה: סמן מילים ולחץ «B הדגשה», או כתוב *כך* עם כוכבית משני הצדדים."),
    sgBox, el("label", null, old ? "החלפת קובץ (אופציונלי)" : "קובץ הגיליון (PDF)"), fi, b);
  if (old) { const cn = el("button", "btn ghost", "ביטול"); cn.style.marginInlineStart = "8px"; cn.onclick = () => { editing = null; adminTab = "list"; adminPanel(); }; c.appendChild(cn); }
  c.appendChild(m);
  b.onclick = async () => {
    const f = fi.files[0], name = (pa.value === "__other" ? po.value : pa.value).trim();
    if (f && f.size > MAX_UPLOAD) { m.textContent = "הקובץ גדול מדי (" + mb(f.size) + "). המקסימום הוא 2 MB."; return; }
    if (!name || !da.value || (!old && !f)) { m.textContent = "נא למלא פרשה ותאריך" + (old ? "." : ", ולבחור קובץ."); return; }
    const numV = nu.value.trim() === "" ? null : Number(nu.value);
    if (numV !== null && (!Number.isInteger(numV) || numV < 1)) { m.textContent = "מספר הגיליון חייב להיות מספר שלם חיובי."; return; }
    const dup = numV !== null && issues.find(x => +x.num === numV && (!old || x.id !== old.id));
    if (dup) { m.textContent = "מספר " + numV + " כבר קיים (" + dup.parasha + " · " + dup.date + "). בחר מספר אחר."; return; }
    b.disabled = true; m.textContent = "שומר…";
    try {
      const id = old ? old.id : "i" + Date.now();
      let { url, path, size, pages } = old || {}, oldPath = old && old.path, oldPages = (old && old.pages) || [], previewFailed = false;
      pages = pages || [];
      let cover = (old && old.cover) || null; const oldCover = cover;
      if (f) {
        const ext = f.type === "application/pdf" ? "pdf" : (f.type.split("/")[1] || "bin");
        path = "issues/" + id + "-" + Date.now() + "." + ext;
        const r = ref(storage, path);
        await uploadBytes(r, f, { contentType: f.type, contentDisposition: "attachment; filename*=UTF-8''" + encodeURIComponent("חכמי ספרד - " + (numV ? "גיליון " + numV + " - " : "") + name + " " + da.value + "." + ext) });
        url = await getDownloadURL(r); size = f.size;
        pages = []; cover = null;
        if (f.type === "application/pdf") {
          try {
            const blobs = await pdfToJpegs(f, (p, n) => { m.textContent = "מכין תצוגה מקדימה… " + p + "/" + n; });
            for (let k = 0; k < blobs.length; k++) {
              m.textContent = "מעלה תצוגה מקדימה… " + (k + 1) + "/" + blobs.length;
              const pp = "issues/" + id + "-" + Date.now() + "-p" + (k + 1) + ".jpg", pr = ref(storage, pp);
              await uploadBytes(pr, blobs[k], { contentType: "image/jpeg" });
              pages.push({ url: await getDownloadURL(pr), path: pp });
            }
            if (blobs[0]) {
              try {
                m.textContent = "מכין תמונת שיתוף…";
                const cb = await makeCover(blobs[0]), cp = "issues/" + id + "-" + Date.now() + "-cover.jpg", cr = ref(storage, cp);
                await uploadBytes(cr, cb, { contentType: "image/jpeg" }); cover = { url: await getDownloadURL(cr), path: cp };
              } catch (e3) { console.warn("cover failed", e3); }
            }
          } catch (e2) { console.warn("preview failed", e2); previewFailed = true; }
        }
      }
      await setDoc(doc(db, "issues", id), { parasha: name, date: da.value, year: gem(hNum(D(da.value))), num: numV, desc: dsF.desc.value.trim(), sages: [...picked.values()], art1: art[1], art2: art[2], url, path, size, pages, cover }, { merge: true });
      if (f && oldPath) deleteObject(ref(storage, oldPath)).catch(() => {});
      if (f) oldPages.forEach(x => x.path && deleteObject(ref(storage, x.path)).catch(() => {}));
      if (f && oldCover && oldCover.path) deleteObject(ref(storage, oldCover.path)).catch(() => {});
      m.textContent = previewFailed ? "✓ נשמר (אך לא נוצרה תצוגה מקדימה – הגיליון זמין להורדה)" : "✓ נשמר"; if (!old) { lastPub = { id, parasha: name, num: numV, date: da.value, desc: dsF.desc.value.trim(), sages: [...picked.values()], art1: art[1], art2: art[2] }; adminTab = "issue"; } else adminTab = "list";
      editing = null; setTimeout(adminPanel, 800);
    } catch (e) { m.textContent = "שגיאה: " + e.message; b.disabled = false; }
  };
}

function issuesList(c) {
  const add = el("button", "btn sm", "➕ גיליון חדש"); add.onclick = () => { editing = null; adminTab = "issue"; adminPanel(); };
  const an = el("button", "btn sm ghost", "🔢 מספור אוטומטי לפי תאריך"); an.style.marginInlineStart = "8px";
  an.onclick = async () => {
    if (!issues.length) return;
    const v = prompt("מאיזה מספר להתחיל? (המספר ייקבע לגיליון הוותיק ביותר)", "1"); if (v === null) return;
    const st = parseInt(v, 10); if (!(st >= 1)) { alert("מספר לא תקין."); return; }
    if (!confirm("לקבוע מספרים ל-" + issues.length + " גיליונות לפי סדר התאריכים, החל מ-" + st + "? מספרים קיימים יוחלפו.")) return;
    const asc = [...issues].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    an.disabled = true;
    try { for (let k = 0; k < asc.length; k++) await setDoc(doc(db, "issues", asc[k].id), { num: st + k }, { merge: true }); }
    catch (e) { alert("הפעולה נכשלה: " + e.message); }
    an.disabled = false;
  };
  c.appendChild(an);
  if (!issues.length) { c.appendChild(el("div", "hint", "עדיין לא הועלו גיליונות.")); return; }
  const box = el("div"); box.style.marginTop = "12px";
  issues.forEach(i => {
    const r = el("div", "arow");
    const sp = el("span", null, (i.num ? issueNo(i.num) + " · " : "") + parashaTitle(i.parasha) + " · " + heDate(i.date) + " · " + grDate(i.date)); sp.style.direction = "rtl";
    const e = el("button", "btn sm ghost", "עריכה"); e.onclick = () => { editing = i; adminTab = "issue"; adminPanel(); window.scrollTo({ top: 0, behavior: "smooth" }); };
    const x = el("button", "del", "🗑"); x.title = "מחיקה"; x.onclick = () => remove(i);
    const dm = el("button", "btn sm ghost", "📋 הודעה להפצה"); dm.onclick = async () => { await copyText(distMsg(i)); dm.textContent = "הועתק ✓"; setTimeout(() => dm.textContent = "📋 הודעה להפצה", 1800); };
    r.append(sp, dm, pushBtn(i.id, true), mailBtn(i.id, true, true), mailBtn(i.id, true), e, x, el("span", "meta", "⬇ " + (i.downloads || 0))); box.appendChild(r);
  });
  c.appendChild(box);
}

// ===== סטטיסטיקות בניהול =====
async function statsView(c) {
  const wrap = el("div"); wrap.style.marginTop = "12px"; c.appendChild(wrap); wrap.appendChild(el("div", "hint", "טוען…"));
  let subs = [], toks = [];
  try { subs = (await getDocs(collection(db, "subscribers"))).docs.map(d => d.data()); } catch (e) {}
  try { toks = (await getDocs(collection(db, "pushTokens"))).docs.map(d => d.data()); } catch (e) {}
  wrap.innerHTML = "";
  const sum = f => issues.reduce((n, x) => n + (+x[f] || 0), 0);
  const grid = el("div"); grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px";
  [["גיליונות", issues.length], ["צפיות", sum("views")], ["הורדות", sum("downloads")], ["מנויי מייל", subs.length], ["מנויי התראות", toks.length]].forEach(([l, n]) => {
    const b = el("div"); b.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:12px;text-align:center;background:var(--card)";
    const num = el("div", null, String(n)); num.style.cssText = "font-size:26px;font-weight:700;color:var(--acc)"; b.append(num, el("div", "meta", l)); grid.appendChild(b);
  });
  wrap.appendChild(grid);
  const bar = (label, val, max, extra) => {
    const r = el("div"); r.style.cssText = "margin:8px 0";
    const top = el("div", null, label); top.style.cssText = "display:flex;justify-content:space-between;gap:8px;font-size:14px"; top.appendChild(el("span", "meta", extra));
    const tr = el("div"); tr.style.cssText = "height:8px;background:var(--line);border-radius:4px;margin-top:4px;overflow:hidden";
    const fl = el("div"); fl.style.cssText = "height:100%;background:var(--acc);border-radius:4px;width:" + Math.max(val ? 3 : 0, Math.round(val / max * 100)) + "%"; tr.appendChild(fl); r.append(top, tr); return r;
  };
  const LN = { he: "עברית", en: "English", fr: "Français", es: "Español" }, cnt = {};
  subs.forEach(s => { const k = LN[s.lang] ? s.lang : "he"; cnt[k] = (cnt[k] || 0) + 1; });
  wrap.appendChild(el("h3", null, "מנויי מייל לפי שפה"));
  Object.keys(LN).filter(k => cnt[k]).forEach(k => wrap.appendChild(bar(LN[k], cnt[k], subs.length || 1, cnt[k])));
  if (!subs.length) wrap.appendChild(el("div", "hint", "אין עדיין מנויים."));
  wrap.appendChild(el("h3", null, "הגיליונות הנקראים ביותר"));
  const topI = [...issues].sort((a, b) => (b.views || 0) - (a.views || 0) || (b.downloads || 0) - (a.downloads || 0)).slice(0, 10), mx = Math.max(1, ...topI.map(i => i.views || 0));
  topI.forEach(i => wrap.appendChild(bar((i.num ? issueNo(i.num) + " · " : "") + parashaTitle(i.parasha) + " · " + heDate(i.date), i.views || 0, mx, "\u{1F441} " + (i.views || 0) + "  \u2b07 " + (i.downloads || 0) + (i.mailCount ? "  \u2709 " + i.mailCount : ""))));
  wrap.appendChild(el("div", "hint", "צפיות נספרות מרגע הפעלת התכונה (לא רטרואקטיבית): פתיחת הגיליון באתר, פעם אחת לכל גולש בכל ביקור. הורדות נספרות מההתחלה."));
}

function adminsBox(c) {
  const box = el("div"); box.style.marginTop = "22px";
  box.appendChild(el("h3", null, "מנהלים"));
  box.appendChild(el("div", "hint", "מנהלים נכנסים עם חשבון Google ויכולים להעלות, לערוך ולמחוק."));
  admins.forEach(a => {
    const r = el("div", "arow"); r.appendChild(el("span", null, a.email || a.id));
    if (a.id !== user.email.toLowerCase()) { const x = el("button", "del", "✕"); x.onclick = () => confirm("להסיר את " + a.id + "?") && deleteDoc(doc(db, "admins", a.id)); r.appendChild(x); }
    box.appendChild(r);
  });
  const e = el("input"); e.type = "email"; e.placeholder = "gmail של מנהל חדש"; e.style.direction = "ltr";
  const b = el("button", "btn sm", "הוספת מנהל"); b.style.marginTop = "6px";
  b.onclick = async () => { const v = e.value.trim().toLowerCase(); if (!v.includes("@")) return; await setDoc(doc(db, "admins", v), { email: v, addedBy: user.email }); e.value = ""; };
  box.append(e, b); c.appendChild(box);
}

let loginMsg = "";
const loginErr = e => { const c = (e && e.code) || ""; return ({
  "auth/operation-not-allowed": "ספק Google לא מופעל. יש להפעיל אותו: Authentication ← Sign-in method ← Google.",
  "auth/unauthorized-domain": "הדומיין הזה לא מורשה. יש להוסיף אותו: Authentication ← Settings ← Authorized domains.",
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "מפתח ה-apiKey ב-config שגוי.",
  "auth/invalid-api-key": "מפתח ה-apiKey ב-config שגוי.",
  "auth/popup-blocked": "הדפדפן חסם את חלון הכניסה. אפשר חלונות קופצים ונסה שוב.",
  "auth/popup-closed-by-user": "החלון נסגר לפני סיום הכניסה.",
  "auth/network-request-failed": "בעיית רשת. בדוק את החיבור ונסה שוב."
})[c] || ("הכניסה נכשלה" + (c ? " (" + c + ")" : "") + ". אם האתר נפתח מתוך וואטסאפ/מייל – פתח אותו ישירות בכרום או בספארי."); };
$("ver").textContent = "v" + VERSION;
getRedirectResult(auth).catch(e => { loginMsg = loginErr(e); showAdmin = true; adminPanel(); });
let editSage = null, sageNew = false;
async function readChunks() {
  const sn = await getDocs(collection(db, "sagesData"));
  return sn.docs.map(d => ({ id: d.id, i: d.data().i, rows: JSON.parse(d.data().json) })).sort((a, b) => a.i - b.i);
}
async function commitChunks(changed, chunks) {
  for (const ch of changed) await setDoc(doc(db, "sagesData", ch.id), { i: ch.i, json: JSON.stringify(ch.rows) });
  await setDoc(doc(db, "meta", "sages"), { version: Date.now(), count: chunks.reduce((a, ch) => a + ch.rows.length, 0), chunks: chunks.length });
  SAGES = null; MAINC = null; try { localStorage.removeItem("sages_v"); } catch {}
}
async function sagesManager(c) {
  c.appendChild(el("h3", null, "ניהול גאונים"));
  const info = el("div", "msg", "טוען…"); c.appendChild(info);
  let all; try { all = await loadSages(); } catch { info.textContent = "לא ניתן לטעון את רשימת הגאונים"; return; }
  info.textContent = all.length + " גאונים ברשימה";
  if (editSage || sageNew) { sageForm(c, all); return; }
  const add = el("button", "btn", "➕ הוספת גאון חדש"); add.onclick = () => { sageNew = true; adminPanel(); };
  const q = el("input"); q.type = "text"; q.placeholder = "חיפוש גאון לעריכה (שם, מדינה, עיר, פרטים)…";
  const res = el("div");
  q.oninput = () => {
    const f = q.value.trim(); res.innerHTML = ""; if (f.length < 2) return;
    const sr = sageSearch(all, f), arr = sr.list;
    arr.slice(0, 30).forEach(g => res.appendChild(sageRow(g, null, "עריכה", () => { editSage = g; adminPanel(); }, sr.toks)));
    if (arr.length > 30) res.appendChild(el("div", "hint", "מוצגים 30 מתוך " + arr.length + " – דייקו את החיפוש."));
  };
  c.append(add, q, res);
}
function sageForm(c, all) {
  const g = editSage, isNew = !g;
  c.appendChild(el("h3", null, isNew ? "גאון חדש" : "עריכת גאון"));
  const mk = (label, node) => { c.appendChild(el("label", null, label)); c.appendChild(node); return node; };
  const inp = (v, ph) => { const x = el("input"); x.type = "text"; x.value = v || ""; if (ph) x.placeholder = ph; return x; };
  const n = mk("שם", inp(g && g.n, "למשל: רבי יהודה עייאש"));
  const co = mk("מדינה", inp(g && g.c)); co.setAttribute("list", "cl");
  const dl = el("datalist"); dl.id = "cl"; mainCountries(all).slice().sort((x, y) => x[0].localeCompare(y[0], "he")).forEach(([k]) => { const o = el("option"); o.value = k; dl.appendChild(o); }); c.appendChild(dl);
  const ci = mk("עיר", inp(g && g.city));
  const d = el("textarea"); d.value = g ? g.d : ""; mk("פרטים", d);
  const y = mk("שנת פטירה", inp(g && sageY(g), "למשל: תק״ס"));
  const ds = el("select"); for (let k = 1; k <= 30; k++) { const o = el("option", null, gem(k) + " (" + k + ")"); o.value = k; ds.appendChild(o); } ds.value = g ? g.day : 1;
  const ms = el("select"); MONTHS.forEach(m => { const o = el("option", null, m); o.value = m; ms.appendChild(o); });
  if (g && !MONTHS.includes(g.m)) { const o = el("option", null, g.m); o.value = g.m; ms.appendChild(o); }
  ms.value = g ? g.m : MONTHS[0];
  mk("יום ההילולא", ds); mk("חודש ההילולא", ms);
  // תמונה (לא חובה): מוקטנת בדפדפן ונשמרת ב-Storage בתיקיית sages/
  let newPhoto = null, dropPhoto = false, pvUrl = "";
  c.appendChild(el("label", null, "תמונה (לא חובה)"));
  const pv = el("div", "phprev"), pf = el("input"), prm = el("button", "btn sm ghost", "🗑 הסרת התמונה"); pf.type = "file"; pf.accept = "image/*"; prm.type = "button";
  const showPv = () => {
    if (pvUrl) { URL.revokeObjectURL(pvUrl); pvUrl = ""; }
    pv.innerHTML = ""; let src = "";
    if (newPhoto) src = pvUrl = URL.createObjectURL(newPhoto); else if (!dropPhoto && photoOk(g)) src = g.p;
    if (src) { const im = el("img", "sphoto-lg"); im.src = src; im.alt = ""; pv.appendChild(im); } else pv.appendChild(el("div", "hint", "אין תמונה"));
    prm.hidden = !src;
  };
  pf.onchange = async () => {
    const f = pf.files[0]; if (!f) return;
    try { newPhoto = await makePhoto(f); dropPhoto = false; msg.textContent = ""; } catch { msg.textContent = "לא ניתן לקרוא את התמונה. נסו קובץ JPG או PNG."; }
    pf.value = ""; showPv();
  };
  prm.onclick = () => { newPhoto = null; dropPhoto = true; showPv(); };
  c.append(pv, pf, prm); showPv();
  // תמונות נוספות (1.29.0): למשל הספר שחיבר החכם – לכל תמונה פירוט של מה רואים בה
  const books = cleanBooks(g && g.b).map(x => ({ url: x[0], cap: x[1], blob: null, pv: "" })), removedBooks = [];
  c.appendChild(el("label", null, "תמונות נוספות – למשל הספר שחיבר (לא חובה)"));
  const bw = el("div", "bkedit"), bf = el("input"); bf.type = "file"; bf.accept = "image/*"; bf.multiple = true;
  const renderBooks = () => {
    bw.innerHTML = "";
    if (!books.length) bw.appendChild(el("div", "hint", "אין תמונות נוספות"));
    books.forEach((b, k) => {
      const it = el("div", "bkitem"), im = el("img", "bkth"); im.src = b.blob ? b.pv : b.url; im.alt = "";
      const cp = el("input"); cp.type = "text"; cp.maxLength = 300; cp.value = b.cap; cp.placeholder = "פירוט: מה בתמונה (למשל: עטיפת הספר «…», שער הספר, עמוד מתוך הספר)"; cp.oninput = () => { b.cap = cp.value; };
      const rm = el("button", "btn sm ghost", "🗑"); rm.type = "button"; rm.title = "הסרת התמונה";
      rm.onclick = () => { if (b.blob && b.pv) URL.revokeObjectURL(b.pv); if (b.url) removedBooks.push(b.url); books.splice(k, 1); renderBooks(); };
      it.append(im, cp, rm); bw.appendChild(it);
    });
  };
  bf.onchange = async () => {
    const fs = [...bf.files]; bf.value = ""; let bad = 0;
    for (const f of fs) {
      if (books.length >= 12) { msg.textContent = "אפשר עד 12 תמונות נוספות לכל חכם."; break; }
      try { const blob = await makeBookImage(f); books.push({ url: "", cap: "", blob, pv: URL.createObjectURL(blob) }); } catch { bad++; }
    }
    if (bad) msg.textContent = "חלק מהקבצים לא נקראו. נסו JPG או PNG."; else if (books.length < 12) msg.textContent = "";
    renderBooks();
  };
  c.append(bw, bf); renderBooks();
  const sv = el("button", "btn", "שמירה"), cn = el("button", "btn ghost", "ביטול"), msg = el("div", "msg");
  const row = el("div", "actions"); row.append(sv, cn);
  if (!isNew) { const rm = el("button", "btn sm ghost", "🗑 מחיקת גאון"); rm.style.color = "#b3402f"; row.appendChild(rm);
    rm.onclick = async () => {
      if (!confirm("למחוק את «" + g.n + "» מהרשימה? אם הוא כבר סומן בגיליונות – הוא יישאר ברשומות הגיליונות.")) return;
      rm.disabled = true;
      try { const chunks = await readChunks(), changed = [];
        chunks.forEach(ch => { const k = ch.rows.findIndex(r => r[0] === g.id); if (k >= 0) { ch.rows.splice(k, 1); changed.push(ch); } });
        await commitChunks(changed, chunks); if (g.p) deleteObject(ref(storage, g.p)).catch(() => {}); (g.b || []).forEach(x => deleteObject(ref(storage, x[0])).catch(() => {})); editSage = null; adminPanel();
      } catch (e) { msg.textContent = "שגיאה: " + e.message; rm.disabled = false; }
    };
  }
  c.append(row, msg);
  cn.onclick = () => { editSage = null; sageNew = false; bookEdit = null; bookNew = false; adminPanel(); };
  sv.onclick = async () => {
    const name = n.value.trim(); if (!name) { msg.textContent = "יש להזין שם."; return; }
    sv.disabled = true; msg.textContent = "שומר…"; let uploadedPhoto = ""; const uploadedBooks = [];
    try {
      const chunks = await readChunks(), t = gem(+ds.value) + " " + ms.value;
      let id = g && g.id;
      if (isNew) { const ids = new Set(chunks.flatMap(ch => ch.rows.map(r => r[0]))); id = await sha8(name + "|" + t); while (ids.has(id)) id = await sha8(id + Date.now()); }
      let photo = (g && g.p) || "", oldPhoto = "";
      if (newPhoto || dropPhoto) {
        oldPhoto = photo; photo = "";
        if (newPhoto) { msg.textContent = "מעלה תמונה…"; const pp = "sages/" + id + "-" + Date.now() + ".jpg", pr = ref(storage, pp); await uploadBytes(pr, newPhoto, { contentType: "image/jpeg" }); photo = await getDownloadURL(pr); uploadedPhoto = photo; }
      }
      const finalBooks = [];
      for (let k = 0; k < books.length; k++) {
        const b = books[k], cap = b.cap.trim().slice(0, 300);
        if (b.blob) { msg.textContent = "מעלה תמונה " + (k + 1) + " מתוך " + books.length + "…"; const bp = "sages/" + id + "-b" + Date.now() + "-" + k + ".jpg", br = ref(storage, bp); await uploadBytes(br, b.blob, { contentType: "image/jpeg" }); const u = await getDownloadURL(br); uploadedBooks.push(u); finalBooks.push([u, cap]); }
        else finalBooks.push([b.url, cap]);
      }
      const r = [id, name, co.value.trim(), ci.value.trim(), d.value.trim(), y.value.trim(), t, +ds.value, ms.value], changed = [];
      if (photo || finalBooks.length) r[9] = photo;
      if (finalBooks.length) r[10] = finalBooks;
      if (isNew) {
        let last = chunks[chunks.length - 1];
        if (!last || last.rows.length >= 400) { last = { id: "c" + String(chunks.length).padStart(3, "0"), i: chunks.length, rows: [] }; chunks.push(last); }
        last.rows.push(r); changed.push(last);
      } else {
        chunks.forEach(ch => { const k = ch.rows.findIndex(x => x[0] === id); if (k >= 0) { ch.rows[k] = r; changed.push(ch); } });
        if (!changed.length) throw new Error("הגאון לא נמצא ברשימה");
      }
      await commitChunks(changed, chunks); uploadedPhoto = "";
      if (oldPhoto) deleteObject(ref(storage, oldPhoto)).catch(() => {});
      uploadedBooks.length = 0; removedBooks.forEach(u => deleteObject(ref(storage, u)).catch(() => {}));
      if (!isNew) for (const i of issues) if ((i.sages || []).some(x => x.id === id)) await setDoc(doc(db, "issues", i.id), { sages: i.sages.map(x => x.id === id ? { id, n: name, c: r[2], city: r[3], d: r[4], y: r[5], t } : x) }, { merge: true });
      editSage = null; sageNew = false; adminPanel();
    } catch (e) { if (uploadedPhoto) deleteObject(ref(storage, uploadedPhoto)).catch(() => {}); uploadedBooks.forEach(u => deleteObject(ref(storage, u)).catch(() => {})); msg.textContent = "שגיאה: " + e.message; sv.disabled = false; }
  };
}

// ===== הלכה יומית (לפי תאריך בקובץ; בלי תאריכים – לפי סדר) =====
let HAL = {}, HALMETA = null, halLoading = false, halDay = null, halTodayPrev = null;
// כותרת היום: [חלק עברי, תאריך לועזי בסוגריים]
const halDateParts = iso => { try { const wd = new Date(iso + "T12:00:00").toLocaleDateString(lang === "he" ? "he" : lang, { weekday: "long" }); return [wd + " · " + (lang === "he" ? heLetters(iso) : heDate(iso)), "(" + grDate(iso) + ")"]; } catch { return [iso, ""]; } };
const halDateLabel = iso => halDateParts(iso).filter(Boolean).join(" ");
const keyLabel = k => { const [pre, rest] = [k.slice(0, k.indexOf(":")), k.slice(k.indexOf(":") + 1)]; try { if (pre === "g") return heLetters(rest); const [a, b, c] = rest.split("|"); if (pre === "hy") return gem(+b) + " " + c + " " + gem(+a % 1000); if (pre === "hr") return gem(+a) + " " + b; } catch {} return rest; };
async function loadHalacha(iso) {
  if (halLoading) return; halLoading = true;
  try {
    const dt = new Date(iso + "T12:00:00");
    if (!HALMETA) { const md = await getDoc(doc(db, "meta", "halacha")); HALMETA = md.exists() ? md.data() : { none: true }; }
    const m = HALMETA; let idx = -1;
    if (!m.none) { if (m.mode === "date") { const km = JSON.parse(m.keys || "{}"); for (const k of halKeysFor(dt)) if (k in km) { idx = km[k]; break; } } else idx = halIdx(m, iso); }
    if (idx < 0) HAL[iso] = { none: true };
    else {
      const ci = Math.floor(idx / m.size), key = "hal_" + m.version + "_" + ci; let rows = null;
      try { rows = JSON.parse(localStorage.getItem(key)); } catch {}
      if (!rows) {
        const d = await getDoc(doc(db, "halachaData", "c" + String(ci).padStart(3, "0"))); rows = JSON.parse(d.data().json);
        try { Object.keys(localStorage).filter(k => k.startsWith("hal_") && k !== key).forEach(k => localStorage.removeItem(k)); localStorage.setItem(key, JSON.stringify(rows)); } catch {}
      }
      HAL[iso] = { row: rows[idx - ci * m.size] };
    }
  } catch { HAL[iso] = { none: true }; }
  halLoading = false; render();
}
let halSagesReq = false;
// (בוטל ב-1.27.1) בעבר סינן כפילויות; כעת מציג את כל השמות בלי הסרה
const uniqSages = arr => arr; // 1.27.1: לא מסננים ולא מוחקים אף שם – כל החכמים מוצגים כפי שהם בנתונים
// כרטיס "חכמים שהילולתם ביום זה" מתחת להלכה היומית
function halSagesCard(iso) {
  if (!SAGES) { if (!halSagesReq) { halSagesReq = true; loadSages().then(() => { if (view === "halacha") render(); }).catch(() => { halSagesReq = false; }); } return null; }
  const keys = dayKeys(new Date(iso + "T12:00:00")), arr = uniqSages(SAGES.filter(g => keys.has(g.day + "|" + g.m)).sort((a, b) => sortKey(a.n).localeCompare(sortKey(b.n), "he")));
  if (!arr.length) return null;
  const c = el("div", "card"); c.appendChild(el("h3", "haltitle", "🕯 " + t("halSages") + " (" + arr.length + ")"));
  const w = el("div", "desc"); let lim = 12;
  const draw = () => {
    w.innerHTML = "";
    arr.slice(0, lim).forEach(g => { const p = el("p"); { const av = sagePhoto(g, "sav"); if (av) p.appendChild(av); } p.appendChild(el("b", null, g.n)); const mt = sageMeta(g).join(" · "); if (mt) p.appendChild(el("div", "meta", mt)); if (g.d) { const dd = linkInto(el("div"), g.d); dd.style.cssText = "font-size:.95rem;margin-top:2px"; p.appendChild(dd); } w.appendChild(p); });
    if (arr.length > lim) { const b = el("button", "btn sm ghost", t("showAll")); b.onclick = () => { lim = 9999; draw(); }; w.appendChild(b); }
  };
  draw(); c.appendChild(w); return c;
}
// ===== זמני היום (1.31.0): meta/zmanim = {version, cities: JSON [[id,שם,מתאריך,עד תאריך],…]} · zmanimData/<id> = {name, json: {h:[תוויות], d:{ISO:[ערכים]}}} =====
let ZMMETA = null, ZMDATA = {}, zmLoading = false, zmCity = (() => { try { return localStorage.getItem("zm_city") || ""; } catch { return ""; } })();
async function loadZmanim(id) {
  if (zmLoading) return; zmLoading = true;
  try {
    if (!ZMMETA) { const md = await getDoc(doc(db, "meta", "zmanim")); ZMMETA = md.exists() ? { version: md.data().version, cities: JSON.parse(md.data().cities || "[]") } : { cities: [] }; }
    if (id && !ZMDATA[id]) {
      const key = "zm_" + ZMMETA.version + "_" + id; let z = null;
      try { z = JSON.parse(localStorage.getItem(key)); } catch {}
      if (!z) {
        const d = await getDoc(doc(db, "zmanimData", id)); z = JSON.parse(d.data().json);
        try { Object.keys(localStorage).filter(k => k.startsWith("zm_") && k !== "zm_city" && !k.startsWith("zm_" + ZMMETA.version + "_")).forEach(k => localStorage.removeItem(k)); localStorage.setItem(key, JSON.stringify(z)); } catch {}
      }
      ZMDATA[id] = z;
    }
  } catch { if (id) ZMDATA[id] = { none: true }; else ZMMETA = ZMMETA || { cities: [] }; }
  zmLoading = false; render();
}
function zmanimCard(iso) {
  if (!ZMMETA) { if (!zmLoading) loadZmanim(""); return null; }
  const cs = ZMMETA.cities; if (!cs.length) return null;
  if (!cs.some(x => x[0] === zmCity)) zmCity = cs[0][0]; // ברירת מחדל: העיר הראשונה ברשימה (המנהל קובע את הסדר)
  const c = el("div", "card"); c.appendChild(el("h3", "haltitle", t("zmTitle")));
  const bar = el("div", "zmbar");
  if (cs.length > 1) {
    const lb = el("label", null, t("zmCity")), sel = el("select"); sel.setAttribute("aria-label", t("zmCity"));
    cs.forEach(x => { const o = el("option", null, x[1]); o.value = x[0]; if (x[0] === zmCity) o.selected = true; sel.appendChild(o); });
    sel.onchange = () => { zmCity = sel.value; try { localStorage.setItem("zm_city", zmCity); } catch {} render(); };
    bar.append(lb, sel);
  } else bar.appendChild(el("b", null, cs[0][1]));
  c.appendChild(bar);
  const z = ZMDATA[zmCity];
  if (!z) { if (!zmLoading) loadZmanim(zmCity); c.appendChild(el("p", "msg", t("loading"))); return c; }
  const v = z.d && z.d[iso];
  if (!v || !v.some(Boolean)) { c.appendChild(el("p", "msg", t("zmNone"))); return c; }
  const g = el("div", "zmgrid");
  z.h.forEach((h, i) => { if (!v[i]) return; const r = el("div", "zmi"); r.appendChild(el("span", null, h)); r.appendChild(el("b", null, v[i])); g.appendChild(r); });
  c.appendChild(g); return c;
}
// ===== פריסת האתר (1.35.0): meta/layout = {version, json: {nav:[[id,1=מוסתר],…], hal:[[id,1=מוסתר],…]}} =====
const NAV_IDS = [["weekly", "navWeekly"], ["issues", "navIssues"], ["halacha", "navHal"], ["sages", "navSages"], ["about", "navAbout"]];
const HAL_BLOCKS = [["zm", "זמני היום"], ["ded", "הקדשות"], ["hal", "הלכה יומית"], ["sg", "חכמי ספרד שהילולתם ביום זה"]];
const CARD_PARTS = [["art", "המאמרים הראשיים (גאון השבוע)"], ["desc", "«על גיליון זה»"], ["sages", "«הגאונים בגיליון»"], ["pv", "«צפייה בגיליון»"], ["act", "כפתורי הורדה ושיתוף"]];
const BOT_BLOCKS = [["contact", "פרטי יצירת קשר"], ["install", "התקנה כאפליקציה"]];
const MISC_BLOCKS = [["subscribe", "הרשמה לקבלת הגיליון במייל"]];
let LAYOUT = null, layoutLoading = false, editMode = false, DRAFT = null, edDirty = false;
const LY = () => (editMode && DRAFT) ? DRAFT : (LAYOUT || {});
const LDEFS = () => ({ nav: NAV_IDS.map(x => [x[0], x[1]]), hal: HAL_BLOCKS, card: CARD_PARTS, bot: BOT_BLOCKS, misc: MISC_BLOCKS });
const edList = g => layoutList(LDEFS()[g], DRAFT[g]);
const edSet = (g, l) => { DRAFT[g] = l.map(x => [x.id, x.hide ? 1 : 0]); edDirty = true; render(); adminPanel(); };
const edMove = (g, id, d) => { const l = edList(g), i = l.findIndex(x => x.id === id), j = i + d; if (i < 0 || j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; edSet(g, l); };
const edToggle = (g, id) => { const l = edList(g), x = l.find(y => y.id === id); if (x) { x.hide = !x.hide; edSet(g, l); } };
function edBar(g, id, hidden, horiz) {
  const bar = el("span", "edbar"); bar.onclick = e => { e.stopPropagation(); e.preventDefault(); };
  const mk = (txt, title, fn) => { const b = el("span", null, txt); b.setAttribute("role", "button"); b.tabIndex = 0; b.title = title; b.onclick = e => { e.stopPropagation(); e.preventDefault(); fn(); }; return b; };
  const dh = el("span", "edgrip", "✥"); dh.title = "גרור עם העכבר להזזה"; dh.style.touchAction = "none"; dh.onclick = ev => { ev.stopPropagation(); ev.preventDefault(); };
  dh.onpointerdown = ev => edDrag(ev, g, id, !!horiz);
  bar.append(dh, mk(horiz ? "→" : "↑", "הקדם", () => edMove(g, id, -1)), mk(horiz ? "←" : "↓", "אחר", () => edMove(g, id, 1)), mk(hidden ? "🚫" : "👁", hidden ? "מוסתר – לחץ להצגה" : "מוצג – לחץ להסתרה", () => edToggle(g, id)));
  return bar;
}
function edMark(node, g, id, hidden) {
  if (!editMode || !node) return node;
  const host = node.tagName === "DETAILS" ? (node.querySelector(":scope > summary") || node) : node;
  node.classList.add("edit-blk"); node.dataset.edG = g; node.dataset.edId = id; if (host !== node) host.classList.add("edit-host");
  node.classList.toggle("ed-off", !!hidden);
  host.querySelectorAll(":scope > .edbar").forEach(b => b.remove());
  host.appendChild(edBar(g, id, hidden)); return node;
}
// ===== גרירה בעכבר (1.36.0): תופסים את ✥ וגוררים; ההזזה רק בין אחים באותה קבוצה =====
function edDrag(e, g, id, horiz) {
  if (e.button > 0) return; e.preventDefault(); e.stopPropagation();
  const h = e.currentTarget, src = h.closest("[data-ed-g]"); if (!src || !DRAFT) return;
  try { h.setPointerCapture(e.pointerId); } catch {}
  const rtl = document.documentElement.dir === "rtl";
  let tgt = null, after = false, moved = false, ob = "";
  const clear = () => { if (tgt) { tgt.style.boxShadow = ob; tgt = null; } };
  const move = ev => {
    if (!moved && Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < 5) return;
    moved = true; src.classList.add("ed-dragging"); clear();
    let best = 1e9, bn = null, br = null;
    [...src.parentElement.children].forEach(n => {
      if (n === src || n.dataset.edG !== g) return; const r = n.getBoundingClientRect(); if (!r.width && !r.height) return;
      const dx = Math.max(r.left - ev.clientX, 0, ev.clientX - r.right), dy = Math.max(r.top - ev.clientY, 0, ev.clientY - r.bottom), d = Math.hypot(dx, dy);
      if (d < best) { best = d; bn = n; br = r; }
    });
    if (bn) {
      after = horiz ? (rtl ? ev.clientX < br.left + br.width / 2 : ev.clientX > br.left + br.width / 2) : ev.clientY > br.top + br.height / 2;
      tgt = bn; ob = bn.style.boxShadow;
      const o = after ? 4 : -4; bn.style.boxShadow = horiz ? ((rtl ? -o : o) + "px 0 0 0 #d4a24c") : ("0 " + o + "px 0 0 #d4a24c");
    }
    if (ev.clientY < 130) window.scrollBy(0, -14); else if (ev.clientY > innerHeight - 60) window.scrollBy(0, 14);
  };
  const end = ev => {
    h.removeEventListener("pointermove", move); h.removeEventListener("pointerup", end); h.removeEventListener("pointercancel", end);
    const to = tgt && tgt.dataset.edId; clear(); src.classList.remove("ed-dragging");
    if (ev.type === "pointercancel" || !moved || !to) return;
    const l = edList(g), from = l.findIndex(x => x.id === id); if (from < 0) return;
    const before = l.map(x => x.id).join(), it = l.splice(from, 1)[0], ti = l.findIndex(x => x.id === to);
    if (ti < 0) return; l.splice(after ? ti + 1 : ti, 0, it);
    if (l.map(x => x.id).join() !== before) edSet(g, l);
  };
  h.addEventListener("pointermove", move); h.addEventListener("pointerup", end); h.addEventListener("pointercancel", end);
}
// ===== עריכת טקסטים על המסך (1.36.0) =====
const TX_RE = /\u2063([\u200b\u200c]+)\u2064([\s\S]*?)\u2060/g, TX_STRIP = s => s.replace(/\u2063[\u200b\u200c]+\u2064/g, "").replace(/\u2060/g, "");
function edTexts() {
  if (!TXT_ON) return;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), list = [];
  while (w.nextNode()) { const n = w.currentNode; if (n.nodeValue && n.nodeValue.indexOf("\u2063") >= 0) list.push(n); }
  list.forEach(n => {
    const par = n.parentElement, s = n.nodeValue;
    if (!par || par.closest("#admin,option,textarea,script,style,title")) { n.nodeValue = TX_STRIP(s); return; }
    const fr = document.createDocumentFragment(); let last = 0, m; TX_RE.lastIndex = 0;
    while ((m = TX_RE.exec(s))) {
      if (m.index > last) fr.append(s.slice(last, m.index));
      const k = TXK[parseInt(m[1].replace(/\u200b/g, "0").replace(/\u200c/g, "1"), 2)], sp = el("span", "ed-txt", m[2]);
      if (k) { sp.dataset.k = k; sp.title = "לחץ לעריכת הטקסט"; fr.append(sp); } else fr.append(m[2]);
      last = m.index + m[0].length;
    }
    if (last < s.length) fr.append(s.slice(last)); n.replaceWith(fr);
  });
}
let edObs = null, edRaf = 0;
function edObserve(on) {
  if (edObs) { edObs.disconnect(); edObs = null; } if (!on) return;
  edObs = new MutationObserver(() => { if (edRaf) return; edRaf = requestAnimationFrame(() => { edRaf = 0; edTexts(); }); });
  edObs.observe(document.body, { childList: true, subtree: true, characterData: true }); edTexts();
}
function edTextPop(sp) {
  document.querySelectorAll(".ed-pop").forEach(n => n.remove());
  const k = sp.dataset.k, def = (T[lang] && T[lang][k]) || T.he[k], cur = ((TXT_DRAFT[lang] || {})[k]) || def;
  const box = el("div", "ed-pop"); box.dir = "rtl";
  const ta = el("textarea"); ta.value = cur; ta.dir = lang === "he" ? "rtl" : "ltr"; ta.rows = Math.min(8, Math.max(2, Math.ceil(cur.length / 38)));
  box.append(el("div", "ed-pop-t", "עריכת טקסט · " + T[lang].name), ta);
  if (/\{\w+\}/.test(def)) box.append(el("div", "ed-pop-h", "יש להשאיר סימונים בסוגריים מסולסלות (כמו {y}) – הם מוחלפים אוטומטית בערך."));
  const ok = el("button", "btn sm", "אישור"), rs = el("button", "btn ghost sm", "שחזור ברירת מחדל"), cn = el("button", "btn ghost sm", "ביטול");
  const set = v => { const o = TXT_DRAFT[lang] = TXT_DRAFT[lang] || {}; if (!v || v === def) delete o[k]; else o[k] = v; edDirty = true; box.remove(); applyLang(); };
  ok.onclick = () => set(ta.value.trim()); rs.onclick = () => set(""); cn.onclick = () => box.remove();
  ta.onkeydown = ev => { if (ev.key === "Escape") box.remove(); else if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) ok.onclick(); };
  box.append(el("div", "ed-pop-b"), ok, rs, cn); document.body.appendChild(box);
  const r = sp.getBoundingClientRect(); box.style.top = Math.max(8, Math.min(r.bottom + 6, innerHeight - box.offsetHeight - 8)) + "px"; box.style.left = Math.max(8, Math.min(r.left, innerWidth - box.offsetWidth - 8)) + "px";
  ta.focus(); ta.select();
}
document.addEventListener("click", e => {
  if (!TXT_ON) return; const sp = e.target.closest && e.target.closest(".ed-txt");
  if (sp) { e.preventDefault(); e.stopPropagation(); edTextPop(sp); } else if (!e.target.closest(".ed-pop")) document.querySelectorAll(".ed-pop").forEach(n => n.remove());
}, true);
// 1.36.6: הגדרות אתר (meta/site) – פרטי קשר והודעה בראש האתר, נערכים בלשונית «הגדרות אתר» בדף הניהול
let SITE_CFG = null, siteLoading = false;
function applySiteContact() { const c = SITE_CFG && SITE_CFG.contact; if (c) ["email", "phone", "whatsapp", "address"].forEach(k => { if (typeof c[k] === "string") CONTACT[k] = c[k]; }); }
async function loadSite() {
  if (siteLoading) return; siteLoading = true;
  try { const d = await getDoc(doc(db, "meta", "site")); SITE_CFG = d.exists() ? cleanSiteCfg(d.data()) : {}; if (d.exists() && !d.data().contact) delete SITE_CFG.contact; } catch { SITE_CFG = {}; }
  siteLoading = false; applySiteContact(); applyLang();
}
function renderBanner() {
  let n = $("banner");
  const b = ADMIN_PAGE ? null : bannerFor(SITE_CFG, lang, todayStr());
  let dismissed = false; try { dismissed = !!b && sessionStorage.getItem("bannerX") === b.text; } catch {}
  if (!b || dismissed) { if (n) n.remove(); return; }
  if (!n) { n = el("div", "site-banner"); n.id = "banner"; n.setAttribute("role", "status"); const tb = document.querySelector(".topband"); if (!tb) return; tb.after(n); }
  n.innerHTML = "";
  const msg = b.url ? el("a", null, b.text) : el("span", null, b.text); if (b.url) { msg.href = b.url; if (/^https?:/i.test(b.url)) { msg.target = "_blank"; msg.rel = "noopener"; } }
  const x = el("button", null, "✕"); x.setAttribute("aria-label", "✕"); x.onclick = () => { try { sessionStorage.setItem("bannerX", b.text); } catch {} n.remove(); };
  n.append(msg, x);
}
async function loadTexts() {
  if (txtLoading) return; txtLoading = true;
  try { const d = await getDoc(doc(db, "meta", "texts")); TXT = d.exists() ? JSON.parse(d.data().json || "{}") : {}; } catch { TXT = {}; }
  txtLoading = false; if (Object.keys(TXT).length) applyLang();
}
// מחיל סדר והסתרה על אלמנטים עם data-part (הכרטיס) – שומר את האלמנטים שלא ברשימה במקומם
function applyParts(parent, defs, saved, g) { layoutList(defs, saved).forEach(x => { const n = parent.querySelector(":scope > [data-part=\"" + x.id + "\"]"); if (!n) return; if (x.hide && !editMode) { n.remove(); return; } parent.appendChild(n); edMark(n, g, x.id, x.hide); }); }
function applyBottom() {
  const B = document.querySelector(".botband"); if (!B) return; const L = LY();
  const ft = B.querySelector("footer"), ids = { contact: $("contact"), install: $("install") };
  layoutList(BOT_BLOCKS, L.bot).forEach(x => { const n = ids[x.id]; if (!n) return; B.insertBefore(n, ft); n.style.display = x.hide && !editMode ? "none" : ""; n.querySelectorAll(":scope > .edbar").forEach(z => z.remove()); n.classList.remove("edit-blk", "ed-off"); edMark(n, "bot", x.id, x.hide); });
  const sb = $("subscribe"); if (sb) { const h = layoutList(MISC_BLOCKS, L.misc)[0].hide; sb.dataset.lhide = h ? "1" : ""; sb.querySelectorAll(":scope > .edbar").forEach(z => z.remove()); sb.classList.remove("edit-blk", "ed-off"); edMark(sb, "misc", "subscribe", h); }
}
async function loadLayout() {
  if (layoutLoading) return; layoutLoading = true;
  try { const d = await getDoc(doc(db, "meta", "layout")); LAYOUT = d.exists() ? JSON.parse(d.data().json || "{}") : {}; } catch { LAYOUT = {}; }
  layoutLoading = false; render();
}
// ===== הקדשות (1.32.0): meta/dedications = {version, json: {ISO: [[שם, נתרם ע"י?], …]}} =====
let DED = null, dedLoading = false;
async function loadDed() {
  if (dedLoading) return; dedLoading = true;
  try { const d = await getDoc(doc(db, "meta", "dedications")); DED = d.exists() ? JSON.parse(d.data().json || "{}") : {}; } catch { DED = {}; }
  dedLoading = false; render();
}
function dedCard(iso) {
  if (!DED) { if (!dedLoading) loadDed(); return null; }
  const l = DED[iso]; if (!l || !l.length) return null;
  const c = el("div", "card dedcard"); c.appendChild(el("h3", "haltitle", t("dedTitle")));
  l.forEach(x => { const r = el("div", "ded"); r.appendChild(el("div", "ded1", x[0])); if (x[1]) r.appendChild(el("div", "ded2", x[1])); c.appendChild(r); });
  return c;
}
function renderHalacha() {
  const V = $("halView"); V.innerHTML = "";
  const today = todayStr(); if (!halDay || (halDay === halTodayPrev && halTodayPrev !== today)) halDay = today; halTodayPrev = today;
  const iso = halDay, h = HAL[iso];
  // ראש העמוד: ניווט בין הימים + כותרת התאריך
  const [dMain, dGr] = halDateParts(iso);
  const pager = el("div", "halpager");
  const pv = el("button", "btn sm ghost pgprev", t("halPrev")); pv.onclick = () => { halDay = addDays(iso, -1); render(); };
  const nx = el("button", "btn sm ghost pgnext", t("halNext")); nx.disabled = iso >= today; nx.onclick = () => { halDay = addDays(iso, 1); render(); };
  const td = el("button", "btn sm pgtoday", t("halToday")); td.disabled = iso === today; td.onclick = () => { halDay = today; render(); };
  const ttl0 = el("div", "pgtitle"); const hd = el("h2", "haldate", dMain); if (dGr) hd.appendChild(el("span", "grd", " " + dGr)); ttl0.appendChild(hd);
  pager.append(pv, ttl0, nx, td); V.appendChild(pager);
  if (iso === today && today !== isoOf(new Date())) { const sn = el("div", "msg", t("halAfterSet")); sn.style.textAlign = "center"; sn.style.marginTop = "2px"; V.appendChild(sn); }
  const BL = { zm: () => zmanimCard(iso), ded: () => dedCard(iso), sg: () => halSagesCard(iso), hal: () => {
  if (h === undefined) { if (!halLoading) loadHalacha(iso); return el("p", "msg", t("loading")); }
  if (h.row) {
    const r = h.row, txt = (lang !== "he" && r[lang]) || r.t || "", ttl = t("halTitle") + (r.h ? " – " + r.h : "");
    const c = el("div", "card"); c.appendChild(el("b", null, ttl));
    const d = el("div", "desc"); renderText(d, txt); c.appendChild(d);
    if (r.s) { const sb = accD("srcd", "h"); sb.appendChild(el("summary", null, t("halSrc").replace(/[:：]\s*$/, ""))); const sx = el("div"); sx.style.cssText = "font-size:.92rem;white-space:pre-wrap;padding-top:4px"; sx.textContent = r.s; sb.appendChild(sx); c.appendChild(sb); }
    const sh = el("a", "btn sm ghost", t("shareWa")); sh.style.marginTop = "8px";
    sh.href = "https://wa.me/?text=" + encodeURIComponent(ttl + "\n" + halDateLabel(iso) + "\n\n" + txt + (r.s ? "\n(" + r.s + ")" : "") + "\n\n" + SITE_ORIGIN + "/"); sh.target = "_blank"; sh.rel = "noopener";
    c.appendChild(sh); return c;
  } return el("div", "card empty", t("halNone"));
  } };
  layoutList(HAL_BLOCKS, LY().hal).forEach(x => { if (x.hide && !editMode) return; let n = BL[x.id](); if (!n && editMode) n = el("div", "card empty", "«" + x.label + "» – אין תוכן להצגה בתאריך זה"); if (n) { V.appendChild(n); edMark(n, "hal", x.id, x.hide); } });
}
// ===== ניהול זמני היום (1.31.0) =====
async function zmanimAdmin(c) {
  c.appendChild(el("h3", null, "זמני היום"));
  c.appendChild(el("div", "hint", "כל גיליון באקסל הוא עיר אחת. שם העיר נלקח משם הגיליון (קו תחתון ← רווח, למשל «תל_אביב»); אם שם הגיליון כללי (Sheet1 / גיליון1) – משם הקובץ. אפשר לבחור כמה קבצים יחד, וקובץ אחד יכול להכיל כמה ערים (גיליון לכל עיר). שורת הכותרות חייבת לכלול עמודה «תאריך» (יום/חודש/שנה); שאר העמודות מוצגות באתר כפי שהן, ותאים ריקים מדולגים. עיר שכבר קיימת מוחלפת במלואה. העיר הראשונה ברשימה היא ברירת המחדל באתר."));
  const box = el("div"); c.appendChild(box);
  const readMeta = async () => { try { const d = await getDoc(doc(db, "meta", "zmanim")); return d.exists() ? JSON.parse(d.data().cities || "[]") : []; } catch { return []; } };
  const saveMeta = async list => { await setDoc(doc(db, "meta", "zmanim"), { version: Date.now(), cities: JSON.stringify(list) }); ZMMETA = null; ZMDATA = {}; };
  const heD = iso => iso ? iso.split("-").reverse().join("/") : "";
  const draw = async () => {
    box.innerHTML = ""; const list = await readMeta();
    if (!list.length) { box.appendChild(el("div", "msg", "עדיין לא הועלו ערים.")); return; }
    list.forEach((x, i) => {
      const row = el("div", "msg"); row.style.cssText = "display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:6px 0";
      row.appendChild(el("b", null, (i === 0 ? "⭐ " : "") + x[1])); row.appendChild(el("span", null, heD(x[2]) + " – " + heD(x[3])));
      if (i > 0) { const d = el("button", "btn sm ghost", "ברירת מחדל"); d.onclick = async () => { d.disabled = true; const l2 = (await readMeta()).filter(y => y[0] !== x[0]); l2.unshift(x); await saveMeta(l2); draw(); }; row.appendChild(d); }
      const del = el("button", "btn sm ghost", "מחיקה"); del.onclick = async () => { if (!confirm("למחוק את " + x[1] + "?")) return; del.disabled = true; try { await deleteDoc(doc(db, "zmanimData", x[0])); } catch {} await saveMeta((await readMeta()).filter(y => y[0] !== x[0])); draw(); };
      row.appendChild(del); box.appendChild(row);
    });
  };
  draw();
  const fi = el("input"); fi.type = "file"; fi.accept = ".xlsx,.xls"; fi.multiple = true; c.appendChild(fi);
  const b = el("button", "btn", "קריאה ופרסום"), msg = el("div", "msg"); msg.style.whiteSpace = "pre-wrap"; c.append(b, msg);
  b.onclick = async () => {
    const files = [...fi.files]; if (!files.length) { msg.textContent = "בחר קובץ אחד או יותר."; return; }
    b.disabled = true;
    try {
      msg.textContent = "קורא את הקבצים…";
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs"), found = [], skipped = [];
      for (const f of files) {
        const wb = XLSX.read(await f.arrayBuffer());
        for (const sn of wb.SheetNames) {
          const r = parseZmanimRows(XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: "", raw: true }));
          if (!r) { skipped.push(f.name + " / " + sn); continue; }
          const generic = /^(sheet|גיליון)\s*\d*$/i.test(sn.trim()), name = zmCityName(generic ? f.name : sn), id = zmCityId(name);
          if (!id) { skipped.push(f.name + " / " + sn); continue; }
          found.push({ id, name, r });
        }
      }
      if (!found.length) { msg.textContent = "לא נמצא גיליון עם עמודת «תאריך»." + (skipped.length ? "\nדולגו: " + skipped.join(", ") : ""); b.disabled = false; return; }
      let list = await readMeta(), n = 0;
      for (const x of found) {
        n++; msg.textContent = "מעלה " + n + " מתוך " + found.length + ": " + x.name + "…";
        await setDoc(doc(db, "zmanimData", x.id), { name: x.name, json: JSON.stringify({ h: x.r.h, d: x.r.d }) });
        const rec = [x.id, x.name, x.r.from, x.r.to], at = list.findIndex(y => y[0] === x.id);
        if (at >= 0) list[at] = rec; else list.push(rec);
      }
      await saveMeta(list);
      msg.textContent = "✓ פורסמו " + found.length + " ערים:\n" + found.map(x => x.name + " – " + x.r.n + " ימים (" + heD(x.r.from) + " – " + heD(x.r.to) + "), " + x.r.h.length + " עמודות").join("\n") + (skipped.length ? "\nדולגו (אין עמודת תאריך): " + skipped.join(", ") : "");
      fi.value = ""; draw();
    } catch (e) { msg.textContent = "שגיאה: " + (e && e.message || e); }
    b.disabled = false;
  };
}
// ===== ניהול פריסת האתר (1.35.0) =====
async function enterEdit() {
  let cur = {}; try { const d = await getDoc(doc(db, "meta", "layout")); if (d.exists()) cur = JSON.parse(d.data().json || "{}"); } catch {}
  let ct = {}; try { const d = await getDoc(doc(db, "meta", "texts")); if (d.exists()) ct = JSON.parse(d.data().json || "{}"); } catch {}
  DRAFT = JSON.parse(JSON.stringify(cur)); TXT_DRAFT = ct; edDirty = false; editMode = true; TXT_ON = true; edObserve(true); applyLang();
}
function visualBar(c) {
  const bar = el("div", "edtool");
  bar.appendChild(el("div", "hint", "מצב עריכה: האתר למטה הוא האתר האמיתי. על כל חלק מופיעה מסגרת מקווקווה עם כפתורים: ↑↓ (או →← בלשוניות) להזזה, 👁 להסתרה/הצגה (חלק מוסתר מעומעם כאן ולא יוצג למבקרים). אפשר לעבור בין הלשוניות כרגיל כדי לערוך כל עמוד. ✥ = גרירה בעכבר (אפשר גם בחצים). טקסטים באתר מסומנים בקו מנוקד – לחיצה עליהם פותחת עריכה, והשינוי חל על השפה המוצגת כרגע (אפשר להחליף שפה בתחתית האתר)."));
  const sv = el("button", "btn", "💾 שמירה ופרסום"), rs = el("button", "btn ghost sm", "איפוס לברירת מחדל"), cn = el("button", "btn ghost sm", "ביטול שינויים"), msg = el("span", "msg"); msg.textContent = edDirty ? "יש שינויים שלא נשמרו" : "";
  sv.onclick = async () => {
    if (!layoutList(LDEFS().nav, DRAFT.nav).some(x => !x.hide)) { msg.textContent = "חייבת להישאר לפחות לשונית אחת מוצגת."; return; }
    sv.disabled = true; try { const tx = {}; Object.keys(TXT_DRAFT || {}).forEach(l => { if (TXT_DRAFT[l] && Object.keys(TXT_DRAFT[l]).length) tx[l] = TXT_DRAFT[l]; });
      await setDoc(doc(db, "meta", "layout"), { version: Date.now(), json: JSON.stringify(DRAFT) }); await setDoc(doc(db, "meta", "texts"), { version: Date.now(), json: JSON.stringify(tx) });
      LAYOUT = JSON.parse(JSON.stringify(DRAFT)); TXT = JSON.parse(JSON.stringify(tx)); edDirty = false; msg.textContent = "✓ נשמר ופורסם."; } catch (e) { msg.textContent = "שגיאה: " + (e && e.message || e); }
    sv.disabled = false;
  };
  rs.onclick = () => { if (!confirm("לאפס את הפריסה וגם את כל הטקסטים שנערכו לברירת המחדל? (יש ללחוץ אחר כך על שמירה)")) return; DRAFT = {}; TXT_DRAFT = {}; edDirty = true; applyLang(); };
  cn.onclick = async () => { await enterEdit(); };
  bar.append(sv, rs, cn, msg); c.appendChild(bar);
}
async function layoutAdmin(c) {
  c.appendChild(el("h3", null, "פריסת האתר"));
  c.appendChild(el("div", "hint", "קובעים את הסדר והמיקום של כל חלקי האתר: הלשוניות העליונות, הכרטיסים בלשונית «הלכה ומידע יומי», החלקים שבתוך כל גיליון (מאמרים, «על גיליון זה», גאונים, צפייה, הורדה) ותחתית האתר (יצירת קשר, התקנה, הרשמה). החיצים מזיזים למעלה ולמטה, והסימון קובע אם הפריט מוצג באתר. השינוי נכנס לתוקף אחרי «שמירה» (מבקרים באתר רואים אותו בטעינה הבאה)."));
  let cur = {}; try { const d = await getDoc(doc(db, "meta", "layout")); if (d.exists()) cur = JSON.parse(d.data().json || "{}"); } catch {}
  const sets = [
    { key: "nav", title: "לשוניות עליונות", list: layoutList(NAV_IDS.map(x => [x[0], T.he[x[1]]]), cur.nav) },
    { key: "hal", title: "כרטיסים בלשונית «הלכה ומידע יומי» (מלמעלה למטה)", list: layoutList(HAL_BLOCKS, cur.hal) },
    { key: "card", title: "חלקים בתוך כרטיס גיליון (גיליון שבועי וארכיון) – מלמעלה למטה", list: layoutList(CARD_PARTS, cur.card) },
    { key: "bot", title: "תחתית האתר (מלמעלה למטה)", list: layoutList(BOT_BLOCKS, cur.bot) },
    { key: "misc", title: "אזורים נוספים", list: layoutList(MISC_BLOCKS, cur.misc) }
  ];
  const defsOf = { nav: NAV_IDS.map(x => [x[0], T.he[x[1]]]), hal: HAL_BLOCKS, card: CARD_PARTS, bot: BOT_BLOCKS, misc: MISC_BLOCKS };
  const box = el("div"); c.appendChild(box);
  const draw = () => {
    box.innerHTML = "";
    sets.forEach(S => {
      box.appendChild(el("h4", null, S.title));
      S.list.forEach((x, i) => {
        const row = el("div", "msg"); row.style.cssText = "display:flex;align-items:center;gap:8px;margin:5px 0";
        const cb = el("input"); cb.type = "checkbox"; cb.checked = !x.hide; cb.setAttribute("aria-label", "הצג " + x.label); cb.onchange = () => { x.hide = !cb.checked; };
        const lb = el("span", null, x.label); lb.style.flex = "1";
        const up = el("button", "btn sm ghost", "↑"), dn = el("button", "btn sm ghost", "↓");
        up.setAttribute("aria-label", "הזז למעלה"); dn.setAttribute("aria-label", "הזז למטה");
        up.onclick = () => { if (i > 0) { [S.list[i - 1], S.list[i]] = [S.list[i], S.list[i - 1]]; draw(); } };
        dn.onclick = () => { if (i < S.list.length - 1) { [S.list[i + 1], S.list[i]] = [S.list[i], S.list[i + 1]]; draw(); } };
        row.append(cb, lb, up, dn); box.appendChild(row);
      });
    });
  };
  draw();
  const sv = el("button", "btn", "שמירה"), rs = el("button", "btn ghost", "איפוס לברירת מחדל"), msg = el("div", "msg"); c.append(sv, rs, msg);
  const save = async o => { await setDoc(doc(db, "meta", "layout"), { version: Date.now(), json: JSON.stringify(o) }); LAYOUT = null; };
  sv.onclick = async () => {
    if (!sets[0].list.some(x => !x.hide)) { msg.textContent = "חייבת להישאר לפחות לשונית אחת מוצגת."; return; }
    sv.disabled = true; try { await save(Object.fromEntries(sets.map(S => [S.key, S.list.map(x => [x.id, x.hide ? 1 : 0])]))); msg.textContent = "✓ נשמר. רענן את האתר כדי לראות."; } catch (e) { msg.textContent = "שגיאה: " + (e && e.message || e); }
    sv.disabled = false;
  };
  rs.onclick = async () => { if (!confirm("לאפס את הפריסה לברירת המחדל?")) return; rs.disabled = true; try { await save({}); sets.forEach(S => { S.list = layoutList(defsOf[S.key], null); }); draw(); msg.textContent = "✓ אופס."; } catch (e) { msg.textContent = "שגיאה: " + (e && e.message || e); } rs.disabled = false; };
}
// ===== ניהול הקדשות (1.32.0) =====
async function dedAdmin(c) {
  c.appendChild(el("h3", null, "הקדשות"));
  c.appendChild(el("div", "hint", "קובץ האקסל של ההקדשות: שורה לכל יום עברי (עמודות: יום בשבוע, יום, חודש, שנה), ואחר כך עד חמישה זוגות עמודות «שם» (אותיות גדולות) / «נתרם ע״י» (אותיות קטנות). שורות בלי תאריך עברי (כותרות, הוראות, דוגמה) מדולגות. הייבוא מחליף את ההקדשות של כל התאריכים שבקובץ; תאריכים אחרים (שנים קודמות או עתידיות) נשארים. ההקדשות מוצגות בלשונית «הלכה ומידע יומי», מעל ההלכה."));
  const info = el("div", "msg", "טוען…"); c.appendChild(info);
  const readAll = async () => { try { const d = await getDoc(doc(db, "meta", "dedications")); return d.exists() ? JSON.parse(d.data().json || "{}") : {}; } catch { return {}; } };
  const heD = iso => iso ? iso.split("-").reverse().join("/") : "";
  const stat = async () => { const m = await readAll(), k = Object.keys(m).sort(); info.textContent = k.length ? "נשמרו הקדשות ל-" + k.length + " ימים (" + heD(k[0]) + " – " + heD(k[k.length - 1]) + ")." : "עדיין לא הועלו הקדשות."; return m; };
  await stat();
  const fi = el("input"); fi.type = "file"; fi.accept = ".xlsx,.xls"; c.appendChild(fi);
  const b = el("button", "btn", "קריאה ופרסום"), clr = el("button", "btn ghost", "מחיקת כל ההקדשות"), msg = el("div", "msg"); msg.style.whiteSpace = "pre-wrap"; c.append(b, clr, msg);
  const save = async m => { await setDoc(doc(db, "meta", "dedications"), { version: Date.now(), json: JSON.stringify(m) }); DED = null; };
  b.onclick = async () => {
    const f = fi.files[0]; if (!f) { msg.textContent = "בחר קובץ אקסל."; return; }
    b.disabled = true;
    try {
      msg.textContent = "קורא את הקובץ…";
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs"), wb = XLSX.read(await f.arrayBuffer());
      let r = null; for (const sn of wb.SheetNames) { r = parseDedRows(XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: "", raw: true })); if (r) break; }
      if (!r) { msg.textContent = "לא נמצאו שורות עם תאריך עברי (יום / חודש / שנה בעמודות א–ד)."; b.disabled = false; return; }
      const m = await readAll(); Object.keys(m).forEach(k => { if (k >= r.lo && k <= r.hi) delete m[k]; }); Object.assign(m, r.d);
      msg.textContent = "מפרסם…"; await save(m);
      msg.textContent = "✓ פורסמו " + r.items + " הקדשות ב-" + Object.keys(r.d).length + " ימים (נקראו " + r.days + " ימים, " + heD(r.lo) + " – " + heD(r.hi) + ")." + (r.bad.length ? "\nדולגו (" + r.bad.length + "): " + r.bad.slice(0, 10).join(" · ") : "");
      fi.value = ""; stat();
    } catch (e) { msg.textContent = "שגיאה: " + (e && e.message || e); }
    b.disabled = false;
  };
  clr.onclick = async () => { if (!confirm("למחוק את כל ההקדשות?")) return; clr.disabled = true; try { await save({}); msg.textContent = "נמחקו."; stat(); } catch (e) { msg.textContent = "שגיאה: " + (e && e.message || e); } clr.disabled = false; };
}
async function halachaAdmin(c) {
  c.appendChild(el("h3", null, "הלכה יומית"));
  const info = el("div", "msg", "טוען…"); c.appendChild(info);
  let m = null; try { const d = await getDoc(doc(db, "meta", "halacha")); if (d.exists()) m = d.data(); } catch {}
  const dateMode = m && m.mode === "date";
  info.textContent = m ? m.count + " הלכות · " + (dateMode ? "מוצגות לפי התאריך שבקובץ (" + Object.keys(JSON.parse(m.keys || "{}")).length + " מפתחות תאריך)" : "מוצגות לפי סדר הקובץ, מ-" + halDateHe(m.start)) : "עדיין לא הועלה קובץ הלכות.";
  c.appendChild(el("div", "hint", "עמודות בקובץ: «יום» ו/או «תאריך» (עברי או לועזי; כל יום מציג את ההלכה של התאריך שלו אוטומטית), «נושא», «תוכן ההלכה», «מקורות». אופציונלי: «English», «Français», «Español» לתרגום. אם אין תאריכים בקובץ – ההלכות מתחלפות כל יום לפי הסדר, מתאריך ההתחלה."));
  c.appendChild(el("label", null, "מצב ייבוא"));
  const md = el("select"); [["replace", "החלפה מלאה – הקובץ החדש במקום הקודם (מומלץ לקובץ השנתי)"], ["add", "הוספה לקיים – מוסיף את הקובץ ומעדכן תאריכים כפולים"]].forEach(([v, l]) => { const o = el("option", null, l); o.value = v; md.appendChild(o); }); c.appendChild(md);
  c.appendChild(el("label", null, "תאריך התחלה (רלוונטי רק אם אין תאריכים בקובץ)"));
  const sd = el("input"); sd.type = "date"; sd.value = (m && m.start) || todayStr(); c.appendChild(sd);
  const fi = el("input"); fi.type = "file"; fi.accept = ".xlsx,.xls,.csv"; c.appendChild(fi);
  const b = el("button", "btn", "ייבוא והחלפה"), msg = el("div", "msg");
  c.append(b, msg);
  b.onclick = async () => {
    const f = fi.files[0]; if (!f) { msg.textContent = "בחר קובץ."; return; }
    b.disabled = true;
    try {
      msg.textContent = "קורא את הקובץ…";
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
      const wb = XLSX.read(await f.arrayBuffer(), { cellDates: true }), ws0 = wb.Sheets[wb.SheetNames[0]];
      let rows = XLSX.utils.sheet_to_json(ws0, { defval: "" });
      // אם שורת הכותרות אינה הראשונה בגיליון – מאתר אותה (עד 10 השורות הראשונות)
      if (!Object.keys(rows[0] || {}).some(k => /תוכן|הלכה|טקסט/.test(String(k)))) {
        const raw = XLSX.utils.sheet_to_json(ws0, { header: 1, defval: "" }), hi = raw.slice(0, 10).findIndex(r => r.some(c => /תוכן|הלכה|טקסט/.test(String(c))));
        if (hi > 0) rows = XLSX.utils.sheet_to_json(ws0, { defval: "", range: hi });
      }
      const hdrs = Object.keys(rows[0] || {}), findH = (re, skip = []) => hdrs.find(k => !skip.includes(k) && re.test(String(k).trim()));
      const isDateH = k => /תאריך|^\s*יום(\s|$)/.test(String(k).trim());
      const hC = findH(/תוכן/) || findH(/^הלכה$/) || findH(/הלכה|טקסט/), hT = findH(/נושא|כותרת/, [hC]);
      let hS = findH(/מקור|מראי|מראה מקום|מקומות|source/i, [hC, hT]);
      if (!hS) { const left = hdrs.filter(k => ![hC, hT].includes(k) && !isDateH(k) && !/english|אנגלית|fran[cç]ais|צרפתית|espa[nñ]ol|ספרדית/i.test(String(k)) && !/^__EMPTY/.test(k)); if (left.length === 1) hS = left[0]; }
      const hEn = findH(/english|אנגלית/i), hFr = findH(/fran[cç]ais|צרפתית/i), hEs = findH(/espa[nñ]ol|ספרדית/i);
      const dateH = hdrs.filter(k => ![hC, hT, hS, hEn, hFr, hEs].includes(k) && isDateH(k));
      const val = (r, k) => (k !== undefined && r[k] !== undefined) ? String(r[k]).trim() : "";
      const readAll = async () => { const a = []; (await getDocs(collection(db, "halachaData"))).docs.map(d => d.data()).sort((x, y) => x.i - y.i).forEach(x => a.push(...JSON.parse(x.json))); return a; };
      const addMode = md.value === "add" && m, base = addMode ? await readAll() : [], km = addMode ? JSON.parse(m.keys || "{}") : {}, out = base.slice(), seen = new Set(); let withDate = 0; const examples = [];
      rows.forEach(r => {
        const o = { t: val(r, hC) || String(Object.values(r)[0] || "").trim(), h: val(r, hT), s: val(r, hS), en: val(r, hEn), fr: val(r, hFr), es: val(r, hEs) };
        if (!o.t) return;
        const ks = halRowKeys(r, dateH), i = out.length; out.push(o);
        if (ks.length) { withDate++; if (examples.length < 3) examples.push(keyLabel(ks[0])); }
        ks.forEach(k => { if (!seen.has(k)) { seen.add(k); km[k] = i; } });
      });
      if (!out.length) throw new Error("לא נמצאו הלכות בקובץ (נדרשת עמודה «תוכן ההלכה»)");
      const size = 60, chunks = Math.ceil(out.length / size), nm = i => "c" + String(i).padStart(3, "0"), oldN = m ? m.chunks : 0;
      for (let i = 0; i < chunks; i++) { msg.textContent = "מעלה " + (i + 1) + " מתוך " + chunks + "…"; await setDoc(doc(db, "halachaData", nm(i)), { i, json: JSON.stringify(out.slice(i * size, (i + 1) * size)) }); }
      for (let i = chunks; i < oldN; i++) await deleteDoc(doc(db, "halachaData", nm(i)));
      const mode = (withDate || (addMode && m.mode === "date")) ? "date" : "seq";
      await setDoc(doc(db, "meta", "halacha"), { version: Date.now(), count: out.length, chunks, size, start: sd.value || todayStr(), mode, keys: JSON.stringify(km) });
      HAL = {}; HALMETA = null;
      const colsMsg = " עמודות שזוהו: תוכן=«" + (hC || "העמודה הראשונה") + "», נושא=«" + (hT || "—") + "», מקורות=«" + (hS || "לא נמצאה") + "», תאריך=«" + (dateH.join(" + ") || "—") + "».";
      msg.textContent = colsMsg + " ✓ " + (addMode ? "נוספו " + (out.length - base.length) + " הלכות (סה״כ " + out.length + "). " : "נטענו " + out.length + " הלכות. ") + (withDate ? "זוהה תאריך ב-" + withDate + " שורות (למשל: " + examples.join(" , ") + ")." + (withDate < out.length ? " " + (out.length - withDate) + " שורות ללא תאריך מזוהה לא יוצגו." : "") : "לא זוהו תאריכים בקובץ – ההלכות יתחלפו לפי הסדר מ-" + halDateHe(sd.value || todayStr()) + ".");
      setTimeout(adminPanel, 3500);
    } catch (e) { msg.textContent = "שגיאה: " + e.message; }
    b.disabled = false;
  };
  if (m) {
    try {
      const all = []; (await getDocs(collection(db, "halachaData"))).docs.map(d => d.data()).sort((a, b) => a.i - b.i).forEach(x => all.push(...JSON.parse(x.json)));
      const km = JSON.parse(m.keys || "{}");
      if (m.mode === "date") {
        let miss = 0, first = "";
        for (let k = 0; k < 60; k++) { const dt = new Date(); dt.setDate(dt.getDate() + k); if (!halKeysFor(dt).some(key => key in km)) { miss++; if (!first) first = isoOf(dt); } }
        if (miss) { const w = el("div", "msg", "⚠ ב-" + miss + " מתוך 60 הימים הקרובים אין הלכה בקובץ (הראשון: " + halDateHe(first) + "). אם הקובץ השנתי עומד להסתיים – העלו את הקובץ של השנה החדשה."); w.style.color = "#b3402f"; c.appendChild(w); }
      }
      c.appendChild(el("h3", null, "ההלכות הקרובות"));
      for (let k = 0; k < 7; k++) {
        const dt = new Date(); dt.setDate(dt.getDate() + k); let idx = -1;
        if (m.mode === "date") { for (const key of halKeysFor(dt)) if (key in km) { idx = km[key]; break; } } else idx = halIdx(m, isoOf(dt));
        const r = idx >= 0 ? all[idx] : null, p = el("div", "hint", halDateHe(isoOf(dt)) + " · " + (r ? (r.h || r.t).slice(0, 90) : "— אין הלכה לתאריך זה —"));
        p.style.cssText = "border-bottom:1px solid var(--line);padding:5px 0"; c.appendChild(p);
      }
    } catch {}
  }
}

// ===== קטלוג ספרים (למנהלים בלבד; חוקי האבטחה חוסמים קריאה לכל מי שאינו מנהל) =====
let LIB = null, LIBHDR = [], LIBMETA = { chunks: 0 }, LK = { st: "", q: "", limit: 40 }, bookEdit = null, bookNew = false;
const BSZ = 300, bnm = i => "c" + String(i).padStart(3, "0");
const stLabel = x => x === "missing" ? "⚠ חסר במכון" : "✓ יש במכון";
function parseBookSheets(sheets, defSt) {
  const out = [], headers = [];
  sheets.forEach(({ name, rows }) => {
    if (!rows.length) return;
    const hd = Object.keys(rows[0]), tC = hd.find(k => /שם|ספר|כותרת/.test(String(k).trim())) || hd[0], sC = hd.find(k => k !== tC && /סטטוס|מצב|קיים|חסר|זמינות/.test(String(k).trim()));
    const sheetSt = /חסר|נדרש|רכישה|חוסר/.test(name) ? "missing" : /יש|קיים|במכון|ספרי|מלאי|ספריה|ספרייה/.test(name) ? "have" : defSt;
    rows.forEach(r => {
      const t = String(r[tC] === undefined ? "" : r[tC]).trim(); if (!t) return;
      let st = sheetSt;
      if (sC) { const v = String(r[sC]).trim(); if (/חסר|אין|^לא/.test(v)) st = "missing"; else if (v) st = "have"; }
      const f = {};
      hd.forEach(k => { if (k === tC || k === sC) return; const v = String(r[k] === undefined ? "" : r[k]).trim(); if (v) { f[String(k).trim()] = v; if (!headers.includes(String(k).trim())) headers.push(String(k).trim()); } });
      out.push({ id: "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7) + out.length, t, st, f });
    });
  });
  return { out, headers };
}
async function loadBooks(force) {
  if (LIB && !force) return LIB;
  const sn = await getDocs(collection(db, "booksData")); LIB = [];
  sn.docs.map(d => d.data()).sort((a, b) => a.i - b.i).forEach(x => LIB.push(...JSON.parse(x.json)));
  const mi = await getDoc(doc(db, "booksMeta", "info")); if (mi.exists()) { LIBHDR = mi.data().headers || []; LIBMETA = { chunks: mi.data().chunks || 0 }; } else { LIBHDR = []; LIBMETA = { chunks: 0 }; }
  return LIB;
}
// כותב מחדש את הקטעים שמכילים את האינדקסים from..to (ואת מטא-הנתונים)
async function saveBookRange(from, to) {
  const chunks = Math.ceil(LIB.length / BSZ);
  for (let i = Math.floor(from / BSZ); i <= Math.min(Math.floor(to / BSZ), chunks - 1); i++) await setDoc(doc(db, "booksData", bnm(i)), { i, json: JSON.stringify(LIB.slice(i * BSZ, (i + 1) * BSZ)) });
  for (let i = chunks; i < LIBMETA.chunks; i++) await deleteDoc(doc(db, "booksData", bnm(i)));
  LIBMETA = { chunks }; await setDoc(doc(db, "booksMeta", "info"), { count: LIB.length, chunks, headers: LIBHDR });
}
async function booksView(c) {
  c.appendChild(el("h3", null, "קטלוג ספרים"));
  const lock = el("div", "hint", "🔒 הקטלוג גלוי למנהלים בלבד. הוא לא מופיע באתר, ואפילו מי שמכיר את כתובת המסד לא יכול לקרוא אותו – חוקי האבטחה של Firebase חוסמים כל מי שאינו ברשימת המנהלים."); c.appendChild(lock);
  const info = el("div", "msg", "טוען…"); c.appendChild(info);
  try { await loadBooks(true); } catch (e) { info.textContent = "שגיאה בטעינה: " + e.message + " (האם פרסתם את חוקי האבטחה החדשים? firebase deploy)"; return; }
  if (bookEdit || bookNew) { bookForm(c); info.remove(); return; }
  const have = LIB.filter(b => b.st !== "missing").length, miss = LIB.length - have;
  info.textContent = LIB.length + " ספרים · " + have + " יש במכון · " + miss + " חסרים";
  const csvAll = (arr, name) => {
    const q2 = v => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"', hs = LIBHDR;
    const lines = [["שם", "סטטוס", ...hs].map(q2).join(",")].concat(arr.map(b => [b.t, b.st === "missing" ? "חסר" : "יש", ...hs.map(h => b.f[h] || "")].map(q2).join(",")));
    const lk = document.createElement("a"); lk.href = URL.createObjectURL(new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" })); lk.download = name; lk.click();
  };
  const act = el("div", "actions");
  const ba = el("button", "btn sm", "➕ הוספת ספר"); ba.onclick = () => { bookNew = true; adminPanel(); };
  const b1 = el("button", "btn sm ghost", "⬇ ייצוא הכול"); b1.onclick = () => csvAll(LIB, "קטלוג-ספרים.csv");
  const b2 = el("button", "btn sm ghost", "⬇ ייצוא החסרים"); b2.onclick = () => csvAll(LIB.filter(b => b.st === "missing"), "ספרים-חסרים.csv");
  act.append(ba, b1, b2); c.appendChild(act);
  // ייבוא
  const imp = el("details"); imp.appendChild(el("summary", null, "⬆ ייבוא קובץ אקסל"));
  imp.appendChild(el("div", "hint", "אפשר קובץ אחד עם כמה גיליונות (למשל «יש במכון» ו«חסרים») או עמודת «סטטוס». העמודה הראשונה (או «שם הספר») היא שם הספר; שאר העמודות נשמרות כפי שהן (מחבר, הוצאה, מיקום וכו׳)."));
  const ds = el("select"); [["have", "ללא זיהוי – ייחשבו «יש במכון»"], ["missing", "ללא זיהוי – ייחשבו «חסרים»"]].forEach(([v, l]) => { const o = el("option", null, l); o.value = v; ds.appendChild(o); });
  const ms = el("select"); [["replace", "החלפה מלאה של הקטלוג"], ["add", "הוספה לקיים"]].forEach(([v, l]) => { const o = el("option", null, l); o.value = v; ms.appendChild(o); });
  const fi = el("input"); fi.type = "file"; fi.accept = ".xlsx,.xls,.csv"; const bi = el("button", "btn sm", "ייבוא"), mi = el("div", "msg");
  bi.onclick = async () => {
    const f = fi.files[0]; if (!f) { mi.textContent = "בחר קובץ."; return; }
    bi.disabled = true;
    try {
      mi.textContent = "קורא…";
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs"), wb = XLSX.read(await f.arrayBuffer());
      const { out, headers } = parseBookSheets(wb.SheetNames.map(n => ({ name: n, rows: XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: "" }) })), ds.value);
      if (!out.length) throw new Error("לא נמצאו ספרים בקובץ");
      const keepOld = ms.value === "add"; if (!keepOld) LIB = []; LIB = LIB.concat(out); LIBHDR = [...new Set([...(keepOld ? LIBHDR : []), ...headers])];
      mi.textContent = "שומר " + out.length + " ספרים…"; await saveBookRange(0, LIB.length);
      mi.textContent = "✓ יובאו " + out.length + " ספרים (" + out.filter(b => b.st === "missing").length + " חסרים). שדות שנשמרו: " + (headers.join(", ") || "—"); setTimeout(adminPanel, 2500);
    } catch (e) { mi.textContent = "שגיאה: " + e.message; }
    bi.disabled = false;
  };
  imp.append(ds, ms, fi, bi, mi); c.appendChild(imp);
  // חיפוש וסינון
  const st = el("select"); [["", "כל הספרים"], ["have", "יש במכון"], ["missing", "חסרים"]].forEach(([v, l]) => { const o = el("option", null, l); o.value = v; st.appendChild(o); }); st.value = LK.st;
  const q = el("input"); q.type = "text"; q.placeholder = "חיפוש לפי שם, מחבר או כל פרט…"; q.value = LK.q;
  const cnt = el("div", "msg"), list = el("div"), more = el("button", "btn sm ghost", "הצג עוד");
  c.append(st, q, cnt, list, more);
  const draw = () => {
    const f = LK.q.trim().toLowerCase(), arr = LIB.map((b, i) => [b, i]).filter(([b]) => (!LK.st || (b.st === "missing" ? "missing" : "have") === LK.st) && (!f || (b.t + " " + Object.values(b.f).join(" ")).toLowerCase().includes(f)));
    cnt.textContent = arr.length + " תוצאות"; list.innerHTML = "";
    arr.slice(0, LK.limit).forEach(([b, idx]) => {
      const r = el("div", "srow"), x = el("div", "st"); x.appendChild(el("b", null, b.t));
      const bd = el("span", "meta", "  " + stLabel(b.st)); if (b.st === "missing") bd.style.color = "#b3402f"; x.appendChild(bd);
      const det = Object.entries(b.f).map(([k, v]) => k + ": " + v).join(" · "); if (det) x.appendChild(el("div", "hint", det));
      const tg = el("button", "btn sm ghost", b.st === "missing" ? "סמן כקיים" : "סמן כחסר");
      tg.onclick = async () => { tg.disabled = true; b.st = b.st === "missing" ? "have" : "missing"; try { await saveBookRange(idx, idx); draw(); } catch (e) { alert("השמירה נכשלה: " + e.message); tg.disabled = false; } };
      const ed = el("button", "btn sm ghost", "עריכה"); ed.onclick = () => { bookEdit = { b, idx }; adminPanel(); };
      const rm = el("button", "del", "🗑"); rm.title = "מחיקה"; rm.onclick = async () => { if (!confirm("למחוק את «" + b.t + "» מהקטלוג?")) return; LIB.splice(idx, 1); try { await saveBookRange(idx, LIB.length); draw(); } catch (e) { alert("המחיקה נכשלה: " + e.message); } };
      const bx = el("div", "actions"); bx.append(tg, ed, rm); x.appendChild(bx); r.appendChild(x); list.appendChild(r);
    });
    more.hidden = arr.length <= LK.limit;
  };
  st.onchange = () => { LK.st = st.value; LK.limit = 40; draw(); }; q.oninput = () => { LK.q = q.value; LK.limit = 40; draw(); }; more.onclick = () => { LK.limit += 40; draw(); };
  draw();
}
function bookForm(c) {
  const isNew = !bookEdit, cur = isNew ? { t: "", st: "missing", f: {} } : bookEdit.b;
  c.appendChild(el("h3", null, isNew ? "ספר חדש" : "עריכת ספר"));
  const mk = (label, node) => { c.appendChild(el("label", null, label)); c.appendChild(node); return node; };
  const t = mk("שם הספר", Object.assign(el("input"), { type: "text", value: cur.t }));
  const st = el("select"); [["have", "יש במכון"], ["missing", "חסר במכון"]].forEach(([v, l]) => { const o = el("option", null, l); o.value = v; st.appendChild(o); }); st.value = cur.st === "missing" ? "missing" : "have"; mk("סטטוס", st);
  const keys = [...new Set([...LIBHDR, ...Object.keys(cur.f)])], F = {};
  keys.forEach(k => { F[k] = mk(k, Object.assign(el("input"), { type: "text", value: cur.f[k] || "" })); });
  const nk = Object.assign(el("input"), { type: "text", placeholder: "שם שדה חדש (למשל: הערות)" }), nv = Object.assign(el("input"), { type: "text", placeholder: "ערך" }); mk("שדה נוסף (אופציונלי)", nk); c.appendChild(nv);
  const sv = el("button", "btn", "שמירה"), cn = el("button", "btn ghost", "ביטול"), msg = el("div", "msg"), row = el("div", "actions"); row.append(sv, cn); c.append(row, msg);
  cn.onclick = () => { bookEdit = null; bookNew = false; adminPanel(); };
  sv.onclick = async () => {
    if (!t.value.trim()) { msg.textContent = "יש להזין שם ספר."; return; }
    sv.disabled = true; msg.textContent = "שומר…";
    try {
      const f = {}; keys.forEach(k => { const v = F[k].value.trim(); if (v) f[k] = v; });
      if (nk.value.trim() && nv.value.trim()) { f[nk.value.trim()] = nv.value.trim(); if (!LIBHDR.includes(nk.value.trim())) LIBHDR.push(nk.value.trim()); }
      if (isNew) { LIB.push({ id: "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), t: t.value.trim(), st: st.value, f }); await saveBookRange(LIB.length - 1, LIB.length - 1); }
      else { Object.assign(bookEdit.b, { t: t.value.trim(), st: st.value, f }); await saveBookRange(bookEdit.idx, bookEdit.idx); }
      bookEdit = null; bookNew = false; adminPanel();
    } catch (e) { msg.textContent = "שגיאה: " + e.message; sv.disabled = false; }
  };
}

// 1.36.3: לשונית «גיבויים» – גיבוי מיידי, רשימת גיבויים ושחזור אוסף (רק מסמכים חסרים, או דריסה). הכל דרך הפונקציות backupNow / backupList / backupRestore
const BK_NAMES = { issues: "גיליונות", subscribers: "נרשמים", admins: "מנהלים", pushTokens: "מנויי התראות", pendingSubs: "ממתינים לאישור מייל", meta: "הגדרות כלליות", mailJobs: "משימות שליחה" };
async function backupView(c0) {
  const c = el("div"); c0.appendChild(c);
  c.appendChild(el("h3", null, "גיבויים ושחזור"));
  c.appendChild(el("div", "hint", "גיבוי אוטומטי כל יום א׳ ב-03:00; נשמרים 8 אחרונים. השחזור מחזיר מסמכים ל-Firestore בלבד (לא קבצי תמונה או PDF)."));
  const now = el("button", "btn sm", "💾 גבה עכשיו"), msg = el("div", "msg", "טוען…"), list = el("div");
  c.append(now, msg, list);
  const load = async () => {
    list.innerHTML = "";
    let res;
    try { res = await callFn("backupList"); } catch (e) { msg.textContent = "שגיאה בטעינה: " + (e && e.message || e); return false; }
    msg.textContent = res.backups.length ? res.backups.length + " גיבויים" : "אין עדיין גיבויים. אפשר ללחוץ «גבה עכשיו».";
    res.backups.forEach(b => {
      const box = el("details", "card"); box.style.marginTop = "10px";
      box.appendChild(el("summary", null, new Date(b.date + "T12:00:00").toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + " · " + b.files.length + " אוספים"));
      b.files.forEach(f => {
        const row = el("div"); row.style.cssText = "margin:10px 0;padding-top:8px;border-top:1px solid var(--line)";
        const rb = el("button", "btn sm ghost", "שחזור…"), out = el("div", "msg"), acts = el("div");
        row.append(el("span", null, (BK_NAMES[f.name] || f.name) + " · \u200e" + Math.max(1, Math.round(f.size / 1024)) + " KB\u200e "), rb, out, acts);
        rb.onclick = async () => {
          rb.disabled = true; acts.innerHTML = ""; out.textContent = "בודק…";
          try {
            const q = await callFn("backupRestore", { date: b.date, collection: f.name, dry: true });
            out.textContent = "בגיבוי " + q.total + " מסמכים · קיימים כיום " + q.existing + " · חסרים " + q.missing + ".";
            const act = (mode, label, warn, ghost) => {
              const x = el("button", "btn sm" + (ghost ? " ghost" : ""), label); x.style.marginInlineEnd = "8px";
              x.onclick = async () => {
                if (!confirm(warn)) return;
                acts.querySelectorAll("button").forEach(z => { z.disabled = true; }); out.textContent = "משחזר…";
                try { const r = await callFn("backupRestore", { date: b.date, collection: f.name, mode }); out.textContent = "✓ שוחזרו " + r.restored + " מסמכים" + (r.skipped ? " (דולגו " + r.skipped + " שכבר קיימים)" : ""); acts.innerHTML = ""; }
                catch (e) { out.textContent = "שגיאה: " + (e && e.message || e); acts.querySelectorAll("button").forEach(z => { z.disabled = false; }); }
              };
              return x;
            };
            if (q.missing > 0) acts.appendChild(act("missing", "שחזר רק חסרים (" + q.missing + ")", "לשחזר " + q.missing + " מסמכים חסרים לאוסף «" + (BK_NAMES[f.name] || f.name) + "»?\nמסמכים שקיימים כיום לא ישונו.", false));
            if (q.total > 0) acts.appendChild(act("overwrite", "דרוס את כל האוסף (" + q.total + ")", "זה יחליף את כל " + q.total + " המסמכים באוסף «" + (BK_NAMES[f.name] || f.name) + "» בגרסה מגיבוי " + b.date + ".\nשינויים שנעשו מאז יאבדו (מסמכים שנוספו אחרי הגיבוי לא יימחקו).\nלהמשיך?", true));
          } catch (e) { out.textContent = "שגיאה: " + (e && e.message || e); }
          rb.disabled = false;
        };
        box.appendChild(row);
      });
      list.appendChild(box);
    });
    return true;
  };
  now.onclick = async () => {
    now.disabled = true; msg.textContent = "מגבה… (יכול לקחת כדקה)";
    try { const r = await callFn("backupNow"); await load(); msg.textContent = "✓ הגיבוי נשמר (" + r.folder.replace(/^backups\/|\/$/g, "") + ")"; }
    catch (e) { msg.textContent = "שגיאה בגיבוי: " + (e && e.message || e); }
    now.disabled = false;
  };
  load();
}

function adminPanel() {
  if (!ADMIN_PAGE) return;
  if (editMode && !(isAdmin && adminTab === "visual")) { editMode = false; DRAFT = null; TXT_ON = false; TXT_DRAFT = null; edDirty = false; edObserve(false); document.querySelectorAll(".ed-pop").forEach(n => n.remove()); applyLang(); return; }
  document.body.classList.toggle("editing", editMode);
  { const pb = $("pub"); if (pb) pb.hidden = !editMode; } // 1.36.1: בעורך החזותי מציגים את האתר עצמו (ב-admin.html הוא מוסתר כברירת מחדל)
  const box = $("admin"); box.innerHTML = "";
  box.dir = "rtl";
  const c = el("div", "card admin");
  if (!user) {
    c.appendChild(el("h3", null, "כניסת מנהלים"));
    const b = el("button", "btn", "כניסה עם Google"), m = el("div", "msg");
    m.textContent = loginMsg;
    b.onclick = async () => {
      m.textContent = "מתחבר…"; const pr = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, pr);
      } catch (e) {
        if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment"].includes(e && e.code)) { try { await signInWithRedirect(auth, pr); return; } catch (e2) { e = e2; } }
        m.textContent = loginErr(e);
      }
    };
    c.append(b, m);
  } else if (!isAdmin) {
    c.append(el("div", "msg", "החשבון " + user.email + " אינו רשום כמנהל."));
    const o = el("button", "btn sm ghost", "יציאה"); o.onclick = () => signOut(auth); c.appendChild(o);
  } else {
    const tb = el("div", "chips");
    [["list", "גיליונות"], ["issue", editing ? "עריכת גיליון" : "העלאת גיליון"], ["visual", "✏️ עורך חזותי"], ["stats", "\u{1F4CA} \u05e1\u05d8\u05d8\u05d9\u05e1\u05d8\u05d9\u05e7\u05d5\u05ea"], ["track", "מעקב גאונים"], ["sagemgr", "גאונים"], ["subs", "נרשמים"], ["halacha", "הלכה יומית"], ["zmanim", "זמני היום"], ["ded", "הקדשות"], ["layout", "פריסה (רשימה)"], ["books", "קטלוג ספרים"], ["about", "אודות"], ["import", "ייבוא מאקסל"], ["site", "⚙️ הגדרות אתר"], ["backup", "גיבויים"], ["admins", "מנהלים"]].forEach(([k, l]) => { const b = el("button", "chip" + (adminTab === k ? " on" : ""), l); b.onclick = () => { if (editMode && k !== "visual" && edDirty && !confirm("יש שינויים שלא נשמרו בעורך החזותי. לעזוב ולבטל אותם?")) return; adminTab = k; editing = k === "issue" ? editing : null; editSage = null; sageNew = false; if (k === "visual") enterEdit(); adminPanel(); }; tb.appendChild(b); });
    c.appendChild(tb);
    if (adminTab === "visual") visualBar(c); else if (adminTab === "list") issuesList(c); else if (adminTab === "issue") issueForm(c); else if (adminTab === "stats") statsView(c); else if (adminTab === "track") trackView(c); else if (adminTab === "subs") subsView(c); else if (adminTab === "sagemgr") sagesManager(c); else if (adminTab === "halacha") halachaAdmin(c); else if (adminTab === "zmanim") zmanimAdmin(c); else if (adminTab === "ded") dedAdmin(c); else if (adminTab === "layout") layoutAdmin(c); else if (adminTab === "books") booksView(c); else if (adminTab === "about") aboutEditor(c); else if (adminTab === "import") importView(c); else if (adminTab === "site") siteAdmin(c); else if (adminTab === "backup") backupView(c); else adminsBox(c);
    const o = el("button", "btn sm ghost", "יציאה"); o.style.marginTop = "16px"; o.onclick = () => signOut(auth); c.appendChild(o);
  }
  box.appendChild(c);
}


function applyInstall() {
  const box = $("install"); box.innerHTML = "";
  if (matchMedia("(display-mode: standalone)").matches || navigator.standalone) return;
  const p = window.__bip;
  if (p) { const b = el("button", "btn ghost sm", t("install")); b.onclick = async () => { p.prompt(); try { await p.userChoice; } catch {} window.__bip = null; applyInstall(); }; box.appendChild(b); }
  else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) box.appendChild(el("div", "hint", t("iosHint")));
}
window.addEventListener("bip-ready", applyInstall);
window.addEventListener("appinstalled", () => { window.__bip = null; applyInstall(); });

function applyLang() {
  document.documentElement.lang = lang; document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  document.title = t("title");
  $("h1").textContent = t("title"); $("sub").textContent = t("sub"); $("q").placeholder = t("search");
  if (ADMIN_PAGE) { document.title = "ניהול · " + t("title"); $("h1").textContent = "ניהול · " + t("title"); $("sub").textContent = "ממשק ניהול"; } else $("adminToggle").textContent = t("manage");
  if (!issues.length && !$("status").dataset.done) $("status").textContent = t("loading");
  const Lb = $("langs"); Lb.innerHTML = "";
  const ls = el("select"); ls.setAttribute("aria-label", "🌐 " + T[lang].name);
  LANGS.forEach(l => { const o = el("option", null, T[l].name); o.value = l; if (l === lang) o.selected = true; ls.appendChild(o); });
  ls.onchange = () => { lang = ls.value; try { localStorage.setItem("lang", lang); } catch {} applyLang(); };
  Lb.appendChild(ls);
  renderBanner();
  const C = $("contact"); C.innerHTML = "";
  const items = [];
  if (CONTACT.email) { const a = el("a", null, "✉ " + CONTACT.email); a.href = "mailto:" + CONTACT.email; items.push(a); }
  if (CONTACT.site) { const a = el("a", null, "🌐 " + CONTACT.site.replace(/^https?:\/\//, "")); a.href = "https://" + CONTACT.site.replace(/^https?:\/\//, ""); a.target = "_blank"; a.rel = "noopener"; a.style.direction = "ltr"; items.push(a); }
  if (CONTACT.phone) { const a = el("a", null, "☎ " + CONTACT.phone); a.href = "tel:" + CONTACT.phone.replace(/[^+\d]/g, ""); a.style.direction = "ltr"; items.push(a); }
  if (CONTACT.whatsapp) { const a = el("a", null, "💬 " + t("wa")); a.href = "https://wa.me/" + CONTACT.whatsapp.replace(/\D/g, ""); a.target = "_blank"; a.rel = "noopener"; items.push(a); }
  if (CONTACT.address) items.push(el("span", null, "📍 " + CONTACT.address));
  C.hidden = !items.length;
  if (items.length) { C.appendChild(el("h3", null, t("contact"))); const w = el("div"); items.forEach(x => w.appendChild(x)); C.appendChild(w); }
  applyInstall(); if (!ADMIN_PAGE) renderSubscribe(); adminPanel(); render();
}

$("q").oninput = e => { filter = e.target.value; render(); };

onAuthStateChanged(auth, async u => {
  user = u; isAdmin = false; editing = null;
  if (!ADMIN_PAGE) return; // באתר הציבורי אין ממשק ניהול
  if (unsubAdmins) { unsubAdmins(); unsubAdmins = null; } admins = [];
  if (u && u.email) { try { isAdmin = (await getDoc(doc(db, "admins", u.email.toLowerCase()))).exists(); } catch {} }
  if (isAdmin) unsubAdmins = onSnapshot(collection(db, "admins"), s => { admins = s.docs.map(d => ({ id: d.id, ...d.data() })); adminPanel(); });
  adminPanel(); render();
});
if (!ADMIN_PAGE) { focusId = hashId(); window.addEventListener("hashchange", () => { focusId = hashId(); render(); }); loadSages().then(() => render()).catch(() => {}); }
applyLang();
onSnapshot(query(collection(db, "issues"), orderBy("date", "desc")),
  s => { const next = s.docs.map(d => ({ id: d.id, ...d.data() })), same = $("status").dataset.done && onlyCountersChanged(issues, next); issues = next; $("status").dataset.done = 1; if (same) return; render(); if (ADMIN_PAGE && adminTab === "list") adminPanel(); enrichYears(); },
  () => { $("status").dataset.done = 1; $("status").textContent = t("err"); });

document.addEventListener("visibilitychange", () => { if (!document.hidden && typeof view !== "undefined" && view === "halacha") render(); });
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
