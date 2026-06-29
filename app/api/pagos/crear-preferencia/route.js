import crypto from "crypto";
import { errorResponse, getUserEmail, getUserId, successResponse } from "../../../../lib/apiUtils";
import { client, hasMercadoPagoConfig, Preference } from "../../../../lib/mercadopago";
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

  if (order.estado !== "pendiente" && order.estado !== "cancelada") {
    return errorResponse("Solo se pueden pagar órdenes pendientes o canceladas", "INVALID_ORDER_STATUS", 400);
  }

  if (order.estado === "cancelada") {
    order.estado = "pendiente";
  }

  if (!Array.isArray(order.items) || order.items.length === 0) {
    return errorResponse("La orden no tiene ítems válidos", "EMPTY_ORDER", 400);
  }

  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const appUrl = configuredUrl.startsWith("https://")
    ? configuredUrl
    : process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

  const preference = {
    id: `pref_${crypto.randomUUID()}`,
    orden_id: order.id,
    external_reference: String(order.id),
    payer: {
      email: order.customer?.email || payerEmail,
    },
    items: order.items.map((item) => ({
      id: String(item.id),
      title: item.name,
      description: `Cantidad: ${item.qty}`,
      quantity: item.qty,
      unit_price: item.price,
      currency_id: "ARS",
    })),
    back_urls: {
      success: `${appUrl}/pago-completado`,
      failure: `${appUrl}/pago-fallido`,
      pending: `${appUrl}/pago-pendiente`,
    },
    auto_return: "approved",
    notification_url: `${appUrl}/api/webhooks/mercado-pago`,
    total: order.total,
    init_point: null,
    sandbox: true,
    status: "prepared",
  };

  if (hasMercadoPagoConfig) {
    try {
      const mpPreference = new Preference(client);
      const preferenceBody = {
        items: preference.items,
        payer: {
          name: order.customer?.firstName || "Comprador",
          surname: order.customer?.lastName || "Demo",
          email: order.customer?.email || payerEmail,
          identification: {
            type: "DNI",
            number: order.customer?.dni || "12345678",
          },
        },
        back_urls: preference.back_urls,
        external_reference: preference.external_reference,
        auto_return: "approved",
        notification_url: preference.notification_url,
      };

      const result = await mpPreference.create({ body: preferenceBody });

      preference.init_point = result.init_point || result.sandbox_init_point;
      preference.id = result.id || preference.id;
    } catch (error) {
      console.error("Error creating Mercado Pago preference:", error?.message || error);
    }
  }

  order.metodo_pago = "mercado_pago";
  order.referencia_pago = preference.id;
  paymentPreferences.set(preference.id, preference);

  return successResponse({ preference }, 201);
}
