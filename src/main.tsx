import React, {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.addEventListener('error', (e) => {
  console.error('[Global Error]', e.message, e.filename, e.lineno, e.colno, e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[Unhandled Rejection]', e.reason);
});

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    const handle = (e: ErrorEvent) => setError(e.error);
    const handleRejection = (e: PromiseRejectionEvent) => setError(e.reason);
    window.addEventListener('error', handle);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handle);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  if (error) {
    return (
      <div style={{ padding: 40, color: 'red', background: 'black', fontFamily: 'monospace' }}>
        <h1>Runtime Error</h1>
        <pre>{error.toString()}</pre>
        <pre>{error.stack}</pre>
      </div>
    );
  }
  return children;
};

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
