// File: src/app/admin/languages.page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/admin/Sidebar';
import LanguageEditor from '../../../components/admin/LanguageEditor';

/**
 * Admin languages page
 * Edit translation keys for all supported languages
 */
export default function AdminLanguages() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [translations, setTranslations] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'am', label: 'አማርኛ (Amharic)' },
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadTranslations(activeLanguage);
    }
  }, [activeLanguage, isAuthenticated]);

  /**
   * Verifies admin authentication
   */
  async function checkAuth() {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', token }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Loads translations for the active language
   */
  async function loadTranslations(lang) {
    try {
      const response = await fetch(`/api/languages?lang=${lang}`);
      if (response.ok) {
        const data = await response.json();
        setTranslations(data);
      }
    } catch (error) {
      console.error('Error loading translations:', error);
      showToast('Failed to load translations', 'error');
    }
  }

  /**
   * Updates a translation key value
   */
  function updateTranslation(keyPath, value) {
    setTranslations((prev) => {
      const updated = { ...prev };
      const keys = keyPath.split('.');
      let current = updated;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return updated;
    });
  }

  /**
   * Saves translations to the API
   */
  async function saveTranslations() {
    setIsSaving(true);
    setToast(null);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/languages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lang: activeLanguage,
          translations,
        }),
      });

      if (response.ok) {
        showToast(`${languages.find((l) => l.code === activeLanguage)?.label} translations saved`, 'success');
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to save translations', 'error');
      }
    } catch (error) {
      console.error('Error saving translations:', error);
      showToast('Failed to save translations', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Renders translation fields recursively
   */
  function renderFields(obj, prefix = '') {
    return Object.entries(obj).map(([key, value]) => {
      const fullPath = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return (
          <div key={fullPath} style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--admin-primary)', marginBottom: '12px', textTransform: 'uppercase' }}>
              {key}
            </h3>
            <div style={{ paddingLeft: '16px', borderLeft: '2px solid var(--admin-border)' }}>
              {renderFields(value, fullPath)}
            </div>
          </div>
        );
      }

      return (
        <div key={fullPath} style={{ marginBottom: '12px' }}>
          <label className="admin-label" style={{ fontSize: '11px' }}>
            {fullPath}
          </label>
          <input
            type="text"
            className="admin-input"
            value={value || ''}
            onChange={(e) => updateTranslation(fullPath, e.target.value)}
          />
        </div>
      );
    });
  }

  /**
   * Displays a toast notification
   */
  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  if (isLoading) {
    return (
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 className="admin-page-title">Languages</h1>
            <p className="admin-page-subtitle">Edit translation strings for each language</p>
          </div>
          <button
            className="admin-btn"
            style={{ width: 'auto' }}
            onClick={saveTranslations}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Translations'}
          </button>
        </div>

        <div className="admin-tabs" style={{ marginBottom: '24px' }}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`admin-tab ${activeLanguage === lang.code ? 'active' : ''}`}
              onClick={() => setActiveLanguage(lang.code)}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <div className="admin-table-container" style={{ padding: '24px' }}>
          {Object.keys(translations).length > 0 ? (
            renderFields(translations)
          ) : (
            <div className="admin-empty">
              <div className="admin-empty-icon">🌐</div>
              <p className="admin-empty-text">No translations loaded</p>
            </div>
          )}
        </div>

        {toast && (
          <div className={`admin-toast admin-toast-${toast.type}`}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}