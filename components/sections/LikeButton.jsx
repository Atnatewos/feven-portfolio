// File: components/sections/LikeButton.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import './LikeButton.css';

/**
 * Reaction button component for blog posts.
 *
 * Supports 6 reaction types: like, love, fire, clap, idea, wow.
 * One reaction per IP per post. Clicking the same reaction removes it.
 * Shows live counts for all reaction types.
 *
 * @param {Object} props
 * @param {string} props.postId - The UUID of the blog post
 */
const REACTIONS = [
  { type: 'like', icon: '👍', label: 'Like' },
  { type: 'love', icon: '❤️', label: 'Love' },
  { type: 'fire', icon: '🔥', label: 'Fire' },
  { type: 'clap', icon: '👏', label: 'Clap' },
  { type: 'idea', icon: '💡', label: 'Idea' },
  { type: 'wow', icon: '😮', label: 'Wow' },
];

export default function LikeButton({ postId }) {
  const [counts, setCounts] = useState({});
  const [userReaction, setUserReaction] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReactions = useCallback(async () => {
    try {
      const response = await fetch(`/api/blog/reactions?post_id=${postId}`);
      if (response.ok) {
        const data = await response.json();
        setCounts(data);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  async function handleReaction(type) {
    const previousCounts = { ...counts };
    const previousUserReaction = userReaction;

    if (userReaction === type) {
      setUserReaction(null);
      setCounts((prev) => ({ ...prev, [type]: Math.max(0, (prev[type] || 0) - 1) }));
    } else {
      if (userReaction) {
        setCounts((prev) => ({
          ...prev,
          [userReaction]: Math.max(0, (prev[userReaction] || 0) - 1),
        }));
      }
      setUserReaction(type);
      setCounts((prev) => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
    }

    try {
      const response = await fetch('/api/blog/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, reaction_type: type }),
      });

      if (response.ok) {
        const data = await response.json();
        setCounts(data);
      } else {
        setCounts(previousCounts);
        setUserReaction(previousUserReaction);
      }
    } catch {
      setCounts(previousCounts);
      setUserReaction(previousUserReaction);
    }
  }

  if (loading) {
    return (
      <div className="reactions-container">
        <div className="reactions-skeleton" />
      </div>
    );
  }

  const totalReactions = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="reactions-container">
      <div className="reactions-row">
        {REACTIONS.map((reaction) => (
          <button
            key={reaction.type}
            className={`reaction-btn ${userReaction === reaction.type ? 'active' : ''}`}
            onClick={() => handleReaction(reaction.type)}
            aria-label={reaction.label}
            title={reaction.label}
            type="button"
          >
            <span className="reaction-icon">{reaction.icon}</span>
            <span className="reaction-count">{(counts[reaction.type] || 0)}</span>
          </button>
        ))}
      </div>
      {totalReactions > 0 && (
        <p className="reactions-total">{totalReactions} reaction{totalReactions !== 1 ? 's' : ''}</p>
      )}
    </div>
  );
}