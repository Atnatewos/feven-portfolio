// File: src/app/api/settings/route.js
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
const sql = neon(DATABASE_URL);

const VALID_SETTING_KEYS = [
  'branding',
  'hero',
  'about',
  'showreel',
  'process',
  'work',
  'social',
  'seo',
  'sections',
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      if (!VALID_SETTING_KEYS.includes(key)) {
        return NextResponse.json({ error: 'Invalid setting key' }, { status: 400 });
      }

      const setting = await sql`SELECT * FROM settings WHERE key = ${key}`;

      if (setting.length === 0) {
        return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
      }

      return NextResponse.json(setting[0]);
    }

    const settings = await sql`SELECT * FROM settings ORDER BY key`;
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings GET error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    if (!VALID_SETTING_KEYS.includes(key)) {
      return NextResponse.json(
        { error: `Invalid setting key. Must be one of: ${VALID_SETTING_KEYS.join(', ')}` },
        { status: 400 }
      );
    }

    if (typeof value !== 'object' || value === null) {
      return NextResponse.json({ error: 'Value must be a valid object' }, { status: 400 });
    }

    const jsonValue = JSON.stringify(value);

    if (jsonValue.length > 50000) {
      return NextResponse.json({ error: 'Setting value exceeds maximum size of 50KB' }, { status: 400 });
    }

    /*
     * Deep merge: read the existing value from the database first,
     * then merge the new value on top. This preserves fields that
     * aren't being updated (e.g., backgroundImage stays when only
     * profilePhoto is being cleared).
     */
    const existing = await sql`SELECT value FROM settings WHERE key = ${key}`;
    let mergedValue = value;

    if (existing.length > 0 && existing[0].value && typeof existing[0].value === 'object') {
      const currentValue = typeof existing[0].value === 'string'
        ? JSON.parse(existing[0].value)
        : existing[0].value;

      mergedValue = {
        ...currentValue,
        ...value,
      };
    }

    const setting = await sql`
      INSERT INTO settings (key, value)
      VALUES (${key}, ${JSON.stringify(mergedValue)})
      ON CONFLICT (key) 
      DO UPDATE SET value = ${JSON.stringify(mergedValue)}, updated_at = NOW()
      RETURNING *
    `;

    return NextResponse.json(setting[0]);
  } catch (error) {
    console.error('Settings PUT error:', error.message);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}