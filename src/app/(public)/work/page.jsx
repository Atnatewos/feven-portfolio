// File: src/app/(public)/work/page.jsx
import ProjectGrid from '@/components/sections/ProjectGrid';
import { getProjects, getSiteSettings } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const settings = await getSiteSettings();
  const branding = settings?.branding || {};
  const work = settings?.work || {};

  return {
    title: `${work.titleEn || 'My Work'} - ${branding.siteName || 'Portfolio'}`,
    description: work.subtitleEn || `Explore projects by ${branding.siteName || 'me'}.`,
  };
}

export default async function WorkPage() {
  const projects = await getProjects();
  const settings = await getSiteSettings();
  const workTitle = settings?.work?.titleEn || 'My Work';

  return <ProjectGrid projects={projects} title={workTitle} />;
}