// File: src/app/layout.jsx
import '@/styles/globals.css';
import { getBranding, getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function generateMetadata() {
  const branding = getBranding();
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: branding.siteName || 'Portfolio',
      template: `%s | ${branding.siteName || 'Portfolio'}`,
    },
    description: branding.taglineEn || '',
    icons: {
      icon: branding.favicon || '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
    robots: { index: true, follow: true },
  };
}

/**
 * Root layout — the SINGLE source of <html> and <body> tags.
 *
 * Applies the Abyssinia dark cyberpunk theme via CSS custom properties
 * read from config/branding.json. Every color, font, and design token
 * flows from the config through CSS variables on <body>.
 *
 * The body background uses the deep navy canvas color (#0B0B16)
 * with subtle radial gradient overlays for depth.
 */
export default function RootLayout({ children }) {
  const branding = getBranding();
  const seo = getConfig('seo');

  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="icon"
          href={branding.favicon || '/favicon.ico'}
          type="image/x-icon"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <meta
          name="theme-color"
          content={branding.colors?.background || '#0B0B16'}
        />
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {seo?.googleAnalyticsId && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${seo.googleAnalyticsId}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${seo.googleAnalyticsId}');`,
              }}
            />
          </>
        )}
      </head>
      <body
        style={{
          '--color-background': branding.colors?.background || '#0B0B16',
          '--color-background-elevated': branding.colors?.backgroundElevated || '#111122',
          '--color-surface': branding.colors?.surface || '#151526',
          '--color-surface-hover': branding.colors?.surfaceHover || '#1C1C35',
          '--color-border': branding.colors?.border || '#252545',
          '--color-border-light': branding.colors?.borderLight || '#323260',
          '--color-text': branding.colors?.text || '#FFFFFF',
          '--color-text-secondary': branding.colors?.textSecondary || '#A5B4FC',
          '--color-text-muted': branding.colors?.textMuted || '#6B7280',
          '--color-primary': branding.colors?.primary || '#D946EF',
          '--color-primary-glow': branding.colors?.primaryGlow || 'rgba(217, 70, 239, 0.4)',
          '--color-secondary': branding.colors?.secondary || '#3B82F6',
          '--color-secondary-glow': branding.colors?.secondaryGlow || 'rgba(59, 130, 246, 0.4)',
          '--color-accent': branding.colors?.accent || '#10B981',
          '--color-accent-glow': branding.colors?.accentGlow || 'rgba(16, 185, 129, 0.4)',
          '--color-success': branding.colors?.success || '#10B981',
          '--color-success-glow': branding.colors?.successGlow || 'rgba(16, 185, 129, 0.4)',
          '--color-error': branding.colors?.error || '#EF4444',
          '--color-error-glow': branding.colors?.errorGlow || 'rgba(239, 68, 68, 0.4)',
          '--color-warning': branding.colors?.warning || '#F59E0B',
          '--color-warning-glow': branding.colors?.warningGlow || 'rgba(245, 158, 11, 0.4)',
          '--color-animation': branding.colors?.animation || '#00FFCC',
          '--color-animation-glow': branding.colors?.animationGlow || 'rgba(0, 255, 204, 0.5)',
          '--color-architecture': branding.colors?.architecture || '#00D2FF',
          '--color-architecture-glow': branding.colors?.architectureGlow || 'rgba(0, 210, 255, 0.5)',
          '--color-design': branding.colors?.design || '#D946EF',
          '--color-design-glow': branding.colors?.designGlow || 'rgba(217, 70, 239, 0.5)',
        }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}