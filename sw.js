const CACHE = "promeza-v38";
const ASSETS = [
  "./", "./index.html", "./styles.css",
  "./data.js", "./i18n.js", "./airtable.js",
  "./ui.jsx", "./auth.jsx", "./shell.jsx", "./map.jsx", "./home.jsx",
  "./lists.jsx", "./profile.jsx", "./forms.jsx", "./duplicates.jsx",
  "./interactions.jsx", "./tasks.jsx", "./pipeline.jsx", "./projects.jsx",
  "./attachments.jsx", "./campaigns.jsx", "./calendar.jsx", "./goals.jsx",
  "./county.jsx", "./app.jsx", "./msal-browser.min.js",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)); }
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
