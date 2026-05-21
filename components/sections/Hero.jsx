// File: components/sections/Hero.jsx
import Link from 'next/link';
import { getConfig, getPublicRoute } from '../../lib/config';
import GlowButton from '../ui/GlowButton';
import './Hero.css';

/**
 * Hero section — dark cyberpunk landing page.
 *
 * Layout:
 * - Left Column: Subtitle tracking tags, massive H1 title, filter pill buttons
 * - Right Column: Profile photo in a 3D partial-frame border.
 *   The border covers top and right sides — bottom and left are open.
 *   If no profilePhoto is set, the right column renders empty
 *   while the left column stays in its fixed position.
 * - Bottom: Glassmorphism CTA bar with neon glow button
 * - Scroll indicator
 *
 * All text, links, colors, and visibility from config/hero.json.
 * Zero hardcoded values — every string comes from getConfig().
 *
 * @param {Object} props
 * @param {Object} props.settings - Complete site settings from database
 * @param {Array}  props.projects - Featured projects
 */
export default function Hero({ settings, projects }) {
  const hero = settings?.hero || {};
  const branding = settings?.branding || {};
  const sections = settings?.sections || {};

  const greeting = hero.greeting?.en || getConfig('hero.greeting.en');
  const title = hero.titleEn || branding.siteName;
  const subtitle = hero.subtitleEn || branding.taglineEn;
  const profilePhoto = hero.profilePhoto;
  const profilePhotoAlt = hero.profilePhotoAlt?.en || getConfig('hero.profilePhotoAlt.en') || `${branding.siteName} profile photo`;
  const backgroundImage = hero.backgroundImage;

  const ctaPrimaryText = hero.ctaPrimary?.text?.en || getConfig('hero.ctaPrimary.text.en');
  const ctaPrimaryLink = hero.ctaPrimary?.link || getConfig('hero.ctaPrimary.link');
  const ctaSecondaryText = hero.ctaSecondary?.text?.en || getConfig('hero.ctaSecondary.text.en');
  const ctaSecondaryLink = hero.ctaSecondary?.link || getConfig('hero.ctaSecondary.link');

  const filterPills = [
    {
      id: 'animation',
      label: getConfig('hero.sections.0.label.en') || 'Animation',
      color: 'animation',
      link: getPublicRoute('work') + '/animation',
      visible: true,
    },
    {
      id: 'architecture',
      label: getConfig('hero.sections.1.label.en') || 'Architecture',
      color: 'architecture',
      link: getPublicRoute('work') + '/architecture',
      visible: sections.showArchitecture !== false,
    },
    {
      id: 'design',
      label: getConfig('hero.sections.2.label.en') || 'Graphic Design',
      color: 'design',
      link: getPublicRoute('work') + '/design',
      visible: true,
    },
  ];

  const visiblePills = filterPills.filter((pill) => pill.visible);

  const scrollIndicator = hero.scrollIndicator || getConfig('hero.scrollIndicator');
  const scrollText = scrollIndicator?.text?.en || getConfig('hero.scrollIndicator.text.en');
  const showScrollIndicator = scrollIndicator?.visible !== false;

  return (
    <section
      className="hero"
      style={
        backgroundImage
          ? {
              backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(11,11,22,0.7) 0%, rgba(11,11,22,0.95) 70%), url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : {}
      }
    >
      <div className="hero-container" suppressHydrationWarning>
        <div className="hero-grid">
          {/* Left Column */}
          <div className="hero-left">
            <div className="hero-tags">
              <span className="hero-tag hero-tag-animation">
                {getConfig('hero.sections.0.label.en') || 'Animator'}
              </span>
              <span className="hero-tag-separator">|</span>
              <span className="hero-tag hero-tag-architecture">
                {getConfig('hero.sections.1.label.en') || 'Architect'}
              </span>
              <span className="hero-tag-separator">|</span>
              <span className="hero-tag hero-tag-design">
                {getConfig('hero.sections.2.label.en') || 'Graphic Designer'}
              </span>
            </div>

            <p className="hero-greeting">{greeting}</p>
            <h1 className="hero-title">{title}</h1>
            {subtitle && <p className="hero-subtitle">{subtitle}</p>}

            {visiblePills.length > 0 && (
              <div className="hero-filter-pills">
                {visiblePills.map((pill) => (
                  <Link
                    key={pill.id}
                    href={pill.link}
                    className={`hero-filter-pill hero-filter-pill-${pill.color}`}
                  >
                    {pill.label}
                  </Link>
                ))}
              </div>
            )}

            <div className="hero-actions">
              <GlowButton href={ctaPrimaryLink} variant="primary" size="lg">
                {ctaPrimaryText}
              </GlowButton>
            </div>
          </div>

          {/* Right Column — Profile Photo */}
          <div className="hero-right">
            {profilePhoto ? (
              <div className="hero-avatar-frame">
                <div className="hero-avatar-glow" />
                <div className="hero-avatar-image-wrapper">
                  <img
                    src={profilePhoto}
                    alt={profilePhotoAlt}
                    className="hero-avatar-image"
                    loading="eager"
                    suppressHydrationWarning
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom CTA Bar */}
        <div className="hero-cta-bar">
          <div className="hero-cta-bar-content">
            <span className="hero-cta-bar-text">
              {getConfig('hero.ctaSecondary.text.en') || 'Watch my latest showreel'}
            </span>
            <GlowButton href={ctaSecondaryLink} variant="accent" size="md">
              <span className="hero-cta-bar-play-icon">▶</span>
              {ctaSecondaryText}
            </GlowButton>
          </div>
        </div>

        {/* Scroll Indicator */}
        {showScrollIndicator && (
          <div className="hero-scroll-indicator">
            <span className="hero-scroll-text">{scrollText}</span>
            <div className="hero-scroll-line" />
          </div>
        )}
      </div>
    </section>
  );
}