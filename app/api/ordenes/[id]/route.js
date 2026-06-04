import { errorResponse, getUserId, getUserRole, successResponse } from "../../../../lib/apiUtils";
import { orders } from "../../../../lib/serverStore";

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

export async function GET(request, { params }) {
  const { id } = await params;
  const userId = getUserId(request);
  const role = getUserRole(request);
  const order = orders.find((item) => String(item.id) === String(id));

  if (!order) {
    return errorResponse("Orden no encontrada", "ORDER_NOT_FOUND", 404);
  }

  if (role !== "admin" && order.userId !== userId) {
    return errorResponse("No tenés permisos para ver esta orden", "FORBIDDEN", 403);
  }

  return successResponse({ order: publicOrder(order), role });
}
