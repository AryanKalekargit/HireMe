'use client';

import React, { useState, useEffect } from 'react';

export function PwaInstallButton({ className = '' }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Detect standalone PWA mode
    if (typeof window !== 'undefined') {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(standalone);

      // Detect iOS Safari
      const ua = window.navigator.userAgent;
      const isApple = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
      setIsIOS(isApple);
    }

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
    };
  }, []);

  // If already installed and running standalone, do not show button
  if (isStandalone) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[HireMe PWA] User accepted the install prompt');
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(!showIOSGuide);
    }
  };

  // Only show if we have an install prompt or on iOS mobile
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        type="button"
        onClick={handleInstallClick}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-primary-container/20 via-indigo-600/15 to-purple-600/15 border border-primary/30 text-white hover:bg-primary-container/30 transition-all text-xs font-semibold shadow-sm active:scale-95"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary-container/40 border border-primary/30 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-base">install_mobile</span>
          </div>
          <div className="text-left">
            <span className="block font-bold text-white leading-tight">Install HireMe App</span>
            <span className="text-[10px] text-primary leading-tight">Add to Home Screen</span>
          </div>
        </div>
        <span className="material-symbols-outlined text-base text-primary">add_to_home_screen</span>
      </button>

      {showIOSGuide && (
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[10.5px] text-slate-300 leading-snug space-y-1 animate-fade-in">
          <p className="font-semibold text-white">To install on iPhone / iPad:</p>
          <p>1. Tap the <strong className="text-sky-300">Share</strong> icon at the bottom of Safari.</p>
          <p>2. Scroll down and tap <strong className="text-sky-300">Add to Home Screen</strong>.</p>
        </div>
      )}
    </div>
  );
}

export default PwaInstallButton;
