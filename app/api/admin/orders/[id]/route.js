import { errorResponse, successResponse } from '../../../../../lib/apiUtils';
import { orders } from '../../../../../lib/serverStore';

const VALID_STATES = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelada', 'pagada'];

function isAdmin(request) {
  const secret = request.headers.get('x-admin-secret');
  return secret && secret === process.env.ADMIN_SECRET;
}

export async function PATCH(request, { params }) {
  if (!isAdmin(request)) return errorResponse('Acceso denegado', 'FORBIDDEN', 403);

  const { id } = await params;
  let body;

  try {
    body = await request.json();
  } catch {
    return errorResponse('JSON inválido', 'INVALID_JSON', 400);
  }

  const { estado } = body;

  if (!estado || !VALID_STATES.includes(estado)) {
    return errorResponse('Estado inválido', 'INVALID_STATUS', 400);
  }

  const order = orders.find((o) => String(o.id) === String(id));

  if (!order) {
    return errorResponse('Orden no encontrada', 'ORDER_NOT_FOUND', 404);
  }

  order.estado = estado;

  return successResponse({ order }, 200);
}
