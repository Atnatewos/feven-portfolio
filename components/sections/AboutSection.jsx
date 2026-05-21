// File: components/sections/AboutSection.jsx
import { getConfig } from '../../lib/config';
import GlowButton from '../ui/GlowButton';
import './AboutSection.css';

/**
 * About page — dark cyberpunk theme.
 *
 * Layout:
 * - Left: Bio text with neon green glowing profile avatar
 * - Right: Skills, tools, education sections
 * - Process flowchart with connected line vectors
 *
 * All content from settings prop (database) with config fallbacks.
 *
 * @param {Object} props
 * @param {Object} props.settings - Complete site settings
 */
export default function AboutSection({ settings }) {
  const about = settings?.about || {};
  const branding = settings?.branding || {};

  const pageTitle = about.pageTitle?.en || getConfig('about.pageTitle.en') || 'About Me';
  const profilePhoto = about.profilePhoto || branding.logo?.light || '';
  const bio = about.bioEn || '';
  const location = about.locationEn || '';
  const skills = about.skills || [];
  const tools = about.tools || [];
  const education = about.education || [];
  const taglines = about.taglines?.en || [];
  const skillsHeading = about.skillsHeading?.en || 'Skills & Expertise';
  const toolsHeading = about.toolsHeading?.en || 'Tools & Software';
  const educationHeading = about.educationHeading?.en || 'Education';

  return (
    <section className="about-page">
      <div className="container">
        <div className="about-header">
          <h1 className="about-title">{pageTitle}</h1>
          {taglines.length > 0 && (
            <div className="about-taglines">
              {taglines.map((tag, i) => (
                <span key={i} className="about-tagline">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="about-grid">
          {/* Left: Bio + Avatar */}
          <div className="about-left">
            <div className="about-avatar-frame">
              <div className="about-avatar-glow" />
              <div className="about-avatar-image-wrapper">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt={about.profilePhotoAlt?.en || `${branding.siteName || ''} profile`}
                    className="about-avatar-image"
                  />
                ) : (
                  <div className="about-avatar-placeholder">
                    {branding.siteNameShort || 'F'}
                  </div>
                )}
              </div>
            </div>

            {bio && (
              <div className="about-bio glass-card">
                <p className="about-bio-text">{bio}</p>
                {location && (
                  <p className="about-location">
                    <span className="about-location-icon">📍</span>
                    {location}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right: Skills, Tools, Education */}
          <div className="about-right">
            {skills.length > 0 && (
              <div className="about-section-block">
                <h3 className="about-section-title">{skillsHeading}</h3>
                <div className="about-tags-grid">
                  {skills.map((skill, i) => (
                    <span key={i} className="about-tag-item">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {tools.length > 0 && (
              <div className="about-section-block">
                <h3 className="about-section-title">{toolsHeading}</h3>
                <div className="about-tags-grid">
                  {tools.map((tool, i) => (
                    <span key={i} className="about-tag-item about-tag-tool">{tool}</span>
                  ))}
                </div>
              </div>
            )}

            {education.length > 0 && (
              <div className="about-section-block">
                <h3 className="about-section-title">{educationHeading}</h3>
                <div className="about-education-list">
                  {education.map((edu, i) => (
                    <div key={i} className="about-education-item glass-card">
                      <h4 className="about-education-degree">{edu.degreeEn || ''}</h4>
                      <p className="about-education-school">{edu.schoolEn || ''}</p>
                      {edu.year && (
                        <span className="about-education-year">{edu.year}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="about-cta">
          <GlowButton href="/contact" variant="primary" size="lg">
            Get In Touch
          </GlowButton>
        </div>
      </div>
    </section>
  );
}