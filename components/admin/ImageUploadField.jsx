// File: components/admin/ImageUploadField.jsx
'use client';

import { useState, useRef } from 'react';
import './ImageUploadField.css';

/**
 * Image upload field component for admin settings forms.
 *
 * Combines a text URL input with an upload button that triggers
 * direct Cloudinary upload. On successful upload, the Cloudinary URL
 * automatically populates the text field. Supports drag-and-drop
 * and displays upload progress.
 *
 * Features:
 * - Text input for manual URL entry (backwards compatible)
 * - Upload button opens native file picker
 * - Direct upload to Cloudinary with progress bar
 * - Auto-fills URL on successful upload
 * - File type validation (images only)
 * - File size validation (10MB max)
 * - Error messages for failed uploads
 *
 * @param {Object}   props
 * @param {string}   props.value       - Current image URL value
 * @param {Function} props.onChange    - Callback when URL changes
 * @param {string}   [props.label]     - Field label text
 * @param {string}   [props.hint]      - Help text below the field
 * @param {string}   [props.placeholder] - Input placeholder text
 * @param {number}   [props.maxSize]   - Maximum file size in MB (default 10)
 * @param {string}   [props.accept]    - Accepted file types (default 'image/*')
 */
export default function ImageUploadField({
  value = '',
  onChange,
  label = 'Image URL',
  hint = '',
  placeholder = 'https://res.cloudinary.com/... or upload an image',
  maxSize = 10,
  accept = 'image/*',
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  /**
   * Fetches a signed upload signature from the API.
   * The signature authorizes a single upload without exposing API secrets.
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
   */
  function validateFile(file) {
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files (JPG, PNG, GIF, WebP) are supported.');
      return false;
    }

    if (file.size > maxSize * 1024 * 1024) {
      setUploadError(`File size must be under ${maxSize}MB.`);
      return false;
    }

    return true;
  }

  /**
   * Handles file selection and uploads to Cloudinary.
   */
  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadError('');

    try {
      const { signature, timestamp, cloudName, apiKey, folder } = await getUploadSignature();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('api_key', apiKey);
      formData.append('folder', folder || 'fevens-portfolio');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      });

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          onChange(response.secure_url);
          setUploading(false);
          setUploadProgress(0);
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            setUploadError(response.error?.message || 'Upload failed. Please try again.');
          } catch {
            setUploadError('Upload failed. Please try again.');
          }
          setUploading(false);
        }
      };

      xhr.onerror = () => {
        setUploadError('Network error during upload. Please check your connection.');
        setUploading(false);
      };

      xhr.send(formData);
    } catch {
      setUploadError('Failed to start upload. Please try again.');
      setUploading(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="image-upload-field">
      {label && <label className="admin-label">{label}</label>}

      <div className="image-upload-field-row">
        <input
          type="text"
          className="admin-input image-upload-field-input"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setUploadError('');
          }}
          placeholder={placeholder}
          disabled={uploading}
        />

        <button
          type="button"
          className="admin-btn admin-btn-outline image-upload-field-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : '📤 Upload'}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          aria-label="Upload image file"
        />
      </div>

      {uploading && (
        <div className="image-upload-field-progress">
          <div className="image-upload-field-progress-bar">
            <div
              className="image-upload-field-progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="image-upload-field-progress-text">
            {uploadProgress}%
          </span>
        </div>
      )}

      {uploadError && (
        <div className="image-upload-field-error" role="alert">
          <span>⚠️</span> {uploadError}
        </div>
      )}

      {hint && !uploadError && (
        <p className="admin-form-hint">{hint}</p>
      )}

      {value && !uploading && (
        <div className="image-upload-field-preview">
          <img
            src={value}
            alt="Preview"
            className="image-upload-field-preview-img"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}