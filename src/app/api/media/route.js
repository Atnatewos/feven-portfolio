// File: src/app/api/media/route.js
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('Cloudinary environment variables are not fully configured');
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

const ALLOWED_RESOURCE_TYPES = ['image', 'video'];
const MAX_RESULTS_LIMIT = 100;

/**
 * Media API route handler.
 * Manages Cloudinary media assets through server-side operations.
 * Generates signed upload signatures for secure client-side uploads.
 * Validates all parameters against allowlists.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'upload';
    const nextCursor = searchParams.get('next_cursor');
    const maxResults = parseInt(searchParams.get('max_results')) || 50;

    const resourceType = searchParams.get('resource_type') || 'image';
    if (!ALLOWED_RESOURCE_TYPES.includes(resourceType)) {
      return NextResponse.json({ error: 'Invalid resource type' }, { status: 400 });
    }

    const safeMaxResults = Math.min(maxResults, MAX_RESULTS_LIMIT);
    const options = {
      type,
      max_results: safeMaxResults,
      resource_type: resourceType,
    };

    if (nextCursor) {
      options.next_cursor = nextCursor;
    }

    const result = await cloudinary.api.resources(options);

    return NextResponse.json({
      resources: result.resources || [],
      next_cursor: result.next_cursor || null,
    });
  } catch (error) {
    console.error('Media GET error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'fevens-portfolio';

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      CLOUDINARY_API_SECRET
    );

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY,
      folder,
    });
  } catch (error) {
    console.error('Media POST error:', error.message);
    return NextResponse.json({ error: 'Failed to generate upload signature' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { public_id, resource_type = 'image' } = body;

    if (!public_id) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 });
    }

    if (!ALLOWED_RESOURCE_TYPES.includes(resource_type)) {
      return NextResponse.json({ error: 'Invalid resource type' }, { status: 400 });
    }

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type,
      invalidate: true,
    });

    if (result.result === 'ok') {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: result.result || 'Delete failed' }, { status: 400 });
  } catch (error) {
    console.error('Media DELETE error:', error.message);
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}