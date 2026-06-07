import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'products.json');

function getData() {
  return JSON.parse(readFileSync(dataPath, 'utf-8'));
}

function saveData(data: any) {
  writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const data = getData();

  const products = category
    ? data.products.filter((p: any) => p.category === category)
    : data.products;

  return NextResponse.json({ products, categories: data.categories });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = getData();
    const newProduct = { ...body, id: `prod_${Date.now()}` };
    data.products.push(newProduct);
    saveData(data);
    return NextResponse.json({ success: true, product: newProduct });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const data = getData();
    const idx = data.products.findIndex((p: any) => p.id === body.id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    data.products[idx] = body;
    saveData(data);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const data = getData();
    data.products = data.products.filter((p: any) => p.id !== id);
    saveData(data);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
