import { errorResponse, successResponse } from '../../../../../lib/apiUtils';
import { products } from '../../../../../lib/serverStore';

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

  const updates = {};
  if (body.stock !== undefined) updates.stock = Math.max(0, Number(body.stock));
  if (body.active !== undefined) updates.active = Boolean(body.active);
  if (body.price !== undefined && body.price > 0) updates.price = Number(body.price);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const res = await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(updates),
      cache: 'no-store',
    });
    if (res.ok) return successResponse({ updated: true }, 200);
  }

  const product = products.find((p) => String(p.id) === String(id));
  if (!product) return errorResponse('Producto no encontrado', 'PRODUCT_NOT_FOUND', 404);
  Object.assign(product, updates);
  return successResponse({ product }, 200);
}
