import { errorResponse, successResponse } from '../../../../lib/apiUtils';
import { orders } from '../../../../lib/serverStore';

function isAdmin(request) {
  const secret = request.headers.get('x-admin-secret');
  return secret && secret === process.env.ADMIN_SECRET;
}

function getSupabaseHeaders() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, key, ready: Boolean(url && key) };
}

function mapOrder(o) {
  const parts = (o.customer_name || '').split(' ');
  return {
    id: String(o.id),
    estado: o.status,
    total: o.total,
    customer: {
      email: o.customer_email,
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
    },
    metodo_pago: o.payment_method,
    referencia_pago: o.payment_reference,
    createdAt: o.created_at,
    items: [],
  };
}

export async function GET(request) {
  if (!isAdmin(request)) return errorResponse('Acceso denegado', 'FORBIDDEN', 403);

  const { url, key, ready } = getSupabaseHeaders();
  if (ready) {
    const res = await fetch(`${url}/rest/v1/orders?select=*&order=created_at.desc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return successResponse({ orders: data.map(mapOrder) }, 200);
    }
  }

  return successResponse({ orders: [...orders].reverse() }, 200);
}
