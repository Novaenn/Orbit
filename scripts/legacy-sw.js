// Compatibility worker for the former /Orbit/sw.js registration.
// No fetch handler: the landing page always comes from the network.
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const scope = self.registration.scope
    const oldPath = new URL(scope).pathname
    await self.clients.claim()
    const windows = await self.clients.matchAll({ type: 'window' })

    // Refresh existing app tabs into their new location, retaining their tab
    // hash. Do not navigate unrelated pages or clear any local activity data.
    for (const client of windows) {
      const current = new URL(client.url)
      if (current.pathname !== oldPath && current.pathname !== `${oldPath}index.html`) continue
      const destination = new URL('app/', scope)
      destination.search = current.search
      destination.hash = current.hash
      // Navigation waits for activation to finish, so awaiting it here would
      // deadlock this activation event.
      void client.navigate(destination.href).catch(() => {})
    }

    // Only remove the old worker's precache, never the new app's offline cache
    // or caches belonging to another project on this domain.
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames
      .filter(name => name.startsWith('workbox-precache-') && name.endsWith(scope))
      .map(name => caches.delete(name)))
  })())
})
