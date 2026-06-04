import { NextResponse } from "next/server";
import { fallbackProducts } from "./fallbackProducts";

export const DEMO_USER_ID = "demo-user";
export const DEFAULT_STOCK = 100;
export const ORDER_STATUSES = ["pendiente", "pagada", "confirmada", "enviada", "entregada", "cancelada"];

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export function successResponse(data, status = 200, meta = {}) {
  return NextResponse.json({ success: true, data, ...meta }, { status });
}

export function errorResponse(error, code = "SERVER_ERROR", status = 500, details) {
  return NextResponse.json(
    { success: false, error, code, ...(details ? { details } : {}) },
    { status }
  );
}

export function sanitize(value, maxLength = 255) {
  return String(value ?? "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .trim()
    .substring(0, maxLength);
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? ""));
}

export function validateQuantity(quantity) {
  return Number.isInteger(quantity) && quantity > 0 && quantity <= 100;
}

export function getUserId(request) {
  return sanitize(request.headers.get("x-user-id") || request.headers.get("x-demo-user-id") || DEMO_USER_ID, 80);
}

export function getUserRole(request) {
  const requestedRole = sanitize(request.headers.get("x-user-role") || request.headers.get("x-demo-role") || "cliente", 50);

  return requestedRole === "admin" ? "admin" : "cliente";
}

export function getUserEmail(request) {
  return sanitize(request.headers.get("x-user-email") || "demo@vitalcore.local", 120).toLowerCase();
}

export function mapProduct(product) {
  return {
    id: Number(product.id),
    name: product.name,
    desc: product.description ?? product.desc,
    tags: product.tags || [],
    price: Number(product.price),
    image: product.image_url ?? product.image,
    stock: Number.isFinite(Number(product.stock)) ? Number(product.stock) : DEFAULT_STOCK,
  };
}

export async function fetchProductsFromSource() {
  if (!hasSupabaseConfig) {
    return { products: fallbackProducts.map(mapProduct), source: "fallback" };
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/products?select=*&active=eq.true&order=sort_order.asc`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase returned ${response.status}`);
    }

    const products = await response.json();
    return { products: products.map(mapProduct), source: "supabase" };
  } catch (error) {
    console.error("Could not load products from Supabase:", error);
    return { products: fallbackProducts.map(mapProduct), source: "fallback" };
  }
}

export async function getProductById(productId) {
  const { products } = await fetchProductsFromSource();
  return products.find((product) => product.id === Number(productId));
}

export async function writeToSupabase(path, payload, options = {}) {
  if (!hasSupabaseConfig) {
    return null;
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method: options.method || "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase write failed with ${response.status}`);
  }

  return response.json();
}

export async function callSupabaseRpc(functionName, payload) {
  if (!hasSupabaseConfig) {
    return null;
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase RPC ${functionName} failed with ${response.status}`);
  }

  return response.json();
}
