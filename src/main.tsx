import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Register relative to Vite's base path and explicitly check for updates
// so installed iPhone versions pick up new game screens promptly.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const serviceWorkerUrl = new URL('sw.js', new URL(import.meta.env.BASE_URL, window.location.href));
    try {
      const registration = await navigator.serviceWorker.register(serviceWorkerUrl.href, {
        updateViaCache: 'none',
      });
      await registration.update();
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    } catch (error) {
      console.error('Service worker registration/update failed:', error);
    }
  });
}
