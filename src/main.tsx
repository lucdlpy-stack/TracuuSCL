import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA mobile installability
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('EVN PWA ServiceWorker registered:', reg.scope))
      .catch((err) => console.log('ServiceWorker registration failed:', err));
  });
}

createRoot(document.getElementById('root')!).render(<App />);
