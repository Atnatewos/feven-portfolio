// File: src/app/(public)/project/[slug]/page.jsx
import { notFound } from 'next/navigation';
import ProjectDetail from '@/components/sections/ProjectDetail';
import { getProjectBySlug } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  // Explicitly await the async params object required by Next.js 15+ / 16+
  const resolvedParams = await params;
  const project = await getProjectBySlug(resolvedParams.slug);
  if (!project) return { title: 'Project Not Found' };

  return {
    title: `${project.title?.en || 'Project'} - Feven Zerabruk`,
    description: project.description?.en?.substring(0, 160) || 'View this project.',
  };
}

export default async function ProjectPage({ params }) {
  // Explicitly await the async params object before querying database parameters
  const resolvedParams = await params;
  const project = await getProjectBySlug(resolvedParams.slug);
  if (!project) notFound();

  return <ProjectDetail project={project} />;
}