import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent uncaught errors and promise rejections from bubbling unhandled
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('Suppressed unhandled rejection:', event.reason);
    event.preventDefault();
  });

  window.addEventListener('error', (event) => {
    console.warn('Suppressed global uncaught error:', event.error || event.message);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
