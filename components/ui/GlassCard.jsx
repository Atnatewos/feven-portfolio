// File: components/ui/GlassCard.jsx
import './GlassCard.css';

/**
 * GlassCard — a glassmorphism card wrapper.
 *
 * Provides the frosted glass effect used throughout the dark theme.
 * Supports hover lift, glow borders, and customizable padding.
 *
 * @param {Object}        props
 * @param {React.ReactNode} props.children   - Card content
 * @param {string}        [props.className]  - Additional CSS classes
 * @param {string}        [props.glowColor]  - Glow color on hover (animation, architecture, design)
 * @param {boolean}       [props.hoverable]  - Whether the card lifts on hover
 * @param {Function}      [props.onClick]    - Click handler
 * @param {string}        [props.padding]    - Custom padding override
 */
export default function GlassCard({
  children,
  className = '',
  glowColor = '',
  hoverable = true,
  onClick,
  padding = '',
  ...props
}) {
  const classes = [
    'glass-card',
    hoverable && 'glass-card-hoverable',
    glowColor && `glass-card-glow-${glowColor}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onClick={onClick}
      style={padding ? { padding } : {}}
      {...props}
    >
      {children}
    </div>
  );
}