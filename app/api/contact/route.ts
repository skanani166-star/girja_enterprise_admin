import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'contacts.json');

function getContacts() {
  try {
    return JSON.parse(readFileSync(dataPath, 'utf-8'));
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const contacts = getContacts();
    const entry = {
      id: `contact_${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      status: 'new',
    };
    contacts.unshift(entry);
    writeFileSync(dataPath, JSON.stringify(contacts, null, 2));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save contact' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(getContacts());
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    const contacts = getContacts();
    const idx = contacts.findIndex((c: any) => c.id === id);
    if (idx !== -1) contacts[idx].status = status;
    writeFileSync(dataPath, JSON.stringify(contacts, null, 2));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
