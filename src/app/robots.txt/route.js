// File: src/app/robots.txt/route.js
/**
 * Dynamic robots.txt generation.
 * Allows search engines to crawl the public site while blocking admin routes. 
 * The SITE_URL is read from environment variables — no hardcoded values.
 */
export async function GET() {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const robotsTxt = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}