// File: src/app/admin/blog/page.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getConfig } from '../../../../lib/config';

function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const brandText = getConfig('admin.sidebar.brandText') || 'Admin';
  const brandIcon = getConfig('admin.sidebar.brandIcon') || 'A';
  const navItems = getConfig('admin.sidebar.navItems') || [];
  const viewSiteLabel = getConfig('admin.sidebar.viewSiteLabel') || 'View Website';
  const signOutLabel = getConfig('admin.sidebar.signOutLabel') || 'Sign Out';
  const footerText = getConfig('admin.sidebar.footerText') || 'Portfolio CMS';
  function isActive(href) { if (href === '/admin') return pathname === '/admin'; return pathname.startsWith(href); }
  function handleLogout() { localStorage.removeItem('admin_token'); router.push('/admin/login'); }
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand"><div className="admin-sidebar-brand-icon">{brandIcon}</div>{brandText}</div>
      <nav className="admin-sidebar-nav">
        <div className="admin-sidebar-section">Main Menu</div>
        {navItems.map((item) => (<Link key={item.id || item.href} href={item.href} className={`admin-sidebar-link ${isActive(item.href) ? 'active' : ''}`}><span className="admin-sidebar-icon">{item.icon || '📄'}</span>{item.label || 'Page'}</Link>))}
        <div className="admin-sidebar-section">Quick Links</div>
        <Link href="/" className="admin-sidebar-link" target="_blank" rel="noopener noreferrer"><span className="admin-sidebar-icon">🔗</span>{viewSiteLabel}</Link>
        <button onClick={handleLogout} className="admin-sidebar-link" style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'inherit' }}><span className="admin-sidebar-icon">🚪</span>{signOutLabel}</button>
      </nav>
      <div className="admin-sidebar-footer"><p style={{ fontSize: '11px', color: 'var(--admin-text-muted)', textAlign: 'center' }}>{footerText}</p></div>
    </aside>
  );
}

