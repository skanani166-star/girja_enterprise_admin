import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  minQty: number;
  description: string;
  price?: number;
  features?: string[];
  colors?: string[];
  badge?: string;
  material?: string;
  weight?: string;
  image?: string;
  images?: string[];
}

export interface ProductsData {
  categories: Category[];
  products: Product[];
}

export interface ContactEntry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  createdAt: string;
  status: string;
}

const CLOUD_PRODUCTS_URL = process.env.CLOUD_PRODUCTS_URL || "https://api.restful-api.dev/objects/ff8081819f7e10ae019fe066d0b01086";
const CLOUD_CONTACTS_URL = process.env.CLOUD_CONTACTS_URL || "https://api.restful-api.dev/objects/ff8081819f7e10ae019fe067b10e1088";

let cachedProductsData: ProductsData | null = null;
let cachedContactsData: ContactEntry[] | null = null;

function getKvConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) return { url: url.replace(/\/+$/, ""), token };
  return null;
}

async function kvGet<T>(key: string): Promise<T | null> {
  const kv = getKvConfig();
  if (!kv) return null;
  try {
    const res = await fetch(`${kv.url}/get/${key}`, {
      headers: { Authorization: `Bearer ${kv.token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.result) return null;
    return typeof json.result === "string" ? JSON.parse(json.result) : json.result;
  } catch (err) {
    console.error(`KV GET error for ${key}:`, err);
    return null;
  }
}

async function kvSet(key: string, value: any): Promise<boolean> {
  const kv = getKvConfig();
  if (!kv) return false;
  try {
    const res = await fetch(`${kv.url}/set/${key}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${kv.token}` },
      body: JSON.stringify(value),
      cache: "no-store",
    });
    return res.ok;
  } catch (err) {
    console.error(`KV SET error for ${key}:`, err);
    return false;
  }
}

// --- PRODUCTS & CATEGORIES DATA ---

const candidateProductPaths = [
  path.resolve(process.cwd(), "data", "products.json"),
  path.resolve(process.cwd(), "..", "girja_enterprise", "data", "products.json"),
].filter(Boolean) as string[];

export function getProductDataPath(): string {
  for (const p of candidateProductPaths) {
    if (existsSync(p)) return p;
  }
  return path.join(process.cwd(), "data", "products.json");
}

export async function fetchProductsData(): Promise<ProductsData> {
  // 1. Try Cloud KV
  const kvData = await kvGet<ProductsData>("girja_products_data");
  if (kvData && Array.isArray(kvData.products) && Array.isArray(kvData.categories)) {
    cachedProductsData = kvData;
    return kvData;
  }

  // 2. Try Cloud REST API
  try {
    const res = await fetch(CLOUD_PRODUCTS_URL, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      const data = json.data || json;
      if (Array.isArray(data.products) && Array.isArray(data.categories)) {
        cachedProductsData = data;
        return data;
      }
    }
  } catch (err) {
    console.warn("Could not fetch products from Cloud Storage:", err);
  }

  // 3. Try reading local products.json file
  try {
    const targetPath = getProductDataPath();
    const data = JSON.parse(readFileSync(targetPath, "utf-8"));
    const result: ProductsData = {
      categories: Array.isArray(data.categories) ? data.categories : [],
      products: Array.isArray(data.products) ? data.products : [],
    };
    cachedProductsData = result;
    return result;
  } catch {
    if (cachedProductsData) return cachedProductsData;
    return { categories: [], products: [] };
  }
}

export async function saveProductsData(data: ProductsData): Promise<void> {
  cachedProductsData = data;

  // 1. Save to Cloud KV if available
  await kvSet("girja_products_data", data);

  // 2. Save to Cloud REST API
  try {
    await fetch(CLOUD_PRODUCTS_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "girja_products_data", data }),
      cache: "no-store",
    });
  } catch (err) {
    console.warn("Could not update Cloud Storage for products:", err);
  }

  // 3. Safe local FS save across candidate paths
  for (const p of candidateProductPaths) {
    try {
      writeFileSync(p, JSON.stringify(data, null, 2));
    } catch (err) {
      console.warn("Could not write to local products.json file (serverless environment):", err);
    }
  }
}

// --- CONTACTS / QUOTES DATA ---

const candidateContactPaths = [
  path.resolve(process.cwd(), "data", "contacts.json"),
  path.resolve(process.cwd(), "..", "girja_enterprise", "data", "contacts.json"),
].filter(Boolean) as string[];

export function getContactsDataPath(): string {
  for (const p of candidateContactPaths) {
    if (existsSync(p)) return p;
  }
  return path.join(process.cwd(), "data", "contacts.json");
}

export async function fetchContacts(): Promise<ContactEntry[]> {
  // 1. Try Cloud KV
  const kvData = await kvGet<ContactEntry[]>("girja_contacts_data");
  if (Array.isArray(kvData)) {
    cachedContactsData = kvData;
    return kvData;
  }

  // 2. Try Cloud REST API
  try {
    const res = await fetch(CLOUD_CONTACTS_URL, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      const data = json.data || json;
      if (Array.isArray(data)) {
        cachedContactsData = data;
        return data;
      }
    }
  } catch (err) {
    console.warn("Could not fetch contacts from Cloud Storage:", err);
  }

  // 3. Try reading local contacts.json
  try {
    const targetPath = getContactsDataPath();
    const data = JSON.parse(readFileSync(targetPath, "utf-8"));
    const result = Array.isArray(data) ? data : [];
    cachedContactsData = result;
    return result;
  } catch {
    if (cachedContactsData) return cachedContactsData;
    return [];
  }
}

export async function saveContacts(contacts: ContactEntry[]): Promise<void> {
  cachedContactsData = contacts;

  // 1. Save to Cloud KV if available
  await kvSet("girja_contacts_data", contacts);

  // 2. Save to Cloud REST API
  try {
    await fetch(CLOUD_CONTACTS_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "girja_contacts_data", data: contacts }),
      cache: "no-store",
    });
  } catch (err) {
    console.warn("Could not update Cloud Storage for contacts:", err);
  }

  // 3. Safe local FS save
  for (const p of candidateContactPaths) {
    try {
      writeFileSync(p, JSON.stringify(contacts, null, 2));
    } catch {
      // Ignore EROFS errors
    }
  }
}
