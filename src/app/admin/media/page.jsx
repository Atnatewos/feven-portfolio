// File: src/app/admin/media/page.jsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getConfig } from '../../../../lib/config';

/**
 * Admin Sidebar component shared across all admin pages.
 * Renders navigation with active state highlighting based on the current route.
 * All labels, icons, and navigation items come from config/admin.json.
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

  function isActive(href) {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  }

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
        <Link href="/" className="admin-sidebar-link" target="_blank" rel="noopener noreferrer">
          <span className="admin-sidebar-icon">🔗</span>
          {viewSiteLabel}
        </Link>
        <button
          onClick={handleLogout}
          className="admin-sidebar-link"
          style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'inherit' }}
        >
          <span className="admin-sidebar-icon">🚪</span>
          {signOutLabel}
        </button>
      </nav>
      <div className="admin-sidebar-footer">
        <p style={{ fontSize: '11px', color: 'var(--admin-text-muted)', textAlign: 'center' }}>
          {footerText}
        </p>
      </div>
    </aside>
  );
}

/**
 * Cloudinary media uploader modal component.
 *
 * Provides drag-and-drop and click-to-browse file selection for uploading
 * images and videos directly to Cloudinary. The upload uses a signed request
 * from the /api/media endpoint for security — API keys are never exposed
 * to the client.
 *
 * Features:
 * - Drag-and-drop zone with visual feedback
 * - File type validation (images and videos only)
 * - File size validation (100MB maximum)
 * - Real-time upload progress bar
 * - Image preview before upload
 * - Error handling with user-friendly messages
 *
 * @param {Object}   props
 * @param {Function} props.onClose   - Callback to close the uploader modal
 * @param {Function} props.onSuccess - Callback when upload completes successfully
 */
