'use client';

import { useEffect } from 'react';

// Registers the app-shell service worker (public/sw.js) so a repeat visit,
// and the PWA installed shell, can render offline. Silently no-ops where
// service workers aren't supported (older Safari, some in-app browsers).
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}
