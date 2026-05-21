// File: src/app/admin/projects/page.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getConfig } from '../../../../lib/config';
import ImageUploadField from '../../../../components/admin/ImageUploadField';

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

  function isActive(href) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

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
          <Link key={item.id || item.href} href={item.href} className={`admin-sidebar-link ${isActive(item.href) ? 'active' : ''}`}>
            <span className="admin-sidebar-icon">{item.icon || '📄'}</span>
            {item.label || 'Page'}
          </Link>
        ))}
        <div className="admin-sidebar-section">Quick Links</div>
        <Link href="/" className="admin-sidebar-link" target="_blank" rel="noopener noreferrer">
          <span className="admin-sidebar-icon">🔗</span>{viewSiteLabel}
        </Link>
        <button onClick={handleLogout} className="admin-sidebar-link" style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'inherit' }}>
          <span className="admin-sidebar-icon">🚪</span>{signOutLabel}
        </button>
      </nav>
      <div className="admin-sidebar-footer">
        <p style={{ fontSize: '11px', color: 'var(--admin-text-muted)', textAlign: 'center' }}>{footerText}</p>
      </div>
    </aside>
  );
}

/**
 * ProjectFormModal — Create or edit a project.
 *
 * The thumbnail field now uses ImageUploadField which supports:
 * - Pasting any image URL (Cloudinary, Imgur, direct links, local /images/ paths)
 * - Drag-and-drop upload to Cloudinary with auto-fill
 * - Image preview after URL is set
 *
 * The media gallery already supports YouTube, Vimeo, Google Drive, Cloudinary,
 * and direct URLs — no changes needed.
 *
 * @param {Object}   props
 * @param {Object}   [props.project]   - Existing project for editing, null for new
 * @param {Function} props.onClose     - Close modal callback
 * @param {Function} props.onSuccess   - Called after successful save
 */
