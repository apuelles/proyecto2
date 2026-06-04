export const carts = globalThis.__vitalcoreCarts ?? new Map();
export const orders = globalThis.__vitalcoreOrders ?? [];
export const verifications = globalThis.__vitalcoreVerifications ?? new Map();
export const paymentPreferences = globalThis.__vitalcorePaymentPreferences ?? new Map();

globalThis.__vitalcoreCarts = carts;
globalThis.__vitalcoreOrders = orders;
globalThis.__vitalcoreVerifications = verifications;
globalThis.__vitalcorePaymentPreferences = paymentPreferences;
