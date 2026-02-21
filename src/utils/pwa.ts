// PWA utility functions for service worker updates and installation
export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // vite-plugin-pwa handles service worker registration automatically
      // This file is for additional PWA functionality if needed
    });
  }
}

// Check if app is installed
export function isInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true ||
         document.referrer.includes('android-app://');
}

// Show install prompt (if available)
export function showInstallPrompt(): Promise<boolean> {
  return new Promise((resolve) => {
    const deferredPrompt = (window as any).deferredPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        (window as any).deferredPrompt = null;
        resolve(choiceResult.outcome === 'accepted');
      });
    } else {
      resolve(false);
    }
  });
}

// Listen for beforeinstallprompt event
export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as any).deferredPrompt = e;
  });
}

