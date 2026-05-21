// File: src/app/(public)/about/page.jsx
import AboutSection from '@/components/sections/AboutSection';
import { getSiteSettings } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const settings = await getSiteSettings();
  const branding = settings?.branding || {};
  const about = settings?.about || {};

  return {
    title: `About - ${branding.siteName || 'Portfolio'}`,
    description: about.bioEn?.substring(0, 160) || `Learn more about ${branding.siteName || 'me'}.`,
  };
}

export default async function AboutPage() {
  const settings = await getSiteSettings();
  return <AboutSection settings={settings} />;
}