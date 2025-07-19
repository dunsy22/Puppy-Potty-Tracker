import React from 'react';
import ReactDOM from 'react-dom/client';
import DogPottyTracker from './DogPottyTracker';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <DogPottyTracker />
  </React.StrictMode>
);

// Register the service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(console.error);
  });
}
