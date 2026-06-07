export const SESSION_COOKIE = 'admin_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET environment variable is not set');
  return secret;
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function hmacSign(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function hmacVerify(data: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(data);
  return timingSafeEqualHex(expected, signature);
}

export async function createSessionToken(): Promise<string> {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_MAX_AGE * 1000 });
  const signature = await hmacSign(payload);
  return `${toBase64Url(payload)}.${signature}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const dot = token.indexOf('.');
    if (dot === -1) return false;
    const encoded = token.slice(0, dot);
    const signature = token.slice(dot + 1);
    const payload = fromBase64Url(encoded);
    if (!(await hmacVerify(payload, signature))) return false;
    const { exp } = JSON.parse(payload);
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

export function verifyCredentials(username: string, password: string): boolean {
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminUser || !adminPass) return false;
  return safeCompare(username, adminUser) && safeCompare(password, adminPass);
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export const PANEL_ROUTES = ['/', '/products', '/orders', '/categories'];

export function isPanelRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  return PANEL_ROUTES.slice(1).some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isProtectedApiRoute(pathname: string, method: string): boolean {
  if (pathname.startsWith('/api/products') || pathname.startsWith('/api/categories')) {
    return true;
  }
  if (pathname.startsWith('/api/contact') && method !== 'POST') {
    return true;
  }
  return false;
}
