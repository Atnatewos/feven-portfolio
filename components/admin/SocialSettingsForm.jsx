// File: components/admin/SocialSettingsForm.jsx
'use client';

import { getConfig } from '../../lib/config';
import './SocialSettingsForm.css';

/**
 * Social Settings Form component.
 *
 * Renders the complete Social tab for the admin Settings page.
 * Every platform is rendered dynamically from config/social.json.
 * No hardcoded platform data — adding a new platform only requires
 * adding it to the config file.
 *
 * Each platform with showDisplayName=true gets two input fields:
 * - URL field (the profile/contact link)
 * - Display Name field (what visitors see on the public site)
 *
 * Phone numbers only get the URL field since the number is self-displaying.
 *
 * @param {Object}   props
 * @param {Object}   props.socialData    - Current social settings from state
 * @param {Function} props.onUpdate      - Callback to update a specific platform's data
 */
export default function SocialSettingsForm({ socialData = {}, onUpdate }) {
  const platforms = getConfig('social.platforms') || [];
  const sectionTitle = getConfig('social.sectionTitle') || 'Social Media & Contact';
  const sectionDescription = getConfig('social.sectionDescription') || '';

  /**
   * Updates a specific field for a platform.
   * Preserves existing data and merges the new field value.
   *
   * @param {string} platformId - The platform ID (e.g., 'instagram', 'youtube')
   * @param {string} field      - The field to update ('url' or 'displayName')
   * @param {string} value      - The new value
   */
  function handleChange(platformId, field, value) {
    const currentData = socialData[platformId] || { url: '', displayName: '' };
    const updatedData = { ...currentData, [field]: value };

    /*
     * For phone numbers, the URL and display name are the same.
     * When the user types a phone number, both fields update together.
     */
    const platformConfig = platforms.find((p) => p.id === platformId);
    if (platformConfig && !platformConfig.showDisplayName) {
      updatedData.displayName = value;
    }

    onUpdate(platformId, updatedData);
  }

  return (
    <div>
      <p
        style={{
          color: 'var(--admin-text-muted)',
          marginBottom: '24px',
          fontSize: '14px',
          lineHeight: '1.6',
        }}
      >
        {sectionDescription}
      </p>

      <div className="admin-form-grid">
        {platforms.map((platform) => (
          <div key={platform.id} className="admin-form-full">
            <div
              className="social-settings-card"
            >
              <div className="social-settings-card-header">
                <span className="social-settings-card-icon">
                  {platform.icon}
                </span>
                <div className="social-settings-card-title-group">
                  <h3 className="social-settings-card-title">
                    {platform.label}
                  </h3>
                  <p className="social-settings-card-help">
                    {platform.helpText}
                  </p>
                </div>
              </div>

              {platform.showDisplayName ? (
                <div className="admin-form-grid" style={{ marginTop: 0 }}>
                  <div>
                    <label className="admin-label">
                      {platform.urlLabel || 'URL'}
                    </label>
                    <input
                      type={platform.id === 'email' ? 'email' : 'url'}
                      className="admin-input"
                      value={socialData[platform.id]?.url || ''}
                      onChange={(e) =>
                        handleChange(platform.id, 'url', e.target.value)
                      }
                      placeholder={platform.urlPlaceholder || ''}
                      maxLength={platform.id === 'email' ? 254 : 500}
                    />
                  </div>
                  <div>
                    <label className="admin-label">
                      {platform.displayNameLabel || 'Display Name'}
                    </label>
                    <input
                      type="text"
                      className="admin-input"
                      value={socialData[platform.id]?.displayName || ''}
                      onChange={(e) =>
                        handleChange(platform.id, 'displayName', e.target.value)
                      }
                      placeholder={platform.displayNamePlaceholder || ''}
                      maxLength={100}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="admin-label">
                    {platform.urlLabel || 'Phone Number(s)'}
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    value={socialData[platform.id]?.url || ''}
                    onChange={(e) =>
                      handleChange(platform.id, 'url', e.target.value)
                    }
                    placeholder={platform.urlPlaceholder || ''}
                    maxLength={500}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}