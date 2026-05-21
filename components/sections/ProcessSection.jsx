// File: components/sections/ProcessSection.jsx
import { getConfig } from '../../lib/config';
import './ProcessSection.css';

/**
 * Process page — dark cyberpunk workflow display.
 *
 * Features:
 * - Vertical timeline with connected glowing nodes
 * - Each step has an icon in a neon circle, step number, title, and description
 * - Connecting lines with gradient glow between nodes
 * - Page title and subtitle from config
 *
 * All content from settings prop (database) with config fallbacks.
 *
 * @param {Object} props
 * @param {Object} props.settings - Complete site settings
 */
export default function ProcessSection({ settings }) {
  const process = settings?.process || {};

  const pageTitle = process.titleEn || getConfig('process.pageTitle.en') || 'My Process';
  const subtitle = process.subtitleEn || getConfig('process.subtitle.en') || '';
  const steps = process.steps || getConfig('process.steps') || [];

  return (
    <section className="process-page">
      <div className="container container-narrow">
        <div className="process-header">
          <h1 className="process-title">{pageTitle}</h1>
          {subtitle && <p className="process-subtitle">{subtitle}</p>}
        </div>

        {steps.length > 0 ? (
          <div className="process-timeline">
            {steps.map((step, index) => (
              <div key={index} className="process-step">
                <div className="process-step-marker">
                  <div className="process-step-circle">
                    <span className="process-step-icon">{step.icon || '🎨'}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="process-step-line" />
                  )}
                </div>
                <div className="process-step-body glass-card">
                  <div className="process-step-header">
                    <span className="process-step-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="process-step-title">
                      {step.titleEn || `Step ${index + 1}`}
                    </h3>
                  </div>
                  {step.descriptionEn && (
                    <p className="process-step-description">
                      {step.descriptionEn}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="process-empty">
            <div className="process-empty-icon">🔄</div>
            <p className="process-empty-text">
              No process steps configured yet. Add steps in the admin Settings → Process tab.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}