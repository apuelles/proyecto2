import { errorResponse, getUserRole, successResponse } from '../../../../lib/apiUtils';
import { orders } from '../../../../lib/serverStore';

export async function GET(request) {
  const role = getUserRole(request);

  if (role !== 'admin') {
    return errorResponse('Acceso denegado', 'FORBIDDEN', 403);
  }

  return successResponse({ orders: [...orders].reverse() }, 200);
}
