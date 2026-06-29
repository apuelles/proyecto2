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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const res = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ status: estado }),
      cache: 'no-store',
    });
    if (res.ok) return successResponse({ updated: true }, 200);
  }

  const order = orders.find((o) => String(o.id) === String(id));
  if (!order) return errorResponse('Orden no encontrada', 'ORDER_NOT_FOUND', 404);
  order.estado = estado;
  return successResponse({ order }, 200);
}
