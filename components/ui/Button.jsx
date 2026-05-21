import Link from 'next/link';
import './Button.css';

/**
 * Reusable Button component supporting multiple variants
 * @param {Object} props
 * @param {string} props.variant - 'primary' | 'secondary' | 'outline' | 'ghost'
 * @param {string} props.size - 'sm' | 'md' | 'lg'
 * @param {string} props.href - If provided, renders as Link
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.disabled - Disabled state
 * @param {React.ReactNode} props.children - Button content
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  disabled = false,
  children,
  className = '',
  ...props
}) {
  const classes = `btn btn-${variant} btn-${size} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}