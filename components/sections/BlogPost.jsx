// File: components/sections/BlogPost.jsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getConfig } from '../../lib/config';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';
import ShareButtons from './ShareButtons';
import './BlogPost.css';

/**
 * BlogPost — single blog post view with dark cyberpunk styling.
 *
 * Layout:
 * - Back link
 * - Category badge + Title + Date
 * - Featured image
 * - Rich HTML content with dark prose styling
 * - Like/Dislike buttons
 * - Share buttons row
 * - Comment section
 *
 * @param {Object} props
 * @param {Object} props.post - Blog post data from database
 */
export default function BlogPost({ post }) {
  if (!post) return null;

  const backToBlogText = getConfig('blog.backToBlog')?.en || '← Back to Blog';
  const { id, title, content, category, thumbnail, created_at } = post;

  function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return (
    <article className="blog-post-page">
      <div className="container container-narrow">
        <Link href="/blog" className="blog-post-back">
          <span className="blog-post-back-arrow">←</span>
          {backToBlogText}
        </Link>

        <header className="blog-post-header">
          {category && (
            <span className="blog-post-category-badge">{category}</span>
          )}
          <h1 className="blog-post-title">{title?.en || 'Untitled Post'}</h1>
          {created_at && (
            <time className="blog-post-date" dateTime={created_at}>
              {formatDate(created_at)}
            </time>
          )}
        </header>

        {thumbnail && (
          <div className="blog-post-featured-image">
            <img
              src={thumbnail}
              alt={title?.en || 'Blog post featured image'}
              className="blog-post-featured-img"
            />
          </div>
        )}

        <div className="blog-post-content">
          {content?.en ? (
            <div
              className="blog-post-body"
              dangerouslySetInnerHTML={{ __html: content.en }}
            />
          ) : (
            <p className="blog-post-empty">No content available.</p>
          )}
        </div>

        <div className="blog-post-interactions">
          <LikeButton postId={id} />
        </div>

        <footer className="blog-post-footer">
          <ShareButtons />
        </footer>

        <CommentSection postId={id} />
      </div>
    </article>
  );
}