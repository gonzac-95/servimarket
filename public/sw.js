/* ServiMarket — service worker
 * Por ahora sólo maneja notificaciones push (web push con VAPID).
 * No cachea nada: la app siempre se carga desde la red.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; }
  catch { d = { title: "ServiMarket", body: event.data ? event.data.text() : "" }; }
  const title = d.title || "ServiMarket";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: d.body || "",
      icon: "/icon-192.png",
      badge: "/badge-96.png",
      tag: d.tag || undefined,
      renotify: !!d.tag,
      data: { url: d.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil((async () => {
    const url = new URL(target, self.location.origin);
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of windows) {
      if (new URL(w.url).origin === url.origin) {
        await w.focus();
        if ("navigate" in w) await w.navigate(url.href);
        return;
      }
    }
    await self.clients.openWindow(url.href);
  })());
});
