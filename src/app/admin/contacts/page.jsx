// File: src/app/admin/contacts/page.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getConfig } from '../../../../lib/config';

/**
 * Admin Sidebar component shared across all admin pages.
 * Renders navigation with active state highlighting based on the current route.
 * All labels, icons, and navigation items come from config/admin.json.
 */
function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const brandText = getConfig('admin.sidebar.brandText') || 'Admin';
  const brandIcon = getConfig('admin.sidebar.brandIcon') || 'A';
  const navItems = getConfig('admin.sidebar.navItems') || [];
  const viewSiteLabel = getConfig('admin.sidebar.viewSiteLabel') || 'View Website';
  const signOutLabel = getConfig('admin.sidebar.signOutLabel') || 'Sign Out';
  const footerText = getConfig('admin.sidebar.footerText') || 'Portfolio CMS';

  /**
   * Determines whether a navigation item matches the current route.
   * Uses exact match for /admin and prefix match for sub-routes.
   */
  function isActive(href) {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  }

  /**
   * Clears the authentication token from localStorage and redirects to login.
   * This effectively logs the user out of the admin panel.
   */
  function handleLogout() {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  }

  return (
    <aside className="admin-sidebar">
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
          >
            <span className="admin-sidebar-icon">{item.icon || '📄'}</span>
            {item.label || 'Page'}
          </Link>
        ))}

        <div className="admin-sidebar-section">Quick Links</div>

        <Link
          href="/"
          className="admin-sidebar-link"
          target="_blank"
          rel="noopener noreferrer"
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
  );
}

/**
 * Modal component for viewing a single contact message in full detail.
 * Displays the sender's name, email, date received, read status, and the
 * complete message body. Provides action buttons for replying via email,
 * marking the message as read, and deleting the message permanently.
 *
 * @param {Object}   props
 * @param {Object}   props.contact    - The contact message object from the database
 * @param {Function} props.onClose    - Callback to close the modal
 * @param {Function} props.onDelete   - Callback when the delete button is clicked
 * @param {Function} props.onMarkRead - Callback when the mark as read button is clicked
 */
