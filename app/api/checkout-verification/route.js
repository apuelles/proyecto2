import crypto from "crypto";
import {
  errorResponse,
  getProductById,
  getUserId,
  sanitize,
  successResponse,
  validateEmail,
  validateQuantity,
} from "../../../lib/apiUtils";
import { verifications } from "../../../lib/serverStore";

export async function POST(request) {
  const userId = getUserId(request);
  let body;

  try {
    body = await request.json();
  } catch {
    return errorResponse("JSON inválido", "INVALID_JSON", 400);
  }

  const email = sanitize(body.email, 120).toLowerCase();
  const items = Array.isArray(body.items) ? body.items : [];

  if (!validateEmail(email)) {
    return errorResponse("Email inválido para verificar la compra", "INVALID_EMAIL", 400);
  }

  if (items.length === 0) {
    return errorResponse("El carrito está vacío", "EMPTY_CART", 400);
  }

  for (const item of items) {
    const productId = Number(item.id ?? item.producto_id ?? item.productId);
    const quantity = Number(item.qty ?? item.cantidad ?? item.quantity);
    const product = await getProductById(productId);

    if (!product) {
      return errorResponse("Producto no encontrado", "PRODUCT_NOT_FOUND", 404);
    }

    if (!validateQuantity(quantity)) {
      return errorResponse("Cantidad inválida", "INVALID_QUANTITY", 400);
    }

    if (product.stock < quantity) {
      return errorResponse(`Stock insuficiente para ${product.name}`, "INSUFFICIENT_STOCK", 400);
    }
  }

  const token = crypto.randomUUID();
  const code = String(crypto.randomInt(100000, 999999));

  verifications.set(token, {
    code,
    email,
    userId,
    expiresAt: Date.now() + 10 * 60 * 1000,
    used: false,
  });

  return successResponse(
    {
      token,
      expiresInMinutes: 10,
      delivery: "demo",
      demoCode: code,
    },
    201
  );
}
