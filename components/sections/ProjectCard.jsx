// File: components/sections/ProjectCard.jsx
import Link from 'next/link';
import { getConfig } from '../../lib/config';
import './ProjectCard.css';

/**
 * ProjectCard — dark glassmorphism card with neon category badge.
 *
 * Each card shows:
 * - A thumbnail image window with category-colored inner glow
 * - A color-coded badge matching the category (Animation=Teal, Architecture=Blue, Design=Magenta)
 * - Bold white title below the image
 * - Year indicator
 * - Hover lift with glow border matching the category
 *
 * All labels from config/work.json via getConfig().
 *
 * @param {Object} props
 * @param {Object} props.project - Project data from database
 */
export default function ProjectCard({ project }) {
  if (!project) return null;

  const { id, slug, title, thumbnail, category, year } = project;

  const viewText = getConfig('work.projectCard.viewText')?.en || 'View Project';
  const noPreviewText = getConfig('work.projectCard.noPreviewText')?.en || 'No Preview';

  return (
    <Link href={`/project/${slug}`} className="project-card-link">
      <article className={`project-card project-card-${category || 'default'}`}>
        <div className="project-card-image-wrapper">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title?.en || 'Project thumbnail'}
              className="project-card-image"
              loading="lazy"
            />
          ) : (
            <div className="project-card-image-placeholder">
              <span className="project-card-image-placeholder-text">{noPreviewText}</span>
            </div>
          )}
          <div className="project-card-image-glow" />

          {category && (
            <span className={`project-card-badge project-card-badge-${category}`}>
              {category}
            </span>
          )}
        </div>

        <div className="project-card-body">
          <h3 className="project-card-title">
            {title?.en || 'Untitled Project'}
          </h3>
          <div className="project-card-footer">
            {year && <span className="project-card-year">{year}</span>}
            <span className="project-card-view">{viewText}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}