function ProjectFormModal({ project, onClose, onSuccess }) {
  const isEditing = Boolean(project);
  const [formData, setFormData] = useState({
    title_en: project?.title?.en || '',
    title_am: project?.title?.am || '',
    slug: project?.slug || '',
    category: project?.category || 'animation',
    description_en: project?.description?.en || '',
    description_am: project?.description?.am || '',
    client: project?.client || '',
    year: project?.year || new Date().getFullYear(),
    tools: project?.tools || [],
    thumbnail: project?.thumbnail || '',
    media: project?.media || [],
    order_index: project?.order_index || 0,
    featured: project?.featured || false,
  });
  const [toolInput, setToolInput] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const btnSave = getConfig('admin.labels.buttons.save') || 'Save';
  const btnCancel = getConfig('admin.labels.buttons.cancel') || 'Cancel';
  const btnCreate = getConfig('admin.labels.buttons.create') || 'Create';
  const btnUpdate = getConfig('admin.labels.buttons.update') || 'Update';
  const btnRemove = getConfig('admin.labels.buttons.remove') || 'Remove';
  const btnAdd = getConfig('admin.labels.buttons.add') || 'Add';

  /**
   * Generates a URL-friendly slug from the English title.
   * Only runs when creating a new project (not editing).
   */
  function generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    if (name === 'title_en' && !isEditing) {
      setFormData((prev) => ({
        ...prev,
        title_en: value,
        slug: generateSlug(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  }

  function addTool() {
    const tool = toolInput.trim();
    if (tool && !formData.tools.includes(tool)) {
      setFormData((prev) => ({ ...prev, tools: [...prev.tools, tool] }));
    }
    setToolInput('');
  }

  function removeTool(index) {
    setFormData((prev) => ({
      ...prev,
      tools: prev.tools.filter((_, i) => i !== index),
    }));
  }

  function addMedia() {
    setFormData((prev) => ({
      ...prev,
      media: [
        ...prev.media,
        { type: 'youtube', url: '', caption_en: '', caption_am: '' },
      ],
    }));
  }

  function updateMedia(index, field, value) {
    setFormData((prev) => {
      const updated = [...prev.media];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, media: updated };
    });
  }

  function removeMedia(index) {
    setFormData((prev) => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }));
  }

  function validateForm() {
    if (!formData.title_en.trim()) {
      setError('Title (English) is required');
      return false;
    }
    if (!formData.slug.trim()) {
      setError('Slug is required');
      return false;
    }
    if (!['animation', 'design', 'architecture'].includes(formData.category)) {
      setError('Invalid category');
      return false;
    }
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
        title: {
          en: formData.title_en.trim(),
          am: formData.title_am.trim(),
        },
        slug: formData.slug.trim(),
        category: formData.category,
        description: {
          en: formData.description_en.trim(),
          am: formData.description_am.trim(),
        },
        client: formData.client.trim() || null,
        year: formData.year || null,
        tools: formData.tools,
        thumbnail: formData.thumbnail.trim() || null,
        media: formData.media.filter((m) => m.url.trim()),
        order_index: parseInt(formData.order_index) || 0,
        featured: formData.featured,
      };

      const url = isEditing ? `/api/projects?id=${project.id}` : '/api/projects';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save project');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">
            {isEditing ? 'Edit Project' : 'New Project'}
          </h2>
          <button className="admin-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body">
            {error && (
              <div className="admin-alert admin-alert-error" role="alert">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="admin-form-grid">
              <div className="admin-form-full">
                <label className="admin-label">Title (English) *</label>
                <input
                  type="text"
                  name="title_en"
                  className="admin-input"
                  value={formData.title_en}
                  onChange={handleChange}
                  placeholder="Project title"
                  maxLength={200}
                />
              </div>

              <div className="admin-form-full">
                <label className="admin-label">Title (Amharic)</label>
                <input
                  type="text"
                  name="title_am"
                  className="admin-input"
                  value={formData.title_am}
                  onChange={handleChange}
                  placeholder="የፕሮጀክት ርዕስ"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="admin-label">Slug *</label>
                <input
                  type="text"
                  name="slug"
                  className="admin-input"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="project-slug"
                />
              </div>

              <div>
                <label className="admin-label">Category *</label>
                <select
                  name="category"
                  className="admin-select"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="animation">Animation</option>
                  <option value="design">Graphic Design</option>
                  <option value="architecture">Architecture</option>
                </select>
              </div>

              <div>
                <label className="admin-label">Client</label>
                <input
                  type="text"
                  name="client"
                  className="admin-input"
                  value={formData.client}
                  onChange={handleChange}
                  placeholder="Client name"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="admin-label">Year</label>
                <input
                  type="number"
                  name="year"
                  className="admin-input"
                  value={formData.year}
                  onChange={handleChange}
                  min="2000"
                  max="2100"
                />
              </div>

              <div className="admin-form-full">
                <label className="admin-label">Description (English)</label>
                <textarea
                  name="description_en"
                  className="admin-textarea"
                  value={formData.description_en}
                  onChange={handleChange}
                  placeholder="Project description"
                  rows={4}
                />
              </div>

              <div className="admin-form-full">
                <label className="admin-label">Description (Amharic)</label>
                <textarea
                  name="description_am"
                  className="admin-textarea"
                  value={formData.description_am}
                  onChange={handleChange}
                  placeholder="የፕሮጀክት መግለጫ"
                  rows={4}
                />
              </div>

              {/* Thumbnail — ImageUploadField: accepts any URL + drag-and-drop upload */}
              <div className="admin-form-full">
                <ImageUploadField
                  label="Thumbnail Image"
                  value={formData.thumbnail}
                  onChange={(newValue) =>
                    setFormData((prev) => ({ ...prev, thumbnail: newValue }))
                  }
                  hint="Paste any image URL (Cloudinary, Imgur, direct link, or /images/ path) or upload from your computer. This is the cover image shown on the Work page."
                  placeholder="https://res.cloudinary.com/... or /images/... or upload"
                  maxSize={10}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                />
              </div>

              {/* Tools */}
              <div className="admin-form-full">
                <label className="admin-label">Tools Used</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    className="admin-input"
                    value={toolInput}
                    onChange={(e) => setToolInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTool();
                      }
                    }}
                    placeholder="Add a tool (e.g., After Effects)"
                  />
                  <button type="button" className="admin-btn admin-btn-outline" onClick={addTool}>
                    {btnAdd}
                  </button>
                </div>
                <div className="admin-tags">
                  {formData.tools.map((tool, i) => (
                    <span key={i} className="admin-tag">
                      {tool}
                      <button type="button" className="admin-tag-remove" onClick={() => removeTool(i)}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Media Gallery — already supports YouTube, Vimeo, Google Drive, Cloudinary */}
              <div className="admin-form-full">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label className="admin-label" style={{ marginBottom: 0 }}>Media Gallery</label>
                  <button type="button" className="admin-btn admin-btn-sm admin-btn-outline" onClick={addMedia}>
                    + Add Media
                  </button>
                </div>

                {formData.media.length === 0 && (
                  <p style={{ color: 'var(--admin-text-muted)', fontSize: '13px', marginBottom: '8px' }}>
                    No media added yet. Add videos or images — supports YouTube, Vimeo, Google Drive, Cloudinary, and direct URLs.
                  </p>
                )}

                {formData.media.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'var(--admin-bg)',
                      border: '1px solid var(--admin-border)',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>Media #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--admin-error)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '13px',
                        }}
                      >
                        {btnRemove}
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="admin-label">Type</label>
                        <select
                          className="admin-select"
                          value={item.type}
                          onChange={(e) => updateMedia(index, 'type', e.target.value)}
                        >
                          <option value="youtube">YouTube</option>
                          <option value="vimeo">Vimeo</option>
                          <option value="googledrive">Google Drive</option>
                          <option value="cloudinary">Cloudinary</option>
                          <option value="direct">Direct URL</option>
                        </select>
                      </div>
                      <div>
                        <label className="admin-label">URL</label>
                        <input
                          type="text"
                          className="admin-input"
                          value={item.url}
                          onChange={(e) => updateMedia(index, 'url', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="admin-label">Caption (English)</label>
                        <input
                          type="text"
                          className="admin-input"
                          value={item.caption_en}
                          onChange={(e) => updateMedia(index, 'caption_en', e.target.value)}
                          placeholder="English caption"
                        />
                      </div>
                      <div>
                        <label className="admin-label">Caption (Amharic)</label>
                        <input
                          type="text"
                          className="admin-input"
                          value={item.caption_am}
                          onChange={(e) => updateMedia(index, 'caption_am', e.target.value)}
                          placeholder="የአማርኛ መግለጫ"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="admin-label">Order Index</label>
                <input
                  type="number"
                  name="order_index"
                  className="admin-input"
                  value={formData.order_index}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', paddingTop: '8px' }}>
                <label className="admin-toggle" onClick={() => setFormData((prev) => ({ ...prev, featured: !prev.featured }))}>
                  <div className={`admin-toggle-track ${formData.featured ? 'active' : ''}`}>
                    <div className="admin-toggle-thumb" />
                  </div>
                  <span className="admin-toggle-label">Featured project</span>
                </label>
              </div>
            </div>
          </div>

          <div className="admin-modal-footer">
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={onClose}
              disabled={saving}
            >
              {btnCancel}
            </button>
            <button type="submit" className="admin-btn" disabled={saving}>
              {saving ? 'Saving...' : isEditing ? btnUpdate : btnCreate}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Admin Projects management page.
 * Full CRUD: list all projects, filter by category, search, create, edit, delete.
 * All labels and button text read from config/admin.json.
 * Requires valid authentication token for all operations.
 */
export default function AdminProjectsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const btnEdit = getConfig('admin.labels.buttons.edit') || 'Edit';
  const btnDelete = getConfig('admin.labels.buttons.delete') || 'Delete';
  const btnCancel = getConfig('admin.labels.buttons.cancel') || 'Cancel';

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'animation', label: 'Animation' },
    { id: 'design', label: 'Design' },
    { id: 'architecture', label: 'Architecture' },
  ];

  const verifyAuth = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return false; }
    const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify', token }) });
    if (!res.ok) { localStorage.removeItem('admin_token'); router.push('/admin/login'); return false; }
    return true;
  }, [router]);

  useEffect(() => { verifyAuth().then((a) => a && fetchProjects()); }, [verifyAuth]);
  useEffect(() => { filterProjects(); }, [projects, activeFilter, searchQuery]);

  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) setProjects(await res.json());
    } catch (err) { console.error('Fetch error:', err.message); } finally { setLoading(false); }
  }

  function filterProjects() {
    let filtered = [...projects];
    if (activeFilter !== 'all') filtered = filtered.filter((p) => p.category === activeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => (p.title?.en || '').toLowerCase().includes(q) || (p.client || '').toLowerCase().includes(q));
    }
    filtered.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    setFilteredProjects(filtered);
  }

  function handleCreate() { setEditingProject(null); setShowModal(true); }
  function handleEdit(project) { setEditingProject(project); setShowModal(true); }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/projects?id=${deleteConfirm.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { showToast('Deleted successfully', 'success'); setDeleteConfirm(null); fetchProjects(); }
      else showToast('Delete failed', 'error');
    } catch { showToast('Network error', 'error'); }
  }

  function handleFormSuccess() { setShowModal(false); setEditingProject(null); fetchProjects(); showToast(editingProject ? 'Updated successfully' : 'Created successfully', 'success'); }

  function showToast(message, type = 'success') { setToast({ message, type }); setTimeout(() => setToast(null), 3500); }

  if (loading) {
    return (
      <div className="admin-layout"><AdminSidebar /><main className="admin-main">
        <div className="admin-skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px' }} />
        <div className="admin-skeleton" style={{ width: '300px', height: '16px', marginBottom: '32px' }} />
        <div className="admin-skeleton" style={{ height: '400px' }} />
      </main></div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-page-header">
          <div><h1 className="admin-page-title">Projects</h1><p className="admin-page-subtitle">{projects.length} total</p></div>
          <button className="admin-btn" onClick={handleCreate}>+ New Project</button>
        </div>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div className="admin-tabs">
            {categories.map((cat) => (
              <button key={cat.id} className={`admin-tab ${activeFilter === cat.id ? 'active' : ''}`} onClick={() => setActiveFilter(cat.id)}>{cat.label}</button>
            ))}
          </div>
          <div className="admin-search">
            <span className="admin-search-icon">🔍</span>
            <input type="text" className="admin-input admin-search-input" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
        {filteredProjects.length > 0 ? (
          <div className="admin-table-wrap">
            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead><tr><th>Title</th><th>Category</th><th>Client</th><th>Year</th><th>Order</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.id}>
                      <td><strong>{project.title?.en || 'Untitled'}</strong><br /><small style={{ color: 'var(--admin-text-muted)' }}>/{project.slug}</small></td>
                      <td><span className="admin-badge admin-badge-primary">{project.category}</span></td>
                      <td>{project.client || '—'}</td>
                      <td>{project.year || '—'}</td>
                      <td>{project.order_index ?? 0}</td>
                      <td>
                        <div className="admin-actions">
                          <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => handleEdit(project)}>{btnEdit}</button>
                          <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => setDeleteConfirm(project)}>{btnDelete}</button>
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
            <div className="admin-empty-icon">🎬</div>
            <h3 className="admin-empty-title">No projects found</h3>
            <p className="admin-empty-text">{searchQuery ? 'Try a different search' : 'Create your first project'}</p>
            {!searchQuery && <button className="admin-btn" onClick={handleCreate}>Create Project</button>}
          </div>
        )}
        {showModal && <ProjectFormModal project={editingProject} onClose={() => setShowModal(false)} onSuccess={handleFormSuccess} />}
        {deleteConfirm && (
          <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
              <div className="admin-modal-header"><h2 className="admin-modal-title">Delete Project</h2><button className="admin-modal-close" onClick={() => setDeleteConfirm(null)}>✕</button></div>
              <div className="admin-modal-body"><p style={{ color: 'var(--admin-text-muted)', marginBottom: '8px' }}>Are you sure you want to delete this project permanently?</p><p style={{ fontWeight: 600 }}>{deleteConfirm.title?.en || 'Untitled'}</p></div>
              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-outline" onClick={() => setDeleteConfirm(null)}>{btnCancel}</button>
                <button className="admin-btn admin-btn-danger" onClick={handleDelete}>{btnDelete}</button>
              </div>
            </div>
          </div>
        )}
        {toast && <div className="admin-toast-container"><div className={`admin-toast admin-toast-${toast.type}`}>{toast.type === 'success' ? '✅' : '❌'} {toast.message}</div></div>}
      </main>
    </div>
  );
}