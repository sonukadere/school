if (import.meta.env.DEV) {
  import("react-grab");
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Auto-recover from dynamic import chunk load failures caused by new deployments
window.addEventListener('vite:preloadError', () => {
  console.warn('[Vite] Chunk loading failed. Refreshing to load newest deployment...');
  window.location.reload();
});

window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Loading chunk')
  ) {
    const reloadKey = 'sms_chunk_recovery_reloaded';
    if (!sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, 'true');
      window.location.reload();
    }
  }
});

// Reset reload recovery guard after startup
setTimeout(() => {
  try {
    sessionStorage.removeItem('sms_chunk_recovery_reloaded');
  } catch {}
}, 5000);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
