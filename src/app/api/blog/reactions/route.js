// File: src/app/api/blog/reactions/route.js
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { checkRateLimit } from '../../../../../lib/security';

const DATABASE_URL = process.env.DATABASE_URL;
const sql = neon(DATABASE_URL);
const VALID_REACTIONS = ['like', 'love', 'fire', 'clap', 'idea', 'wow'];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('post_id');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const counts = {};
    for (const type of VALID_REACTIONS) {
      const result = await sql`SELECT COUNT(*) as count FROM blog_reactions WHERE post_id = ${postId} AND reaction_type = ${type}`;
      counts[type] = parseInt(result[0]?.count || 0);
    }

    return NextResponse.json(counts);
  } catch (error) {
    console.error('Reactions GET error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 });
  }
}

export async function POST(request) {
  const rateLimit = checkRateLimit(15);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { post_id, reaction_type } = body;

    if (!post_id || !reaction_type) {
      return NextResponse.json(
        { error: 'Post ID and reaction type are required' },
        { status: 400 }
      );
    }

    if (!VALID_REACTIONS.includes(reaction_type)) {
      return NextResponse.json(
        { error: `Reaction type must be one of: ${VALID_REACTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor?.split(',')[0]?.trim() || '127.0.0.1';

    await sql`
      INSERT INTO blog_reactions (post_id, reaction_type, ip_address)
      VALUES (${post_id}, ${reaction_type}, ${clientIp})
      ON CONFLICT (post_id, ip_address)
      DO UPDATE SET reaction_type = ${reaction_type}, created_at = NOW()
    `;

    const counts = {};
    for (const type of VALID_REACTIONS) {
      const result = await sql`SELECT COUNT(*) as count FROM blog_reactions WHERE post_id = ${post_id} AND reaction_type = ${type}`;
      counts[type] = parseInt(result[0]?.count || 0);
    }

    return NextResponse.json({ success: true, ...counts });
  } catch (error) {
    console.error('Reactions POST error:', error.message);
    return NextResponse.json({ error: 'Failed to submit reaction' }, { status: 500 });
  }
}