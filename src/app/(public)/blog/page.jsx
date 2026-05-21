// File: src/app/(public)/blog/page.jsx
import BlogList from '@/components/sections/BlogList';
import { getBlogPosts, getSiteSettings } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const settings = await getSiteSettings();
  const branding = settings?.branding || {};
  const blog = settings?.blog || {};

  return {
    title: `${blog.pageTitle?.en || 'Blog'} - ${branding.siteName || 'Portfolio'}`,
    description: blog.subtitle?.en || `Read articles by ${branding.siteName || 'me'}.`,
  };
}

export default async function BlogPage() {
  const posts = await getBlogPosts();
  return <BlogList posts={posts} />;
}