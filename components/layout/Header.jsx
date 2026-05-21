// File: components/layout/Header.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getBranding, getPublicRoute, getConfig } from '../../lib/config';
import './Header.css';

/**
 * Public site header — dark cyberpunk theme.
 *
 * Layout:
 * - Left: Browser-style window controls (red, yellow, green dots)
 * - Center: Logo
 * - Right: Navigation links + social icons + hamburger menu
 *
 * All labels, links, and social URLs come from config files.
 * Active route detection highlights the current page with a neon dot.
 */
export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const branding = getBranding();
  const socialLinks = getConfig('footer.social') || {};

  const siteName = branding.siteName || 'Portfolio';
  const logoUrl = branding.logo?.light || '';
  const logoAlt = branding.logo?.alt || `${siteName} logo`;

  const socialIcons = {
    instagram: { icon: '📷', label: 'Instagram' },
    youtube: { icon: '▶️', label: 'YouTube' },
    linkedin: { icon: '💼', label: 'LinkedIn' },
    telegram: { icon: '📨', label: 'Telegram' },
    facebook: { icon: '👤', label: 'Facebook' },
    tiktok: { icon: '🎵', label: 'TikTok' },
    behance: { icon: '🎨', label: 'Behance' },
    vimeo: { icon: '🎬', label: 'Vimeo' },
  };

  const activeSocials = Object.entries(socialLinks || {})
    .filter(([key, value]) => {
      if (key === 'phone' || key === 'email') return false;
      if (!value) return false;
      const url = typeof value === 'object' ? value.url : value;
      return Boolean(url);
    })
    .slice(0, 4);

  const navItems = [
    { id: 'home', href: getPublicRoute('home'), label: 'Home' },
    { id: 'work', href: getPublicRoute('work'), label: 'Work' },
    { id: 'showreel', href: getPublicRoute('showreel'), label: 'Showreel' },
    { id: 'about', href: getPublicRoute('about'), label: 'About' },
    { id: 'process', href: getPublicRoute('process'), label: 'Process' },
    { id: 'blog', href: getPublicRoute('blog'), label: 'Blog' },
    { id: 'contact', href: getPublicRoute('contact'), label: 'Contact' },
  ];

  /**
   * Detects if the current pathname matches a navigation item.
   * Home is only active on exact match '/'.
   * Other routes match by prefix.
   */
  function isActive(href) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  /**
   * Tracks scroll position to add glassmorphism blur to header.
   */
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * Prevents body scroll when mobile menu is open.
   */
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);


  return (
    <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
      <div className="header-inner">
        {/* Left: Window controls + Logo together */}
        <div className="header-left">
          <div className="header-window-controls">
            <span className="header-window-dot dot-red" />
            <span className="header-window-dot dot-yellow" />
            <span className="header-window-dot dot-green" />
          </div>

          <Link href={getPublicRoute('home')} className="header-logo">
            {logoUrl ? (
              <img src={logoUrl} alt={logoAlt} className="header-logo-img" />
            ) : (
              <span className="header-logo-text">{siteName}</span>
            )}
          </Link>
        </div>

        {/* Right: Navigation + Socials + Hamburger */}
        <div className="header-right">
          <nav className={`header-nav ${isMenuOpen ? 'header-nav-open' : ''}`}>
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`header-nav-link ${isActive(item.href) ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
                {isActive(item.href) && <span className="header-nav-active-dot" />}
              </Link>
            ))}
          </nav>

          <div className="header-social-icons">
            {activeSocials.map(([platform, value]) => {
              const url = typeof value === 'object' ? value.url : value;
              const iconData = socialIcons[platform] || { icon: '🔗', label: platform };
              return (
                <a
                  key={platform}
                  href={url}
                  className="header-social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={iconData.label}
                  title={iconData.label}
                >
                  {iconData.icon}
                </a>
              );
            })}
          </div>

          <button
            className={`header-hamburger ${isMenuOpen ? 'active' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            type="button"
          >
            <span className="header-hamburger-line" />
            <span className="header-hamburger-line" />
            <span className="header-hamburger-line" />
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="header-mobile-overlay" onClick={() => setIsMenuOpen(false)} />
      )}
    </header>
  );
}