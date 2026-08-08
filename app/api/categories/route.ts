import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'products.json');

function getData() {
  return JSON.parse(readFileSync(dataPath, 'utf-8'));
}

export async function GET() {
  const data = getData();
  return NextResponse.json(data.categories);
}

export async function POST(req: NextRequest) {
  try {
    const { categories } = await req.json();
    const data = getData();
    data.categories = categories;
    writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update categories' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const data = getData();
    data.categories = (data.categories || []).filter((c: any) => c.id !== id);
    writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