function BlogFormModal({ post, onClose, onSuccess }) {
  const isEditing = Boolean(post);
  const [formData, setFormData] = useState({
    title_en: post?.title?.en || '',
    title_am: post?.title?.am || '',
    slug: post?.slug || '',
    category: post?.category || 'animation',
    excerpt_en: post?.excerpt?.en || '',
    excerpt_am: post?.excerpt?.am || '',
    content_en: post?.content?.en || '',
    content_am: post?.content?.am || '',
    thumbnail: post?.thumbnail || '',
    published: post?.published ?? true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const btnSave = getConfig('admin.labels.buttons.save') || 'Save';
  const btnCancel = getConfig('admin.labels.buttons.cancel') || 'Cancel';
  const btnPublish = getConfig('admin.labels.buttons.publish') || 'Publish';
  const toastNetworkError = getConfig('admin.labels.toasts.networkError') || 'Network error';

  const categories = [
    { value: 'animation', label: 'Animation' },
    { value: 'design', label: 'Graphic Design' },
    { value: 'architecture', label: 'Architecture' },
    { value: 'tutorial', label: 'Tutorial' },
    { value: 'news', label: 'News' },
  ];

  function generateSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 100);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (name === 'title_en' && !isEditing) {
      setFormData((prev) => ({ ...prev, title_en: value, slug: generateSlug(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  }

  function validateForm() {
    if (!formData.title_en.trim()) { setError('Post title (English) is required'); return false; }
    if (!formData.slug.trim()) { setError('Slug is required'); return false; }
    if (!formData.content_en.trim()) { setError('Post content (English) is required'); return false; }
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setSaving(true);

    try {
      const token = localStorage.getItem('admin_token');
      const payload = {
        title: { en: formData.title_en.trim(), am: formData.title_am.trim() },
        slug: formData.slug.trim(),
        category: formData.category,
        excerpt: { en: formData.excerpt_en.trim(), am: formData.excerpt_am.trim() },
        content: { en: formData.content_en.trim(), am: formData.content_am.trim() },
        thumbnail: formData.thumbnail.trim() || null,
        published: formData.published,
      };

      const url = isEditing ? `/api/blog?id=${post.id}` : '/api/blog';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedPost = await res.json();
        onSuccess(savedPost);
      } else {
        const d = await res.json();
        setError(d.error || 'Save failed');
      }
    } catch {
      setError(toastNetworkError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">{isEditing ? 'Edit Post' : 'New Blog Post'}</h2>
          <button className="admin-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body">
            {error && <div className="admin-alert admin-alert-error"><span>⚠️</span> {error}</div>}
            <div className="admin-form-grid">
              <div className="admin-form-full">
                <label className="admin-label">Title (English) *</label>
                <input type="text" name="title_en" className="admin-input" value={formData.title_en} onChange={handleChange} placeholder="My Animation Process" maxLength={300} />
              </div>
              <div className="admin-form-full">
                <label className="admin-label">Title (Amharic)</label>
                <input type="text" name="title_am" className="admin-input" value={formData.title_am} onChange={handleChange} placeholder="የአማርኛ ርዕስ" maxLength={300} />
              </div>
              <div>
                <label className="admin-label">Slug *</label>
                <input type="text" name="slug" className="admin-input" value={formData.slug} onChange={handleChange} placeholder="post-slug" />
                <p className="admin-form-hint">URL-friendly identifier for the post</p>
              </div>
              <div>
                <label className="admin-label">Category</label>
                <select name="category" className="admin-select" value={formData.category} onChange={handleChange}>
                  {categories.map((cat) => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
                </select>
              </div>
              <div className="admin-form-full">
                <label className="admin-label">Excerpt (English)</label>
                <textarea name="excerpt_en" className="admin-textarea" value={formData.excerpt_en} onChange={handleChange} placeholder="Brief summary for post previews..." rows={3} maxLength={500} />
                <p className="admin-form-hint">{formData.excerpt_en.length}/500 characters</p>
              </div>
              <div className="admin-form-full">
                <label className="admin-label">Excerpt (Amharic)</label>
                <textarea name="excerpt_am" className="admin-textarea" value={formData.excerpt_am} onChange={handleChange} placeholder="አጭር ማጠቃለያ..." rows={3} maxLength={500} />
              </div>
              <div className="admin-form-full">
                <label className="admin-label">Content (English) * — HTML supported</label>
                <textarea name="content_en" className="admin-textarea" value={formData.content_en} onChange={handleChange} placeholder="<p>Write your blog post here. HTML tags are supported.</p>" rows={14} style={{ fontFamily: 'monospace', fontSize: '13px' }} />
                <p className="admin-form-hint">Use HTML tags for formatting: &lt;p&gt;, &lt;h2&gt;, &lt;strong&gt;, &lt;img&gt;, etc.</p>
              </div>
              <div className="admin-form-full">
                <label className="admin-label">Content (Amharic) — HTML supported</label>
                <textarea name="content_am" className="admin-textarea" value={formData.content_am} onChange={handleChange} placeholder="<p>የብሎግ ይዘት በአማርኛ...</p>" rows={10} style={{ fontFamily: 'monospace', fontSize: '13px' }} />
              </div>
              <div className="admin-form-full">
                <label className="admin-label">Featured Image URL</label>
                <input type="text" name="thumbnail" className="admin-input" value={formData.thumbnail} onChange={handleChange} placeholder="https://res.cloudinary.com/..." />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', paddingTop: '8px' }}>
                <label className="admin-toggle" onClick={() => setFormData((prev) => ({ ...prev, published: !prev.published }))}>
                  <div className={`admin-toggle-track ${formData.published ? 'active' : ''}`}><div className="admin-toggle-thumb" /></div>
                  <span className="admin-toggle-label">{formData.published ? 'Published' : 'Draft'}</span>
                </label>
              </div>
            </div>
          </div>
          <div className="admin-modal-footer">
            <button type="button" className="admin-btn admin-btn-outline" onClick={onClose} disabled={saving}>{btnCancel}</button>
            <button type="submit" className="admin-btn" disabled={saving}>
              {saving ? 'Saving...' : isEditing ? btnSave : btnPublish}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const btnEdit = getConfig('admin.labels.buttons.edit') || 'Edit';
  const btnDelete = getConfig('admin.labels.buttons.delete') || 'Delete';
  const btnPublish = getConfig('admin.labels.buttons.publish') || 'Publish';
  const btnUnpublish = getConfig('admin.labels.buttons.unpublish') || 'Unpublish';
  const btnCancel = getConfig('admin.labels.buttons.cancel') || 'Cancel';

  const categories = [
    { id: 'all', label: 'All Posts' },
    { id: 'animation', label: 'Animation' },
    { id: 'design', label: 'Design' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'tutorial', label: 'Tutorials' },
    { id: 'news', label: 'News' },
  ];

  const verifyAuth = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return false; }
    const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify', token }) });
    if (!res.ok) { localStorage.removeItem('admin_token'); router.push('/admin/login'); return false; }
    return true;
  }, [router]);

  useEffect(() => { verifyAuth().then((a) => a && fetchPosts()); }, [verifyAuth]);
  useEffect(() => { filterPosts(); }, [posts, activeFilter, searchQuery]);

  async function fetchPosts() {
    try {
      const res = await fetch('/api/blog');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Fetch error:', err.message);
      showToast('Failed to load posts', 'error');
    } finally {
      setLoading(false);
    }
  }

  function filterPosts() {
    let filtered = [...posts];
    if (activeFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => (p.title?.en || '').toLowerCase().includes(q) || (p.slug || '').toLowerCase().includes(q));
    }
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setFilteredPosts(filtered);
  }

  function handleCreate() { setEditingPost(null); setShowModal(true); }
  function handleEdit(post) { setEditingPost(post); setShowModal(true); }

  /**
   * Toggles a blog post between published and draft states.
   * Sends only the published field to the API (partial update).
   * On failure, reverts the optimistic UI update.
   */
  async function togglePublish(post) {
    const previousPosts = [...posts];

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, published: !p.published } : p
      )
    );

    try {
      const token = localStorage.getItem('admin_token');

      const response = await fetch(`/api/blog?id=${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          published: !post.published,
        }),
      });

      if (!response.ok) {
        setPosts(previousPosts);
        const data = await response.json();
        showToast(data.error || 'Failed to update status', 'error');
      } else {
        showToast(
          post.published ? 'Post unpublished' : 'Post published',
          'success'
        );
      }
    } catch {
      setPosts(previousPosts);
      showToast('Network error', 'error');
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/blog?id=${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Post deleted permanently', 'success');
        setDeleteConfirm(null);
        fetchPosts();
      } else {
        const data = await res.json();
        showToast(data.error || 'Delete failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  }

  /**
   * Called when the blog form modal saves successfully.
   * Refreshes the post list from the API to show the latest data.
   */
  function handleFormSuccess() {
    setShowModal(false);
    setEditingPost(null);
    fetchPosts();
    showToast(editingPost ? 'Post updated successfully' : 'Post published successfully', 'success');
  }

  function showToast(message, type = 'success') { setToast({ message, type }); setTimeout(() => setToast(null), 3500); }

  function formatDate(d) {
    if (!d) return '—';
    const diff = Math.floor((Date.now() - new Date(d)) / 3600000);
    if (diff < 1) return 'Just now';
    if (diff < 24) return `${diff}h ago`;
    if (diff < 48) return 'Yesterday';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getCategoryBadge(category) {
    const colors = { animation: 'admin-badge-primary', design: 'admin-badge-success', architecture: 'admin-badge-warning', tutorial: 'admin-badge-primary', news: 'admin-badge-error' };
    return colors[category] || 'admin-badge-primary';
  }

  if (loading) {
    return (
      <div className="admin-layout"><AdminSidebar /><main className="admin-main">
        <div className="admin-skeleton" style={{ width: '160px', height: '32px', marginBottom: '8px' }} />
        <div className="admin-skeleton" style={{ width: '240px', height: '16px', marginBottom: '32px' }} />
        <div className="admin-skeleton" style={{ height: '400px' }} />
      </main></div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Blog</h1>
            <p className="admin-page-subtitle">
              {posts.length} posts · {posts.filter((p) => p.published).length} published · {posts.filter((p) => !p.published).length} drafts
            </p>
          </div>
          <button className="admin-btn" onClick={handleCreate}>✏️ New Post</button>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div className="admin-tabs">
            {categories.map((cat) => (
              <button key={cat.id} className={`admin-tab ${activeFilter === cat.id ? 'active' : ''}`} onClick={() => setActiveFilter(cat.id)}>
                {cat.label}
              </button>
            ))}
          </div>
          <div className="admin-search">
            <span className="admin-search-icon">🔍</span>
            <input type="text" className="admin-input admin-search-input" placeholder="Search posts by title..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {filteredPosts.length > 0 ? (
          <div className="admin-table-wrap">
            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr><th>Title</th><th>Category</th><th>Status</th><th>Date</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post) => (
                    <tr key={post.id}>
                      <td>
                        <strong>{post.title?.en || 'Untitled Post'}</strong>
                        <br />
                        <small style={{ color: 'var(--admin-text-muted)' }}>/blog/{post.slug}</small>
                        {post.excerpt?.en && (
                          <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '4px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {post.excerpt.en}
                          </p>
                        )}
                      </td>
                      <td><span className={`admin-badge ${getCategoryBadge(post.category)}`}>{post.category || 'Uncategorized'}</span></td>
                      <td>
                        <span className={`admin-badge ${post.published ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(post.created_at)}</td>
                      <td>
                        <div className="admin-actions" style={{ flexWrap: 'nowrap' }}>
                          <button
                            className="admin-btn admin-btn-sm admin-btn-outline"
                            onClick={() => togglePublish(post)}
                            title={post.published ? btnUnpublish : btnPublish}
                          >
                            {post.published ? '⬇' : '⬆'}
                          </button>
                          <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => handleEdit(post)}>{btnEdit}</button>
                          <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => setDeleteConfirm(post)}>{btnDelete}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="admin-empty">
            <div className="admin-empty-icon">📝</div>
            <h3 className="admin-empty-title">No blog posts found</h3>
            <p className="admin-empty-text">
              {searchQuery ? 'Try adjusting your search or filter' : activeFilter !== 'all' ? `No posts in "${activeFilter}" category yet` : 'Start writing your first blog post'}
            </p>
            {!searchQuery && activeFilter === 'all' && (
              <button className="admin-btn" onClick={handleCreate}>Write Your First Post</button>
            )}
          </div>
        )}

        {showModal && <BlogFormModal post={editingPost} onClose={() => setShowModal(false)} onSuccess={handleFormSuccess} />}

        {deleteConfirm && (
          <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
              <div className="admin-modal-header"><h2 className="admin-modal-title">Delete Blog Post</h2><button className="admin-modal-close" onClick={() => setDeleteConfirm(null)}>✕</button></div>
              <div className="admin-modal-body">
                <div className="admin-alert admin-alert-error"><span>⚠️</span> This action cannot be undone.</div>
                <p style={{ color: 'var(--admin-text-muted)', marginBottom: '8px' }}>Are you sure you want to permanently delete this post?</p>
                <p style={{ fontWeight: 600, fontSize: '16px' }}>&ldquo;{deleteConfirm.title?.en || 'Untitled Post'}&rdquo;</p>
                {deleteConfirm.published && (
                  <p style={{ color: 'var(--admin-warning)', fontSize: '13px', marginTop: '8px' }}>This post is currently published and visible to visitors.</p>
                )}
              </div>
              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-outline" onClick={() => setDeleteConfirm(null)}>Keep Post</button>
                <button className="admin-btn admin-btn-danger" onClick={handleDelete}>Delete Permanently</button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className="admin-toast-container"><div className={`admin-toast admin-toast-${toast.type}`}>{toast.type === 'success' ? '✅' : '❌'} {toast.message}</div></div>}
      </main>
    </div>
  );
}