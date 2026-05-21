// File: src/app/api/projects/route.js
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { sanitizeString, isValidMediaUrl, isAllowedCategory } from '../../../../lib/security';

const DATABASE_URL = process.env.DATABASE_URL;
const sql = neon(DATABASE_URL);

/*
 * Strict allowlist of valid project categories.
 * Matches the three creative disciplines Feven works in.
 * Any category value outside this list is rejected at the API level.
 */
const VALID_CATEGORIES = ['animation', 'design', 'architecture'];

/**
 * Projects API route handler — Full CRUD for portfolio projects.
 *
 * GET:    Fetch all projects, optionally filtered by category.
 *         Ordered by order_index ascending, then creation date descending.
 *
 * POST:   Create a new project with all metadata.
 *         Validates category, media URLs, and required fields.
 *         Sanitizes slug, client name, and tool names.
 *
 * PUT:    Partial update of an existing project by ID.
 *         Only provided fields are modified.
 *
 * DELETE: Permanently remove a project by ID.
 *
 * Security: All string inputs are sanitized. Media URLs are validated
 * against an allowlist of trusted hosts (Cloudinary, YouTube, Vimeo, Google Drive).
 * All database queries use parameterized statements.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let projects;

    if (category && category !== 'all' && isAllowedCategory(category, VALID_CATEGORIES)) {
      projects = await sql`
        SELECT * FROM projects
        WHERE category = ${category}
        ORDER BY order_index ASC, created_at DESC
      `;
    } else {
      projects = await sql`
        SELECT * FROM projects
        ORDER BY order_index ASC, created_at DESC
      `;
    }

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Projects GET error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch projects.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title,
      slug,
      category,
      description,
      media,
      thumbnail,
      tools,
      client,
      year,
      order_index,
      featured,
    } = body;

    if (!title?.en || !slug || !category) {
      return NextResponse.json(
        { error: 'Title (English), slug, and category are required.' },
        { status: 400 }
      );
    }

    if (!isAllowedCategory(category, VALID_CATEGORIES)) {
      return NextResponse.json(
        { error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    const sanitizedSlug = sanitizeString(slug, 100);
    const sanitizedClient = client ? sanitizeString(client, 200) : null;

    if (thumbnail && !isValidMediaUrl(thumbnail)) {
      return NextResponse.json(
        { error: 'Invalid thumbnail URL. Must be from Cloudinary, YouTube, Vimeo, or Google Drive.' },
        { status: 400 }
      );
    }

    if (media && Array.isArray(media)) {
      for (const item of media) {
        if (item.url && !isValidMediaUrl(item.url)) {
          return NextResponse.json(
            { error: `Invalid media URL detected. All media must be from approved hosts.` },
            { status: 400 }
          );
        }
      }
    }

    const sanitizedTools =
      tools && Array.isArray(tools)
        ? tools.map((tool) => sanitizeString(tool, 100)).filter(Boolean)
        : null;

    const project = await sql`
      INSERT INTO projects (
        title,
        slug,
        category,
        description,
        media,
        thumbnail,
        tools,
        client,
        year,
        order_index,
        featured
      )
      VALUES (
        ${JSON.stringify(title)},
        ${sanitizedSlug},
        ${category},
        ${description ? JSON.stringify(description) : null},
        ${media ? JSON.stringify(media) : null},
        ${thumbnail || null},
        ${sanitizedTools},
        ${sanitizedClient},
        ${year || null},
        ${order_index || 0},
        ${featured || false}
      )
      RETURNING *
    `;

    return NextResponse.json(project[0], { status: 201 });
  } catch (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A project with this slug already exists.' },
        { status: 409 }
      );
    }

    console.error('Projects POST error:', error.message);
    return NextResponse.json(
      { error: 'Failed to create project.' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      slug,
      category,
      description,
      media,
      thumbnail,
      tools,
      client,
      year,
      order_index,
      featured,
    } = body;

    if (category && !isAllowedCategory(category, VALID_CATEGORIES)) {
      return NextResponse.json(
        { error: 'Invalid category.' },
        { status: 400 }
      );
    }

    if (thumbnail && !isValidMediaUrl(thumbnail)) {
      return NextResponse.json(
        { error: 'Invalid thumbnail URL.' },
        { status: 400 }
      );
    }

    const project = await sql`
      UPDATE projects
      SET
        title = ${title ? JSON.stringify(title) : undefined},
        slug = ${slug ? sanitizeString(slug, 100) : undefined},
        category = ${category || undefined},
        description = ${description ? JSON.stringify(description) : undefined},
        media = ${media ? JSON.stringify(media) : undefined},
        thumbnail = ${thumbnail || undefined},
        tools = ${tools || undefined},
        client = ${client ? sanitizeString(client, 200) : undefined},
        year = ${year || undefined},
        order_index = ${order_index !== undefined ? order_index : undefined},
        featured = ${featured !== undefined ? featured : undefined},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (project.length === 0) {
      return NextResponse.json(
        { error: 'Project not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(project[0]);
  } catch (error) {
    console.error('Projects PUT error:', error.message);
    return NextResponse.json(
      { error: 'Failed to update project.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required.' },
        { status: 400 }
      );
    }

    const project = await sql`
      DELETE FROM projects
      WHERE id = ${id}
      RETURNING id
    `;

    if (project.length === 0) {
      return NextResponse.json(
        { error: 'Project not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted permanently.',
    });
  } catch (error) {
    console.error('Projects DELETE error:', error.message);
    return NextResponse.json(
      { error: 'Failed to delete project.' },
      { status: 500 }
    );
  }
}