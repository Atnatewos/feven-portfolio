'use client';

import { useState, useEffect } from 'react';
import './BlogForm.css';

/**
 * Blog post creation and editing form
 * Handles all post fields including multi-language content
 * @param {Object} props
 * @param {Object|null} props.post - Existing post data for editing, null for new
 * @param {Function} props.onSuccess - Callback on successful save
 * @param {Function} props.onCancel - Callback to close form
 * @param {string} props.token - Admin authentication token
 */
export default function BlogForm({ post, onSuccess, onCancel, token }) {
  const isEditing = Boolean(post);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title_en: '',
    title_am: '',
    slug: '',
    category: 'animation',
    excerpt_en: '',
    excerpt_am: '',
    content_en: '',
    content_am: '',
    thumbnail: '',
    published: true,
  });

  useEffect(() => {
    if (post) {
      setFormData({
        title_en: post.title?.en || '',
        title_am: post.title?.am || '',
        slug: post.slug || '',
        category: post.category || 'animation',
        excerpt_en: post.excerpt?.en || '',
        excerpt_am: post.excerpt?.am || '',
        content_en: post.content?.en || '',
        content_am: post.content?.am || '',
        thumbnail: post.thumbnail || '',
        published: post.published ?? true,
      });
    }
  }, [post]);

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
   * Validates the form before submission
   */
  function validateForm() {
    if (!formData.title_en.trim()) {
      setError('Post title (English) is required');
      return false;
    }
    if (!formData.slug.trim()) {
      setError('Slug is required');
      return false;
    }
    if (!formData.content_en.trim()) {
      setError('Post content (English) is required');
      return false;
    }
    const validCategories = ['animation', 'design', 'architecture', 'tutorial', 'news'];
    if (!validCategories.includes(formData.category)) {
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
        excerpt: {
          en: formData.excerpt_en.trim(),
          am: formData.excerpt_am.trim(),
        },
        content: {
          en: formData.content_en.trim(),
          am: formData.content_am.trim(),
        },
        thumbnail: formData.thumbnail.trim() || null,
        published: formData.published,
      };

      const url = isEditing ? `/api/blog?id=${post.id}` : '/api/blog';
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
        setError(data.error || 'Failed to save post');
      }
    } catch (err) {
      console.error('Error saving post:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="blog-form">
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
            placeholder="e.g., My Animation Process"
            maxLength={300}
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
            maxLength={300}
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
            placeholder="post-slug"
            required
          />
        </div>

        <div>
          <label className="admin-label">Category</label>
          <select
            name="category"
            className="admin-input"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="animation">Animation</option>
            <option value="design">Graphic Design</option>
            <option value="architecture">Architecture</option>
            <option value="tutorial">Tutorial</option>
            <option value="news">News</option>
          </select>
        </div>

        <div className="admin-form-full">
          <label className="admin-label">Excerpt (English)</label>
          <textarea
            name="excerpt_en"
            className="admin-input"
            value={formData.excerpt_en}
            onChange={handleChange}
            placeholder="Brief summary for post previews"
            rows={3}
            maxLength={500}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="admin-form-full">
          <label className="admin-label">Excerpt (Amharic)</label>
          <textarea
            name="excerpt_am"
            className="admin-input"
            value={formData.excerpt_am}
            onChange={handleChange}
            placeholder="አጭር ማጠቃለያ"
            rows={3}
            maxLength={500}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="admin-form-full">
          <label className="admin-label">Content (English) * - HTML supported</label>
          <textarea
            name="content_en"
            className="admin-input"
            value={formData.content_en}
            onChange={handleChange}
            placeholder="<p>Write your blog post content here. HTML tags are supported.</p>"
            rows={15}
            required
            style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
          />
        </div>

        <div className="admin-form-full">
          <label className="admin-label">Content (Amharic) - HTML supported</label>
          <textarea
            name="content_am"
            className="admin-input"
            value={formData.content_am}
            onChange={handleChange}
            placeholder="<p>የብሎግ ይዘትዎን እዚህ ይፃፉ</p>"
            rows={10}
            style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
          />
        </div>

        <div className="admin-form-full">
          <label className="admin-label">Featured Image URL</label>
          <input
            type="text"
            name="thumbnail"
            className="admin-input"
            value={formData.thumbnail}
            onChange={handleChange}
            placeholder="https://res.cloudinary.com/..."
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', paddingTop: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="published"
              checked={formData.published}
              onChange={handleChange}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '14px' }}>Publish immediately</span>
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
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Post' : 'Create Post'}
        </button>
      </div>
    </form>
  );
}