import { errorResponse, successResponse } from '../../../../lib/apiUtils';
import { products } from '../../../../lib/serverStore';

function isAdmin(request) {
  const secret = request.headers.get('x-admin-secret');
  return secret && secret === process.env.ADMIN_SECRET;
}

export async function GET(request) {
  if (!isAdmin(request)) return errorResponse('Acceso denegado', 'FORBIDDEN', 403);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const res = await fetch(`${supabaseUrl}/rest/v1/products?select=*&order=sort_order.asc`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return successResponse({ products: data }, 200);
    }
  }

  return successResponse({ products }, 200);
}
