// Must be first import to suppress all console output before other modules initialize
import './silenceConsole';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import amplifyClient to ensure Amplify is configured before app starts
// Dynamically load amplifyClient before rendering to avoid Vite prebundle/export-shape issues
(async () => {
  await import('./utils/amplifyClient');

  // Remove StrictMode to prevent double useEffect calls that can interfere with auth
  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  );
})();
