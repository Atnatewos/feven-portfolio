// File: components/sections/BlogList.jsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getConfig } from '../../lib/config';
import './BlogList.css';

/**
 * BlogList — dark gradient cards grid for blog posts.
 *
 * Each card shows:
 * - Dark purple-gradient background
 * - Category badge with neon color
 * - Bold title
 * - Excerpt preview
 * - Date indicator
 * - Hover lift with glow
 *
 * All labels from config/blog.json via getConfig().
 *
 * @param {Object} props
 * @param {Array}  props.posts - Array of blog post objects
 */
export default function BlogList({ posts = [] }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const pageTitle = getConfig('blog.pageTitle')?.en || 'Blog';
  const subtitle = getConfig('blog.subtitle')?.en || '';
  const readMoreText = getConfig('blog.readMore')?.en || 'Read More →';
  const noPostsText = getConfig('blog.noPosts')?.en || 'No blog posts yet.';
  const filterAllLabel = getConfig('blog.filterAllLabel')?.en || 'All Posts';
  const categories = getConfig('blog.categories') || [];

  const allFilter = { id: 'all', label: { en: filterAllLabel } };
  const allCategories = [allFilter, ...categories.filter((c) => c.id !== 'all')];

  let filtered = [...posts];

  if (activeFilter !== 'all') {
    filtered = filtered.filter((p) => p.category === activeFilter);
  }

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        (p.title?.en || '').toLowerCase().includes(query) ||
        (p.excerpt?.en || '').toLowerCase().includes(query) ||
        (p.slug || '').toLowerCase().includes(query)
    );
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return (
    <section className="blog-section">
      <div className="container">
        <div className="blog-header">
          <h1 className="blog-title">{pageTitle}</h1>
          {subtitle && <p className="blog-subtitle">{subtitle}</p>}
        </div>

        <div className="blog-filters-row">
          <div className="blog-filter-pills">
            {allCategories.map((cat) => (
              <button
                key={cat.id}
                className={`blog-filter-pill ${activeFilter === cat.id ? 'active' : ''}`}
                onClick={() => setActiveFilter(cat.id)}
                aria-pressed={activeFilter === cat.id}
                type="button"
              >
                {cat.label.en || cat.id}
              </button>
            ))}
          </div>

          <div className="projects-search">
            <span className="projects-search-icon">🔍</span>
            <input
              type="text"
              className="projects-search-input"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="blog-grid">
            {filtered.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="blog-card-link">
                <article className="blog-card">
                  {post.thumbnail && (
                    <div className="blog-card-image-wrapper">
                      <img
                        src={post.thumbnail}
                        alt={post.title?.en || 'Blog post'}
                        className="blog-card-image"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="blog-card-body">
                    <div className="blog-card-meta">
                      {post.category && (
                        <span className="blog-card-category">{post.category}</span>
                      )}
                      {post.created_at && (
                        <span className="blog-card-date">{formatDate(post.created_at)}</span>
                      )}
                    </div>
                    <h3 className="blog-card-title">
                      {post.title?.en || 'Untitled Post'}
                    </h3>
                    {post.excerpt?.en && (
                      <p className="blog-card-excerpt">{post.excerpt.en}</p>
                    )}
                    <span className="blog-card-read-more">{readMoreText}</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="projects-empty">
            <div className="projects-empty-icon">📝</div>
            <p className="projects-empty-text">{noPostsText}</p>
          </div>
        )}
      </div>
    </section>
  );
}