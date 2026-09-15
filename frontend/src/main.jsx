import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// Register PWA Service Worker for offline support & automatic updates
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New version of Steve Budget available, updating...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('Steve Budget is ready to work offline!');
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
