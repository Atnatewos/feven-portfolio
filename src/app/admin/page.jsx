// File: src/app/admin/page.jsx — UPDATE to use the shared AdminSidebar
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getConfig } from '../../../lib/config';
import AdminSidebar from '../../../components/admin/AdminSidebar';

/**
 * Admin Dashboard page.
 * Displays overview statistics fetched from all API endpoints.
 * Requires valid authentication — redirects to login if token is missing or expired.
 * Shows recent unread contacts for quick action.
 */
export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    projects: 0,
    posts: 0,
    publishedPosts: 0,
    contacts: 0,
    unreadContacts: 0,
  });
  const [recentContacts, setRecentContacts] = useState([]);

  const greeting = getConfig('admin.dashboard.greeting') || 'Welcome back';
  const statsLabels = {
    projects: getConfig('admin.dashboard.stats.projects') || 'Total Projects',
    posts: getConfig('admin.dashboard.stats.posts') || 'Blog Posts',
    contacts: getConfig('admin.dashboard.stats.contacts') || 'Total Messages',
    unread: getConfig('admin.dashboard.stats.unread') || 'Unread Messages',
  };

  const verifyAuth = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return false;
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', token }),
      });

      if (!res.ok) {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
        return false;
      }

      return true;
    } catch {
      router.push('/admin/login');
      return false;
    }
  }, [router]);

  useEffect(() => {
    async function init() {
      const authed = await verifyAuth();
      if (!authed) return;

      try {
        const [projectsRes, blogRes, contactsRes] = await Promise.allSettled([
          fetch('/api/projects'),
          fetch('/api/blog'),
          fetch('/api/contacts'),
        ]);

        const projects = projectsRes.status === 'fulfilled' && projectsRes.value.ok
          ? await projectsRes.value.json()
          : [];
        const posts = blogRes.status === 'fulfilled' && blogRes.value.ok
          ? await blogRes.value.json()
          : [];
        const contacts = contactsRes.status === 'fulfilled' && contactsRes.value.ok
          ? await contactsRes.value.json()
          : [];

        const unreadContacts = contacts.filter((c) => !c.read);

        setStats({
          projects: projects.length,
          posts: posts.length,
          publishedPosts: posts.filter((p) => p.published).length,
          contacts: contacts.length,
          unreadContacts: unreadContacts.length,
        });

        setRecentContacts(unreadContacts.slice(0, 5));
      } catch (error) {
        console.error('Dashboard fetch error:', error.message);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [verifyAuth]);

  function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <main className="admin-main">
          <div className="admin-skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px' }} />
          <div className="admin-skeleton" style={{ width: '300px', height: '16px', marginBottom: '32px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="admin-skeleton" style={{ height: '120px' }} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar unreadCount={stats.unreadContacts} />

      <main className="admin-main">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Dashboard</h1>
            <p className="admin-page-subtitle">
              {greeting} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/admin/projects" className="admin-btn admin-btn-outline">
              + New Project
            </Link>
            <Link href="/admin/blog" className="admin-btn">
              + New Post
            </Link>
          </div>
        </div>

        <div className="admin-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">🎬</div>
            <p className="admin-stat-label">{statsLabels.projects}</p>
            <p className="admin-stat-value">{stats.projects}</p>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">📝</div>
            <p className="admin-stat-label">{statsLabels.posts}</p>
            <p className="admin-stat-value">{stats.posts}</p>
            <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
              {stats.publishedPosts} published
            </p>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">📧</div>
            <p className="admin-stat-label">{statsLabels.contacts}</p>
            <p className="admin-stat-value">{stats.contacts}</p>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">🔔</div>
            <p className="admin-stat-label">{statsLabels.unread}</p>
            <p className="admin-stat-value" style={{ color: stats.unreadContacts > 0 ? 'var(--admin-error)' : 'var(--admin-text)' }}>
              {stats.unreadContacts}
            </p>
          </div>
        </div>

        {recentContacts.length > 0 && (
          <div className="admin-card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Recent Messages</h3>
              <Link href="/admin/contacts" className="admin-btn admin-btn-sm admin-btn-outline">
                View All
              </Link>
            </div>
            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>Message</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentContacts.map((contact) => (
                    <tr key={contact.id}>
                      <td>
                        <strong>{contact.name}</strong>
                        <br />
                        <small style={{ color: 'var(--admin-text-muted)' }}>{contact.email}</small>
                      </td>
                      <td>{contact.message?.substring(0, 80)}...</td>
                      <td>{formatDate(contact.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}