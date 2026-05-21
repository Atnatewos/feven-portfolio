// File: src/app/(public)/project/[slug]/page.jsx
import { notFound } from 'next/navigation';
import ProjectDetail from '@/components/sections/ProjectDetail';
import { getProjectBySlug } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const project = await getProjectBySlug(params.slug);
  if (!project) return { title: 'Project Not Found' };

  return {
    title: `${project.title?.en || 'Project'} - Feven Zerabruk`,
    description: project.description?.en?.substring(0, 160) || 'View this project.',
  };
}

export default async function ProjectPage({ params }) {
  const project = await getProjectBySlug(params.slug);
  if (!project) notFound();

  return <ProjectDetail project={project} />;
}