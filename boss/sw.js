const CACHE = 'piano-boss-v1';
const URLS = ['/boss/index.html', '/assets/piano-theme.css', '/assets/common.js', '/assets/firebase-api.js', '/config/config.js', '/config/firebase.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(URLS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => { if(e.request.method!=='GET') return; e.respondWith(fetch(e.request).then(r=>{caches.open(CACHE).then(c=>c.put(e.request,r.clone()));return r;}).catch(()=>caches.match(e.request))); });
