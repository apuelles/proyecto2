import { errorResponse, getUserRole, successResponse } from '../../../../lib/apiUtils';
import { products } from '../../../../lib/serverStore';

export async function GET(request) {
  const role = getUserRole(request);

  if (role !== 'admin') {
    return errorResponse('Acceso denegado', 'FORBIDDEN', 403);
  }

  return successResponse({ products }, 200);
}
