'use client';

import { useState, useEffect } from 'react';
import './ProjectForm.css';

/**
 * Project creation and editing form
 * Handles all project fields including multi-language support
 * @param {Object} props
 * @param {Object|null} props.project - Existing project data for editing, null for new
 * @param {Function} props.onSuccess - Callback on successful save
 * @param {Function} props.onCancel - Callback to close form
 * @param {string} props.token - Admin authentication token
 */
export default function ProjectForm({ project, onSuccess, onCancel, token }) {
  const isEditing = Boolean(project);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title_en: '',
    title_am: '',
    slug: '',
    category: 'animation',
    description_en: '',
    description_am: '',
    client: '',
    year: new Date().getFullYear(),
    tools: [],
    thumbnail: '',
    media: [],
    order_index: 0,
    featured: false,
  });
  const [toolInput, setToolInput] = useState('');

  useEffect(() => {
    if (project) {
      setFormData({
        title_en: project.title?.en || '',
        title_am: project.title?.am || '',
        slug: project.slug || '',
        category: project.category || 'animation',
        description_en: project.description?.en || '',
        description_am: project.description?.am || '',
        client: project.client || '',
        year: project.year || new Date().getFullYear(),
        tools: project.tools || [],
        thumbnail: project.thumbnail || '',
        media: project.media || [],
        order_index: project.order_index || 0,
        featured: project.featured || false,
      });
    }
  }, [project]);

  /**
   * Generates a URL-friendly slug from the English title
   */
  function generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  /**
   * Handles input changes for all form fields
   */
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

  /**
   * Adds a tool to the tools array
   */
  function addTool() {
    const tool = toolInput.trim();
    if (tool && !formData.tools.includes(tool)) {
      setFormData((prev) => ({
        ...prev,
        tools: [...prev.tools, tool],
      }));
    }
    setToolInput('');
  }

  /**
   * Removes a tool from the tools array
   */
  function removeTool(toolToRemove) {
    setFormData((prev) => ({
      ...prev,
      tools: prev.tools.filter((t) => t !== toolToRemove),
    }));
  }

  /**
   * Adds a new media entry to the media array
   */
  function addMedia() {
    setFormData((prev) => ({
      ...prev,
      media: [
        ...prev.media,
        { type: 'youtube', url: '', caption_en: '', caption_am: '' },
      ],
    }));
  }

  /**
   * Updates a specific media entry
   */
  function updateMedia(index, field, value) {
    setFormData((prev) => {
      const updated = [...prev.media];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, media: updated };
    });
  }

  /**
   * Removes a media entry
   */
  function removeMedia(index) {
    setFormData((prev) => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }));
  }

  /**
   * Validates the form before submission
   */
  function validateForm() {
    if (!formData.title_en.trim()) {
      setError('Project title (English) is required');
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

  /**
   * Handles form submission
   */
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
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

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to save project');
      }
    } catch (err) {
      console.error('Error saving project:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="project-form">
      {error && (
        <div className="admin-error-msg" role="alert">
          {error}
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
            placeholder="e.g., Animated Short Film"
            maxLength={200}
            required
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
            placeholder="የአማርኛ ርዕስ"
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
            required
          />
        </div>

        <div>
          <label className="admin-label">Category *</label>
          <select
            name="category"
            className="admin-input"
            value={formData.category}
            onChange={handleChange}
            required
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
            className="admin-input"
            value={formData.description_en}
            onChange={handleChange}
            placeholder="Project description in English"
            rows={4}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="admin-form-full">
          <label className="admin-label">Description (Amharic)</label>
          <textarea
            name="description_am"
            className="admin-input"
            value={formData.description_am}
            onChange={handleChange}
            placeholder="የፕሮጀክት መግለጫ በአማርኛ"
            rows={4}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="admin-form-full">
          <label className="admin-label">Thumbnail URL</label>
          <input
            type="text"
            name="thumbnail"
            className="admin-input"
            value={formData.thumbnail}
            onChange={handleChange}
            placeholder="https://res.cloudinary.com/..."
          />
        </div>

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
            <button
              type="button"
              className="admin-btn"
              style={{ width: 'auto' }}
              onClick={addTool}
            >
              Add
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {formData.tools.map((tool, index) => (
              <span
                key={index}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  backgroundColor: 'var(--admin-bg)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: '20px',
                  fontSize: '12px',
                }}
              >
                {tool}
                <button
                  type="button"
                  onClick={() => removeTool(tool)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--admin-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '0 2px',
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="admin-form-full">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label className="admin-label" style={{ marginBottom: 0 }}>Media</label>
            <button type="button" className="admin-btn admin-btn-sm" style={{ width: 'auto' }} onClick={addMedia}>
              + Add Media
            </button>
          </div>

          {formData.media.length === 0 && (
            <p style={{ color: 'var(--admin-text-secondary)', fontSize: '13px' }}>
              No media added yet. Add videos or images for this project.
            </p>
          )}

          {formData.media.map((item, index) => (
            <div
              key={index}
              style={{
                padding: '16px',
                backgroundColor: 'var(--admin-bg)',
                border: '1px solid var(--admin-border)',
                borderRadius: '8px',
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
                    fontSize: '13px',
                  }}
                >
                  Remove
                </button>
              </div>

              <div className="admin-form-grid" style={{ marginTop: 0 }}>
                <div>
                  <label className="admin-label">Type</label>
                  <select
                    className="admin-input"
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
                  <label className="admin-label">URL *</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={item.url}
                    onChange={(e) => updateMedia(index, 'url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="admin-label">Caption (EN)</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={item.caption_en}
                    onChange={(e) => updateMedia(index, 'caption_en', e.target.value)}
                    placeholder="English caption"
                  />
                </div>

                <div>
                  <label className="admin-label">Caption (AM)</label>
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

        <div style={{ display: 'flex', alignItems: 'center', paddingTop: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleChange}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '14px' }}>Featured project</span>
          </label>
        </div>
      </div>

      <div className="admin-form-actions">
        <button
          type="button"
          className="admin-btn admin-btn-outline"
          style={{ width: 'auto' }}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="admin-btn"
          style={{ width: 'auto' }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Project' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}