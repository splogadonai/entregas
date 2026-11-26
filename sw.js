// SPLOG service worker: deixa o app instalável, abre rápido e abre a tela mesmo sem sinal.
// Páginas do app: busca a versão mais nova na internet primeiro; se a internet demorar,
// abre a cópia guardada e atualiza por trás (a novidade aparece na próxima abertura).
// Bibliotecas com versão fixa (Firebase, jsPDF, fonte): guardadas no aparelho, abrem na hora.
// Os dados (Firebase) não passam por aqui.
const CACHE = "splog-v27";
const CDN = "splog-cdn-v1";                       // não muda com a versão do app: as URLs já têm versão
const SHELL = ["./", "./index.html", "./config.js", "./manifest.webmanifest", "./favicon.svg", "./icon-192.png", "./icon-512.png"];
const LIBS = [
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
];
const ESPERA = 3500;                              // ms de espera pela internet antes de abrir a cópia guardada

// guarda as bibliotecas sem travar a instalação (se falhar, guarda no primeiro uso)
const guardarLibs = () => caches.open(CDN).then(c => Promise.all(LIBS.map(u =>
  c.match(u).then(hit => hit || fetch(new Request(u, { mode: "no-cors" })).then(r => (r.ok || r.type === "opaque") && c.put(u, r))).catch(() => {}))));

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
  guardarLibs();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== CDN).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const LIB_HOST = url =>
  (url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/")) ||
  (url.hostname === "cdnjs.cloudflare.com" && url.pathname.startsWith("/ajax/libs/")) ||
  url.hostname === "fonts.gstatic.com";

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // bibliotecas e arquivos de fonte: do aparelho primeiro
  if (LIB_HOST(url)) {
    event.respondWith(caches.open(CDN).then(c => c.match(req.url).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === "opaque") c.put(req.url, res.clone());
      return res;
    }))));
    return;
  }
  // folha de estilo da fonte: usa a guardada e atualiza por trás
  if (url.hostname === "fonts.googleapis.com") {
    event.respondWith(caches.open(CDN).then(c => c.match(req.url).then(hit => {
      const net = fetch(req).then(res => { if (res.ok || res.type === "opaque") c.put(req.url, res.clone()); return res; });
      if (hit) { event.waitUntil(net.catch(() => {})); return hit; }
      return net;
    })));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // arquivos do app: internet primeiro, com limite de espera quando já existe cópia guardada
  const net = fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  });
  event.waitUntil(net.catch(() => {}));
  const fallback = () => caches.match(req).then(hit => hit || (req.mode === "navigate" ? caches.match("./index.html") : undefined));
  event.respondWith(new Promise(resolve => {
    let done = false;
    const finish = r => { if (!done && r) { done = true; resolve(r); } };
    const timer = setTimeout(() => fallback().then(finish), ESPERA);
    net.then(r => { clearTimeout(timer); finish(r); })
      .catch(() => { clearTimeout(timer); fallback().then(hit => { finish(hit); if (!done) { done = true; resolve(Response.error()); } }); });
  }));
});
