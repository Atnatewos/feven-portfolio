'use client';

import { useState, useRef } from 'react';
import './MediaUploader.css';

/**
 * Cloudinary media uploader component
 * Handles direct upload to Cloudinary with preview
 * @param {Object} props
 * @param {Function} props.onSuccess - Callback on successful upload
 * @param {Function} props.onCancel - Callback to close uploader
 */
export default function MediaUploader({ onSuccess, onCancel }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  /**
   * Fetches upload signature from API
   */
  async function getUploadSignature() {
    const response = await fetch('/api/media', { method: 'POST' });
    if (!response.ok) {
      throw new Error('Failed to get upload signature');
    }
    return response.json();
  }

  /**
   * Handles file selection and uploads to Cloudinary
   */
  async function handleFile(file) {
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Only image and video files are supported');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('File size must be under 100MB');
      return;
    }

    setError('');
    setIsUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    try {
      const { signature, timestamp, cloudName, apiKey } = await getUploadSignature();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('api_key', apiKey);
      formData.append('folder', 'fevens-portfolio');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.onload = () => {
        if (xhr.status === 200) {
          onSuccess();
        } else {
          const response = JSON.parse(xhr.responseText);
          setError(response.error?.message || 'Upload failed');
        }
        setIsUploading(false);
      };

      xhr.onerror = () => {
        setError('Network error during upload');
        setIsUploading(false);
      };

      xhr.send(formData);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file');
      setIsUploading(false);
    }
  }

  /**
   * Handles drag events
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

  /**
   * Handles file drop
   */
  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  /**
   * Handles file input change
   */
  function handleFileInputChange(e) {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }

  return (
    <div className="media-uploader">
      {error && (
        <div className="admin-error-msg" role="alert">
          {error}
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
            <span style={{ fontSize: '48px', marginBottom: '16px' }}>📁</span>
            <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              Drag and drop your file here
            </p>
            <p style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>
              or click to browse · Max 100MB
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
              alt="Preview"
              style={{ maxWidth: '300px', maxHeight: '200px', borderRadius: '8px', marginBottom: '20px' }}
            />
          )}
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--admin-bg)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                width: `${uploadProgress}%`,
                height: '100%',
                backgroundColor: 'var(--admin-primary)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <p style={{ fontSize: '14px', color: 'var(--admin-text-secondary)' }}>
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      <div className="admin-form-actions">
        <button
          type="button"
          className="admin-btn admin-btn-outline"
          style={{ width: 'auto' }}
          onClick={onCancel}
          disabled={isUploading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}