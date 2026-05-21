// File: src/app/api/blog/route.js — FIX the import path on line 4
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { sanitizeString, isValidMediaUrl, isAllowedCategory } from '../../../../lib/security';

const DATABASE_URL = process.env.DATABASE_URL;
const sql = neon(DATABASE_URL);
const VALID_CATEGORIES = ['animation', 'design', 'architecture', 'tutorial', 'news'];

export async function GET() {
  try {
    const posts = await sql`SELECT * FROM blog_posts ORDER BY created_at DESC`;
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Blog GET error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, slug, excerpt, content, category, thumbnail, published } = body;

    if (!title?.en || !slug || !content?.en) {
      return NextResponse.json(
        { error: 'Title (English), slug, and content (English) are required' },
        { status: 400 }
      );
    }

    const sanitizedSlug = sanitizeString(slug, 150);

    if (category && !isAllowedCategory(category, VALID_CATEGORIES)) {
      return NextResponse.json(
        { error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    if (thumbnail && !isValidMediaUrl(thumbnail)) {
      return NextResponse.json({ error: 'Invalid thumbnail URL format' }, { status: 400 });
    }

    const post = await sql`
      INSERT INTO blog_posts (title, slug, excerpt, content, category, thumbnail, published)
      VALUES (
        ${JSON.stringify(title)},
        ${sanitizedSlug},
        ${excerpt ? JSON.stringify(excerpt) : null},
        ${JSON.stringify(content)},
        ${category || null},
        ${thumbnail || null},
        ${published !== undefined ? published : true}
      )
      RETURNING *
    `;

    return NextResponse.json(post[0], { status: 201 });
  } catch (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 409 }
      );
    }
    console.error('Blog POST error:', error.message);
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { title, slug, excerpt, content, category, thumbnail, published } = body;

    if (category && !isAllowedCategory(category, VALID_CATEGORIES)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    if (thumbnail && !isValidMediaUrl(thumbnail)) {
      return NextResponse.json({ error: 'Invalid thumbnail URL format' }, { status: 400 });
    }

    const post = await sql`
      UPDATE blog_posts
      SET
        title = COALESCE(${title ? JSON.stringify(title) : null}, title),
        slug = COALESCE(${slug ? sanitizeString(slug, 150) : null}, slug),
        excerpt = COALESCE(${excerpt ? JSON.stringify(excerpt) : null}, excerpt),
        content = COALESCE(${content ? JSON.stringify(content) : null}, content),
        category = COALESCE(${category || null}, category),
        thumbnail = COALESCE(${thumbnail || null}, thumbnail),
        published = COALESCE(${published !== undefined ? published : null}, published),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (post.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post[0]);
  } catch (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 409 }
      );
    }
    console.error('Blog PUT error:', error.message);
    return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const post = await sql`DELETE FROM blog_posts WHERE id = ${id} RETURNING id`;

    if (post.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Blog DELETE error:', error.message);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}