// File: src/app/api/contacts/route.js
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { checkRateLimit, sanitizeString, isValidEmail } from '../../../../lib/security';

const DATABASE_URL = process.env.DATABASE_URL;
const sql = neon(DATABASE_URL);

/**
 * Contacts API route handler — Manages contact form submissions.
 *
 * GET:    Fetch all contacts, ordered newest first.
 *         Used by the admin contacts page to display the message list.
 *
 * POST:   Submit a new contact message from the public contact form.
 *         Rate limited to 5 requests per IP per minute to prevent spam.
 *         All fields are sanitized and validated before storage.
 *         Name must be 2+ characters, email must be valid format,
 *         message must be 10+ characters.
 *
 * PUT:    Update a contact's read status (mark as read).
 *
 * DELETE: Permanently remove a contact message by ID.
 *         Returns 404 if the contact doesn't exist.
 *
 * All queries use parameterized statements. No raw SQL concatenation.
 */
export async function GET() {
  try {
    const contacts = await sql`
      SELECT * FROM contacts
      ORDER BY created_at DESC
    `;

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Contacts GET error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  /*
   * Rate limit public contact form submissions to 5 per minute per IP.
   * This prevents spam bots from flooding the database with messages.
   * Legitimate users rarely submit more than 1-2 messages per minute.
   */
  const rateLimit = checkRateLimit(5);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error:
          'You have sent too many messages. Please wait a moment and try again.',
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { name, email, message } = body;

    /*
     * Server-side sanitization of all user inputs.
     * This runs even though the client has its own validation,
     * because client-side validation can be bypassed.
     * Defense-in-depth: never trust client-side data alone.
     */
    const sanitizedName = sanitizeString(name, 100);
    const sanitizedEmail = sanitizeString(email, 254);
    const sanitizedMessage = sanitizeString(message, 2000);

    if (!sanitizedName || !sanitizedEmail || !sanitizedMessage) {
      return NextResponse.json(
        { error: 'Name, email, and message are all required fields.' },
        { status: 400 }
      );
    }

    if (sanitizedName.length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters.' },
        { status: 400 }
      );
    }

    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (sanitizedMessage.length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters.' },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO contacts (name, email, message)
      VALUES (${sanitizedName}, ${sanitizedEmail}, ${sanitizedMessage})
    `;

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully.',
    });
  } catch (error) {
    console.error('Contacts POST error:', error.message);
    return NextResponse.json(
      { error: 'Failed to send your message. Please try again.' },
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
        { error: 'Contact ID is required.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { read } = body;

    const contact = await sql`
      UPDATE contacts
      SET read = ${read === true}
      WHERE id = ${id}
      RETURNING *
    `;

    if (contact.length === 0) {
      return NextResponse.json(
        { error: 'Contact message not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(contact[0]);
  } catch (error) {
    console.error('Contacts PUT error:', error.message);
    return NextResponse.json(
      { error: 'Failed to update contact.' },
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
        { error: 'Contact ID is required.' },
        { status: 400 }
      );
    }

    const contact = await sql`
      DELETE FROM contacts
      WHERE id = ${id}
      RETURNING id
    `;

    if (contact.length === 0) {
      return NextResponse.json(
        { error: 'Contact message not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contact message deleted permanently.',
    });
  } catch (error) {
    console.error('Contacts DELETE error:', error.message);
    return NextResponse.json(
      { error: 'Failed to delete contact message.' },
      { status: 500 }
    );
  }
}