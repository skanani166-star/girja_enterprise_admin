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
