// File: components/admin/AdminSidebar.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getConfig } from '../../lib/config';
import './AdminSidebar.css';

/**
 * Unified AdminSidebar component — used by ALL admin pages.
 *
 * This is the single source of truth for the admin navigation sidebar.
 * Every admin page (Dashboard, Projects, Blog, Contacts, Media, Settings)
 * imports this component instead of defining their own.
 *
 * Features:
 * - Responsive: full sidebar on desktop, slide-in drawer on tablet/mobile
 * - Active route highlighting
 * - Unread contact badge
 * - Mobile toggle button with overlay
 * - Auto-closes on route change
 * - Sign out functionality
 *
 * @param {Object}  props
 * @param {number}  [props.unreadCount=0] - Number of unread contact messages
 * @param {boolean} [props.showToggle=true] - Whether to show the mobile menu toggle
 */
export default function AdminSidebar({ unreadCount = 0, showToggle = true }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const brandText = getConfig('admin.sidebar.brandText') || 'Admin';
  const brandIcon = getConfig('admin.sidebar.brandIcon') || 'A';
  const navItems = getConfig('admin.sidebar.navItems') || [];
  const viewSiteLabel = getConfig('admin.sidebar.viewSiteLabel') || 'View Website';
  const signOutLabel = getConfig('admin.sidebar.signOutLabel') || 'Sign Out';
  const footerText = getConfig('admin.sidebar.footerText') || 'Portfolio CMS';

  /**
   * Determines whether a navigation item matches the current route.
   */
  function isActive(href) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  /**
   * Closes the mobile sidebar when the route changes.
   */
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  /**
   * Prevents body scroll when mobile sidebar is open.
   */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /**
   * Clears authentication and redirects to login.
   */
  function handleLogout() {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  }

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      {showToggle && (
        <button
          className="admin-menu-toggle"
          onClick={toggleSidebar}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          type="button"
        >
          {isOpen ? '✕' : '☰'}
        </button>
      )}

      {/* Mobile Overlay */}
      <div
        className={`admin-sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-brand-icon">{brandIcon}</div>
          {brandText}
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-sidebar-section">Main Menu</div>

          {navItems.map((item) => (
            <Link
              key={item.id || item.href}
              href={item.href}
              className={`admin-sidebar-link ${isActive(item.href) ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="admin-sidebar-icon">{item.icon || '📄'}</span>
              {item.label || 'Page'}
              {item.id === 'contacts' && unreadCount > 0 && (
                <span className="admin-sidebar-badge">{unreadCount}</span>
              )}
            </Link>
          ))}

          <div className="admin-sidebar-section">Quick Links</div>

          <Link
            href="/"
            className="admin-sidebar-link"
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeSidebar}
          >
            <span className="admin-sidebar-icon">🔗</span>
            {viewSiteLabel}
          </Link>

          <button
            onClick={handleLogout}
            className="admin-sidebar-link"
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              fontFamily: 'inherit',
            }}
          >
            <span className="admin-sidebar-icon">🚪</span>
            {signOutLabel}
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <p
            style={{
              fontSize: '11px',
              color: 'var(--admin-text-muted)',
              textAlign: 'center',
            }}
          >
            {footerText}
          </p>
        </div>
      </aside>
    </>
  );
}