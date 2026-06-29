import { errorResponse, successResponse } from '../../../../lib/apiUtils';
import { orders } from '../../../../lib/serverStore';

function isAdmin(request) {
  const secret = request.headers.get('x-admin-secret');
  return secret && secret === process.env.ADMIN_SECRET;
}

export async function GET(request) {
  if (!isAdmin(request)) return errorResponse('Acceso denegado', 'FORBIDDEN', 403);
  return successResponse({ orders: [...orders].reverse() }, 200);
}
