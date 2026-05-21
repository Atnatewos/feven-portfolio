// File: components/sections/ProjectGrid.jsx
'use client';

import { useState } from 'react';
import ProjectCard from './ProjectCard';
import { getConfig } from '../../lib/config';
import './ProjectGrid.css';

/**
 * ProjectGrid — filterable, searchable grid of project cards.
 *
 * Features:
 * - Section title with chevron navigation arrows
 * - Category filter pills with neon glow colors
 * - Search input
 * - Responsive grid layout
 * - Empty state when no projects match
 *
 * All labels from config/work.json.
 *
 * @param {Object} props
 * @param {Array}  props.projects - Array of project objects
 * @param {string} [props.title]  - Section title override
 */
export default function ProjectGrid({ projects = [], title }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = getConfig('work.categories') || [];
  const filterAllLabel = getConfig('work.filterAllLabel')?.en || 'All Work';
  const sectionTitle = title || getConfig('work.pageTitle')?.en || 'Selected Projects';

  const allFilter = { id: 'all', label: { en: filterAllLabel } };
  const allCategories = [allFilter, ...categories.filter((c) => c.id !== 'all')];

  let filtered = [...projects];

  if (activeFilter !== 'all') {
    filtered = filtered.filter((p) => p.category === activeFilter);
  }

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        (p.title?.en || '').toLowerCase().includes(query) ||
        (p.client || '').toLowerCase().includes(query) ||
        (p.category || '').toLowerCase().includes(query)
    );
  }

  if (projects.length === 0) {
    return null;
  }

  return (
    <section className="projects-section">
      <div className="container">
        <div className="projects-section-header">
          <h2 className="projects-section-title">{sectionTitle}</h2>
          <div className="projects-section-nav">
            <button className="projects-nav-btn" aria-label="Previous projects" type="button" disabled>
              ←
            </button>
            <button className="projects-nav-btn" aria-label="Next projects" type="button" disabled>
              →
            </button>
          </div>
        </div>

        <div className="projects-filters-row">
          <div className="projects-filter-pills">
            {allCategories.map((cat) => (
              <button
                key={cat.id}
                className={`projects-filter-pill ${activeFilter === cat.id ? 'active' : ''} projects-filter-pill-${cat.id}`}
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
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="projects-grid">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="projects-empty">
            <div className="projects-empty-icon">🎬</div>
            <p className="projects-empty-text">No projects found matching your criteria.</p>
          </div>
        )}
      </div>
    </section>
  );
}