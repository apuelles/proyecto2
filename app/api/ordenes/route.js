import {
  errorResponse,
  callSupabaseRpc,
  getProductById,
  getUserRole,
  getUserId,
  sanitize,
  successResponse,
  validateEmail,
  validateQuantity,
  writeToSupabase,
} from "../../../lib/apiUtils";
import { carts, orders, verifications } from "../../../lib/serverStore";

function publicOrder(order) {
  return {
    id: order.id,
    total: order.total,
    estado: order.estado,
    created_at: order.created_at,
    customer: order.customer,
    items: order.items,
    metodo_pago: order.metodo_pago,
    referencia_pago: order.referencia_pago,
    pagado_en: order.pagado_en,
  };
}

export async function GET(request) {
  const userId = getUserId(request);
  const role = getUserRole(request);
  const userOrders = orders
    .filter((order) => role === "admin" || order.userId === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(publicOrder);

  return successResponse({ orders: userOrders, role, authMode: "demo" });
}

export async function POST(request) {
  const userId = getUserId(request);
  let body;

  try {
    body = await request.json();
  } catch {
    return errorResponse("JSON inválido", "INVALID_JSON", 400);
  }

  const customer = {
    firstName: sanitize(body.customer?.firstName ?? body.nombre, 80),
    lastName: sanitize(body.customer?.lastName ?? body.apellido, 80),
    email: sanitize(body.customer?.email ?? body.email, 120).toLowerCase(),
  };
  const verificationToken = sanitize(body.verificationToken, 120);
  const verificationCode = sanitize(body.verificationCode, 12);
  const clientItems = Array.isArray(body.items) ? body.items : carts.get(userId) || [];

  if (!customer.firstName || !customer.lastName) {
    return errorResponse("Nombre y apellido son obligatorios", "INVALID_CUSTOMER", 400);
  }

  if (!validateEmail(customer.email)) {
    return errorResponse("Email inválido", "INVALID_EMAIL", 400);
  }

  const verification = verifications.get(verificationToken);
  if (
    !verification ||
    verification.userId !== userId ||
    verification.email !== customer.email ||
    verification.code !== verificationCode ||
    verification.used ||
    verification.expiresAt < Date.now()
  ) {
    return errorResponse("Código de verificación inválido o vencido", "INVALID_VERIFICATION", 400);
  }

  if (clientItems.length === 0) {
    return errorResponse("El carrito está vacío", "EMPTY_CART", 400);
  }

  const orderItems = [];

  for (const item of clientItems) {
    const productId = Number(item.id ?? item.producto_id ?? item.productId);
    const quantity = Number(item.qty ?? item.cantidad ?? item.quantity);

    if (!validateQuantity(quantity)) {
      return errorResponse("Cantidad inválida", "INVALID_QUANTITY", 400);
    }

    const product = await getProductById(productId);
    if (!product) {
      return errorResponse("Producto no encontrado", "PRODUCT_NOT_FOUND", 404);
    }

    if (product.stock < quantity) {
      return errorResponse(`Stock insuficiente para ${product.name}`, "INSUFFICIENT_STOCK", 400);
    }

    orderItems.push({
      id: product.id,
      name: product.name,
      price: product.price,
      qty: quantity,
      subtotal: product.price * quantity,
    });
  }

  const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const order = {
    id: `ORD-${Date.now()}`,
    userId,
    customer,
    items: orderItems,
    total,
    estado: "pendiente",
    metodo_pago: null,
    referencia_pago: null,
    pagado_en: null,
    created_at: new Date().toISOString(),
  };

  try {
    const transactionResult = await callSupabaseRpc("crear_orden_completa", {
      p_usuario_id: userId,
      p_items: orderItems.map((item) => ({
        producto_id: item.id,
        nombre: item.name,
        cantidad: item.qty,
        precio_unitario: item.price,
      })),
      p_total: total,
      p_customer_email: customer.email,
      p_customer_name: `${customer.firstName} ${customer.lastName}`,
    });

    const rpcRow = Array.isArray(transactionResult) ? transactionResult[0] : transactionResult;

    if (rpcRow?.success === false) {
      return errorResponse(rpcRow.error_msg || "No se pudo crear la orden", "TRANSACTION_FAILED", 400);
    }

    if (rpcRow?.orden_id) {
      order.id = rpcRow.orden_id;
    }
  } catch (error) {
    console.error("Could not create order with Supabase RPC, using memory store:", error);

    try {
      const inserted = await writeToSupabase("orders", {
        user_id: userId,
        customer_email: customer.email,
        customer_name: `${customer.firstName} ${customer.lastName}`,
        total,
        status: order.estado,
      });

      if (inserted?.[0]?.id) {
        order.id = inserted[0].id;
        await writeToSupabase(
          "order_items",
          orderItems.map((item) => ({
            order_id: order.id,
            product_id: item.id,
            product_name: item.name,
            quantity: item.qty,
            unit_price: item.price,
            subtotal: item.subtotal,
          }))
        );
      }
    } catch (writeError) {
      console.error("Could not persist order in Supabase REST, using memory store:", writeError);
    }
  }

  verification.used = true;
  verifications.set(verificationToken, verification);
  orders.unshift(order);
  carts.set(userId, []);

  return successResponse({ order: publicOrder(order) }, 201);
}
