// File: src/app/(public)/process/page.jsx
import ProcessSection from '@/components/sections/ProcessSection';
import { getSiteSettings } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const settings = await getSiteSettings();
  const branding = settings?.branding || {};
  const process = settings?.process || {};

  return {
    title: `${process.titleEn || 'My Process'} - ${branding.siteName || 'Portfolio'}`,
    description: process.subtitleEn || `See how ${branding.siteName || 'I'} work.`,
  };
}

export default async function ProcessPage() {
  const settings = await getSiteSettings();
  return <ProcessSection settings={settings} />;
}