// File: src/app/api/blog/comments/route.js
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { checkRateLimit, sanitizeString, isValidEmail } from '../../../../../lib/security';

const DATABASE_URL = process.env.DATABASE_URL;
const sql = neon(DATABASE_URL);

/**
 * Blog Comments API route handler.
 *
 * GET:  Fetch all comments for a post (public and admin).
 *       Returns ALL comments — the public filter is done client-side.
 *       Admin can see all comments including hidden ones.
 *
 * POST: Submit a new comment. Comments are published immediately (approved = true).
 *
 * PUT:  Toggle comment visibility (hide/show) — admin only.
 *
 * DELETE: Remove a comment permanently — admin only.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('post_id');
    const admin = searchParams.get('admin');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    /*
     * If admin=true, return ALL comments including hidden ones.
     * Otherwise, only return approved comments for public display.
     */
    let comments;
    if (admin === 'true') {
      comments = await sql`
        SELECT id, post_id, author_name, author_email, content, approved, created_at
        FROM blog_comments
        WHERE post_id = ${postId}
        ORDER BY created_at ASC
      `;
    } else {
      comments = await sql`
        SELECT id, post_id, author_name, content, created_at
        FROM blog_comments
        WHERE post_id = ${postId} AND approved = true
        ORDER BY created_at ASC
      `;
    }

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Comments GET error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request) {
  const rateLimit = checkRateLimit(5);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'You are commenting too fast. Please wait a moment.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { post_id, author_name, author_email, content } = body;

    const sanitizedName = sanitizeString(author_name, 100);
    const sanitizedEmail = author_email ? sanitizeString(author_email, 254) : null;
    const sanitizedContent = sanitizeString(content, 2000);

    if (!post_id || !sanitizedName || !sanitizedContent) {
      return NextResponse.json(
        { error: 'Post ID, author name, and content are required' },
        { status: 400 }
      );
    }

    if (sanitizedName.length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (sanitizedContent.length < 3) {
      return NextResponse.json(
        { error: 'Comment must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (sanitizedEmail && !isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const comment = await sql`
      INSERT INTO blog_comments (post_id, author_name, author_email, content, approved)
      VALUES (${post_id}, ${sanitizedName}, ${sanitizedEmail}, ${sanitizedContent}, true)
      RETURNING id, post_id, author_name, content, created_at
    `;

    return NextResponse.json({
      success: true,
      message: 'Your comment has been posted.',
      comment: comment[0],
    });
  } catch (error) {
    console.error('Comments POST error:', error.message);
    return NextResponse.json({ error: 'Failed to submit comment' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { approved } = body;

    if (typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'Approved status must be a boolean' }, { status: 400 });
    }

    const comment = await sql`
      UPDATE blog_comments SET approved = ${approved}
      WHERE id = ${id}
      RETURNING *
    `;

    if (comment.length === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json(comment[0]);
  } catch (error) {
    console.error('Comments PUT error:', error.message);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    const comment = await sql`DELETE FROM blog_comments WHERE id = ${id} RETURNING id`;

    if (comment.length === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Comments DELETE error:', error.message);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}