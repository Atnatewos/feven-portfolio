// File: src/app/admin/login/page.jsx — fix the router.push hardcoded paths
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig, getAdminLoginPath, getPublicRoute } from '../../../../lib/config';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const adminRoute = getConfig('routes.admin.prefix') || '/admin';
  const loginPath = getAdminLoginPath();
  const loginLogo = getConfig('admin.login.logo') || '🎬';
  const loginTitle = getConfig('admin.login.title') || 'Admin Panel';
  const loginSubtitle = getConfig('admin.login.subtitle') || 'Enter your password to continue';
  const passwordLabel = getConfig('admin.login.passwordLabel') || 'Password';
  const passwordPlaceholder = getConfig('admin.login.passwordPlaceholder') || 'Enter admin password';
  const submitText = getConfig('admin.login.submitText') || 'Sign In';
  const loadingText = getConfig('admin.login.loadingText') || 'Authenticating...';
  const errorDefault = getConfig('admin.login.errorDefault') || 'Invalid password';

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          router.push(adminRoute);
        } else {
          localStorage.removeItem('admin_token');
        }
      })
      .catch(() => {
        localStorage.removeItem('admin_token');
      });
  }, [router, adminRoute]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.status === 429) {
        setError('Too many attempts. Please wait a moment and try again.');
        return;
      }

      if (response.ok && data.success) {
        localStorage.setItem('admin_token', data.token);
        router.push(adminRoute);
      } else {
        setError(data.error || errorDefault);
      }
    } catch {
      setError('Connection failed. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">{loginLogo}</div>
        <h1 className="admin-login-title">{loginTitle}</h1>
        <p className="admin-login-subtitle">{loginSubtitle}</p>

        {error && (
          <div className="admin-alert admin-alert-error" role="alert">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label htmlFor="admin-password" className="admin-label">
              {passwordLabel}
            </label>
            <input
              id="admin-password"
              type="password"
              className="admin-input"
              placeholder={passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoFocus
              autoComplete="current-password"
              maxLength={128}
            />
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn-lg"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? loadingText : submitText}
          </button>
        </form>
      </div>
    </div>
  );
}