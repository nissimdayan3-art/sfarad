const C='sefarad-v1.36.6';
// התראות Push (FCM): אם הטעינה נכשלת (למשל בלי רשת) – ה-SW ממשיך לעבוד כרגיל
try{importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js','https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js','/__/firebase/init.js');firebase.messaging()}catch(e){}
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['/','/manifest.webmanifest','/logo.jpg','/logo-band.png','/theme.css'])));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  // לא נוגעים בבקשות שאינן GET, בדומיינים אחרים, ובדפי השרת: שיתוף (/i/), הסרה (/u/), אישור (/c/) וכניסה (/__/)
  if(e.request.method!=='GET'||u.origin!==location.origin||/^\/(i|u|c|__)\//.test(u.pathname)||/^\/(archive|sitemap\.xml|rss\.xml)$/.test(u.pathname))return;
  e.respondWith(fetch(e.request).then(r=>{if(r.status===200){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp)).catch(()=>{})}return r}).catch(()=>caches.match(e.request)));
});
