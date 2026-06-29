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

  const product = products.find((p) => String(p.id) === String(id));

  if (!product) {
    return errorResponse('Producto no encontrado', 'PRODUCT_NOT_FOUND', 404);
  }

  if (body.stock !== undefined) {
    product.stock = Math.max(0, Number(body.stock));
  }
  if (body.active !== undefined) {
    product.active = Boolean(body.active);
  }
  if (body.price !== undefined && body.price > 0) {
    product.price = Number(body.price);
  }

  return successResponse({ product }, 200);
}
