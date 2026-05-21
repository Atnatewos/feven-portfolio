// File: src/app/error.jsx
'use client';

import { useEffect } from 'react';

/**
 * Global error boundary.
 * Catches unhandled errors in the component tree.
 * Stays at root level to catch errors from all route groups.
 */
export default function ErrorPage({ error, reset }) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <h1 className="not-found-code">500</h1>
        <h2 className="not-found-title">Something went wrong</h2>
        <p className="not-found-description">
          An unexpected error occurred. Please try again or return to the homepage.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset} className="not-found-button">
            Try Again
          </button>
          <a href="/" className="not-found-button" style={{ background: 'transparent', border: '2px solid var(--color-primary, #6366F1)', color: 'var(--color-primary, #6366F1)' }}>
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}