function MessageDetailModal({ contact, onClose, onDelete, onMarkRead }) {
  if (!contact) {
    return null;
  }

  const btnDelete = getConfig('admin.labels.buttons.delete') || 'Delete';
  const btnMarkRead = getConfig('admin.labels.buttons.markRead') || 'Mark as Read';
  const btnReply = getConfig('admin.labels.buttons.reply') || 'Reply via Email';

  /**
   * Formats a date string into a full, human-readable format.
   * Used for displaying the exact timestamp of when the message was received.
   */
  function formatFullDate(dateString) {
    if (!dateString) {
      return '—';
    }

    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Opens the default email client with a pre-filled reply to the sender.
   * The subject and body are pre-populated for convenience.
   */
  function handleReply() {
    const subject = encodeURIComponent('Re: Your message to Feven Zerabruk');
    const body = encodeURIComponent(
      `Hi ${contact.name},\n\nThank you for reaching out. I received your message:\n\n"${contact.message?.substring(0, 200)}..."\n\nBest regards,\n`
    );
    window.open(`mailto:${contact.email}?subject=${subject}&body=${body}`, '_blank');
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">Message Details</h2>
          <button className="admin-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="admin-modal-body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '24px',
            }}
          >
            <div>
              <label className="admin-label">From</label>
              <p style={{ fontSize: '16px', fontWeight: 600 }}>
                {contact.name}
              </p>
            </div>

            <div>
              <label className="admin-label">Email</label>
              <a
                href={`mailto:${contact.email}`}
                style={{
                  color: 'var(--admin-primary)',
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                {contact.email}
              </a>
            </div>

            <div>
              <label className="admin-label">Date Received</label>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--admin-text-muted)',
                }}
              >
                {formatFullDate(contact.created_at)}
              </p>
            </div>

            <div>
              <label className="admin-label">Status</label>
              <span
                className={`admin-badge ${
                  contact.read ? 'admin-badge-success' : 'admin-badge-warning'
                }`}
              >
                {contact.read ? 'Read' : 'Unread'}
              </span>
            </div>
          </div>

          <div>
            <label className="admin-label">Message</label>
            <div
              style={{
                padding: '16px',
                background: 'var(--admin-bg)',
                border: '1px solid var(--admin-border)',
                borderRadius: '8px',
                fontSize: '14px',
                lineHeight: '1.7',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {contact.message || 'No message content'}
            </div>
          </div>
        </div>

        <div className="admin-modal-footer">
          <button
            className="admin-btn admin-btn-danger"
            onClick={() => onDelete(contact)}
          >
            {btnDelete}
          </button>

          {!contact.read && (
            <button
              className="admin-btn admin-btn-outline"
              onClick={() => onMarkRead(contact)}
            >
              {btnMarkRead}
            </button>
          )}

          <button className="admin-btn" onClick={handleReply}>
            {btnReply}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Admin Contacts management page.
 *
 * Displays all contact form submissions in a filterable, searchable table.
 * Messages can be filtered by read status (All, Unread, Read).
 * Clicking a row opens the full message detail modal.
 * Supports marking messages as read, replying via email, and permanent deletion.
 *
 * Security: Requires valid admin authentication token to access.
 * All data mutations go through the /api/contacts endpoint with server-side validation.
 */
export default function AdminContactsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedContact, setSelectedContact] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
  });

  const btnDelete = getConfig('admin.labels.buttons.delete') || 'Delete';
  const btnCancel = getConfig('admin.labels.buttons.cancel') || 'Cancel';
  const btnKeep = getConfig('admin.labels.buttons.keep') || 'Keep';

  const filters = [
    { id: 'all', label: 'All Messages' },
    { id: 'unread', label: 'Unread' },
    { id: 'read', label: 'Read' },
  ];

  /**
   * Verifies that the user has a valid admin authentication token.
   * Redirects to the login page if no token is found or if the token is invalid.
   * This check runs on every page load to prevent unauthorized access.
   */
  const verifyAuth = useCallback(async () => {
    const token = localStorage.getItem('admin_token');

    if (!token) {
      router.push('/admin/login');
      return false;
    }

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', token }),
      });

      if (!response.ok) {
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

  /**
   * On mount: verify authentication, then fetch all contact submissions.
   */
  useEffect(() => {
    verifyAuth().then((authenticated) => {
      if (authenticated) {
        fetchContacts();
      }
    });
  }, [verifyAuth]);

  /**
   * Re-filters contacts whenever the contacts array or active filter changes.
   * This ensures the displayed list stays in sync with user interactions.
   */
  useEffect(() => {
    filterContacts();
  }, [contacts, activeFilter]);

  /**
   * Fetches all contact submissions from the API.
   * Updates both the full contacts list and the statistics counters.
   */
  async function fetchContacts() {
    try {
      const response = await fetch('/api/contacts');

      if (response.ok) {
        const data = await response.json();
        setContacts(data);

        const unread = data.filter((contact) => !contact.read);
        const read = data.filter((contact) => contact.read);

        setStats({
          total: data.length,
          unread: unread.length,
          read: read.length,
        });
      }
    } catch (error) {
      console.error('Contacts fetch error:', error.message);
      showToast('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Filters the contacts array based on the active read-status filter.
   * Sorts results by date with newest messages first.
   */
  function filterContacts() {
    let filtered = [...contacts];

    if (activeFilter === 'unread') {
      filtered = filtered.filter((contact) => !contact.read);
    } else if (activeFilter === 'read') {
      filtered = filtered.filter((contact) => contact.read);
    }

    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setFilteredContacts(filtered);
  }

  /**
   * Marks a contact message as read.
   * Sends a PUT request to the API and updates local state optimistically.
   * If the update fails, the local state remains unchanged.
   *
   * @param {Object} contact - The contact to mark as read
   */
  async function markAsRead(contact) {
    if (contact.read) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');

      const response = await fetch(`/api/contacts?id=${contact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ read: true }),
      });

      if (response.ok) {
        setContacts((prev) =>
          prev.map((c) =>
            c.id === contact.id ? { ...c, read: true } : c
          )
        );

        if (selectedContact && selectedContact.id === contact.id) {
          setSelectedContact((prev) => (prev ? { ...prev, read: true } : null));
        }

        showToast('Marked as read', 'success');
      }
    } catch {
      showToast('Failed to update message', 'error');
    }
  }

  /**
   * Permanently deletes a contact message.
   * Removes it from the local state and closes any open modals.
   * Shows a toast notification with the result.
   */
  async function handleDelete() {
    if (!deleteConfirm) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');

      const response = await fetch(`/api/contacts?id=${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setContacts((prev) =>
          prev.filter((contact) => contact.id !== deleteConfirm.id)
        );
        setSelectedContact(null);
        setDeleteConfirm(null);
        showToast('Message deleted permanently', 'success');
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to delete message', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    }
  }

  /**
   * Opens a contact message for detailed viewing.
   * Automatically marks the message as read when opened.
   *
   * @param {Object} contact - The contact to view
   */
  function viewContact(contact) {
    setSelectedContact(contact);

    if (!contact.read) {
      markAsRead(contact);
    }
  }

  /**
   * Displays a temporary toast notification that auto-dismisses after 3.5 seconds.
   *
   * @param {string} message - The message to display
   * @param {string} type    - 'success' or 'error'
   */
  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  /**
   * Formats a date string into a human-readable relative format.
   * Shows "Today", "Yesterday", "X days ago", or the actual date for older messages.
   *
   * @param {string} dateString - ISO date string from the database
   * @returns {string} Formatted date
   */
  function formatDate(dateString) {
    if (!dateString) {
      return '—';
    }

    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    }

    if (diffDays === 1) {
      return 'Yesterday';
    }

    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Loading State                                                      */
  /* ------------------------------------------------------------------ */
  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <main className="admin-main">
          <div
            className="admin-skeleton"
            style={{ width: '180px', height: '32px', marginBottom: '8px' }}
          />
          <div
            className="admin-skeleton"
            style={{ width: '260px', height: '16px', marginBottom: '32px' }}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '32px',
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="admin-skeleton"
                style={{ height: '80px' }}
              />
            ))}
          </div>
          <div className="admin-skeleton" style={{ height: '400px' }} />
        </main>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Main Render                                                        */
  /* ------------------------------------------------------------------ */
  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Contacts</h1>
            <p className="admin-page-subtitle">
              {stats.total} total messages · {stats.unread} unread
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            className="admin-stat-card"
            onClick={() => setActiveFilter('all')}
            style={{ cursor: 'pointer' }}
          >
            <div className="admin-stat-icon">📧</div>
            <p className="admin-stat-label">Total</p>
            <p className="admin-stat-value">{stats.total}</p>
          </div>

          <div
            className="admin-stat-card"
            onClick={() => setActiveFilter('unread')}
            style={{ cursor: 'pointer' }}
          >
            <div className="admin-stat-icon">🔔</div>
            <p className="admin-stat-label">Unread</p>
            <p
              className="admin-stat-value"
              style={{
                color:
                  stats.unread > 0
                    ? 'var(--admin-warning)'
                    : 'var(--admin-text)',
              }}
            >
              {stats.unread}
            </p>
          </div>

          <div
            className="admin-stat-card"
            onClick={() => setActiveFilter('read')}
            style={{ cursor: 'pointer' }}
          >
            <div className="admin-stat-icon">✅</div>
            <p className="admin-stat-label">Read</p>
            <p className="admin-stat-value">{stats.read}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '24px',
            flexWrap: 'wrap',
          }}
        >
          <div className="admin-tabs">
            {filters.map((filter) => (
              <button
                key={filter.id}
                className={`admin-tab ${
                  activeFilter === filter.id ? 'active' : ''
                }`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
                {filter.id === 'unread' && stats.unread > 0 && (
                  <span
                    style={{
                      marginLeft: '6px',
                      background: 'var(--admin-warning)',
                      color: '#000',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontSize: '11px',
                    }}
                  >
                    {stats.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Contacts Table */}
        {filteredContacts.length > 0 ? (
          <div className="admin-table-wrap">
            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>Message Preview</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="clickable"
                      onClick={() => viewContact(contact)}
                      style={{
                        fontWeight: contact.read ? 'normal' : '600',
                      }}
                    >
                      <td>
                        <span>{contact.name}</span>
                        <br />
                        <small
                          style={{
                            color: 'var(--admin-text-muted)',
                            fontWeight: 400,
                          }}
                        >
                          {contact.email}
                        </small>
                      </td>
                      <td>
                        <span
                          style={{
                            color: 'var(--admin-text-muted)',
                            fontWeight: contact.read ? 400 : 600,
                          }}
                        >
                          {contact.message?.substring(0, 80)}
                          {contact.message?.length > 80 ? '...' : ''}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(contact.created_at)}
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${
                            contact.read
                              ? 'admin-badge-success'
                              : 'admin-badge-warning'
                          }`}
                        >
                          {contact.read ? 'Read' : 'New'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="admin-empty">
            <div className="admin-empty-icon">📧</div>
            <h3 className="admin-empty-title">No messages found</h3>
            <p className="admin-empty-text">
              {activeFilter === 'unread'
                ? 'All messages have been read! 🎉'
                : activeFilter === 'read'
                  ? 'No read messages yet'
                  : 'No contact submissions yet. They will appear here when visitors fill out the contact form on your website.'}
            </p>
          </div>
        )}

        {/* Message Detail Modal */}
        {selectedContact && (
          <MessageDetailModal
            contact={selectedContact}
            onClose={() => setSelectedContact(null)}
            onDelete={(contact) => {
              setSelectedContact(null);
              setDeleteConfirm(contact);
            }}
            onMarkRead={markAsRead}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div
            className="admin-modal-overlay"
            onClick={() => setDeleteConfirm(null)}
          >
            <div
              className="admin-modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '440px' }}
            >
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">Delete Message</h2>
                <button
                  className="admin-modal-close"
                  onClick={() => setDeleteConfirm(null)}
                >
                  ✕
                </button>
              </div>

              <div className="admin-modal-body">
                <p
                  style={{
                    color: 'var(--admin-text-muted)',
                    marginBottom: '8px',
                  }}
                >
                  Permanently delete this message from {deleteConfirm.name}?
                </p>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--admin-text-muted)',
                  }}
                >
                  This action cannot be undone. The message will be permanently
                  removed from the database.
                </p>
              </div>

              <div className="admin-modal-footer">
                <button
                  className="admin-btn admin-btn-outline"
                  onClick={() => setDeleteConfirm(null)}
                >
                  {btnKeep}
                </button>
                <button
                  className="admin-btn admin-btn-danger"
                  onClick={handleDelete}
                >
                  {btnDelete}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        {toast && (
          <div className="admin-toast-container">
            <div className={`admin-toast admin-toast-${toast.type}`}>
              {toast.type === 'success' ? '✅' : '❌'} {toast.message}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}