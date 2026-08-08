import { NextRequest, NextResponse } from 'next/server';
import { fetchContacts, saveContacts, ContactEntry } from '@/lib/data-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET() {
  const contacts = await fetchContacts();
  return NextResponse.json(contacts, { headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required.' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const contacts = await fetchContacts();

    // Check if quote ID or exact email entry already exists
    const existingIdx = contacts.findIndex(
      (c: any) => c.id === body.id || (c.email || '').trim().toLowerCase() === email
    );

    const entry: ContactEntry = {
      id: body.id || `contact_${Date.now()}`,
      name: body.name || 'Anonymous',
      email: email,
      phone: body.phone || '',
      company: body.company || '',
      message: body.message || '',
      createdAt: body.createdAt || new Date().toISOString(),
      status: body.status || 'new',
    };

    if (existingIdx !== -1) {
      contacts[existingIdx] = { ...contacts[existingIdx], ...entry };
    } else {
      contacts.unshift(entry);
    }

    await saveContacts(contacts);

    return NextResponse.json({ success: true, contact: entry }, { headers: corsHeaders() });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to save contact' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    const contacts = await fetchContacts();
    const idx = contacts.findIndex((c: any) => c.id === id);
    if (idx !== -1) {
      contacts[idx].status = status;
      await saveContacts(contacts);
    }
    return NextResponse.json({ success: true }, { headers: corsHeaders() });
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500, headers: corsHeaders() });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Contact ID required' }, { status: 400, headers: corsHeaders() });

    let contacts = await fetchContacts();
    contacts = contacts.filter((c: any) => c.id !== id);
    await saveContacts(contacts);

    return NextResponse.json({ success: true }, { headers: corsHeaders() });
  } catch {
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500, headers: corsHeaders() });
  }
}
