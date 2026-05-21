// File: src/app/(public)/showreel/page.jsx
import Showreel from '@/components/sections/Showreel';
import { getSiteSettings } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const settings = await getSiteSettings();
  const branding = settings?.branding || {};
  const showreel = settings?.showreel || {};

  return {
    title: `${showreel.titleEn || 'Showreel'} - ${branding.siteName || 'Portfolio'}`,
    description: showreel.descriptionEn || `Watch the showreel of ${branding.siteName || 'me'}.`,
  };
}

export default async function ShowreelPage() {
  const settings = await getSiteSettings();
  const showreel = settings?.showreel || {};

  if (!showreel.videoUrl) {
    return (
      <section className="showreel-page">
        <div className="container">
          <div className="showreel-empty-state">
            <div className="showreel-empty-icon">🎥</div>
            <h1 className="showreel-empty-title">Showreel Coming Soon</h1>
            <p className="showreel-empty-text">
              The showreel is currently being prepared. Please check back later.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return <Showreel settings={settings} />;
}