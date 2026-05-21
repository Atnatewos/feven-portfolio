// File: src/app/(public)/page.jsx
import Hero from '@/components/sections/Hero';
import ProjectGrid from '@/components/sections/ProjectGrid';
import { getSiteSettings, getFeaturedProjects } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const settings = await getSiteSettings();
  const branding = settings?.branding || {};

  return {
    title: branding.siteName || 'Portfolio',
    description: branding.taglineEn || 'A creative portfolio',
  };
}

export default async function HomePage() {
  const settings = await getSiteSettings();
  const featuredProjects = await getFeaturedProjects(6);

  return (
    <>
      <Hero settings={settings} projects={featuredProjects} />
      {featuredProjects.length > 0 && (
        <ProjectGrid projects={featuredProjects} title="Featured Work" />
      )}
    </>
  );
}