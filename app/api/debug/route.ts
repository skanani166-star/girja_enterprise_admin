import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  return NextResponse.json({
    ADMIN_USERNAME: !!process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV || null,
  });
}
