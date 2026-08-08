import { NextRequest, NextResponse } from 'next/server';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fetchProductsData, saveProductsData, ProductsData } from '@/lib/data-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

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

function ensureUploadDir() {
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
}

function parseStringArray(value: any) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return trimmed
      .split(/\n|,/)
      .map((item: string) => item.trim())
      .filter(Boolean);
  }
  return [];
}

async function saveUploadedFiles(files: File[]) {
  const uploadedPaths: string[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      ensureUploadDir();
      const extension = path.extname(file.name || 'image') || '.jpg';
      const fileName = `${Date.now()}-${index}-${sanitizeFileName(file.name || 'image')}${extension}`;
      const filePath = path.join(uploadDir, fileName);
      writeFileSync(filePath, buffer);
      uploadedPaths.push(`/uploads/${fileName}`);
    } catch (err) {
      // In serverless / read-only filesystem environments, fall back to Data URL
      const mime = file.type || 'image/jpeg';
      const base64 = buffer.toString('base64');
      uploadedPaths.push(`data:${mime};base64,${base64}`);
    }
  }

  return uploadedPaths;
}

async function parseRequestBody(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const payload: Record<string, any> = {};
    const uploadedFiles = formData.getAll('newImages').filter((value): value is File => value instanceof File);
    const existingImages = formData.get('existingImages');

    const entries = formData.entries();
    let entry = entries.next();
    while (!entry.done) {
      const [key, value] = entry.value;
      if (key === 'newImages' || key === 'existingImages') {
        entry = entries.next();
        continue;
      }
      if (key === 'minQty') {
        payload[key] = Number(value);
      } else {
        payload[key] = value;
      }
      entry = entries.next();
    }

    const images = await saveUploadedFiles(uploadedFiles);
    const keptImages = existingImages ? parseStringArray(existingImages.toString()) : [];
    payload.images = [...keptImages, ...images];
    payload.image = payload.images[0] || payload.image || '';

    return { body: payload };
  }

  return { body: await req.json() };
}

function normalizePayload(body: any) {
  const images = Array.isArray(body.images) ? body.images : body.image ? [body.image] : [];
  const image = typeof body.image === 'string' ? body.image : '';
  const slug = body.slug || (body.name ? body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '');

  return {
    id: body.id,
    name: body.name || '',
    slug: body.slug || slug,
    category: body.category || '',
    minQty: Number(body.minQty || 0),
    description: body.description || '',
    images: images.filter(Boolean),
    image: images[0] || image || '',
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const data = await fetchProductsData();

  const products = category
    ? data.products.filter((p: any) => p.category === category)
    : data.products;

  return NextResponse.json({ products, categories: data.categories }, { headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  try {
    const { body } = await parseRequestBody(req);
    const data = await fetchProductsData();
    const newProduct = normalizePayload({ ...body, id: body.id || `prod_${Date.now()}` });
    data.products.unshift(newProduct);
    await saveProductsData(data);
    return NextResponse.json({ success: true, product: newProduct }, { headers: corsHeaders() });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500, headers: corsHeaders() });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { body } = await parseRequestBody(req);
    const data = await fetchProductsData();
    const idx = data.products.findIndex((p: any) => p.id === body.id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
    data.products[idx] = normalizePayload({ ...data.products[idx], ...body });
    await saveProductsData(data);
    return NextResponse.json({ success: true, product: data.products[idx] }, { headers: corsHeaders() });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500, headers: corsHeaders() });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400, headers: corsHeaders() });
    const data = await fetchProductsData();
    data.products = data.products.filter((p: any) => p.id !== id);
    await saveProductsData(data);
    return NextResponse.json({ success: true }, { headers: corsHeaders() });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500, headers: corsHeaders() });
  }
}