function MediaUploaderModal({ onClose, onSuccess }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const btnCancel = getConfig('admin.labels.buttons.cancel') || 'Cancel';

  /**
   * Fetches a signed upload signature from the API.
   * The signature authorizes a single upload to Cloudinary without exposing
   * the API secret to the client.
   *
   * @returns {Object} { signature, timestamp, cloudName, apiKey, folder }
   */
  async function getUploadSignature() {
    const response = await fetch('/api/media', { method: 'POST' });

    if (!response.ok) {
      throw new Error('Failed to get upload authorization');
    }

    return response.json();
  }

  /**
   * Validates the selected file before upload.
   * Only allows image and video files under 100MB.
   *
   * @param {File} file - The file selected by the user
   * @returns {boolean} Whether the file passes validation
   */
  function validateFile(file) {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Only image and video files are supported. Please select a JPG, PNG, GIF, or MP4 file.');
      return false;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('File size must be under 100MB. Please compress or resize your file and try again.');
      return false;
    }

    return true;
  }

  /**
   * Handles the complete file upload flow.
   * Generates a preview, gets a signed signature from the API, and uploads
   * directly to Cloudinary via XMLHttpRequest with progress tracking.
   *
   * @param {File} file - The validated file to upload
   */
  async function handleFile(file) {
    if (!file || !validateFile(file)) {
      return;
    }

    setError('');
    setIsUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    try {
      const { signature, timestamp, cloudName, apiKey, folder } = await getUploadSignature();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('api_key', apiKey);
      formData.append('folder', folder || 'fevens-portfolio');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      xhr.onload = () => {
        if (xhr.status === 200) {
          onSuccess();
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            setError(response.error?.message || 'Upload failed. Please try again.');
          } catch {
            setError('Upload failed. Please try again.');
          }
        }
        setIsUploading(false);
      };

      xhr.onerror = () => {
        setError('Network error during upload. Please check your internet connection and try again.');
        setIsUploading(false);
      };

      xhr.send(formData);
    } catch {
      setError('Failed to upload file. Please try again.');
      setIsUploading(false);
    }
  }

  /**
   * Drag and drop event handlers for the upload zone.
   * These manage the visual state of the drop zone during drag operations.
   */
  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function handleFileInputChange(e) {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '560px' }}
      >
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">Upload Media</h2>
          <button className="admin-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="admin-modal-body">
          {error && (
            <div className="admin-alert admin-alert-error" role="alert">
              <span>⚠️</span> {error}
            </div>
          )}

          {!isUploading && !preview && (
            <div
              className={`media-uploader-dropzone ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="media-uploader-dropzone-content">
                <span
                  style={{
                    fontSize: '48px',
                    marginBottom: '16px',
                    display: 'block',
                  }}
                >
                  📁
                </span>
                <p
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    marginBottom: '8px',
                  }}
                >
                  Drag and drop your file here
                </p>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--admin-text-muted)',
                  }}
                >
                  or click to browse · Images & videos · Max 100MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {isUploading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              {preview && (
                <img
                  src={preview}
                  alt="Upload preview"
                  style={{
                    maxWidth: '300px',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                  }}
                />
              )}

              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: 'var(--admin-bg)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    background: 'var(--admin-primary)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--admin-text-muted)',
                }}
              >
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
        </div>

        <div className="admin-modal-footer">
          <button
            className="admin-btn admin-btn-outline"
            onClick={onClose}
            disabled={isUploading}
          >
            {btnCancel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Admin Media Library page.
 *
 * Provides a full interface for browsing, uploading, copying URLs from,
 * and deleting media assets stored in Cloudinary. All operations go through
 * the /api/media endpoint which handles authentication and Cloudinary API
 * communication server-side — API secrets are never exposed to the client.
 *
 * Features:
 * - Grid display of all Cloudinary media assets
 * - Upload modal with drag-and-drop support
 * - One-click URL copy to clipboard
 * - Delete with confirmation dialog
 * - File size and dimension display
 * - Loading skeletons while fetching
 */
export default function AdminMediaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mediaItems, setMediaItems] = useState([]);
  const [showUploader, setShowUploader] = useState(false);
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const btnDelete = getConfig('admin.labels.buttons.delete') || 'Delete';
  const btnCancel = getConfig('admin.labels.buttons.cancel') || 'Cancel';

  /**
   * Verifies admin authentication before loading media.
   * Redirects to login if no valid token is found.
   */
  const verifyAuth = useCallback(async () => {
    const token = localStorage.getItem('admin_token');

    if (!token) {
      router.push('/admin/login');
      return false;
    }

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', token }),
      });

      if (!response.ok) {
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
   * On mount: verify authentication, then load media from Cloudinary.
   */
  useEffect(() => {
    verifyAuth().then((authenticated) => {
      if (authenticated) {
        fetchMedia();
      }
    });
  }, [verifyAuth]);

  /**
   * Fetches all media resources from Cloudinary via the API.
   * The API handles authentication and Cloudinary SDK communication.
   */
  async function fetchMedia() {
    try {
      const response = await fetch('/api/media');

      if (response.ok) {
        const data = await response.json();
        setMediaItems(data.resources || []);
      }
    } catch (error) {
      console.error('Media fetch error:', error.message);
      showToast('Failed to load media library', 'error');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Copies a media URL to the system clipboard.
   * Shows a brief visual confirmation on the copy button.
   *
   * @param {string} url - The Cloudinary URL to copy
   */
  async function copyToClipboard(url) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(url);
      showToast('URL copied to clipboard', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast('Failed to copy URL. Please copy it manually.', 'error');
    }
  }

  /**
   * Initiates the delete confirmation flow for a media asset.
   *
   * @param {string} publicId     - The Cloudinary public ID
   * @param {string} resourceType - 'image' or 'video'
   */
  function requestDelete(publicId, resourceType) {
    setDeleteConfirm({ publicId, resourceType });
  }

  /**
   * Permanently deletes a media asset from Cloudinary.
   * Sends the delete request to the API and refreshes the media list.
   */
  async function confirmDelete() {
    if (!deleteConfirm) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');

      const response = await fetch('/api/media', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          public_id: deleteConfirm.publicId,
          resource_type: deleteConfirm.resourceType,
        }),
      });

      if (response.ok) {
        showToast('Media deleted successfully', 'success');
        setDeleteConfirm(null);
        fetchMedia();
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to delete media', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    }
  }

  /**
   * Called when an upload completes successfully.
   * Closes the upload modal, refreshes the media list, and shows a success toast.
   */
  function handleUploadSuccess() {
    setShowUploader(false);
    fetchMedia();
    showToast('Upload completed successfully', 'success');
  }

  /**
   * Displays a temporary toast notification.
   *
   * @param {string} message - The message to display
   * @param {string} type    - 'success' or 'error'
   */
  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  /**
   * Formats a byte count into a human-readable file size string.
   *
   * @param {number} bytes - The file size in bytes
   * @returns {string} Formatted file size (e.g., "2.5 MB")
   */
  function formatBytes(bytes) {
    if (!bytes) {
      return '—';
    }

    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '16px',
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="admin-skeleton"
                style={{ height: '280px' }}
              />
            ))}
          </div>
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
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Media Library</h1>
            <p className="admin-page-subtitle">
              {mediaItems.length} assets · Cloudinary
            </p>
          </div>
          <button
            className="admin-btn"
            onClick={() => setShowUploader(true)}
          >
            + Upload Media
          </button>
        </div>

        {/* Media Grid */}
        {mediaItems.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '16px',
            }}
          >
            {mediaItems.map((item) => (
              <div
                key={item.public_id}
                className="hover-lift"
                style={{
                  background: 'var(--admin-surface)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: 'var(--admin-radius-sm)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    aspectRatio: '16/10',
                    background: 'var(--admin-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={item.secure_url}
                    alt={item.public_id}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>

                <div style={{ padding: '12px' }}>
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'var(--admin-text-muted)',
                      marginBottom: '8px',
                      wordBreak: 'break-all',
                      lineHeight: '1.4',
                    }}
                  >
                    {item.public_id}
                  </p>

                  <p
                    style={{
                      fontSize: '11px',
                      color: 'var(--admin-text-muted)',
                      marginBottom: '10px',
                    }}
                  >
                    {item.width}×{item.height} · {formatBytes(item.bytes)}
                  </p>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="admin-btn admin-btn-sm admin-btn-outline"
                      style={{ flex: 1, fontSize: '11px' }}
                      onClick={() => copyToClipboard(item.secure_url)}
                    >
                      {copiedId === item.secure_url ? '✓ Copied!' : 'Copy URL'}
                    </button>

                    <button
                      className="admin-btn admin-btn-sm admin-btn-danger"
                      style={{ fontSize: '11px' }}
                      onClick={() =>
                        requestDelete(item.public_id, item.resource_type)
                      }
                    >
                      {btnDelete}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-empty">
            <div className="admin-empty-icon">🖼️</div>
            <h3 className="admin-empty-title">No media found</h3>
            <p className="admin-empty-text">
              Upload images and videos to your Cloudinary library. They will
              appear here and you can copy their URLs to use in projects and
              blog posts.
            </p>
            <button
              className="admin-btn"
              style={{ marginTop: '16px' }}
              onClick={() => setShowUploader(true)}
            >
              Upload Your First Media
            </button>
          </div>
        )}

        {/* Upload Modal */}
        {showUploader && (
          <MediaUploaderModal
            onClose={() => setShowUploader(false)}
            onSuccess={handleUploadSuccess}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div
            className="admin-modal-overlay"
            onClick={() => setDeleteConfirm(null)}
          >
            <div
              className="admin-modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '440px' }}
            >
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">Delete Media</h2>
                <button
                  className="admin-modal-close"
                  onClick={() => setDeleteConfirm(null)}
                >
                  ✕
                </button>
              </div>

              <div className="admin-modal-body">
                <div className="admin-alert admin-alert-error">
                  <span>⚠️</span> This action cannot be undone.
                </div>
                <p
                  style={{
                    color: 'var(--admin-text-muted)',
                    marginBottom: '8px',
                  }}
                >
                  Are you sure you want to permanently delete this media file
                  from Cloudinary?
                </p>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--admin-text-muted)',
                    wordBreak: 'break-all',
                  }}
                >
                  {deleteConfirm.publicId}
                </p>
              </div>

              <div className="admin-modal-footer">
                <button
                  className="admin-btn admin-btn-outline"
                  onClick={() => setDeleteConfirm(null)}
                >
                  {btnCancel}
                </button>
                <button
                  className="admin-btn admin-btn-danger"
                  onClick={confirmDelete}
                >
                  {btnDelete} Permanently
                </button>
              </div>
            </div>
          </div>
        )}

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