// File: src/app/(public)/work/[category]/page.jsx
import { notFound } from 'next/navigation';
import ProjectGrid from '@/components/sections/ProjectGrid';
import { getProjects } from '@/lib/data';

export const dynamic = 'force-dynamic';

const validCategories = ['animation', 'design', 'architecture'];

export function generateStaticParams() {
  return validCategories.map((category) => ({ category }));
}

export async function generateMetadata({ params }) {
  const { category } = params;
  if (!validCategories.includes(category)) return { title: 'Not Found' };

  const labels = { animation: 'Animation', design: 'Graphic Design', architecture: 'Architecture' };
  return {
    title: `${labels[category] || 'Portfolio'} - Feven Zerabruk`,
    description: `Browse ${category} projects.`,
  };
}

export default async function CategoryPage({ params }) {
  const { category } = params;
  if (!validCategories.includes(category)) notFound();

  const projects = await getProjects(category);
  return <ProjectGrid projects={projects} title={category} />;
}