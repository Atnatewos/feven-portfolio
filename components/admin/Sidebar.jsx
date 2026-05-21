'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './Sidebar.css';

/**
 * Admin sidebar navigation
 * Highlights current active page
 */
export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: '📊' },
    { label: 'Projects', href: '/admin/projects', icon: '🎬' },
    { label: 'Blog', href: '/admin/blog', icon: '📝' },
    { label: 'Media', href: '/admin/media', icon: '🖼️' },
    { label: 'Contacts', href: '/admin/contacts', icon: '📧' },
    { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
    { label: 'Languages', href: '/admin/languages', icon: '🌐' },
  ];

  /**
   * Handles logout by clearing auth cookie
   */
  async function handleLogout() {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  /**
   * Determines if a nav item is the current active page
   */
  function isActive(href) {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">Feven Admin</div>

      <nav className="admin-sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-nav-item ${isActive(item.href) ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <div style={{ flex: 1 }} />

        <Link href="/" className="admin-nav-item" target="_blank">
          <span className="admin-nav-icon">🔗</span>
          View Site
        </Link>

        <button onClick={handleLogout} className="admin-nav-item" style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
          <span className="admin-nav-icon">🚪</span>
          Logout
        </button>
      </nav>
    </aside>
  );
}