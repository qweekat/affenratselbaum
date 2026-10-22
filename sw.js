/* Keeps Daily Helper working with no signal. App pages come from the phone's copy first and refresh in the background;
   fonts and the label reader are kept after their first download. Version changes with every build. */
const CACHE = "dh-phone-c529b80892";
const FILES = ["./", "index.html", "pantry.html", "checker.html", "manifest.webmanifest", "icon-180.png", "icon-512.png", "qrcode.js"];
self.addEventListener("install", e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())); });
self.addEventListener("activate", e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch", e=>{
  const r = e.request; if(r.method!=="GET") return;
  const u = new URL(r.url), same = u.origin===location.origin;
  // Pages opened with ?do=... or ?view=... are the same page; look them up without the query.
  const key = same ? new Request(u.origin + u.pathname) : r;
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit = await c.match(key);
    const net = fetch(r).then(res=>{ if(res && (res.ok || res.type==="opaque")) c.put(key, res.clone()); return res; }).catch(()=>null);
    if(hit){ e.waitUntil(net); return hit; }
    return (await net) || (await c.match(new Request(u.origin + u.pathname.replace(/[^/]*$/, "")))) || Response.error();
  }));
});
