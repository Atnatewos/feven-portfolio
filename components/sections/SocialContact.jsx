// File: components/sections/SocialContact.jsx
import { getConfig } from '../../lib/config';
import './SocialContact.css';

/**
 * Social media and contact links component for the public Contact page.
 *
 * Architecture:
 * - Phone numbers: displayed as cards in a grid (multiple supported)
 * - Email: displayed inline above the contact form (not as a card)
 * - Social media (Instagram, YouTube, LinkedIn, etc.): displayed as cards in a grid
 *
 * Only platforms with configured URLs appear. If a platform is not filled
 * in the admin Settings → Social tab, it is completely hidden.
 *
 * Data format: { platform: { url: "...", displayName: "..." } }
 * Backward compatible with old plain-string format.
 *
 * @param {Object} props
 * @param {Object} props.links    - Social links from database
 * @param {Object} props.settings - Full site settings (fallback)
 */
export default function SocialContact({ links, settings }) {
  const socialLinks = links || settings?.social || getConfig('footer.social') || {};
  const platforms = getConfig('social.platforms') || [];

  /**
   * Builds the correct href attribute for each platform.
   */
  function buildHref(url, platform) {
    if (!url) return '#';
    if (platform === 'phone') {
      const cleaned = url.replace(/[\s\-()]/g, '');
      return `tel:${cleaned}`;
    }
    if (platform === 'email') return `mailto:${url}`;
    return url;
  }

  /**
   * Splits a comma-separated string into individual values.
   * Only operates on strings — returns empty array for objects or null.
   */
  function splitMultipleValues(value) {
    if (!value) return [];
    if (typeof value !== 'string') return [];
    return value.split(',').map((v) => v.trim()).filter(Boolean);
  }

  function getLinkTarget(platform) {
    return platform === 'phone' || platform === 'email' ? '_self' : '_blank';
  }

  function getLinkRel(platform) {
    return platform === 'phone' || platform === 'email' ? '' : 'noopener noreferrer';
  }

  /**
   * Safely extracts URL and display name from a social link value.
   * Supports both old plain-string format and new { url, displayName } object.
   */
  function extractValueData(value) {
    if (!value) return { url: '', displayName: '' };

    if (typeof value === 'object' && value !== null) {
      return {
        url: value.url || '',
        displayName: value.displayName || value.url || '',
      };
    }

    return { url: value, displayName: value };
  }

  /**
   * Checks if a platform has a configured URL.
   * Returns false for empty strings, null, undefined, and objects with empty url.
   */
  function hasValue(value) {
    if (!value) return false;
    if (typeof value === 'object') return Boolean(value.url);
    return Boolean(value);
  }

  /*
   * Separate platforms into categories for different display treatments.
   * - Phone: cards (can have multiple numbers)
   * - Email: inline display above the contact form
   * - Social media: cards in a grid
   */
  const phonePlatforms = [];
  const emailItems = [];
  const socialPlatforms = [];

  platforms.forEach((platform) => {
    const value = socialLinks[platform.id];
    if (!hasValue(value)) return;

    const { url, displayName } = extractValueData(value);
    if (!url) return;

    if (platform.id === 'phone') {
      const urls = splitMultipleValues(url);
      const names = splitMultipleValues(displayName);

      urls.forEach((singleUrl, index) => {
        phonePlatforms.push({
          id: `${platform.id}-${index}`,
          platform: platform.id,
          label: platform.label,
          icon: platform.icon,
          url: singleUrl,
          href: buildHref(singleUrl, platform.id),
          displayName: names[index] || singleUrl,
          target: getLinkTarget(platform.id),
          rel: getLinkRel(platform.id),
        });
      });
      return;
    }

    if (platform.id === 'email') {
      emailItems.push({
        id: platform.id,
        platform: platform.id,
        label: platform.label,
        icon: platform.icon,
        url,
        href: buildHref(url, platform.id),
        displayName,
        target: getLinkTarget(platform.id),
        rel: getLinkRel(platform.id),
      });
      return;
    }

    socialPlatforms.push({
      id: platform.id,
      platform: platform.id,
      label: platform.label,
      icon: platform.icon,
      url,
      href: buildHref(url, platform.id),
      displayName,
      target: getLinkTarget(platform.id),
      rel: getLinkRel(platform.id),
    });
  });

  const hasAnyContent = phonePlatforms.length > 0 || emailItems.length > 0 || socialPlatforms.length > 0;

  if (!hasAnyContent) {
    return null;
  }

  return (
    <div className="social-contact-wrapper">
      {/* Phone numbers — displayed as cards */}
      {phonePlatforms.length > 0 && (
        <div className="social-contact-grid">
          {phonePlatforms.map((item, index) => (
            <a
              key={item.id}
              href={item.href}
              className="social-contact-item"
              target={item.target}
              rel={item.rel}
              aria-label={`Call ${item.displayName}`}
            >
              <span className="social-contact-icon" aria-hidden="true">{item.icon}</span>
              <div className="social-contact-info">
                <span className="social-contact-label">{item.label}</span>
                <span className="social-contact-value">{item.displayName}</span>
              </div>
              <span className="social-contact-arrow" aria-hidden="true">→</span>
            </a>
          ))}
        </div>
      )}

      {/* Social media platforms — displayed as cards */}
      {socialPlatforms.length > 0 && (
        <div className="social-contact-grid">
          {socialPlatforms.map((item, index) => (
            <a
              key={item.id}
              href={item.href}
              className="social-contact-item"
              target={item.target}
              rel={item.rel}
              aria-label={`Visit ${item.label}: ${item.displayName}`}
            >
              <span className="social-contact-icon" aria-hidden="true">{item.icon}</span>
              <div className="social-contact-info">
                <span className="social-contact-label">{item.label}</span>
                <span className="social-contact-value">{item.displayName}</span>
              </div>
              <span className="social-contact-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      )}

      {/* Email — displayed inline, not as a card */}
      {emailItems.length > 0 && (
        <div className="social-contact-email">
          {emailItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="social-contact-email-link"
              target={item.target}
              rel={item.rel}
              aria-label={`Email ${item.displayName}`}
            >
              <span className="social-contact-email-icon" aria-hidden="true">{item.icon}</span>
              <span className="social-contact-email-text">{item.displayName}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}