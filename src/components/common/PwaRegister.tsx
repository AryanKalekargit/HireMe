'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[HireMe PWA] Active service worker scope:', reg.scope);
          })
          .catch((err) => {
            console.error('[HireMe PWA] Service worker registration error:', err);
          });
      });
    }
  }, []);

  return null;
}

export default PwaRegister;
