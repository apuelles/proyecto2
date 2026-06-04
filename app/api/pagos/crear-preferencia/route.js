import crypto from "crypto";
import { errorResponse, getUserEmail, getUserId, successResponse } from "../../../../lib/apiUtils";
import { orders, paymentPreferences } from "../../../../lib/serverStore";

export async function POST(request) {
  const userId = getUserId(request);
  const payerEmail = getUserEmail(request);
  let body;

  try {
    body = await request.json();
  } catch {
    return errorResponse("JSON inválido", "INVALID_JSON", 400);
  }

  const orderId = body.orden_id ?? body.orderId;
  const order = orders.find((item) => String(item.id) === String(orderId));

  if (!order) {
    return errorResponse("Orden no encontrada", "ORDER_NOT_FOUND", 404);
  }

  if (order.userId !== userId) {
    return errorResponse("La orden no pertenece al usuario autenticado", "FORBIDDEN", 403);
  }

  if (order.estado !== "pendiente") {
    return errorResponse("Solo se pueden pagar órdenes pendientes", "INVALID_ORDER_STATUS", 400);
  }

  if (!Array.isArray(order.items) || order.items.length === 0) {
    return errorResponse("La orden no tiene ítems válidos", "EMPTY_ORDER", 400);
  }

  const preference = {
    id: `pref_${crypto.randomUUID()}`,
    orden_id: order.id,
    external_reference: String(order.id),
    payer: {
      email: order.customer?.email || payerEmail,
    },
    items: order.items.map((item) => ({
      title: item.name,
      quantity: item.qty,
      unit_price: item.price,
      currency_id: "ARS",
    })),
    total: order.total,
    notification_url: "/api/pagos/webhook",
    init_point: null,
    status: "prepared",
  };

  order.metodo_pago = "mercado_pago";
  order.referencia_pago = preference.id;
  paymentPreferences.set(preference.id, preference);

  return successResponse({ preference }, 201);
}
