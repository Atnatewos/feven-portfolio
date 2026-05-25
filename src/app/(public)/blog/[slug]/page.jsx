// File: src/app/(public)/blog/[slug]/page.jsx
import { notFound } from 'next/navigation';
import BlogPost from '@/components/sections/BlogPost';
import { getBlogPostBySlug } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  // Explicitly await the async params object required by Next.js 15+ / 16+
  const resolvedParams = await params;
  const post = await getBlogPostBySlug(resolvedParams.slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: `${post.title?.en || 'Blog Post'} - Feven Zerabruk`,
    description: post.excerpt?.en?.substring(0, 160) || 'Read this blog post.',
  };
}

export default async function BlogPostPage({ params }) {
  // Explicitly await the async params object before querying database parameters
  const resolvedParams = await params;
  const post = await getBlogPostBySlug(resolvedParams.slug);
  if (!post) notFound();

  return <BlogPost post={post} />;
}