import React, {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const isProd = import.meta.env.PROD;

window.addEventListener('error', (e) => {
  if (!isProd) {
    console.error('[Global Error]', e.message);
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (!isProd) {
    console.error('[Unhandled Rejection]', e.reason);
  }
  e.preventDefault();
});

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = React.useState(false);
  const [errorId] = React.useState(() => Math.random().toString(36).slice(2, 11));
  
  React.useEffect(() => {
    const handle = (e: ErrorEvent) => {
      if (!isProd) {
        console.error('Error:', e.error);
      }
      setHasError(true);
    };
    const handleRejection = (e: PromiseRejectionEvent) => {
      if (!isProd) {
        console.error('Rejection:', e.reason);
      }
      setHasError(true);
      e.preventDefault();
    };
    window.addEventListener('error', handle);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handle);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div
        style={{
          padding: "40px 20px",
          color: "var(--ink)",
          background: "var(--paper)",
          fontFamily: '"Inter", system-ui, sans-serif',
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            margin: "0 0 16px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          Something went wrong
        </h1>
        <p style={{ color: "var(--ink-soft)", margin: "0 0 24px", maxWidth: "420px", lineHeight: 1.6 }}>
          The page hit an unexpected error. A refresh usually clears it — your saved stories and
          drafts stay on this device.
        </p>
        {isProd && (
          <p style={{ fontSize: "12px", color: "var(--ink-faint)", fontFamily: "monospace" }}>
            Error ID: {errorId}
          </p>
        )}
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: "24px",
            padding: "11px 26px",
            background: "var(--accent)",
            color: "var(--on-accent)",
            border: "none",
            borderRadius: "999px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          Refresh page
        </button>
      </div>
    );
  }
  return children;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
