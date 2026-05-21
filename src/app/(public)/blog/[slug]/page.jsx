// File: src/app/(public)/blog/[slug]/page.jsx
import { notFound } from 'next/navigation';
import BlogPost from '@/components/sections/BlogPost';
import { getBlogPostBySlug } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: `${post.title?.en || 'Blog Post'} - Feven Zerabruk`,
    description: post.excerpt?.en?.substring(0, 160) || 'Read this blog post.',
  };
}

export default async function BlogPostPage({ params }) {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) notFound();

  return <BlogPost post={post} />;
}