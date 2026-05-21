// File: components/sections/ProjectDetail.jsx
import Link from 'next/link';
import VideoEmbed from './VideoEmbed';
import GlowButton from '../ui/GlowButton';
import './ProjectDetail.css';

/**
 * ProjectDetail — single project view with dark cyberpunk styling.
 *
 * Layout:
 * - Back link
 * - Category badge + Title + Description
 * - Media gallery with video embeds and images
 * - Sidebar: Client, Year, Category, Tools Used
 * - "View Live Project" card with thumbnail — links to the first media URL
 * - Navigation: View All Projects, Start a Project Like This
 *
 * If the project has a media URL (YouTube, Google Drive, etc.),
 * a clickable thumbnail card appears that opens the project in a new tab.
 *
 * @param {Object} props
 * @param {Object} props.project - Project data from database
 */
export default function ProjectDetail({ project }) {
  if (!project) return null;

  const { title, description, category, media, tools, client, year, thumbnail } = project;

  /*
   * Extract the first media URL for the "View Live Project" link.
   * This could be a YouTube video, Google Drive link, Vimeo, or any URL.
   */
  const firstMediaUrl = media && media.length > 0 ? media[0].url : null;
  const firstMediaType = media && media.length > 0 ? media[0].type : null;
  const firstMediaLabel = firstMediaType === 'youtube' ? 'Watch on YouTube' :
    firstMediaType === 'vimeo' ? 'Watch on Vimeo' :
    firstMediaType === 'googledrive' ? 'View on Google Drive' :
    'View Live Project';

  const categoryColors = {
    animation: 'var(--color-animation, #00FFCC)',
    design: 'var(--color-design, #D946EF)',
    architecture: 'var(--color-architecture, #00D2FF)',
  };

  return (
    <article className="project-detail-page">
      <div className="container">
        <Link href="/work" className="project-detail-back">
          <span className="project-detail-back-arrow">←</span>
          Back to Work
        </Link>

        <header className="project-detail-header">
          <div className="project-detail-meta-row">
            {category && (
              <span
                className="project-detail-category"
                style={{
                  background: `${categoryColors[category] || '#D946EF'}20`,
                  color: categoryColors[category] || '#D946EF',
                  borderColor: `${categoryColors[category] || '#D946EF'}40`,
                }}
              >
                {category}
              </span>
            )}
            {year && <span className="project-detail-year">{year}</span>}
          </div>

          <h1 className="project-detail-title">
            {title?.en || 'Untitled Project'}
          </h1>

          {description?.en && (
            <p className="project-detail-description">{description.en}</p>
          )}
        </header>

        <div className="project-detail-layout">
          {/* Left: Media Gallery */}
          <div className="project-detail-main">
            {media && media.length > 0 && (
              <div className="project-detail-media">
                {media.map((item, index) => (
                  <div key={index} className="project-detail-media-item">
                    {item.type === 'youtube' ||
                    item.type === 'vimeo' ||
                    item.type === 'googledrive' ||
                    item.type === 'cloudinary' ? (
                      <VideoEmbed
                        url={item.url}
                        title={`${title?.en || 'Project'} - ${index + 1}`}
                        poster={item.poster}
                        aspectRatio="16/9"
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={item.caption_en || `${title?.en || 'Project'} image ${index + 1}`}
                        className="project-detail-media-image"
                        loading="lazy"
                      />
                    )}
                    {(item.caption_en || item.caption_am) && (
                      <p className="project-detail-media-caption">
                        {item.caption_en || item.caption_am}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* "View Live Project" Card — Links to the first media URL */}
            {firstMediaUrl && (
              <a
                href={firstMediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="project-detail-live-card"
              >
                <div className="project-detail-live-card-image">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={title?.en || 'Project thumbnail'}
                      className="project-detail-live-card-thumb"
                    />
                  ) : (
                    <div className="project-detail-live-card-placeholder">
                      <span className="project-detail-live-card-placeholder-icon">🎬</span>
                    </div>
                  )}
                  <div className="project-detail-live-card-overlay">
                    <span className="project-detail-live-card-play">▶</span>
                    <span className="project-detail-live-card-label">{firstMediaLabel}</span>
                  </div>
                </div>
              </a>
            )}
          </div>

          {/* Right: Sidebar */}
          <aside className="project-detail-sidebar">
            {client && (
              <div className="project-detail-info-block">
                <h3 className="project-detail-info-label">Client</h3>
                <p className="project-detail-info-value">{client}</p>
              </div>
            )}

            {year && (
              <div className="project-detail-info-block">
                <h3 className="project-detail-info-label">Year</h3>
                <p className="project-detail-info-value">{year}</p>
              </div>
            )}

            {category && (
              <div className="project-detail-info-block">
                <h3 className="project-detail-info-label">Category</h3>
                <p className="project-detail-info-value">{category}</p>
              </div>
            )}

            {tools && tools.length > 0 && (
              <div className="project-detail-info-block">
                <h3 className="project-detail-info-label">Tools Used</h3>
                <div className="project-detail-tools">
                  {tools.map((tool, i) => (
                    <span key={i} className="project-detail-tool-tag">{tool}</span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Bottom Navigation */}
        <div className="project-detail-navigation">
          <Link href="/work" className="project-detail-nav-link">
            ← View All Projects
          </Link>
          <GlowButton href="/contact" variant="primary" size="md">
            Start a Project Like This
          </GlowButton>
        </div>
      </div>
    </article>
  );
}