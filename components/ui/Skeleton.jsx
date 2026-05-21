import './Skeleton.css';

/**
 * Skeleton loader placeholder for async content
 * @param {Object} props
 * @param {string} props.width - Width of skeleton
 * @param {string} props.height - Height of skeleton
 * @param {string} props.borderRadius - Border radius
 */
export default function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-md)',
}) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
}