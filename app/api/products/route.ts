import { NextRequest, NextResponse } from 'next/server';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'products.json');
const uploadDir = path.join(process.cwd(), 'public', 'uploads');

function getData() {
  return JSON.parse(readFileSync(dataPath, 'utf-8'));
}

function saveData(data: any) {
  writeFileSync(dataPath, JSON.stringify(data, null, 2));
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
  ensureUploadDir();
  const uploadedPaths: string[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const extension = path.extname(file.name || 'image');
    const fileName = `${Date.now()}-${index}-${sanitizeFileName(file.name || 'image') || 'image'}${extension}`;
    const filePath = path.join(uploadDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(filePath, buffer);
    uploadedPaths.push(`/uploads/${fileName}`);
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
      if (key === 'newImages') {
        entry = entries.next();
        continue;
      }
      if (key === 'existingImages') {
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
  const images = Array.isArray(body.images) ? body.images : [];
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
  const data = getData();

  const products = category
    ? data.products.filter((p: any) => p.category === category)
    : data.products;

  return NextResponse.json({ products, categories: data.categories });
}

export async function POST(req: NextRequest) {
  try {
    const { body } = await parseRequestBody(req);
    const data = getData();
    const newProduct = normalizePayload({ ...body, id: `prod_${Date.now()}` });
    data.products.push(newProduct);
    saveData(data);
    return NextResponse.json({ success: true, product: newProduct });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { body } = await parseRequestBody(req);
    const data = getData();
    const idx = data.products.findIndex((p: any) => p.id === body.id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    data.products[idx] = normalizePayload(body);
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
