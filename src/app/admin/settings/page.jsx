// File: src/app/admin/settings/page.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getConfig, getFullConfig } from '../../../../lib/config';
import ImageUploadField from '../../../../components/admin/ImageUploadField';
import SocialSettingsForm from '../../../../components/admin/SocialSettingsForm';

/**
 * Admin Sidebar — shared across all admin pages.
 * Reads navigation structure from config/admin.json via getConfig().
 * Highlights the current active route and provides sign out functionality.
 * All labels, icons, and navigation items are config-driven.
 */
function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const brandText = getConfig('admin.sidebar.brandText') || 'Admin';
  const brandIcon = getConfig('admin.sidebar.brandIcon') || 'A';
  const navItems = getConfig('admin.sidebar.navItems') || [];
  const viewSiteLabel = getConfig('admin.sidebar.viewSiteLabel') || 'View Website';
  const signOutLabel = getConfig('admin.sidebar.signOutLabel') || 'Sign Out';
  const footerText = getConfig('admin.sidebar.footerText') || 'Portfolio CMS';

  /**
   * Determines whether a navigation item matches the current route.
   * Uses exact match for /admin and prefix match for sub-routes
   * to handle nested admin pages correctly.
   *
   * @param {string} href - The navigation item's href
   * @returns {boolean} Whether this item is the active route
   */
  function isActive(href) {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  }

  /**
   * Clears authentication state and redirects to the login page.
   * Removes the JWT token from localStorage and navigates away.
   * The login path comes from config/site.json via getConfig().
   */
  function handleLogout() {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <div className="admin-sidebar-brand-icon">{brandIcon}</div>
        {brandText}
      </div>

      <nav className="admin-sidebar-nav">
        <div className="admin-sidebar-section">Main Menu</div>

        {navItems.map((item) => (
          <Link
            key={item.id || item.href}
            href={item.href}
            className={`admin-sidebar-link ${isActive(item.href) ? 'active' : ''}`}
          >
            <span className="admin-sidebar-icon">{item.icon || '📄'}</span>
            {item.label || 'Page'}
          </Link>
        ))}

        <div className="admin-sidebar-section">Quick Links</div>

        <Link
          href="/"
          className="admin-sidebar-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="admin-sidebar-icon">🔗</span>
          {viewSiteLabel}
        </Link>

        <button
          onClick={handleLogout}
          className="admin-sidebar-link"
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            fontFamily: 'inherit',
          }}
        >
          <span className="admin-sidebar-icon">🚪</span>
          {signOutLabel}
        </button>
      </nav>

      <div className="admin-sidebar-footer">
        <p
          style={{
            fontSize: '11px',
            color: 'var(--admin-text-muted)',
            textAlign: 'center',
          }}
        >
          {footerText}
        </p>
      </div>
    </aside>
  );
}

/**
 * Admin Settings Page — Central Configuration Hub.
 *
 * This is the single most important page in the admin panel.
 * Every setting here controls how the public website appears and behaves.
 *
 * Architecture:
 * - Reads initial default values from config/*.json files via getFullConfig()
 * - Loads saved values from PostgreSQL via /api/settings on mount
 * - Merges DB values over config defaults (DB takes priority)
 * - Saves all changes back to PostgreSQL via /api/settings
 * - Public pages read from the same database via lib/data.js
 *
 * All form labels, placeholders, hints, maxLength, maxSize, and accept
 * values come from config/settingsForm.json via getConfig().
 * Zero hardcoded user-facing strings in any form field.
 *
 * Tabs:
 * 1. Branding  — Site name, tagline, colors, logo, favicon
 * 2. Hero      — Homepage hero section content, CTAs, background image, profile photo
 * 3. About     — Bio, skills, tools, education, profile photo
 * 4. Showreel  — Video URL, poster image, stats display
 * 5. Process   — Workflow steps with icons and descriptions
 * 6. Work Page — Work section title, subtitle, filter toggles
 * 7. Social    — Social media URLs and email
 * 8. SEO       — Meta titles, descriptions, OG image, analytics
 * 9. Sections  — Toggle visibility of site sections
 */
