import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Register the service worker relative to Vite's base path so it works
// on GitHub Pages project sites such as /1/, not only at the domain root.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const serviceWorkerUrl = new URL('sw.js', new URL(import.meta.env.BASE_URL, window.location.href));
    navigator.serviceWorker.register(serviceWorkerUrl.href).catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}
