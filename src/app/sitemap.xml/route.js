// File: src/app/sitemap.xml/route.js
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * Dynamic sitemap.xml generation.
 * Includes all static pages plus dynamic content (projects and blog posts).
 * All database queries are parameterized. No hardcoded URLs.
 */
export async function GET() {
  const staticPages = [
    { path: '', priority: '1.0', changefreq: 'weekly' },
    { path: '/work', priority: '0.9', changefreq: 'weekly' },
    { path: '/showreel', priority: '0.8', changefreq: 'monthly' },
    { path: '/about', priority: '0.7', changefreq: 'monthly' },
    { path: '/process', priority: '0.7', changefreq: 'monthly' },
    { path: '/blog', priority: '0.8', changefreq: 'daily' },
    { path: '/contact', priority: '0.6', changefreq: 'monthly' },
  ];

  let projectUrls = [];
  let blogUrls = [];

  try {
    if (DATABASE_URL) {
      const sql = neon(DATABASE_URL);

      const projects = await sql`
        SELECT slug, updated_at FROM projects ORDER BY updated_at DESC
      `;

      projectUrls = projects.map((p) => ({
        path: `/project/${p.slug}`,
        priority: '0.8',
        changefreq: 'monthly',
        lastmod: p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : null,
      }));

      const posts = await sql`
        SELECT slug, updated_at FROM blog_posts 
        WHERE published = true 
        ORDER BY updated_at DESC
      `;

      blogUrls = posts.map((p) => ({
        path: `/blog/${p.slug}`,
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : null,
      }));
    }
  } catch (error) {
    console.error('Sitemap generation error:', error.message);
  }

  const allPages = [...staticPages, ...projectUrls, ...blogUrls];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <priority>${page.priority}</priority>
    <changefreq>${page.changefreq}</changefreq>${page.lastmod ? `\n    <lastmod>${page.lastmod}</lastmod>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}