import {
  errorResponse,
  getProductById,
  getUserId,
  successResponse,
  validateQuantity,
} from "../../../lib/apiUtils";
import { carts } from "../../../lib/serverStore";

export async function GET(request) {
  const userId = getUserId(request);
  const items = carts.get(userId) || [];

  return successResponse({ items, authMode: "demo" });
}

export async function POST(request) {
  const userId = getUserId(request);
  let body;

  try {
    body = await request.json();
  } catch {
    return errorResponse("JSON inválido", "INVALID_JSON", 400);
  }

  const productId = Number(body.producto_id ?? body.productId ?? body.id);
  const quantity = Number(body.cantidad ?? body.quantity ?? body.qty ?? 1);

  if (!Number.isInteger(productId) || productId <= 0) {
    return errorResponse("Producto inválido", "INVALID_PRODUCT", 400);
  }

  if (!validateQuantity(quantity)) {
    return errorResponse("La cantidad debe ser un entero entre 1 y 100", "INVALID_QUANTITY", 400);
  }

  const product = await getProductById(productId);
  if (!product) {
    return errorResponse("Producto no encontrado", "PRODUCT_NOT_FOUND", 404);
  }

  const currentCart = carts.get(userId) || [];
  const existing = currentCart.find((item) => item.id === product.id);
  const nextQuantity = (existing?.qty || 0) + quantity;

  if (product.stock < nextQuantity) {
    return errorResponse("Stock insuficiente", "INSUFFICIENT_STOCK", 400);
  }

  const nextCart = existing
    ? currentCart.map((item) => (item.id === product.id ? { ...item, qty: nextQuantity } : item))
    : [...currentCart, { ...product, qty: quantity }];

  carts.set(userId, nextCart);

  return successResponse({ items: nextCart, authMode: "demo" }, 201);
}
