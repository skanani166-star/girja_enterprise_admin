import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

const candidatePaths = [
  path.join(process.cwd(), 'data', 'contacts.json'),
  path.resolve(process.cwd(), '..', 'girja_enterprise', 'data', 'contacts.json'),
  path.resolve(process.cwd(), '..', '..', 'girja_enterprise', 'data', 'contacts.json'),
];

function getContacts(): any[] {
  for (const p of candidatePaths) {
    if (existsSync(p)) {
      try {
        const data = JSON.parse(readFileSync(p, 'utf-8'));
        return Array.isArray(data) ? data : [];
      } catch {}
    }
  }
  return [];
}

function saveContactsToAll(contacts: any[]) {
  for (const p of candidatePaths) {
    try {
      const dir = path.dirname(p);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(p, JSON.stringify(contacts, null, 2));
    } catch {}
  }
}

export async function GET() {
  return NextResponse.json(getContacts());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const contacts = getContacts();

    // Check if email already exists
    const existing = contacts.find(
      (c: any) => (c.email || '').trim().toLowerCase() === email
    );

    if (existing) {
      return NextResponse.json(
        {
          error:
            'A quote request has already been submitted using this email address.',
        },
        { status: 400 }
      );
    }

    const entry = {
      id: `contact_${Date.now()}`,
      name: body.name || 'Anonymous',
      email: email,
      phone: body.phone || '',
      company: body.company || '',
      message: body.message || '',
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    contacts.unshift(entry);
    saveContactsToAll(contacts);

    return NextResponse.json({ success: true, contact: entry });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to save contact' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    const contacts = getContacts();
    const idx = contacts.findIndex((c: any) => c.id === id);
    if (idx !== -1) {
      contacts[idx].status = status;
      saveContactsToAll(contacts);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
