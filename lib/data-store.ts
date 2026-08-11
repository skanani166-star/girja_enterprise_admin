import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy
} from "@firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

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

const defaultCategories: Category[] = [
  {
    id: "t_shirts",
    name: "t-shirts",
    slug: "t-shirts",
    description: "Premium custom branded T-Shirts",
    icon: "FolderOpen",
  },
  {
    id: "caps",
    name: "caps",
    slug: "caps",
    description: "Custom promotional caps and headwear",
    icon: "FolderOpen",
  },
];

const defaultProducts: Product[] = [];

const candidateProductPaths = [
  process.env.ADMIN_DATA_PATH,
  path.resolve(process.cwd(), "..", "girja_enterprise", "data", "products.json"),
  path.resolve(process.cwd(), "data", "products.json"),
].filter(Boolean) as string[];

export function getProductDataPath(): string {
  for (const p of candidateProductPaths) {
    if (existsSync(p)) return p;
  }
  return path.join(process.cwd(), "data", "products.json");
}

const candidateContactPaths = [
  process.env.ADMIN_CONTACTS_PATH,
  path.resolve(process.cwd(), "..", "girja_enterprise", "data", "contacts.json"),
  path.resolve(process.cwd(), "data", "contacts.json"),
].filter(Boolean) as string[];

export function getContactsDataPath(): string {
  for (const p of candidateContactPaths) {
    if (existsSync(p)) return p;
  }
  return path.join(process.cwd(), "data", "contacts.json");
}

function readLocalProductsJson(): ProductsData {
  try {
    const targetPath = getProductDataPath();
    const fileContent = readFileSync(targetPath, "utf-8");
    const data = JSON.parse(fileContent);
    return {
      categories: Array.isArray(data.categories) && data.categories.length > 0 ? data.categories : defaultCategories,
      products: Array.isArray(data.products) ? data.products : [],
    };
  } catch {
    return { categories: defaultCategories, products: [] };
  }
}

function readLocalContactsJson(): ContactEntry[] {
  try {
    const targetPath = getContactsDataPath();
    const data = JSON.parse(readFileSync(targetPath, "utf-8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// --- PRODUCTS & CATEGORIES DATA MANAGEMENT ---

export async function fetchProductsData(): Promise<ProductsData> {
  if (isFirebaseConfigured() && db) {
    try {
      const catSnap = await getDocs(collection(db, "categories"));
      const prodSnap = await getDocs(collection(db, "products"));

      let categories: Category[] = catSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as Category));

      const products: Product[] = prodSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as Product));

      if (categories.length === 0) {
        for (const cat of defaultCategories) {
          try {
            await setDoc(doc(db, "categories", cat.id), cat);
            categories.push(cat);
          } catch (e) {
            console.warn("Could not seed category to Firestore:", e);
          }
        }
      }

      return { categories, products };
    } catch (err) {
      console.error("Error fetching products from Firestore:", err);
    }
  }

  return readLocalProductsJson();
}

export async function saveProductsData(data: ProductsData): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      const existingCatsSnap = await getDocs(collection(db, "categories"));
      const currentCatIds = new Set(data.categories.map((c) => c.id));

      for (const cat of data.categories) {
        await setDoc(doc(db, "categories", cat.id), cat);
      }
      for (const docSnap of existingCatsSnap.docs) {
        if (!currentCatIds.has(docSnap.id)) {
          await deleteDoc(doc(db, "categories", docSnap.id));
        }
      }

      const existingProdsSnap = await getDocs(collection(db, "products"));
      const currentProdIds = new Set(data.products.map((p) => p.id));

      for (const prod of data.products) {
        await setDoc(doc(db, "products", prod.id), prod);
      }
      for (const docSnap of existingProdsSnap.docs) {
        if (!currentProdIds.has(docSnap.id)) {
          await deleteDoc(doc(db, "products", docSnap.id));
        }
      }
    } catch (err) {
      console.error("Error saving products to Firestore:", err);
      throw err;
    }
  }

  try {
    const targetPath = getProductDataPath();
    writeFileSync(targetPath, JSON.stringify(data, null, 2));
  } catch (err) {
    // Ignore EROFS errors
  }
}

// --- CONTACTS / QUOTES DATA MANAGEMENT ---

export async function fetchContacts(): Promise<ContactEntry[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, "contacts"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as ContactEntry));
    } catch (err) {
      console.error("Error fetching contacts from Firestore:", err);
      try {
        const snap = await getDocs(collection(db, "contacts"));
        const contacts: ContactEntry[] = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        } as ContactEntry));
        contacts.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        return contacts;
      } catch (err2) {
        console.error("Fallback contact fetch error:", err2);
      }
    }
  }

  return readLocalContactsJson();
}

export async function saveContacts(contacts: ContactEntry[]): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      const existingSnap = await getDocs(collection(db, "contacts"));
      const currentIds = new Set(contacts.map((c) => c.id));

      for (const contact of contacts) {
        await setDoc(doc(db, "contacts", contact.id), contact);
      }

      for (const docSnap of existingSnap.docs) {
        if (!currentIds.has(docSnap.id)) {
          await deleteDoc(doc(db, "contacts", docSnap.id));
        }
      }
    } catch (err) {
      console.error("Error saving contacts to Firestore:", err);
      throw err;
    }
  }

  for (const p of candidateContactPaths) {
    try {
      writeFileSync(p, JSON.stringify(contacts, null, 2));
    } catch {
      // Ignore write errors
    }
  }
}
