// File: components/ui/GlowButton.jsx
import Link from 'next/link';
import './GlowButton.css';

/**
 * GlowButton — a button with animated neon glow shadow.
 *
 * Used throughout the dark cyberpunk theme for primary CTAs,
 * filter pills, and interactive elements that need visual pop.
 *
 * Variants map to category colors from the design system:
 * - primary: Neon Magenta/Pink
 * - secondary: Electric Cyan/Blue
 * - accent: Mint/Neon Green
 * - animation: Bright Teal
 * - architecture: Sky Blue
 * - design: Magenta
 *
 * @param {Object}        props
 * @param {string}        [props.variant='primary'] - Color variant
 * @param {string}        [props.size='md']         - Size (sm, md, lg)
 * @param {string}        [props.href]              - If provided, renders as Next.js Link
 * @param {Function}      [props.onClick]           - Click handler for button mode
 * @param {boolean}       [props.disabled=false]    - Disabled state
 * @param {React.ReactNode} props.children          - Button content
 * @param {string}        [props.className]         - Additional CSS classes
 */
export default function GlowButton({
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  disabled = false,
  children,
  className = '',
  ...props
}) {
  const classes = [
    'glow-btn',
    `glow-btn-${variant}`,
    `glow-btn-${size}`,
    className,
  ].filter(Boolean).join(' ');

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
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}