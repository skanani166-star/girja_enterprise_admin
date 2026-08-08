import { NextRequest, NextResponse } from 'next/server';
import { fetchProductsData, saveProductsData, Category } from '@/lib/data-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET() {
  const data = await fetchProductsData();
  return NextResponse.json(data.categories || [], { headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await fetchProductsData();

    if (Array.isArray(body.categories)) {
      data.categories = body.categories;
    } else if (body.name) {
      const newCategory: Category = {
        id: body.id || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: body.description || '',
        icon: body.icon || 'FolderOpen',
      };
      const existingIdx = data.categories.findIndex((c) => c.id === newCategory.id);
      if (existingIdx !== -1) {
        data.categories[existingIdx] = newCategory;
      } else {
        data.categories.push(newCategory);
      }
    }

    await saveProductsData(data);
    return NextResponse.json({ success: true, categories: data.categories }, { headers: corsHeaders() });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update categories' }, { status: 500, headers: corsHeaders() });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await fetchProductsData();
    const idx = data.categories.findIndex((c) => c.id === body.id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404, headers: corsHeaders() });
    }
    data.categories[idx] = { ...data.categories[idx], ...body };
    await saveProductsData(data);
    return NextResponse.json({ success: true, category: data.categories[idx] }, { headers: corsHeaders() });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500, headers: corsHeaders() });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Category ID required' }, { status: 400, headers: corsHeaders() });

    const data = await fetchProductsData();
    data.categories = (data.categories || []).filter((c: any) => c.id !== id);
    await saveProductsData(data);
    return NextResponse.json({ success: true }, { headers: corsHeaders() });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500, headers: corsHeaders() });
  }
}
