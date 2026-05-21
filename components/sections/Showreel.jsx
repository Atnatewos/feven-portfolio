// File: components/sections/Showreel.jsx
import { getConfig } from '../../lib/config';
import VideoEmbed from './VideoEmbed';
import GlowButton from '../ui/GlowButton';
import './Showreel.css';

/**
 * Showreel page — dark cyberpunk video showcase.
 *
 * Layout:
 * - Large 16:9 video player with centered glassmorphism play button overlay
 * - Horizontal thumbnail carousel below for chapter selection
 * - Stats row with neon glow numbers
 * - Bottom split: About snippet + Process flowchart diagram
 *
 * All content from config/showreel.json via getConfig().
 *
 * @param {Object} props
 * @param {Object} props.settings - Complete site settings from database
 */
export default function Showreel({ settings }) {
  const showreel = settings?.showreel || {};

  const title = showreel.titleEn || getConfig('showreel.pageTitle.en') || 'Showreel';
  const description = showreel.descriptionEn || getConfig('showreel.description.en') || '';
  const videoUrl = showreel.videoUrl || '';
  const posterUrl = showreel.posterUrl || '';
  const stats = showreel.stats || getConfig('showreel.stats') || [];

  const aboutSnippet = showreel.aboutSnippet || '';
  const processSteps = showreel.processSteps || [];

  return (
    <section className="showreel-page">
      <div className="container">
        <div className="showreel-header">
          <h1 className="showreel-title">{title}</h1>
          {description && <p className="showreel-description">{description}</p>}
        </div>

        {/* Video Player */}
        <div className="showreel-player-wrapper">
          <div className="showreel-player">
            {videoUrl ? (
              <VideoEmbed
                url={videoUrl}
                title={title}
                poster={posterUrl}
                aspectRatio="16/9"
              />
            ) : (
              <div className="showreel-player-empty">
                <div className="showreel-player-empty-icon">🎥</div>
                <p className="showreel-player-empty-text">
                  Add your showreel video URL in the admin Settings → Showreel tab.
                </p>
              </div>
            )}
          </div>

          {/* Custom Timeline Scrubber */}
          {videoUrl && (
            <div className="showreel-timeline">
              <div className="showreel-timeline-bar">
                <div className="showreel-timeline-progress" style={{ width: '0%' }} />
                <div className="showreel-timeline-thumb" style={{ left: '0%' }} />
              </div>
              <div className="showreel-timeline-time">
                <span>00:00</span>
                <span>00:00</span>
              </div>
            </div>
          )}
        </div>

        {/* Thumbnail Carousel */}
        {showreel.thumbnails && showreel.thumbnails.length > 0 && (
          <div className="showreel-carousel">
            <div className="showreel-carousel-track">
              {showreel.thumbnails.map((thumb, index) => (
                <button
                  key={index}
                  className={`showreel-carousel-item ${index === 0 ? 'active' : ''}`}
                  type="button"
                  aria-label={`Chapter ${index + 1}`}
                >
                  {thumb.imageUrl ? (
                    <img
                      src={thumb.imageUrl}
                      alt={thumb.label || `Chapter ${index + 1}`}
                      className="showreel-carousel-image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="showreel-carousel-placeholder">
                      <span>{String(index + 1).padStart(2, '0')}</span>
                    </div>
                  )}
                  <div className="showreel-carousel-label">
                    <span className="showreel-carousel-chapter">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {thumb.label && (
                      <span className="showreel-carousel-title">{thumb.label}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {stats.length > 0 && (
          <div className="showreel-stats">
            {stats.map((stat, index) => (
              <div key={index} className="showreel-stat-item">
                <span className="showreel-stat-value">{stat.value || ''}</span>
                <span className="showreel-stat-label">{stat.label?.en || ''}</span>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Split: About Snippet + Process Flowchart */}
        <div className="showreel-bottom-split">
          {/* About Snippet */}
          {aboutSnippet && (
            <div className="showreel-about-snippet glass-card">
              <h3 className="showreel-snippet-title">About Me</h3>
              <p className="showreel-snippet-text">{aboutSnippet}</p>
              <GlowButton href="/about" variant="primary" size="sm">
                Read More
              </GlowButton>
            </div>
          )}

          {/* Process Flowchart */}
          {processSteps.length > 0 && (
            <div className="showreel-process-chart">
              <h3 className="showreel-snippet-title">My Process</h3>
              <div className="showreel-process-flow">
                {processSteps.map((step, index) => (
                  <div key={index} className="showreel-process-node">
                    <div className="showreel-process-node-circle">
                      <span className="showreel-process-node-icon">{step.icon || '🎨'}</span>
                    </div>
                    <div className="showreel-process-node-content">
                      <span className="showreel-process-node-number">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="showreel-process-node-title">
                        {step.titleEn || `Step ${index + 1}`}
                      </span>
                    </div>
                    {index < processSteps.length - 1 && (
                      <div className="showreel-process-node-line" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}