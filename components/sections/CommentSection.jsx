// File: components/sections/CommentSection.jsx — UPDATE the fetch and submit
'use client';

import { useState, useEffect, useCallback } from 'react';
import './CommentSection.css';

export default function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    author_name: '',
    author_email: '',
    content: '',
    website: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/blog/comments?post_id=${postId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  function validateForm() {
    const newErrors = {};
    if (!formData.author_name.trim()) {
      newErrors.author_name = 'Name is required';
    } else if (formData.author_name.trim().length < 2) {
      newErrors.author_name = 'Name must be at least 2 characters';
    }
    if (formData.author_email.trim() && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.author_email.trim())) {
      newErrors.author_email = 'Please enter a valid email address';
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Comment is required';
    } else if (formData.content.trim().length < 3) {
      newErrors.content = 'Comment must be at least 3 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (formData.website) {
      setSubmitted(true);
      return;
    }
    if (!validateForm()) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          author_name: formData.author_name.trim(),
          author_email: formData.author_email.trim() || null,
          content: formData.content.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({ author_name: '', author_email: '', content: '', website: '' });
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 2000);

        /*
         * Refresh comments from the API to show the new comment.
         * This ensures we get the correct data from the database.
         */
        fetchComments();
      } else {
        const data = await response.json();
        setSubmitError(data.error || 'Failed to submit comment.');
      }
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return (
    <section className="comment-section">
      <h3 className="comment-section-title">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>

      {loading ? (
        <div className="comment-skeleton">
          <div className="comment-skeleton-avatar" />
          <div className="comment-skeleton-content">
            <div className="comment-skeleton-line short" />
            <div className="comment-skeleton-line" />
          </div>
        </div>
      ) : comments.length > 0 ? (
        <div className="comment-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar">
                {comment.author_name.charAt(0).toUpperCase()}
              </div>
              <div className="comment-body">
                <div className="comment-header">
                  <span className="comment-author">{comment.author_name}</span>
                  <span className="comment-date">{formatDate(comment.created_at)}</span>
                </div>
                <p className="comment-content">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="comment-empty">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}

      {submitted ? (
        <div className="comment-success">
          <span>✅</span> Your comment has been posted.
        </div>
      ) : (
        <form className="comment-form" onSubmit={handleSubmit} noValidate>
          <h4 className="comment-form-title">Leave a Comment</h4>

          <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }} aria-hidden="true">
            <label htmlFor="comment-website">Website</label>
            <input type="text" id="comment-website" name="website" value={formData.website} onChange={handleChange} tabIndex={-1} autoComplete="off" />
          </div>

          <div className="comment-form-grid">
            <div className="comment-form-group">
              <label htmlFor="comment-name" className="comment-form-label">Name *</label>
              <input type="text" id="comment-name" name="author_name" value={formData.author_name} onChange={handleChange} className={`comment-form-input ${errors.author_name ? 'has-error' : ''}`} placeholder="Your name" disabled={submitting} maxLength={100} />
              {errors.author_name && <span className="comment-form-error">{errors.author_name}</span>}
            </div>
            <div className="comment-form-group">
              <label htmlFor="comment-email" className="comment-form-label">Email <span className="comment-form-optional">(optional)</span></label>
              <input type="email" id="comment-email" name="author_email" value={formData.author_email} onChange={handleChange} className={`comment-form-input ${errors.author_email ? 'has-error' : ''}`} placeholder="your@email.com" disabled={submitting} maxLength={254} />
              {errors.author_email && <span className="comment-form-error">{errors.author_email}</span>}
            </div>
            <div className="comment-form-group comment-form-full">
              <label htmlFor="comment-content" className="comment-form-label">Comment *</label>
              <textarea id="comment-content" name="content" value={formData.content} onChange={handleChange} className={`comment-form-textarea ${errors.content ? 'has-error' : ''}`} placeholder="Share your thoughts..." rows={4} disabled={submitting} maxLength={2000} />
              {errors.content && <span className="comment-form-error">{errors.content}</span>}
            </div>
          </div>

          {submitError && <div className="comment-submit-error">{submitError}</div>}

          <button type="submit" className="comment-submit-btn" disabled={submitting}>
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      )}
    </section>
  );
}