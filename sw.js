/* صدى — Service Worker: يخزّن واجهة التطبيق ليعمل بلا إنترنت ويفتح أسرع. غيّر الرقم لإجبار التحديث. */
const VER = 'sada-v57';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(VER).then(c=>c.addAll(SHELL).catch(()=>{})).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VER).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method!=='GET') return;
  const url = new URL(req.url);
  /* لا نتدخل في: الوسائط الكبيرة (تحتاج Range)، الإعدادات السحابية، قاعدة البيانات */
  if(req.headers.has('range')) return;
  if(url.origin===location.origin && (/\/media\//i.test(url.pathname) || /cloud\.json$/.test(url.pathname))) return;
  if(url.hostname.endsWith('supabase.co') || /\/(rest|storage|auth)\/v1\//.test(url.pathname)) return;
  /* صفحة التطبيق: الشبكة أولاً (لتصلك التحديثات) ثم النسخة المخزّنة عند انقطاع الإنترنت */
  if(req.mode==='navigate' || (url.origin===location.origin && /\.(html|webmanifest)$/.test(url.pathname))){
    e.respondWith(fetch(req).then(r=>{ const cp=r.clone(); caches.open(VER).then(c=>c.put(req.mode==='navigate'?'index.html':req, cp)); return r; })
      .catch(()=>caches.match(req).then(m=>m||caches.match('index.html'))));
    return;
  }
  /* بقية الملفات (أيقونات، خطوط، مكتبة التنسيق): المخزّن أولاً ثم تحديثه بالخلفية */
  e.respondWith(caches.match(req).then(m=>{
    const net = fetch(req).then(r=>{ if(r && (r.ok||r.type==='opaque')){ const cp=r.clone(); caches.open(VER).then(c=>c.put(req, cp)); } return r; }).catch(()=>m);
    return m || net;
  }));
});
