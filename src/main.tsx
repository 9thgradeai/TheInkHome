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
  const [errorId] = React.useState(() => Math.random().toString(36).substr(2, 9));
  
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
      <div style={{ 
        padding: '40px 20px', 
        color: '#ffffff', 
        background: '#08080a', 
        fontFamily: 'Inter, system-ui, sans-serif',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px', fontWeight: '600' }}>Something went wrong</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px', maxWidth: '400px' }}>
          We're sorry for the inconvenience. Please refresh the page to try again.
        </p>
        {isProd && (
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
            Error ID: {errorId}
          </p>
        )}
        <button 
          onClick={() => window.location.reload()} 
          style={{
            marginTop: '24px',
            padding: '10px 24px',
            background: '#c8ff4d',
            color: '#000000',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Refresh Page
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
