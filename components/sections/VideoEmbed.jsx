'use client';

import { useState } from 'react';
import './VideoEmbed.css';

/**
 * Smart video embed component that handles multiple video sources
 * Supports YouTube, Vimeo, Google Drive, Cloudinary, and direct video URLs
 * @param {Object} props
 * @param {string} props.url - Video URL
 * @param {string} props.title - Video title for accessibility
 * @param {string} props.poster - Poster image URL
 * @param {string} props.aspectRatio - Aspect ratio (e.g., "16/9")
 */
export default function VideoEmbed({
  url,
  title = 'Video',
  poster,
  aspectRatio = '16 / 9',
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!url) {
    return (
      <div className="video-embed-error" role="alert">
        <p>No video URL provided</p>
      </div>
    );
  }

  /**
   * Determines the video source type based on URL
   * @param {string} videoUrl
   * @returns {string} Video source type
   */
  function getEmbedType(videoUrl) {
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'))
      return 'youtube';
    if (videoUrl.includes('vimeo.com')) return 'vimeo';
    if (videoUrl.includes('drive.google.com')) return 'googledrive';
    if (videoUrl.includes('cloudinary.com') || videoUrl.includes('res.cloudinary.com'))
      return 'cloudinary';
    return 'direct';
  }

  /**
   * Extracts and formats the embed URL based on source type
   * @param {string} videoUrl
   * @returns {string} Formatted embed URL
   */
  function getEmbedUrl(videoUrl) {
    const type = getEmbedType(videoUrl);

    switch (type) {
      case 'youtube': {
        const ytId =
          videoUrl.match(
            /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^"&?\/\s]{11})/
          )?.[1];
        return `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&showinfo=0`;
      }

      case 'vimeo': {
        const vmId = videoUrl.match(/vimeo\.com\/(\d+)/)?.[1];
        return `https://player.vimeo.com/video/${vmId}?title=0&byline=0&portrait=0`;
      }

      case 'googledrive': {
        const gdId = videoUrl.match(/\/d\/([^\/]+)/)?.[1];
        return `https://drive.google.com/file/d/${gdId}/preview`;
      }

      default:
        return videoUrl;
    }
  }

  const embedType = getEmbedType(url);

  /**
   * Handles video load errors gracefully
   */
  function handleError() {
    setHasError(true);
  }

  if (hasError) {
    return (
      <div className="video-embed-error" role="alert">
        <p>Failed to load video. The video may be unavailable or private.</p>
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open video in new tab
        </a>
      </div>
    );
  }

  return (
    <div className="video-embed" style={{ aspectRatio }}>
      {!isLoaded && (
        <div
          className="video-embed-poster"
          onClick={() => setIsLoaded(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsLoaded(true);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Play video: ${title}`}
        >
          {poster ? (
            <img src={poster} alt={title} className="video-embed-poster-img" />
          ) : (
            <div className="video-embed-poster-placeholder">
              <span>Click to Play</span>
            </div>
          )}

          <div className="video-embed-play-btn" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {isLoaded && (
        <>
          {embedType === 'cloudinary' || embedType === 'direct' ? (
            <video
              controls
              autoPlay={false}
              poster={poster}
              onError={handleError}
              className="video-embed-player"
            >
              <source src={url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <iframe
              src={getEmbedUrl(url)}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              onError={handleError}
              className="video-embed-iframe"
            />
          )}
        </>
      )}
    </div>
  );
}