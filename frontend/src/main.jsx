import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
// Hide splash after first paint
requestAnimationFrame(() => setTimeout(() => window.__hideSplash?.(), 80));
