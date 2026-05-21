// File: lib/data.js — UPDATE the getSiteSettings function
// The social key was mapped to 'footer.social' in defaults, but admin saves to 'social' key.
// They must match. Change the default mapping:

import { neon } from '@neondatabase/serverless';
import { cache } from 'react';
import { getFullConfig } from './config';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required for data layer');
}

const sql = neon(DATABASE_URL);

export const getSiteSettings = cache(async () => {
  const configDefaults = getFullConfig();

  const defaults = {
    branding: configDefaults.branding || {},
    hero: configDefaults.hero || {},
    about: configDefaults.about || {},
    showreel: configDefaults.showreel || {},
    process: configDefaults.process || {},
    work: configDefaults.work || {},
    social: configDefaults.footer?.social || {},
    seo: configDefaults.seo || {},
    sections: {
      showBlog: true,
      showProcess: true,
      showShowreel: true,
      showTestimonials: false,
      showArchitecture: true,
    },
  };

  try {
    const rows = await sql`SELECT key, value FROM settings`;
    const merged = { ...defaults };

    for (const row of rows) {
      if (row.key && row.value && typeof row.value === 'object') {
        merged[row.key] = {
          ...(defaults[row.key] || {}),
          ...row.value,
        };
      }
    }

    return merged;
  } catch (error) {
    console.error('Error fetching site settings from DB, using config defaults:', error.message);
    return defaults;
  }
});

export const getSetting = cache(async (key) => {
  try {
    const result = await sql`SELECT value FROM settings WHERE key = ${key}`;
    if (result.length > 0 && result[0].value && typeof result[0].value === 'object') {
      return result[0].value;
    }
  } catch (error) {
    console.error(`Error fetching setting "${key}" from DB:`, error.message);
  }
  const configDefaults = getFullConfig();
  return configDefaults[key] || null;
});

export const getProjects = cache(async (category) => {
  try {
    if (category && category !== 'all') {
      return await sql`SELECT * FROM projects WHERE category = ${category} ORDER BY order_index ASC, created_at DESC`;
    }
    return await sql`SELECT * FROM projects ORDER BY order_index ASC, created_at DESC`;
  } catch (error) {
    console.error('Error fetching projects:', error.message);
    return [];
  }
});

export const getProjectBySlug = cache(async (slug) => {
  try {
    const result = await sql`SELECT * FROM projects WHERE slug = ${slug}`;
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error(`Error fetching project "${slug}":`, error.message);
    return null;
  }
});

export const getFeaturedProjects = cache(async (limit = 6) => {
  try {
    return await sql`SELECT * FROM projects WHERE featured = true ORDER BY order_index ASC, created_at DESC LIMIT ${limit}`;
  } catch (error) {
    console.error('Error fetching featured projects:', error.message);
    return [];
  }
});

export const getBlogPosts = cache(async (category) => {
  try {
    if (category && category !== 'all') {
      return await sql`SELECT * FROM blog_posts WHERE published = true AND category = ${category} ORDER BY created_at DESC`;
    }
    return await sql`SELECT * FROM blog_posts WHERE published = true ORDER BY created_at DESC`;
  } catch (error) {
    console.error('Error fetching blog posts:', error.message);
    return [];
  }
});

export const getBlogPostBySlug = cache(async (slug) => {
  try {
    const result = await sql`SELECT * FROM blog_posts WHERE slug = ${slug} AND published = true`;
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error(`Error fetching blog post "${slug}":`, error.message);
    return null;
  }
});

export async function submitContact(data) {
  const { name, email, message } = data;
  if (!name || !email || !message) return { success: false, error: 'All fields are required' };
  if (name.trim().length < 2) return { success: false, error: 'Name must be at least 2 characters' };
  if (message.trim().length < 10) return { success: false, error: 'Message must be at least 10 characters' };
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) return { success: false, error: 'Invalid email address' };
  try {
    await sql`INSERT INTO contacts (name, email, message) VALUES (${name.trim()}, ${email.trim()}, ${message.trim()})`;
    return { success: true };
  } catch (error) {
    console.error('Error submitting contact:', error.message);
    return { success: false, error: 'Failed to send message. Please try again.' };
  }
}