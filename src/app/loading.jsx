// File: src/app/loading.jsx
/**
 * Global loading state for page transitions.
 * Stays at root level to work across all route groups.
 */
export default function Loading() {
  return (
    <div className="loading-page">
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Loading...</p>
      </div>
    </div>
  );
}