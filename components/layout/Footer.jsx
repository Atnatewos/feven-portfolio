// File: components/layout/Footer.jsx
import { getConfig } from '../../lib/config';
import './Footer.css';

/**
 * Site footer — dark cyberpunk theme.
 *
 * Features:
 * - Centered minimal layout
 * - Social media icon row with neon hover effects
 * - Copyright text from config
 * - Subtle top border with gradient
 *
 * All content from config files via getConfig().
 */
export default function Footer({ lang = 'en' }) {
  const siteName = getConfig('branding.siteName');
  const currentYear = new Date().getFullYear();
  const socialLinks = getConfig('footer.social') || {};
  const socialLabels = getConfig('footer.socialLabels') || {};

  const socialIcons = {
    instagram: '📷',
    youtube: '▶️',
    linkedin: '💼',
    telegram: '📨',
    facebook: '👤',
    tiktok: '🎵',
    behance: '🎨',
    vimeo: '🎬',
  };

  const copyrightTemplate = getConfig('footer.copyright.template', lang, {
    year: currentYear,
    siteName,
  });

  const visibleSocials = Object.entries(socialLinks || {})
    .filter(([, value]) => {
      if (!value) return false;
      const url = typeof value === 'object' ? value.url : value;
      return Boolean(url);
    })
    .map(([platform, value]) => ({
      platform,
      url: typeof value === 'object' ? value.url : value,
      label: socialLabels?.[platform] || platform,
      icon: socialIcons[platform] || '🔗',
    }));

  return (
    <footer className="footer">
      <div className="footer-inner container">
        {visibleSocials.length > 0 && (
          <div className="footer-social-row">
            {visibleSocials.map((link) => (
              <a
                key={link.platform}
                href={link.url}
                className="footer-social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${link.label}`}
                title={link.label}
              >
                <span className="footer-social-icon">{link.icon}</span>
              </a>
            ))}
          </div>
        )}

        <p className="footer-copyright">{copyrightTemplate}</p>
      </div>
    </footer>
  );
}