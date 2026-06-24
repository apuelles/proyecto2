import { fallbackProducts } from './fallbackProducts';

export const carts = globalThis.__vitalcoreCarts ?? new Map();
export const orders = globalThis.__vitalcoreOrders ?? [];
export const verifications = globalThis.__vitalcoreVerifications ?? new Map();
export const paymentPreferences = globalThis.__vitalcorePaymentPreferences ?? new Map();

// Mutable products list for demo-mode admin edits
export const products = globalThis.__vitalcoreProducts
  ?? fallbackProducts.map(p => ({ ...p, stock: p.stock ?? 50, active: true }));

globalThis.__vitalcoreCarts = carts;
globalThis.__vitalcoreOrders = orders;
globalThis.__vitalcoreVerifications = verifications;
globalThis.__vitalcorePaymentPreferences = paymentPreferences;
globalThis.__vitalcoreProducts = products;
