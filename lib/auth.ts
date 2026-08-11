export const SESSION_COOKIE = 'admin_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;

  // In development, generate an in-memory secret so session creation doesn't fail.
  // This avoids a hard crash when .env doesn't include AUTH_SECRET while keeping
  // production strict.
  if (process.env.NODE_ENV === 'development') {
    // cache a generated secret for the lifetime of the process
    // eslint-disable-next-line no-underscore-dangle
    if (!(globalThis as any).__DEV_AUTH_SECRET) {
      try {
        const arr = new Uint8Array(32);
        globalThis.crypto.getRandomValues(arr);
        (globalThis as any).__DEV_AUTH_SECRET = Array.from(arr).map((b: number) => b.toString(16).padStart(2, '0')).join('');
      } catch {
        (globalThis as any).__DEV_AUTH_SECRET = String(Math.random() + Date.now());
      }
      // eslint-disable-next-line no-console
      console.warn('AUTH_SECRET not set — using generated dev secret (sessions will not persist across restarts).');
    }
    return (globalThis as any).__DEV_AUTH_SECRET as string;
  }

  throw new Error('AUTH_SECRET environment variable is not set');
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
  let adminUser = process.env.ADMIN_USERNAME;
  let adminPass = process.env.ADMIN_PASSWORD;

  // Fallback: try to read .env if variables are not present (useful in some deployment/dev setups)
  if (!adminUser || !adminPass) {
    try {
      // Use dynamic require to avoid static Node imports (Edge runtime compatibility)
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const req = typeof require === 'function' ? require : eval('typeof require === "function" ? require : undefined');
      if (req) {
        const _fs = req('fs');
        const _path = req('path');
        const envPath = _path.join(process.cwd(), '.env');
        if (_fs.existsSync(envPath)) {
          const contents = _fs.readFileSync(envPath, 'utf8');
          for (const line of contents.split(/\r?\n/)) {
            const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
            if (!m) continue;
            const key = m[1];
            let val = m[2] || '';
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (key === 'ADMIN_USERNAME') adminUser = adminUser || val;
            if (key === 'ADMIN_PASSWORD') adminPass = adminPass || val;
          }
        }
      }
    } catch {
      // ignore
    }
  }

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
  // GET requests for products and categories are public so the frontend website can query catalog data
  if (method.toUpperCase() === 'GET') {
    return false;
  }
  if (pathname.startsWith('/api/products') || pathname.startsWith('/api/categories')) {
    return true;
  }
  if (pathname.startsWith('/api/contact') && method.toUpperCase() !== 'POST') {
    return true;
  }
  return false;
}