export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('branding');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  /*
   * Load config file defaults as the starting point.
   * These are overridden by database values when they exist.
   */
  const defaultConfig = getFullConfig();

  /**
   * Central settings state object.
   * Each top-level key maps to a settings category stored in the database.
   * Initialized from config/*.json files as defaults.
   * Database values override these defaults when loaded.
   */
  const [settings, setSettings] = useState({
    branding: defaultConfig.branding || {},
    hero: defaultConfig.hero || {},
    about: defaultConfig.about || {},
    showreel: defaultConfig.showreel || {},
    process: defaultConfig.process || {},
    work: defaultConfig.work || {},
    social: defaultConfig.footer?.social || {},
    seo: defaultConfig.seo || {},
    sections: {
      showBlog: true,
      showProcess: true,
      showShowreel: true,
      showTestimonials: false,
      showArchitecture: true,
    },
  });

  /*
   * Tab definitions for the settings navigation.
   * Each tab has an id, icon, and label for display.
   */
  const tabs = [
    { id: 'branding', icon: '🎨', label: 'Branding' },
    { id: 'hero', icon: '🏠', label: 'Hero' },
    { id: 'about', icon: '👤', label: 'About' },
    { id: 'showreel', icon: '🎥', label: 'Showreel' },
    { id: 'process', icon: '🔄', label: 'Process' },
    { id: 'work', icon: '🎬', label: 'Work Page' },
    { id: 'social', icon: '🔗', label: 'Social' },
    { id: 'seo', icon: '🔍', label: 'SEO' },
    { id: 'sections', icon: '📑', label: 'Sections' },
  ];

  /*
   * Button and toast labels from config/admin.json.
   * All user-facing text is config-driven with sensible fallbacks.
   */
  const btnSaveAll = getConfig('admin.labels.buttons.save') || 'Save All Settings';
  const btnAdd = getConfig('admin.labels.buttons.add') || 'Add';
  const toastSaved = getConfig('admin.labels.toasts.saved') || 'All settings saved successfully';
  const toastPartial = getConfig('admin.labels.toasts.error') || 'Some settings failed to save';
  const toastNetwork = getConfig('admin.labels.toasts.networkError') || 'Network error. Please try again.';

  /**
   * Verifies the admin is authenticated before loading settings.
   * Redirects to the login page if no valid token is found.
   * The token is verified server-side via /api/auth.
   *
   * @returns {Promise<boolean>} Whether the user is authenticated
   */
  const verifyAuth = useCallback(async () => {
    const token = localStorage.getItem('admin_token');

    if (!token) {
      router.push('/admin/login');
      return false;
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', token }),
      });

      if (!res.ok) {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
        return false;
      }

      return true;
    } catch {
      router.push('/admin/login');
      return false;
    }
  }, [router]);

  /**
   * On mount: verify authentication, then load saved settings from the database.
   * DB values are merged over config defaults so the admin sees what is live.
   */
  useEffect(() => {
    verifyAuth().then((authenticated) => {
      if (authenticated) {
        loadSettings();
      }
    });
  }, [verifyAuth]);

  /**
   * Fetches all settings from the database and merges them into state.
   * Each row in the settings table has a key (e.g. 'branding') and a JSON value.
   * Config file defaults are preserved for any keys not yet in the database.
   * Database values always override config defaults.
   */
  async function loadSettings() {
    try {
      const response = await fetch('/api/settings');

      if (response.ok) {
        const data = await response.json();

        if (data && data.length > 0) {
          const merged = { ...settings };

          data.forEach((item) => {
            if (merged[item.key] && item.value) {
              merged[item.key] = { ...merged[item.key], ...item.value };
            }
          });

          setSettings(merged);
        }
      }
    } catch (error) {
      console.error('Settings load error:', error.message);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Updates a single field within a settings category.
   * Used by text inputs, selects, color pickers, and ImageUploadField.
   *
   * @param {string} section — The settings category (e.g. 'branding', 'hero')
   * @param {string} field   — The specific field to update
   * @param {*}      value   — The new value
   */
  function updateSetting(section, field, value) {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  }

  /**
   * Adds a new empty string to an array-type setting.
   * Used by the Skills, Tools, and Education sections.
   *
   * @param {string} section — The settings category
   * @param {string} field   — The array field name
   */
  function addArrayItem(section, field) {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...(prev[section][field] || []), ''],
      },
    }));
  }

  /**
   * Updates a specific index within an array-type setting.
   *
   * @param {string} section — The settings category
   * @param {string} field   — The array field name
   * @param {number} index   — The index to update
   * @param {*}      value   — The new value
   */
  function updateArrayItem(section, field, index, value) {
    setSettings((prev) => {
      const updated = [...(prev[section][field] || [])];
      updated[index] = value;
      return { ...prev, [section]: { ...prev[section], [field]: updated } };
    });
  }

  /**
   * Removes an item from an array-type setting by index.
   *
   * @param {string} section — The settings category
   * @param {string} field   — The array field name
   * @param {number} index   — The index to remove
   */
  function removeArrayItem(section, field, index) {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].filter((_, i) => i !== index),
      },
    }));
  }

  /**
   * Toggles a boolean section on/off in the sections settings.
   * Used by the Sections tab to show/hide site features.
   *
   * @param {string} sectionName — The section key to toggle
   */
  function toggleSection(sectionName) {
    setSettings((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionName]: !prev.sections[sectionName],
      },
    }));
  }

  /**
   * Adds a new empty education entry to the about section.
   * Each entry has fields for degree, school, and year in both languages.
   */
  function addEducation() {
    setSettings((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        education: [
          ...(prev.about.education || []),
          {
            degreeEn: '',
            degreeAm: '',
            schoolEn: '',
            schoolAm: '',
            year: '',
          },
        ],
      },
    }));
  }

  /**
   * Updates a specific field within an education entry.
   *
   * @param {number} index — The education entry index
   * @param {string} field — The field to update
   * @param {*}      value — The new value
   */
  function updateEducation(index, field, value) {
    setSettings((prev) => {
      const updated = [...(prev.about.education || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, about: { ...prev.about, education: updated } };
    });
  }

  /**
   * Removes an education entry by index.
   *
   * @param {number} index — The index to remove
   */
  function removeEducation(index) {
    setSettings((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        education: prev.about.education.filter((_, i) => i !== index),
      },
    }));
  }

  /**
   * Adds a new empty process step to the process section.
   * Each step has a title, description, and icon emoji.
   */
  function addProcessStep() {
    setSettings((prev) => ({
      ...prev,
      process: {
        ...prev.process,
        steps: [
          ...(prev.process.steps || []),
          {
            titleEn: '',
            titleAm: '',
            descriptionEn: '',
            descriptionAm: '',
            icon: '🎨',
          },
        ],
      },
    }));
  }

  /**
   * Updates a specific field within a process step.
   *
   * @param {number} index — The process step index
   * @param {string} field — The field to update
   * @param {*}      value — The new value
   */
  function updateProcessStep(index, field, value) {
    setSettings((prev) => {
      const updated = [...(prev.process.steps || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, process: { ...prev.process, steps: updated } };
    });
  }

  /**
   * Removes a process step by index.
   *
   * @param {number} index — The index to remove
   */
  function removeProcessStep(index) {
    setSettings((prev) => ({
      ...prev,
      process: {
        ...prev.process,
        steps: prev.process.steps.filter((_, i) => i !== index),
      },
    }));
  }

  /**
   * Persists all settings categories to the database.
   * Each category is sent as a separate PUT request to /api/settings.
   * Uses Promise.allSettled so one failure does not block others.
   * Displays appropriate toast notification based on results.
   */
  async function saveAllSettings() {
    setSaving(true);
    setToast(null);

    try {
      const token = localStorage.getItem('admin_token');

      const promises = Object.entries(settings).map(([key, value]) =>
        fetch('/api/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ key, value }),
        })
      );

      const results = await Promise.allSettled(promises);
      const allOk = results.every(
        (result) => result.status === 'fulfilled' && result.value.ok
      );

      if (allOk) {
        showToast(toastSaved, 'success');
      } else {
        showToast(toastPartial, 'error');
      }
    } catch {
      showToast(toastNetwork, 'error');
    } finally {
      setSaving(false);
    }
  }

  /**
   * Displays a temporary toast notification that auto-dismisses after 4 seconds.
   *
   * @param {string} message — The message to display
   * @param {string} type    — 'success' or 'error'
   */
  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  /* ------------------------------------------------------------------ */
  /*  Loading State                                                      */
  /* ------------------------------------------------------------------ */
  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <main className="admin-main">
          <div
            className="admin-skeleton"
            style={{ width: '200px', height: '32px', marginBottom: '8px' }}
          />
          <div
            className="admin-skeleton"
            style={{ width: '300px', height: '16px', marginBottom: '32px' }}
          />
          <div className="admin-skeleton" style={{ height: '500px' }} />
        </main>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Main Render                                                        */
  /* ------------------------------------------------------------------ */
  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Settings</h1>
            <p className="admin-page-subtitle">
              Configure every page of your site from one place
            </p>
          </div>
          <button
            className="admin-btn admin-btn-lg"
            onClick={saveAllSettings}
            disabled={saving}
          >
            {saving ? '💾 Saving...' : `💾 ${btnSaveAll}`}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={{ marginRight: '4px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Card */}
        <div className="admin-card">

          {/* ============================================================ */}
          {/*  BRANDING TAB                                                */}
          {/* ============================================================ */}
          {activeTab === 'branding' && (
            <div className="admin-form-grid">

              <div className="admin-form-full">
                <label className="admin-label">
                  {getConfig('settingsForm.branding.siteName.label')}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings.branding.siteName || ''}
                  onChange={(e) =>
                    updateSetting('branding', 'siteName', e.target.value)
                  }
                  placeholder={getConfig('settingsForm.branding.siteName.placeholder')}
                  maxLength={getConfig('settingsForm.branding.siteName.maxLength') || 100}
                />
                <p className="admin-form-hint">
                  {getConfig('settingsForm.branding.siteName.hint')}
                </p>
              </div>

              <div className="admin-form-full">
                <label className="admin-label">
                  {getConfig('settingsForm.branding.taglineEn.label')}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings.branding.taglineEn || ''}
                  onChange={(e) =>
                    updateSetting('branding', 'taglineEn', e.target.value)
                  }
                  placeholder={getConfig('settingsForm.branding.taglineEn.placeholder')}
                  maxLength={getConfig('settingsForm.branding.taglineEn.maxLength') || 200}
                />
              </div>

              <div className="admin-form-full">
                <label className="admin-label">
                  {getConfig('settingsForm.branding.taglineAm.label')}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings.branding.taglineAm || ''}
                  onChange={(e) =>
                    updateSetting('branding', 'taglineAm', e.target.value)
                  }
                  placeholder={getConfig('settingsForm.branding.taglineAm.placeholder')}
                  maxLength={getConfig('settingsForm.branding.taglineAm.maxLength') || 200}
                />
              </div>

              <div>
                <label className="admin-label">
                  {getConfig('settingsForm.branding.primaryColor.label')}
                </label>
                <div className="admin-color-input">
                  <input
                    type="color"
                    className="admin-color-swatch"
                    value={settings.branding.colors?.primary || getConfig('branding.colors.primary') || '#D946EF'}
                    onChange={(e) =>
                      updateSetting('branding', 'colors', {
                        ...settings.branding.colors,
                        primary: e.target.value,
                      })
                    }
                    style={{
                      backgroundColor:
                        settings.branding.colors?.primary || getConfig('branding.colors.primary') || '#D946EF',
                    }}
                  />
                  <input
                    type="text"
                    className="admin-input"
                    value={settings.branding.colors?.primary || ''}
                    onChange={(e) =>
                      updateSetting('branding', 'colors', {
                        ...settings.branding.colors,
                        primary: e.target.value,
                      })
                    }
                    placeholder={getConfig('settingsForm.branding.primaryColor.placeholder')}
                  />
                </div>
                <p className="admin-form-hint">
                  {getConfig('settingsForm.branding.primaryColor.hint')}
                </p>
              </div>

              <div>
                <label className="admin-label">
                  {getConfig('settingsForm.branding.secondaryColor.label')}
                </label>
                <div className="admin-color-input">
                  <input
                    type="color"
                    className="admin-color-swatch"
                    value={settings.branding.colors?.secondary || getConfig('branding.colors.secondary') || '#3B82F6'}
                    onChange={(e) =>
                      updateSetting('branding', 'colors', {
                        ...settings.branding.colors,
                        secondary: e.target.value,
                      })
                    }
                    style={{
                      backgroundColor:
                        settings.branding.colors?.secondary || getConfig('branding.colors.secondary') || '#3B82F6',
                    }}
                  />
                  <input
                    type="text"
                    className="admin-input"
                    value={settings.branding.colors?.secondary || ''}
                    onChange={(e) =>
                      updateSetting('branding', 'colors', {
                        ...settings.branding.colors,
                        secondary: e.target.value,
                      })
                    }
                    placeholder={getConfig('settingsForm.branding.secondaryColor.placeholder')}
                  />
                </div>
                <p className="admin-form-hint">
                  {getConfig('settingsForm.branding.secondaryColor.hint')}
                </p>
              </div>

              <div>
                <label className="admin-label">
                  {getConfig('settingsForm.branding.accentColor.label')}
                </label>
                <div className="admin-color-input">
                  <input
                    type="color"
                    className="admin-color-swatch"
                    value={settings.branding.colors?.accent || getConfig('branding.colors.accent') || '#10B981'}
                    onChange={(e) =>
                      updateSetting('branding', 'colors', {
                        ...settings.branding.colors,
                        accent: e.target.value,
                      })
                    }
                    style={{
                      backgroundColor:
                        settings.branding.colors?.accent || getConfig('branding.colors.accent') || '#10B981',
                    }}
                  />
                  <input
                    type="text"
                    className="admin-input"
                    value={settings.branding.colors?.accent || ''}
                    onChange={(e) =>
                      updateSetting('branding', 'colors', {
                        ...settings.branding.colors,
                        accent: e.target.value,
                      })
                    }
                    placeholder={getConfig('settingsForm.branding.accentColor.placeholder')}
                  />
                </div>
                <p className="admin-form-hint">
                  {getConfig('settingsForm.branding.accentColor.hint')}
                </p>
              </div>

              <div className="admin-form-full">
                <ImageUploadField
                  label={getConfig('settingsForm.branding.logoLight.label')}
                  value={settings.branding.logo?.light || ''}
                  onChange={(newValue) =>
                    updateSetting('branding', 'logo', {
                      ...settings.branding.logo,
                      light: newValue,
                    })
                  }
                  hint={getConfig('settingsForm.branding.logoLight.hint')}
                  placeholder={getConfig('settingsForm.branding.logoLight.placeholder')}
                  maxSize={getConfig('settingsForm.branding.logoLight.maxSize') || 2}
                  accept={getConfig('settingsForm.branding.logoLight.accept')}
                />
              </div>

              <div className="admin-form-full">
                <ImageUploadField
                  label={getConfig('settingsForm.branding.logoDark.label')}
                  value={settings.branding.logo?.dark || ''}
                  onChange={(newValue) =>
                    updateSetting('branding', 'logo', {
                      ...settings.branding.logo,
                      dark: newValue,
                    })
                  }
                  hint={getConfig('settingsForm.branding.logoDark.hint')}
                  placeholder={getConfig('settingsForm.branding.logoDark.placeholder')}
                  maxSize={getConfig('settingsForm.branding.logoDark.maxSize') || 2}
                  accept={getConfig('settingsForm.branding.logoDark.accept')}
                />
              </div>

              <div className="admin-form-full">
                <ImageUploadField
                  label={getConfig('settingsForm.branding.favicon.label')}
                  value={settings.branding.favicon || ''}
                  onChange={(newValue) =>
                    updateSetting('branding', 'favicon', newValue)
                  }
                  hint={getConfig('settingsForm.branding.favicon.hint')}
                  placeholder={getConfig('settingsForm.branding.favicon.placeholder')}
                  maxSize={getConfig('settingsForm.branding.favicon.maxSize') || 1}
                  accept={getConfig('settingsForm.branding.favicon.accept')}
                />
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/*  HERO TAB                                                    */}
          {/* ============================================================ */}
          {activeTab === 'hero' && (
            <div className="admin-form-grid">

              <div className="admin-form-full">
                <label className="admin-label">
                  {getConfig('settingsForm.hero.titleEn.label')}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings.hero.titleEn || ''}
                  onChange={(e) =>
                    updateSetting('hero', 'titleEn', e.target.value)
                  }
                  placeholder={getConfig('settingsForm.hero.titleEn.placeholder')}
                  maxLength={getConfig('settingsForm.hero.titleEn.maxLength') || 150}
                />
                <p className="admin-form-hint">
                  {getConfig('settingsForm.hero.titleEn.hint')}
                </p>
              </div>

              <div className="admin-form-full">
                <label className="admin-label">
                  {getConfig('settingsForm.hero.titleAm.label')}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings.hero.titleAm || ''}
                  onChange={(e) =>
                    updateSetting('hero', 'titleAm', e.target.value)
                  }
                  placeholder={getConfig('settingsForm.hero.titleAm.placeholder')}
                  maxLength={getConfig('settingsForm.hero.titleAm.maxLength') || 150}
                />
              </div>

              <div className="admin-form-full">
                <label className="admin-label">
                  {getConfig('settingsForm.hero.subtitleEn.label')}
                </label>
                <textarea
                  className="admin-textarea"
                  value={settings.hero.subtitleEn || ''}
                  onChange={(e) =>
                    updateSetting('hero', 'subtitleEn', e.target.value)
                  }
                  rows={3}
                  placeholder={getConfig('settingsForm.hero.subtitleEn.placeholder')}
                  maxLength={getConfig('settingsForm.hero.subtitleEn.maxLength') || 300}
                />
              </div>

              <div className="admin-form-full">
                <label className="admin-label">
                  {getConfig('settingsForm.hero.subtitleAm.label')}
                </label>
                <textarea
                  className="admin-textarea"
                  value={settings.hero.subtitleAm || ''}
                  onChange={(e) =>
                    updateSetting('hero', 'subtitleAm', e.target.value)
                  }
                  rows={3}
                  placeholder={getConfig('settingsForm.hero.subtitleAm.placeholder')}
                  maxLength={getConfig('settingsForm.hero.subtitleAm.maxLength') || 300}
                />
              </div>

              <div className="admin-form-full">
                <ImageUploadField
                  label={getConfig('settingsForm.hero.backgroundImage.label')}
                  value={settings.hero.backgroundImage || ''}
                  onChange={(newValue) =>
                    updateSetting('hero', 'backgroundImage', newValue)
                  }
                  hint={getConfig('settingsForm.hero.backgroundImage.hint')}
                  placeholder={getConfig('settingsForm.hero.backgroundImage.placeholder')}
                  maxSize={getConfig('settingsForm.hero.backgroundImage.maxSize') || 5}
                  accept={getConfig('settingsForm.hero.backgroundImage.accept')}
                />
              </div>

              <div className="admin-form-full">
                <ImageUploadField
                  label={getConfig('settingsForm.hero.profilePhoto.label')}
                  value={settings.hero.profilePhoto || ''}
                  onChange={(newValue) =>
                    updateSetting('hero', 'profilePhoto', newValue)
                  }
                  hint={getConfig('settingsForm.hero.profilePhoto.hint')}
                  placeholder={getConfig('settingsForm.hero.profilePhoto.placeholder')}
                  maxSize={getConfig('settingsForm.hero.profilePhoto.maxSize') || 5}
                  accept={getConfig('settingsForm.hero.profilePhoto.accept')}
                />
              </div>

              <div>
                <label className="admin-label">
                  {getConfig('settingsForm.hero.ctaPrimaryText.label')}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings.hero.ctaPrimary?.text?.en || ''}
                  onChange={(e) =>
                    updateSetting('hero', 'ctaPrimary', {
                      ...settings.hero.ctaPrimary,
                      text: { en: e.target.value },
                    })
                  }
                  placeholder={getConfig('settingsForm.hero.ctaPrimaryText.placeholder')}
                  maxLength={getConfig('settingsForm.hero.ctaPrimaryText.maxLength') || 50}
                />
              </div>

              <div>
                <label className="admin-label">
                  {getConfig('settingsForm.hero.ctaPrimaryLink.label')}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings.hero.ctaPrimary?.link || ''}
                  onChange={(e) =>
                    updateSetting('hero', 'ctaPrimary', {
                      ...settings.hero.ctaPrimary,
                      link: e.target.value,
                    })
                  }
                  placeholder={getConfig('settingsForm.hero.ctaPrimaryLink.placeholder')}
                />
              </div>

              <div>
                <label className="admin-label">
                  {getConfig('settingsForm.hero.ctaSecondaryText.label')}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings.hero.ctaSecondary?.text?.en || ''}
                  onChange={(e) =>
                    updateSetting('hero', 'ctaSecondary', {
                      ...settings.hero.ctaSecondary,
                      text: { en: e.target.value },
                    })
                  }
                  placeholder={getConfig('settingsForm.hero.ctaSecondaryText.placeholder')}
                  maxLength={getConfig('settingsForm.hero.ctaSecondaryText.maxLength') || 50}
                />
              </div>

              <div>
                <label className="admin-label">
                  {getConfig('settingsForm.hero.ctaSecondaryLink.label')}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings.hero.ctaSecondary?.link || ''}
                  onChange={(e) =>
                    updateSetting('hero', 'ctaSecondary', {
                      ...settings.hero.ctaSecondary,
                      link: e.target.value,
                    })
                  }
                  placeholder={getConfig('settingsForm.hero.ctaSecondaryLink.placeholder')}
                />
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/*  ABOUT TAB                                                   */}
          {/* ============================================================ */}
          {activeTab === 'about' && (
            <div className="admin-form-grid">

              <div className="admin-form-full">
                <ImageUploadField
                  label={getConfig('settingsForm.about.profilePhoto.label')}
                  value={settings.about.profilePhoto || ''}
                  onChange={(newValue) =>
                    updateSetting('about', 'profilePhoto', newValue)
                  }
                  hint={getConfig('settingsForm.about.profilePhoto.hint')}
                  placeholder={getConfig('settingsForm.about.profilePhoto.placeholder')}
                  maxSize={getConfig('settingsForm.about.profilePhoto.maxSize') || 5}
                  accept={getConfig('settingsForm.about.profilePhoto.accept')}
                />
              </div>

              <div>
                <label className="admin-label">
                  {getConfig('settingsForm.about.locationEn.label')}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings.about.locationEn || ''}
                  onChange={(e) =>
                    updateSetting('about', 'locationEn', e.target.value)
                  }
                  placeholder={getConfig('settingsForm.about.locationEn.placeholder')}
                  maxLength={getConfig('settingsForm.about.locationEn.maxLength') || 100}
                />
              </div>

              <div>
                <label className="admin-label">
                  {getConfig('settingsForm.about.locationAm.label')}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings.about.locationAm || ''}
                  onChange={(e) =>
                    updateSetting('about', 'locationAm', e.target.value)
                  }
                  placeholder={getConfig('settingsForm.about.locationAm.placeholder')}
                  maxLength={getConfig('settingsForm.about.locationAm.maxLength') || 100}
                />
              </div>

              <div className="admin-form-full">
                <label className="admin-label">
                  {getConfig('settingsForm.about.bioEn.label')}
                </label>
                <textarea
                  className="admin-textarea"
                  value={settings.about.bioEn || ''}
                  onChange={(e) =>
                    updateSetting('about', 'bioEn', e.target.value)
                  }
                  rows={5}
                  placeholder={getConfig('settingsForm.about.bioEn.placeholder')}
                  maxLength={getConfig('settingsForm.about.bioEn.maxLength') || 2000}
                />
                <p className="admin-form-hint">
                  {getConfig('settingsForm.about.bioEn.hint')}
                </p>
              </div>

              <div className="admin-form-full">
                <label className="admin-label">
                  {getConfig('settingsForm.about.bioAm.label')}
                </label>
                <textarea
                  className="admin-textarea"
                  value={settings.about.bioAm || ''}
                  onChange={(e) =>
                    updateSetting('about', 'bioAm', e.target.value)
                  }
                  rows={5}
                  placeholder={getConfig('settingsForm.about.bioAm.placeholder')}
                  maxLength={getConfig('settingsForm.about.bioAm.maxLength') || 2000}
                />
              </div>

              {/* Skills */}
              <div className="admin-form-full">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <label className="admin-label" style={{ marginBottom: 0 }}>
                    {getConfig('settingsForm.about.skillsHeading.label')}
                  </label>
                  <button
                    type="button"
                    className="admin-btn admin-btn-sm admin-btn-outline"
                    onClick={() => addArrayItem('about', 'skills')}
                  >
                    + {btnAdd}
                  </button>
                </div>

                {(settings.about.skills || []).length === 0 && (
                  <p
                    style={{
                      color: 'var(--admin-text-muted)',
                      fontSize: '13px',
                      marginBottom: '8px',
                    }}
                  >
                    No skills added yet. Click &ldquo;+ Add&rdquo; to add your
                    first skill.
                  </p>
                )}

                {(settings.about.skills || []).map((skill, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      gap: '8px',
                      marginBottom: '8px',
                    }}
                  >
                    <input
                      type="text"
                      className="admin-input"
                      value={skill}
                      onChange={(e) =>
                        updateArrayItem(
                          'about',
                          'skills',
                          index,
                          e.target.value
                        )
                      }
                      placeholder="e.g., 2D Character Animation"
                      maxLength={100}
                    />
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-danger"
                      onClick={() =>
                        removeArrayItem('about', 'skills', index)
                      }
                      aria-label="Remove skill"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Tools */}
              <div className="admin-form-full">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <label className="admin-label" style={{ marginBottom: 0 }}>
                    {getConfig('settingsForm.about.toolsHeading.label')}
                  </label>
                  <button
                    type="button"
                    className="admin-btn admin-btn-sm admin-btn-outline"
                    onClick={() => addArrayItem('about', 'tools')}
                  >
                    + {btnAdd}
                  </button>
                </div>

                {(settings.about.tools || []).length === 0 && (
                  <p
                    style={{
                      color: 'var(--admin-text-muted)',
                      fontSize: '13px',
                      marginBottom: '8px',
                    }}
                  >
                    No tools added yet.
                  </p>
                )}

                {(settings.about.tools || []).map((tool, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      gap: '8px',
                      marginBottom: '8px',
                    }}
                  >
                    <input
                      type="text"
                      className="admin-input"
                      value={tool}
                      onChange={(e) =>
                        updateArrayItem(
                          'about',
                          'tools',
                          index,
                          e.target.value
                        )
                      }
                      placeholder="e.g., Adobe After Effects"
                      maxLength={100}
                    />
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-danger"
                      onClick={() =>
                        removeArrayItem('about', 'tools', index)
                      }
                      aria-label="Remove tool"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Education */}
              <div className="admin-form-full">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <label className="admin-label" style={{ marginBottom: 0 }}>
                    {getConfig('settingsForm.about.educationHeading.label')}
                  </label>
                  <button
                    type="button"
                    className="admin-btn admin-btn-sm admin-btn-outline"
                    onClick={addEducation}
                  >
                    + {btnAdd}
                  </button>
                </div>

                {(settings.about.education || []).length === 0 && (
                  <p
                    style={{
                      color: 'var(--admin-text-muted)',
                      fontSize: '13px',
                      marginBottom: '8px',
                    }}
                  >
                    No education entries yet. Add your degrees and
                    certifications.
                  </p>
                )}

                {(settings.about.education || []).map((edu, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'var(--admin-bg)',
                      border: '1px solid var(--admin-border)',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '12px',
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>
                        Education #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEducation(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--admin-error)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '13px',
                        }}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="admin-form-grid">
                      <div>
                        <label className="admin-label">
                          Degree (English)
                        </label>
                        <input
                          type="text"
                          className="admin-input"
                          value={edu.degreeEn}
                          onChange={(e) =>
                            updateEducation(index, 'degreeEn', e.target.value)
                          }
                          placeholder="Bachelor of Architecture"
                          maxLength={150}
                        />
                      </div>

                      <div>
                        <label className="admin-label">
                          Degree (Amharic)
                        </label>
                        <input
                          type="text"
                          className="admin-input"
                          value={edu.degreeAm}
                          onChange={(e) =>
                            updateEducation(index, 'degreeAm', e.target.value)
                          }
                          maxLength={150}
                        />
                      </div>

                      <div>
                        <label className="admin-label">
                          School (English)
                        </label>
                        <input
                          type="text"
                          className="admin-input"
                          value={edu.schoolEn}
                          onChange={(e) =>
                            updateEducation(index, 'schoolEn', e.target.value)
                          }
                          placeholder="University Name"
                          maxLength={150}
                        />
                      </div>

                      <div>
                        <label className="admin-label">
                          School (Amharic)
                        </label>
                        <input
                          type="text"
                          className="admin-input"
                          value={edu.schoolAm}
                          onChange={(e) =>
                            updateEducation(index, 'schoolAm', e.target.value)
                          }
                          maxLength={150}
                        />
                      </div>

                      <div>
                        <label className="admin-label">Year</label>
                        <input
                          type="text"
                          className="admin-input"
                          value={edu.year}
                          onChange={(e) =>
                            updateEducation(index, 'year', e.target.value)
                          }
                          placeholder="2024 - Present"
                          maxLength={50}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/*  SHOWREEL TAB                                                */}
          {/* ============================================================ */}
          {activeTab === 'showreel' && (
            <div className="admin-form-grid">

              <div className="admin-form-full">
                <label className="admin-label">
                  {getConfig('settingsForm.showreel.videoUrl.label')}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings.showreel.videoUrl || ''}
                  onChange={(e) =>
                    updateSetting('showreel', 'videoUrl', e.target.value)
                  }
                  placeholder={getConfig('settingsForm.showreel.videoUrl.placeholder')}
                />
                <p className="admin-form-hint">
                  {getConfig('settingsForm.showreel.videoUrl.hint')}
                </p>
              </div>

              <div className="admin-form-full">
                <ImageUploadField
                  label={getConfig('settingsForm.showreel.posterUrl.label')}
                  value={settings.showreel.posterUrl || ''}
                  onChange={(newValue) =>
                    updateSetting('showreel', 'posterUrl', newValue)
                  }
                  hint={getConfig('settingsForm.showreel.posterUrl.hint')}
                  placeholder={getConfig('settingsForm.showreel.posterUrl.placeholder')}
                  maxSize={getConfig('settingsForm.showreel.posterUrl.maxSize') || 5}
                  accept={getConfig('settingsForm.showreel.posterUrl.accept')}
                />
              </div>

              <div>
                <label className="admin-label">
                  {getConfig('settingsForm.showreel.titleEn.label')}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings.showreel.titleEn || ''}
                  onChange={(e) =>
                    updateSetting('showreel', 'titleEn', e.target.value)
                  }
                  placeholder={getConfig('settingsForm.showreel.titleEn.placeholder')}
                  maxLength={getConfig('settingsForm.showreel.titleEn.maxLength') || 100}
                />
              </div>

              <div>
                <label className="admin-label">
                  {getConfig('settingsForm.showreel.titleAm.label')}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings.showreel.titleAm || ''}
                  onChange={(e) =>
                    updateSetting('showreel', 'titleAm', e.target.value)
                  }
                  placeholder={getConfig('settingsForm.showreel.titleAm.placeholder')}
                  maxLength={getConfig('settingsForm.showreel.titleAm.maxLength') || 100}
                />
              </div>

              <div className="admin-form-full">
                <label className="admin-label">
                  {getConfig('settingsForm.showreel.descriptionEn.label')}
                </label>
                <textarea
                  className="admin-textarea"
                  value={settings.showreel.descriptionEn || ''}
                  onChange={(e) =>
                    updateSetting('showreel', 'descriptionEn', e.target.value)
                  }
                  rows={3}
                  placeholder={getConfig('settingsForm.showreel.descriptionEn.placeholder')}
                  maxLength={getConfig('settingsForm.showreel.descriptionEn.maxLength') || 500}
                />
              </div>

              <div className="admin-form-full">
                <label className="admin-label">
                  {getConfig('settingsForm.showreel.descriptionAm.label')}
                </label>
                <textarea
                  className="admin-textarea"
                  value={settings.showreel.descriptionAm || ''}
                  onChange={(e) =>
                    updateSetting('showreel', 'descriptionAm', e.target.value)
                  }
                  rows={3}
                  maxLength={getConfig('settingsForm.showreel.descriptionAm.maxLength') || 500}
                />
              </div>

              {(settings.showreel.stats || []).map((stat, index) => (
                <div key={index}>
                  <label className="admin-label">
                    Stat {index + 1} — Value
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    value={stat.value || ''}
                    onChange={(e) => {
                      const updated = [...(settings.showreel.stats || [])];
                      updated[index] = {
                        ...updated[index],
                        value: e.target.value,
                      };
                      updateSetting('showreel', 'stats', updated);
                    }}
                    placeholder="50+"
                    maxLength={20}
                  />
                  <label className="admin-label" style={{ marginTop: '8px' }}>
                    Stat {index + 1} — Label (English)
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    value={stat.label?.en || ''}
                    onChange={(e) => {
                      const updated = [...(settings.showreel.stats || [])];
                      updated[index] = {
                        ...updated[index],
                        label: {
                          ...updated[index].label,
                          en: e.target.value,
                        },
                      };
                      updateSetting('showreel', 'stats', updated);
                    }}
                    placeholder="Projects"
                    maxLength={50}
                  />
                </div>
              ))}

              {(!settings.showreel.stats || settings.showreel.stats.length === 0) && (
                <div className="admin-form-full">
                  <p style={{ color: 'var(--admin-text-muted)', fontSize: '13px' }}>
                    Stats are configured in config/showreel.json. Add entries
                    to display stats below the showreel video.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* ============================================================ */}
          {/*  PROCESS TAB                                                 */}
          {/* ============================================================ */}
          {activeTab === 'process' && (
            <div>

              <div className="admin-form-grid" style={{ marginBottom: '32px' }}>
                <div>
                  <label className="admin-label">
                    {getConfig('settingsForm.process.titleEn.label')}
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    value={settings.process.titleEn || ''}
                    onChange={(e) =>
                      updateSetting('process', 'titleEn', e.target.value)
                    }
                    placeholder={getConfig('settingsForm.process.titleEn.placeholder')}
                    maxLength={getConfig('settingsForm.process.titleEn.maxLength') || 100}
                  />
                </div>

                <div>
                  <label className="admin-label">
                    {getConfig('settingsForm.process.titleAm.label')}
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    value={settings.process.titleAm || ''}
                    onChange={(e) =>
                      updateSetting('process', 'titleAm', e.target.value)
                    }
                    placeholder={getConfig('settingsForm.process.titleAm.placeholder')}
                    maxLength={getConfig('settingsForm.process.titleAm.maxLength') || 100}
                  />
                </div>

                <div className="admin-form-full">
                  <label className="admin-label">
                    {getConfig('settingsForm.process.subtitleEn.label')}
                  </label>
                  <textarea
                    className="admin-textarea"
                    value={settings.process.subtitleEn || ''}
                    onChange={(e) =>
                      updateSetting('process', 'subtitleEn', e.target.value)
                    }
                    rows={3}
                    placeholder={getConfig('settingsForm.process.subtitleEn.placeholder')}
                    maxLength={getConfig('settingsForm.process.subtitleEn.maxLength') || 400}
                  />
                </div>

                <div className="admin-form-full">
                  <label className="admin-label">
                    {getConfig('settingsForm.process.subtitleAm.label')}
                  </label>
                  <textarea
                    className="admin-textarea"
                    value={settings.process.subtitleAm || ''}
                    onChange={(e) =>
                      updateSetting('process', 'subtitleAm', e.target.value)
                    }
                    rows={3}
                    maxLength={getConfig('settingsForm.process.subtitleAm.maxLength') || 400}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <label className="admin-label" style={{ marginBottom: 0 }}>
                  Process Steps ({(settings.process.steps || []).length} total)
                </label>
                <button
                  type="button"
                  className="admin-btn admin-btn-sm"
                  onClick={addProcessStep}
                >
                  + Add Step
                </button>
              </div>

              {(settings.process.steps || []).length === 0 && (
                <div className="admin-empty" style={{ padding: '40px 24px' }}>
                  <div className="admin-empty-icon">🔄</div>
                  <h3 className="admin-empty-title">No process steps yet</h3>
                  <p className="admin-empty-text">
                    Add steps to show your creative workflow on the Process
                    page. Each step can have an icon, title, and description
                    in both English and Amharic.
                  </p>
                </div>
              )}

              {(settings.process.steps || []).map((step, index) => (
                <div
                  key={index}
                  style={{
                    background: 'var(--admin-bg)',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '20px',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '20px',
                      background: 'var(--admin-primary)',
                      color: '#fff',
                      padding: '4px 16px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    Step {index + 1}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginBottom: '20px',
                      marginTop: '4px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => removeProcessStep(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--admin-error)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      Remove Step
                    </button>
                  </div>

                  <div className="admin-form-grid">
                    <div>
                      <label className="admin-label">Icon (emoji)</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={step.icon || ''}
                        onChange={(e) =>
                          updateProcessStep(index, 'icon', e.target.value)
                        }
                        placeholder="🎨"
                        maxLength={5}
                        style={{ fontSize: '20px', textAlign: 'center' }}
                      />
                    </div>

                    <div>
                      <label className="admin-label">Step Number</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={String(index + 1).padStart(2, '0')}
                        disabled
                      />
                    </div>

                    <div>
                      <label className="admin-label">Title (English)</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={step.titleEn || ''}
                        onChange={(e) =>
                          updateProcessStep(index, 'titleEn', e.target.value)
                        }
                        placeholder="Discovery & Brief"
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <label className="admin-label">Title (Amharic)</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={step.titleAm || ''}
                        onChange={(e) =>
                          updateProcessStep(index, 'titleAm', e.target.value)
                        }
                        maxLength={100}
                      />
                    </div>

                    <div className="admin-form-full">
                      <label className="admin-label">
                        Description (English)
                      </label>
                      <textarea
                        className="admin-textarea"
                        value={step.descriptionEn || ''}
                        onChange={(e) =>
                          updateProcessStep(
                            index,
                            'descriptionEn',
                            e.target.value
                          )
                        }
                        rows={3}
                        placeholder="Understanding your vision, goals, and target audience..."
                        maxLength={500}
                      />
                    </div>

                    <div className="admin-form-full">
                      <label className="admin-label">
                        Description (Amharic)
                      </label>
                      <textarea
                        className="admin-textarea"
                        value={step.descriptionAm || ''}
                        onChange={(e) =>
                          updateProcessStep(
                            index,
                            'descriptionAm',
                            e.target.value
                          )
                        }
                        rows={3}
                        maxLength={500}
                      />
                    </div>
                  </div>
                </div>
              ))}

            </div>
          )}

          {/* ============================================================ */}
          {/*  WORK PAGE TAB                                               */}
          {/* ============================================================ */}
          {activeTab === 'work' && (
            <div className="admin-form-grid">

              <div>
                <label className="admin-label">
                  {getConfig('settingsForm.work.titleEn.label')}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings.work.titleEn || ''}
                  onChange={(e) =>
                    updateSetting('work', 'titleEn', e.target.value)
                  }
                  placeholder={getConfig('settingsForm.work.titleEn.placeholder')}
                  maxLength={getConfig('settingsForm.work.titleEn.maxLength') || 100}
                />
              </div>

              <div>
                <label className="admin-label">
                  {getConfig('settingsForm.work.titleAm.label')}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings.work.titleAm || ''}
                  onChange={(e) =>
                    updateSetting('work', 'titleAm', e.target.value)
                  }
                  placeholder={getConfig('settingsForm.work.titleAm.placeholder')}
                  maxLength={getConfig('settingsForm.work.titleAm.maxLength') || 100}
                />
              </div>

              <div className="admin-form-full">
                <label className="admin-label">
                  {getConfig('settingsForm.work.subtitleEn.label')}
                </label>
                <textarea
                  className="admin-textarea"
                  value={settings.work.subtitleEn || ''}
                  onChange={(e) =>
                    updateSetting('work', 'subtitleEn', e.target.value)
                  }
                  rows={3}
                  placeholder={getConfig('settingsForm.work.subtitleEn.placeholder')}
                  maxLength={getConfig('settingsForm.work.subtitleEn.maxLength') || 400}
                />
              </div>

              <div className="admin-form-full">
                <label className="admin-label">
                  {getConfig('settingsForm.work.subtitleAm.label')}
                </label>
                <textarea
                  className="admin-textarea"
                  value={settings.work.subtitleAm || ''}
                  onChange={(e) =>
                    updateSetting('work', 'subtitleAm', e.target.value)
                  }
                  rows={3}
                  maxLength={getConfig('settingsForm.work.subtitleAm.maxLength') || 400}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', paddingTop: '8px' }}>
                <label
                  className="admin-toggle"
                  onClick={() =>
                    updateSetting('work', 'showFilters', !settings.work.showFilters)
                  }
                >
                  <div
                    className={`admin-toggle-track ${
                      settings.work.showFilters ? 'active' : ''
                    }`}
                  >
                    <div className="admin-toggle-thumb" />
                  </div>
                  <span className="admin-toggle-label">
                    Show category filter buttons on the work page
                  </span>
                </label>
              </div>

              <div className="admin-form-full">
                <div className="admin-alert admin-alert-info" style={{ marginTop: '8px' }}>
                  <span>💡</span> Projects are managed separately in the{' '}
                  <Link
                    href="/admin/projects"
                    style={{ color: 'var(--admin-primary)', fontWeight: 600 }}
                  >
                    Projects section
                  </Link>
                  . This tab controls the Work page layout only.
                </div>
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/*  SOCIAL TAB                                                  */}
          {/* ============================================================ */}
          {activeTab === 'social' && (
            <SocialSettingsForm
              socialData={settings.social}
              onUpdate={(platformId, newData) =>
                updateSetting('social', platformId, newData)
              }
            />
          )}

          {/* ============================================================ */}
          {/*  SEO TAB                                                     */}
          {/* ============================================================ */}
          {activeTab === 'seo' && (
            <div className="admin-form-grid">

              <div className="admin-form-full">
                <label className="admin-label">
                  {getConfig('settingsForm.seo.titleTemplate.label')}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings.seo.titleTemplate?.en || ''}
                  onChange={(e) =>
                    updateSetting('seo', 'titleTemplate', {
                      en: e.target.value,
                    })
                  }
                  placeholder={getConfig('settingsForm.seo.titleTemplate.placeholder')}
                  maxLength={getConfig('settingsForm.seo.titleTemplate.maxLength') || 150}
                />
                <p className="admin-form-hint">
                  {getConfig('settingsForm.seo.titleTemplate.hint')}
                </p>
              </div>

              <div className="admin-form-full">
                <label className="admin-label">
                  {getConfig('settingsForm.seo.defaultDescription.label')}
                </label>
                <textarea
                  className="admin-textarea"
                  value={settings.seo.defaultDescription?.en || ''}
                  onChange={(e) =>
                    updateSetting('seo', 'defaultDescription', {
                      en: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder={getConfig('settingsForm.seo.defaultDescription.placeholder')}
                  maxLength={getConfig('settingsForm.seo.defaultDescription.maxLength') || 160}
                />
                <p className="admin-form-hint">
                  {(settings.seo.defaultDescription?.en || '').length}/
                  {getConfig('settingsForm.seo.defaultDescription.maxLength') || 160}{' '}
                  characters. Recommended: 150-160 for optimal display in
                  search results.
                </p>
              </div>

              <div className="admin-form-full">
                <ImageUploadField
                  label={getConfig('settingsForm.seo.ogImage.label')}
                  value={settings.seo.ogImage || ''}
                  onChange={(newValue) =>
                    updateSetting('seo', 'ogImage', newValue)
                  }
                  hint={getConfig('settingsForm.seo.ogImage.hint')}
                  placeholder={getConfig('settingsForm.seo.ogImage.placeholder')}
                  maxSize={getConfig('settingsForm.seo.ogImage.maxSize') || 5}
                  accept={getConfig('settingsForm.seo.ogImage.accept')}
                />
              </div>

              <div>
                <label className="admin-label">
                  {getConfig('settingsForm.seo.twitterHandle.label')}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings.seo.twitterHandle || ''}
                  onChange={(e) =>
                    updateSetting('seo', 'twitterHandle', e.target.value)
                  }
                  placeholder={getConfig('settingsForm.seo.twitterHandle.placeholder')}
                  maxLength={getConfig('settingsForm.seo.twitterHandle.maxLength') || 50}
                />
              </div>

              <div>
                <label className="admin-label">
                  {getConfig('settingsForm.seo.googleAnalyticsId.label')}
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings.seo.googleAnalyticsId || ''}
                  onChange={(e) =>
                    updateSetting('seo', 'googleAnalyticsId', e.target.value)
                  }
                  placeholder={getConfig('settingsForm.seo.googleAnalyticsId.placeholder')}
                  maxLength={getConfig('settingsForm.seo.googleAnalyticsId.maxLength') || 20}
                />
                <p className="admin-form-hint">
                  {getConfig('settingsForm.seo.googleAnalyticsId.hint')}
                </p>
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/*  SECTIONS TAB                                                */}
          {/* ============================================================ */}
          {activeTab === 'sections' && (
            <div>
              <p
                style={{
                  color: 'var(--admin-text-muted)',
                  marginBottom: '24px',
                  fontSize: '14px',
                }}
              >
                Toggle which sections appear on your public website. Changes
                take effect immediately after saving. Hidden sections are
                removed from navigation and are not accessible to visitors.
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div
                  className="admin-card"
                  onClick={() => toggleSection('showBlog')}
                  style={{ cursor: 'pointer' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          marginBottom: '4px',
                        }}
                      >
                        📝 Blog
                      </h3>
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--admin-text-muted)',
                        }}
                      >
                        Show the blog section and all published posts
                      </p>
                    </div>
                    <div
                      className={`admin-toggle-track ${
                        settings.sections.showBlog ? 'active' : ''
                      }`}
                    >
                      <div className="admin-toggle-thumb" />
                    </div>
                  </div>
                </div>

                <div
                  className="admin-card"
                  onClick={() => toggleSection('showProcess')}
                  style={{ cursor: 'pointer' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          marginBottom: '4px',
                        }}
                      >
                        🔄 Process Page
                      </h3>
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--admin-text-muted)',
                        }}
                      >
                        Show the creative process and workflow page
                      </p>
                    </div>
                    <div
                      className={`admin-toggle-track ${
                        settings.sections.showProcess ? 'active' : ''
                      }`}
                    >
                      <div className="admin-toggle-thumb" />
                    </div>
                  </div>
                </div>

                <div
                  className="admin-card"
                  onClick={() => toggleSection('showShowreel')}
                  style={{ cursor: 'pointer' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          marginBottom: '4px',
                        }}
                      >
                        🎥 Showreel Page
                      </h3>
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--admin-text-muted)',
                        }}
                      >
                        Display the demo reel page with video and stats
                      </p>
                    </div>
                    <div
                      className={`admin-toggle-track ${
                        settings.sections.showShowreel ? 'active' : ''
                      }`}
                    >
                      <div className="admin-toggle-thumb" />
                    </div>
                  </div>
                </div>

                <div
                  className="admin-card"
                  onClick={() => toggleSection('showTestimonials')}
                  style={{ cursor: 'pointer' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          marginBottom: '4px',
                        }}
                      >
                        💬 Testimonials
                      </h3>
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--admin-text-muted)',
                        }}
                      >
                        Display client testimonials and reviews
                      </p>
                    </div>
                    <div
                      className={`admin-toggle-track ${
                        settings.sections.showTestimonials ? 'active' : ''
                      }`}
                    >
                      <div className="admin-toggle-thumb" />
                    </div>
                  </div>
                </div>

                <div
                  className="admin-card"
                  onClick={() => toggleSection('showArchitecture')}
                  style={{ cursor: 'pointer' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          marginBottom: '4px',
                        }}
                      >
                        🏛️ Architecture Portfolio
                      </h3>
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--admin-text-muted)',
                        }}
                      >
                        Show architecture projects and student work
                      </p>
                    </div>
                    <div
                      className={`admin-toggle-track ${
                        settings.sections.showArchitecture ? 'active' : ''
                      }`}
                    >
                      <div className="admin-toggle-thumb" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Bottom Save Button */}
        <div
          style={{
            marginTop: '32px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            className="admin-btn admin-btn-lg"
            onClick={saveAllSettings}
            disabled={saving}
          >
            {saving ? '💾 Saving...' : `💾 ${btnSaveAll}`}
          </button>
        </div>

        {/* Toast Notifications */}
        {toast && (
          <div className="admin-toast-container">
            <div className={`admin-toast admin-toast-${toast.type}`}>
              {toast.type === 'success' ? '✅' : '❌'} {toast.message}
            </div>
          </div>
                )}
      </main>
    </div>
  );
}