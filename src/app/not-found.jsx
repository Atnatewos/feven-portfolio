// File: src/app/not-found.jsx
import Link from 'next/link';
import { getConfig } from '../../lib/config';
import GlowButton from '../../components/ui/GlowButton';

/**
 * Custom 404 page — dark cyberpunk theme.
 *
 * Features:
 * - Large neon "404" with glow effect
 * - Config-driven title and description
 * - Glow button to return home
 *
 * All text from config/notFound.json via getConfig().
 */
export default function NotFound() {
  const code = getConfig('notFound.code') || '404';
  const title = getConfig('notFound.title')?.en || 'Page Not Found';
  const description = getConfig('notFound.description')?.en || 'The page you are looking for does not exist.';
  const buttonText = getConfig('notFound.buttonText')?.en || 'Go Home';

  return (
    <section className="not-found-page">
      <div className="not-found-container">
        <h1 className="not-found-code">{code}</h1>
        <div className="not-found-divider" />
        <h2 className="not-found-title">{title}</h2>
        <p className="not-found-description">{description}</p>
        <GlowButton href="/" variant="primary" size="lg">
          {buttonText}
        </GlowButton>
      </div>
    </section>
  );
}